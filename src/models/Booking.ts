import mongoose, { Schema, Model } from "mongoose";

export enum BookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

const BookingSchema = new Schema(
  {
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
    },
    bookingType: {
      type: String,
      enum: ["ONLINE", "MANUAL"],
      default: "ONLINE",
    },
    customerName: {
      type: String,
      required: false, // Required for MANUAL
    },
    customerPhone: {
      type: String,
      required: false,
    },
    emergencyContact: {
      type: String, // Required for manual booking, optional otherwise? Let's make it optional at schema level to support legacy/online bookings if not collected there yet.
      required: false,
    },
    seatNumber: {
      type: String,
      required: false,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    serviceFee: {
      type: Number,
      default: 0,
    },
    companyRevenue: {
      type: Number,
      default: 0,
    },
    paymentRef: {
      type: String,
      required: false,
    },
    paymentMethod: {
      type: String,
      enum: ["CARD", "BANK_TRANSFER", "CASH", "POS"],
      default: "CARD",
    },
    proofOfPayment: {
      type: String,
      required: false,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false, // Now optional for manual bookings
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: "Route",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Booking: Model<any> = mongoose.models.Booking || mongoose.model("Booking", BookingSchema);

export default Booking;
