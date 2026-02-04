import mongoose, { Schema, Model } from "mongoose";

const SystemSettingSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const SystemSetting: Model<any> = mongoose.models.SystemSetting || mongoose.model("SystemSetting", SystemSettingSchema);

export default SystemSetting;
