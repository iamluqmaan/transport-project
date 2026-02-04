import mongoose, { Schema, Model } from "mongoose";

export enum AdminRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  support = "SUPPORT",
}

const AdminSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(AdminRole),
      default: AdminRole.SUPER_ADMIN,
    },
  },
  {
    timestamps: true,
  }
);

const Admin: Model<any> = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);

export default Admin;
