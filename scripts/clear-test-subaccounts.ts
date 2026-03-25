import mongoose from "mongoose";
import TransportCompany from "../src/models/TransportCompany";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Please define the MONGODB_URI environment variable inside .env");
  process.exit(1);
}

async function clearTestSubaccounts() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log("Connected to MongoDB...");

    const result = await TransportCompany.updateMany(
      {},
      { $set: { paystackSubaccountCode: "" } }
    );

    console.log(`Successfully cleared paystackSubaccountCode for ${result.modifiedCount} companies.`);
    
  } catch (error) {
    console.error("Failed to clear subaccounts:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

clearTestSubaccounts();
