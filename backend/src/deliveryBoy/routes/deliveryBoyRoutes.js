import express from "express";
import {
  getDashboard,
  getOrders,
  getOrderById,
  updateOrderStatus,
  verifyOtp,
  getEarnings,
  updateProfile,
} from "../controllers/deliveryBoyController.js";
import { protectDeliveryBoy } from "../middleware/deliveryBoyAuthMiddleware.js";

const router = express.Router();

// Apply protectDeliveryBoy middleware to all endpoints
router.use(protectDeliveryBoy);

router.get("/dashboard", getDashboard);
router.get("/orders", getOrders);
router.get("/orders/:id", getOrderById);
router.put("/orders/:id/status", updateOrderStatus);
router.post("/orders/:id/verify-otp", verifyOtp);
router.get("/earnings", getEarnings);
router.put("/profile", updateProfile);

export default router;
