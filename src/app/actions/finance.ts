"use server";

import connectDB from "@/lib/db";
import SystemSetting from "@/models/SystemSetting";
import Booking, { BookingStatus } from "@/models/Booking";
import TransportCompany from "@/models/TransportCompany";
import "@/models/Route"; // Ensure Route model is registered for population
import { revalidatePath } from "next/cache";

const COMMISSION_KEY = "commission_percentage";
const DEFAULT_COMMISSION = 5;

// 1. Get Commission Rate
export async function getCommissionRate(): Promise<number> {
  await connectDB();
  const setting = await SystemSetting.findOne({ key: COMMISSION_KEY });
  
  if (!setting || setting.value === undefined || setting.value === null) {
    return DEFAULT_COMMISSION;
  }

  const rate = Number(setting.value);
  return isNaN(rate) ? DEFAULT_COMMISSION : rate;
}

// 2. Update Commission Rate
export async function updateCommissionRate(rate: number) {
  try {
    await connectDB();
    await SystemSetting.findOneAndUpdate(
      { key: COMMISSION_KEY },
      { 
        key: COMMISSION_KEY, 
        value: rate, 
        description: "Percentage of booking amount taken as platform fee" 
      },
      { upsert: true, new: true }
    );
    revalidatePath("/admin/finance");
    return { success: true };
  } catch (error) {
    console.error("Failed to update commission rate:", error);
    return { error: "Failed to update commission rate" };
  }
}

// 3. Get Financial Summary
export async function getFinancialSummary() {
  await connectDB();

  // 1. Calculate Platform Metrics
  const bookings = await Booking.find({
    status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] }
  });

  const totalPlatformRevenue = bookings.reduce((sum, b) => sum + (b.serviceFee || 0), 0);
  const totalBookingsValue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  
  // 2. Fetch Companies
  const companies = await TransportCompany.find({});
  // Create Company Name Helper
  const companyMap = new Map();
  companies.forEach(c => companyMap.set(c._id.toString(), c.name));

  const Transaction = (await import("@/models/Transaction")).default;
  
  // 3. Calculate Balances
  const balances = await Transaction.aggregate([
    {
       $match: {
           status: { $ne: "REJECTED" }
       }
    },
    {
      $group: {
        _id: "$companyId",
        totalCredits: {
          $sum: {
            $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0]
          }
        },
        totalDebits: {
          $sum: {
            $cond: [{ $in: ["$type", ["DEBIT", "WITHDRAWAL"]] }, "$amount", 0]
          }
        }
      }
    }
  ]);

  const balanceMap = new Map();
  balances.forEach(b => {
    balanceMap.set(b._id.toString(), b.totalCredits - b.totalDebits);
  });

  const companyLedger = companies.map((company: any) => {
    const balance = balanceMap.get(company._id.toString()) || 0;
    return {
      id: company._id.toString(),
      name: company.name,
      totalSales: 0, 
      platformCommission: 0, 
      balanceDue: balance 
    };
  });

  const totalCompanyRevenue = companyLedger.reduce((sum, c) => sum + (c.balanceDue > 0 ? c.balanceDue : 0), 0);

  // 4. Fetch Pending Withdrawals
  const pendingRequests = await Transaction.find({
      type: "WITHDRAWAL",
      status: "PENDING"
  }).sort({ createdAt: -1 }).lean();

  const enrichedPendingRequests = pendingRequests.map((req: any) => ({
      ...req,
      _id: req._id.toString(),
      companyName: companyMap.get(req.companyId.toString()) || "Unknown Company"
  }));

  return {
    totalPlatformRevenue,
    totalCompanyRevenue,
    totalBookingsValue,
    companyLedger: companyLedger,
    pendingWithdrawals: enrichedPendingRequests
  };
}

// 4. Get Company Specific Financials
export async function getCompanyFinancials(companyId: string) {
  await connectDB();

  const Transaction = (await import("@/models/Transaction")).default;

  // 1. Calculate Balance and Breakdown (Transactions)
  // We exclude REJECTED transactions from the balance calculation
  const balanceAgg = await Transaction.aggregate([
    { 
        $match: { 
            companyId: new (await import("mongoose")).Types.ObjectId(companyId),
            status: { $ne: "REJECTED" }
        } 
    },
    {
      $group: {
        _id: null,
        credits: { $sum: { $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0] } },
        debits: { $sum: { $cond: [{ $in: ["$type", ["DEBIT", "WITHDRAWAL"]] }, "$amount", 0] } },
        totalBonus: { $sum: { $cond: [{ $eq: ["$category", "BONUS"] }, "$amount", 0] } },
        // Only COMPLETED payouts count as "Total Withdrawn" stats (money actually left)
        totalWithdrawn: { 
            $sum: { 
                $cond: [
                    { $and: [
                        { $eq: ["$category", "PAYOUT"] }, 
                        { $eq: ["$status", "COMPLETED"] }
                    ] }, 
                    "$amount", 
                    0
                ] 
            } 
        }
      }
    }
  ]);

  // 2. Calculate Total Earnings from Bookings (Online + Manual)
  const Route = (await import("@/models/Route")).default;
  const Booking = (await import("@/models/Booking")).default;
  
  const companyRoutes = await Route.find({ companyId: companyId }).select('_id');
  const routeIds = companyRoutes.map(r => r._id);

  const bookingAgg = await Booking.aggregate([
    { $match: { 
        routeId: { $in: routeIds }, 
        status: { $in: ["CONFIRMED", "COMPLETED"] } 
      } 
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$companyRevenue" }
      }
    }
  ]);

  const stats = balanceAgg.length > 0 ? balanceAgg[0] : { credits: 0, debits: 0, totalBookingRevenue: 0, totalBonus: 0, totalWithdrawn: 0 };
  const balance = stats.credits - stats.debits; // Debits include PENDING Withdrawals
  const totalRevenue = bookingAgg.length > 0 ? bookingAgg[0].totalRevenue : 0;

  // 3. Fetch Recent Transactions
  const transactions = await Transaction.find({ companyId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return {
    balance,
    totalRevenue, // Now sourced from Bookings aggregation
    totalBonus: stats.totalBonus,
    totalWithdrawn: stats.totalWithdrawn,
    transactions: JSON.parse(JSON.stringify(transactions))
  };
}

// 5. Add Bonus Transaction
export async function addBonusTransaction(companyId: string, amount: number, description: string) {
  try {
    if (!companyId || amount <= 0 || !description) {
        return { error: "Invalid input" };
    }

    await connectDB();
    const Transaction = (await import("@/models/Transaction")).default;

    await Transaction.create({
      type: "CREDIT",
      category: "BONUS",
      amount: amount,
      description: description,
      companyId: companyId,
      status: "COMPLETED"
    });

    revalidatePath("/admin/finance/" + companyId);
    revalidatePath("/admin/finance");
    return { success: true };
  } catch (error) {
    console.error("Failed to add bonus:", error);
    return { error: "Failed to add bonus" };
  }
}

// 6. Request Payout
export async function requestPayout(companyId: string, amount: number, bankDetails?: string) {
  try {
    await connectDB();
    const Transaction = (await import("@/models/Transaction")).default;

    // 1. Validate Balance
    // Balance = Credits - Debits (including Pending Withdrawals)
    const balanceAgg = await Transaction.aggregate([
        { 
            $match: { 
                companyId: new (await import("mongoose")).Types.ObjectId(companyId),
                status: { $ne: "REJECTED" }
            } 
        },
        {
          $group: {
            _id: null,
            credits: { $sum: { $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0] } },
            debits: { $sum: { $cond: [{ $in: ["$type", ["DEBIT", "WITHDRAWAL"]] }, "$amount", 0] } }
          }
        }
      ]);
    
    const balance = balanceAgg.length > 0 ? (balanceAgg[0].credits - balanceAgg[0].debits) : 0;

    if (amount > balance) {
        return { error: "Insufficient wallet balance." };
    }

    if (amount <= 0) {
        return { error: "Invalid amount." };
    }

    // 2. Create Payout Transaction (PENDING)
    await Transaction.create({
        type: "WITHDRAWAL", // New Type
        category: "PAYOUT",
        amount: amount,
        description: `Withdrawal Request${bankDetails ? ` - ${bankDetails}` : ''}`,
        companyId: companyId,
        status: "PENDING" // Starts as Pending
    });

    // 3. Send Email & SMS Notification to SUPER ADMIN
    // Find Super Admin email (Assuming specific email or finding first super admin)
    const User = (await import("@/models/User")).default;
    const TransportCompany = (await import("@/models/TransportCompany")).default;
    
    const superAdmin = await User.findOne({ role: "SUPER_ADMIN" });
    const company = await TransportCompany.findById(companyId);

    const { sendSMS } = await import("@/lib/sms");

    if (superAdmin && superAdmin.email) {
        const { sendEmail } = await import("@/lib/email");
        const { generateBookingEmail } = await import("@/lib/email-templates"); // Reuse or use raw
        
        await sendEmail(
            superAdmin.email,
            "New Withdrawal Request - TransportNG",
             generateBookingEmail({
                companyName: company?.name || "Unknown Company",
                amount: amount,
                ticketId: bankDetails || "Bank Transfer",
                status: "PENDING",
                // Dummy values for required fields
                customerName: "Admin",
                originCity: "",
                destinationCity: "",
                departureTime: new Date()
            }, 'WITHDRAWAL_REQUEST')
        );
    }
    
    if (superAdmin && superAdmin.phoneNumber) {
        await sendSMS(
            superAdmin.phoneNumber,
            `Alert: New Withdrawal Request from ${company?.name || "a company"} for N${amount.toLocaleString()}. Check Admin Finance.`
        );
    }

    revalidatePath("/admin/finance");
    revalidatePath("/company/finance");
    return { success: true };

  } catch (error: any) {
      console.error("Payout Request Error:", error);
      return { error: error.message || "Failed to request payout" }; 
  }
}

// 7. Process Withdrawal (Approve/Reject)
export async function processWithdrawal(transactionId: string, action: "APPROVE" | "REJECT") {
    try {
        await connectDB();
        const Transaction = (await import("@/models/Transaction")).default;
        const User = (await import("@/models/User")).default;
        const TransportCompany = (await import("@/models/TransportCompany")).default;

        const transaction = await Transaction.findById(transactionId);
        if (!transaction) return { error: "Transaction not found" };
        if (transaction.status !== "PENDING") return { error: "Transaction is not pending" };

        if (action === "APPROVE") {
            transaction.status = "COMPLETED";
        } else {
            transaction.status = "REJECTED";
        }
        
        await transaction.save();

        // Notify Company
        const companyAdmin = await User.findOne({ companyId: transaction.companyId, role: "COMPANY_ADMIN" });
        const company = await TransportCompany.findById(transaction.companyId);
        
        const { sendSMS } = await import("@/lib/sms");

        if (companyAdmin && companyAdmin.email) {
             const { sendEmail } = await import("@/lib/email");
             const { generateBookingEmail } = await import("@/lib/email-templates");

             await sendEmail(
                companyAdmin.email,
                `Withdrawal ${action === "APPROVE" ? "Approved" : "Rejected"} - TransportNG`,
                generateBookingEmail({
                    companyName: company?.name || "Company",
                    amount: transaction.amount,
                    ticketId: transaction.description,
                    status: action === "APPROVE" ? "APPROVED" : "REJECTED",
                    // Dummy values
                    customerName: companyAdmin.name,
                    originCity: "",
                    destinationCity: "",
                    departureTime: new Date()
                }, action === "APPROVE" ? 'WITHDRAWAL_APPROVED' : 'WITHDRAWAL_REJECTED')
             );
        }
        
        if (companyAdmin && companyAdmin.phoneNumber) {
            const smsMessage = action === "APPROVE"
                ? `Withdrawal Approved! N${transaction.amount.toLocaleString()} has been processed.`
                : `Withdrawal Rejected. Your request for N${transaction.amount.toLocaleString()} was declined.`;
            
            await sendSMS(companyAdmin.phoneNumber, smsMessage);
        }

        revalidatePath("/admin/finance");
        revalidatePath("/company/finance");
        return { success: true };

    } catch (error: any) {
        console.error("Process Withdrawal Error:", error);
        return { error: "Failed to process withdrawal" };
    }
}
