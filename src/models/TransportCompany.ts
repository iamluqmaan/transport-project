import mongoose, { Schema, Model } from "mongoose";

const TransportCompanySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    contactInfo: {
      type: String,
      required: true,
    },
    bankAccounts: [{
      bankName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      accountName: { type: String, required: true },
      bankCode: { type: String, required: false } // Added for Paystack
    }],
    paystackSubaccountCode: {
      type: String,
      required: false
    },
    commissionRate: {
      type: Number,
      required: false, 
      default: 5 // Default 5% if not specified
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const TransportCompany: Model<any> = mongoose.models.TransportCompany || mongoose.model("TransportCompany", TransportCompanySchema);

export default TransportCompany;
