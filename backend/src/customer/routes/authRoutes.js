import express from "express";
import User from "../models/User.js";
import {
  signup,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  firebaseLogin,
  googleLogin,
  updateProfile,
} from "../controllers/authController.js";
import generateToken from "../../utils/generateToken.js";
import protect from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/test", (req, res) => {
  res.status(200).json({ success: true, message: "Auth Route Working 🚀" });
});

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

/*
|--------------------------------------------------------------------------
| Update Profile (authenticated)
|--------------------------------------------------------------------------
*/
router.put("/profile", protect, updateProfile);

/*
|--------------------------------------------------------------------------
| Google OAuth (GIS) — no Firebase involved
|--------------------------------------------------------------------------
*/
router.post("/google", googleLogin);

/*
|--------------------------------------------------------------------------
| Token Refresh
|--------------------------------------------------------------------------
*/
router.post("/token-refresh", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const token = generateToken(user._id);
    res.json({ success: true, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/*
|--------------------------------------------------------------------------
| Firebase Phone OTP Login — Customer / Vendor / Delivery Boy / Admin
|--------------------------------------------------------------------------
*/
router.post("/firebase-login", firebaseLogin);

export default router;