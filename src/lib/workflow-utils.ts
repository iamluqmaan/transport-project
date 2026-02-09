import Booking, { BookingStatus } from "@/models/Booking";
import TransportCompany from "@/models/TransportCompany";
import Transaction, { TransactionType, TransactionCategory } from "@/models/Transaction";
import { getCommissionRate } from "@/app/actions/finance"; 
import connectDB from "@/lib/db";

/**
 * Distributes revenue for a confirmed booking.
 * Calculates platform fee and company revenue, updates the booking,
 * and creates the appropriate Transaction record (Credit or Debit).
 */
export async function distributeBookingRevenue(bookingId: string) {
  await connectDB();
  
  const booking = await Booking.findById(bookingId).populate({
    path: 'routeId',
    populate: { path: 'companyId' }
  });

  if (!booking) {
    console.error(`Booking ${bookingId} not found for revenue distribution.`);
    return;
  }

  const company = booking.routeId?.companyId;
  if (!company) {
    console.error(`Company not found for booking ${bookingId}`);
    return;
  }

  // Determine Commission Rate
  // Priority: Use values captured at booking time if available. 
  // If undefined/zero (legacy), fetch current system rate.
  let serviceFee = booking.serviceFee;
  let companyRevenue = booking.companyRevenue;
  const totalAmount = booking.totalAmount;

  if (serviceFee === undefined || companyRevenue === undefined || (serviceFee === 0 && companyRevenue === 0 && totalAmount > 0)) {
      const rate = await getCommissionRate();
      serviceFee = (totalAmount * rate) / 100;
      companyRevenue = totalAmount - serviceFee;

      // Update Booking with calculated financials
      booking.serviceFee = serviceFee;
      booking.companyRevenue = companyRevenue;
      await booking.save();
  }

  // Prepare Transactions to Create
  interface TxDef {
      type: TransactionType;
      category: TransactionCategory;
      amount: number;
      description: string;
  }
  const transactionsToCreate: TxDef[] = [];

  if (booking.paymentMethod === "CARD") {
      // Check for Split Payment (Subaccount)
      if (company.paystackSubaccountCode) {
          // INFO: Money went to bank directly
          transactionsToCreate.push({
              type: TransactionType.INFO,
              category: TransactionCategory.EXTERNAL_PAYMENT,
              amount: companyRevenue,
              description: `Direct Payout (Split) for Booking #${booking._id.toString().slice(-6)}`
          });
      } else {
          // CREDIT: Platform owes Company
          transactionsToCreate.push({
              type: TransactionType.CREDIT,
              category: TransactionCategory.BOOKING_REVENUE,
              amount: companyRevenue,
              description: `Revenue for Online Card Booking #${booking._id.toString().slice(-6)}`
          });
      }
  } else {
      // Manual, Cash, Bank Transfer (Direct to Company), POS
      
      // 1. INFO: Record that company collected money (Revenue)
      transactionsToCreate.push({
          type: TransactionType.INFO,
          category: TransactionCategory.BOOKING_REVENUE, 
          amount: totalAmount, // Full amount collected by company
          description: `Payment Received (${booking.paymentMethod}) for Booking #${booking._id.toString().slice(-6)}`
      });

      // 2. DEBIT: Company owes commission
      transactionsToCreate.push({
          type: TransactionType.DEBIT,
          category: TransactionCategory.COMMISSION_DEDUCTION,
          amount: serviceFee,
          description: `Commission Fee for Booking #${booking._id.toString().slice(-6)}`
      });
  }

  // Create Transactions Idempotently
  for (const txData of transactionsToCreate) {
      const existingTx = await Transaction.findOne({ 
          bookingId: booking._id, 
          type: txData.type,
          category: txData.category 
      });

      if (!existingTx) {
          await Transaction.create({
              ...txData,
              bookingId: booking._id,
              companyId: company._id,
              status: "COMPLETED"
          });
          console.log(`Created ${txData.type} transaction for booking ${bookingId}`);
      } else {
          console.log(`Transaction ${txData.type} already exists for booking ${bookingId}`);
      }
  }
}
