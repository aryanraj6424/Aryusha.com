import express from "express";
import protect from "../../middleware/authMiddleware.js";
import {
  getCartSummary,
  getActiveCoupons,
  applyCoupon,
  removeCoupon,
  getDeliverySlots
} from "../controllers/cartController.js";

const router = express.Router();

// All customer cart endpoints are protected
router.use(protect);

router.post("/summary", getCartSummary); // Allow POST for easy passing of cart items
router.get("/summary", getCartSummary);  // Also support GET with query parameter for spec alignment
router.get("/coupons", getActiveCoupons); // Eligible coupons route for customers
router.post("/apply-coupon", applyCoupon);
router.post("/remove-coupon", removeCoupon);
router.get("/slots", getDeliverySlots);

export default router;
