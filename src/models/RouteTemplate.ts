import mongoose, { Schema, Model } from "mongoose";

const RouteTemplateSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
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
    vehicleType: { // Preferred vehicle type
      type: String,
      required: true, 
      enum: ["BUS", "MINI_BUS", "LUXURY_COACH", "SIENNA", "HUMMER_BUS"],
    },
    vehicleCapacity: {
      type: Number,
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "TransportCompany",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const RouteTemplate: Model<any> = mongoose.models.RouteTemplate || mongoose.model("RouteTemplate", RouteTemplateSchema);

export default RouteTemplate;
