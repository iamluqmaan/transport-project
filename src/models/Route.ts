import mongoose, { Schema, Model } from "mongoose";
import "./TransportCompany"; // Ensure model is registered
import "./Vehicle";          // Ensure model is registered

const RouteSchema = new Schema(
  {
    originState: {
      type: String,
      required: true,
    },
    originCity: {
      type: String,
      required: true,
    },
    destinationState: {
      type: String,
      required: true,
    },
    destinationCity: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    departureTime: {
      type: Date,
      required: true,
    },
    estimatedDuration: {
      type: Number, // In minutes
      required: false,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "TransportCompany",
      required: true,
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Route: Model<any> = mongoose.models.Route || mongoose.model("Route", RouteSchema);

export default Route;
