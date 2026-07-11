import express from "express";

console.log("✅ adminAuthRoutes.js Loaded");

import {
  loginAdmin,
  forgotPassword,
  verifyOtp,
  resetPassword,
} from "../controllers/adminAuthController.js";

const router =
  express.Router();

// Admin Login
router.post(
  "/login",
  loginAdmin
);

// Forgot Password
router.post(
  "/forgot-password",
  forgotPassword
);

// Verify OTP
router.post(
  "/verify-otp",
  verifyOtp
);

// Reset Password
router.post(
  "/reset-password",
  resetPassword
);



router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Admin Auth Route Working",
  });
});

export default router;