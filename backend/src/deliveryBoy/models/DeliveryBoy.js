import mongoose from "mongoose";

const deliveryBoySchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    vehicleDetails: {
      type: { type: String, default: "Bike" },
      number: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    accountStatus: {
      type: String,
      enum: ["active", "hold", "suspended", "deactivated"],
      default: "active",
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpiry: {
      type: Date,
      default: null,
    },
    latitude: {
      type: Number,
      default: 28.6139,
    },
    longitude: {
      type: Number,
      default: 77.2090,
    },
  },
  {
    timestamps: true,
  }
);

const DeliveryBoy = mongoose.models.DeliveryBoy || mongoose.model("DeliveryBoy", deliveryBoySchema);
export default DeliveryBoy;
