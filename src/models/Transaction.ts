import mongoose, { Schema, Model } from "mongoose";

export enum TransactionType {
  CREDIT = "CREDIT", // Adds to company balance (Platform owes Company)
  DEBIT = "DEBIT",   // Subtracts from company balance (Company owes Platform)
  WITHDRAWAL = "WITHDRAWAL", // Company requesting payout (Pending deduction)
  INFO = "INFO", // Informational only, does not affect balance (e.g. Split Payments)
}

export enum TransactionCategory {
  BOOKING_REVENUE = "BOOKING_REVENUE",
  COMMISSION_DEDUCTION = "COMMISSION_DEDUCTION",
  PAYOUT = "PAYOUT",
  ADJUSTMENT = "ADJUSTMENT",
  BONUS = "BONUS", // Added for TransportNG bonuses
  EXTERNAL_PAYMENT = "EXTERNAL_PAYMENT", // Money went directly to company via Paystack Split
}

const TransactionSchema = new Schema(
  {
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
    },
    category: {
      type: String,
      enum: Object.values(TransactionCategory),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: false,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "TransportCompany",
      required: true,
    },
    reference: {
      type: String,
      required: false, // For external payment refs or payout refs
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "REJECTED"],
      default: "COMPLETED",
    },
  },
  {
    timestamps: true,
  }
);

const Transaction: Model<any> = mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);

export default Transaction;
