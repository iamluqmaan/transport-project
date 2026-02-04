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

  // Prevent double processing
  // Check if a transaction already exists for this booking
  const existingTx = await Transaction.findOne({ bookingId: booking._id });
  if (existingTx) {
    console.log(`Revenue already distributed for booking ${bookingId}.`);
    return;
  }

  const company = booking.routeId?.companyId;
  if (!company) {
    console.error(`Company not found for booking ${bookingId}`);
    return;
  }

  // Determine Commission Rate
  // Priority: Global System Rate (As per user request)
  // We ignore company specific rates for now to ensure platform cut is uniform and controllable by Super Admin.
  const rate = await getCommissionRate();

  const totalAmount = booking.totalAmount;
  const serviceFee = (totalAmount * rate) / 100;
  const companyRevenue = totalAmount - serviceFee;

  // Update Booking with calculated financials
  booking.serviceFee = serviceFee;
  booking.companyRevenue = companyRevenue;
  await booking.save();

  // Create Ledger Transaction
  // Logic:
  // ONLINE: Platform holds money. We OWE company their revenue. -> CREDIT Company
  // MANUAL: Company holds money. They OWE us commission. -> DEBIT Company

  let txType: TransactionType;
  let txAmount: number;
  let txCategory: TransactionCategory;
  let description: string;

  if (booking.bookingType === "ONLINE") {
      txType = TransactionType.CREDIT;
      txAmount = companyRevenue; // We owe them the revenue part
      txCategory = TransactionCategory.BOOKING_REVENUE;
      description = `Revenue for Online Booking #${booking._id.toString().slice(-6)}`;
  } else {
      // MANUAL or cash
      txType = TransactionType.DEBIT;
      txAmount = serviceFee; // They owe us the commission part
      txCategory = TransactionCategory.COMMISSION_DEDUCTION;
      description = `Commission Fee for Booking #${booking._id.toString().slice(-6)}`;
  }

  await Transaction.create({
      type: txType,
      category: txCategory,
      amount: txAmount, // Store absolute value
      description: description,
      bookingId: booking._id,
      companyId: company._id,
      status: "COMPLETED"
  });

  console.log(`Distributed revenue for booking ${bookingId}: ${txType} ${txAmount}`);
}
