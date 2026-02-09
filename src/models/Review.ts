
import mongoose, { Schema, Model } from "mongoose";

const ReviewSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "TransportCompany",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Review: Model<any> = mongoose.models.Review || mongoose.model("Review", ReviewSchema);

export default Review;
