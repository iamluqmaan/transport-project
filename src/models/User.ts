import mongoose, { Schema, Model } from "mongoose";

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  COMPANY_ADMIN = "COMPANY_ADMIN",
  CUSTOMER = "CUSTOMER",
}

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: false, // Optional for OAuth
    },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.CUSTOMER,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "TransportCompany",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<any> = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
