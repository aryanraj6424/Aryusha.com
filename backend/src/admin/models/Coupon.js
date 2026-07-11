import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    // Unique coupon code, e.g., "FIRST50"
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    // Type of discount: flat amount or percentage rate
    discountType: {
      type: String,
      enum: ["flat", "percentage"],
      required: true,
      default: "flat"
    },
    // Discount value (flat amount in ₹ or percentage value 0-100)
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    // Minimum cart subtotal required to apply the coupon
    minCartValue: {
      type: Number,
      default: 0,
      min: 0
    },
    // Maximum discount limit cap (only relevant for percentage type)
    maxDiscountCap: {
      type: Number,
      default: null,
      min: 0
    },
    // Validity start date
    startDate: {
      type: Date,
      required: true
    },
    // Expiry date
    expiryDate: {
      type: Date,
      required: true
    },
    // Maximum total overall uses allowed across all customers
    usageLimit: {
      type: Number,
      default: null,
      min: 0
    },
    // Maximum uses allowed per unique customer account
    perCustomerLimit: {
      type: Number,
      default: 1,
      min: 1
    },
    // Status of coupon: Active or Inactive
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },
    // Track how many times this coupon has been used in orders
    usedCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

// Virtual check to verify if the coupon is expired
couponSchema.virtual("isExpired").get(function () {
  return new Date() > this.expiryDate;
});

export default mongoose.model("Coupon", couponSchema);
