import mongoose, { Schema, Model } from "mongoose";

export enum VehicleType {
  BUS = "BUS",
  MINI_BUS = "MINI_BUS",
  LUXURY_COACH = "LUXURY_COACH",
  SIENNA = "SIENNA",
  HUMMER_BUS = "HUMMER_BUS",
}

const VehicleSchema = new Schema(
  {
    type: {
      type: String,
      enum: Object.values(VehicleType),
      required: true,
    },
    plateNumber: {
      type: String,
      required: true,
    },
    capacity: {
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

const Vehicle: Model<any> = mongoose.models.Vehicle || mongoose.model("Vehicle", VehicleSchema);

export default Vehicle;
