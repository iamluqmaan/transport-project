
import mongoose from "mongoose";
import Transaction, { TransactionType, TransactionCategory } from "../src/models/Transaction";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Please define the MONGODB_URI environment variable inside .env");
  process.exit(1);
}

async function verifyWithdrawal() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log("Connected to MongoDB");

    // Attempt to create a document with the new type
    // We use a dummy ID for companyId
    const dummyId = new mongoose.Types.ObjectId();

    const tx = new Transaction({
        type: TransactionType.WITHDRAWAL,
        category: TransactionCategory.PAYOUT,
        amount: 100,
        description: "Test Withdrawal",
        companyId: dummyId,
        status: "PENDING"
    });

    await tx.validate();
    console.log("Validation Successful: WITHDRAWAL type is accepted.");
    
  } catch (error) {
    console.error("Validation Failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected");
  }
}

verifyWithdrawal();
