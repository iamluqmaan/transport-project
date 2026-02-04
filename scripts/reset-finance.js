const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" }); // Changed to .env

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Please define the MONGODB_URI environment variable inside .env");
  process.exit(1);
}

async function resetFinance() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear Transactions
    const transactionResult = await mongoose.connection.collection("transactions").deleteMany({});
    console.log(`Deleted ${transactionResult.deletedCount} transactions.`);

    // Clear Bookings
    const bookingResult = await mongoose.connection.collection("bookings").deleteMany({});
    console.log(`Deleted ${bookingResult.deletedCount} bookings.`);
    
    console.log("Finance and Booking data reset to zero.");
  } catch (error) {
    console.error("Error resetting data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected");
  }
}

resetFinance();
