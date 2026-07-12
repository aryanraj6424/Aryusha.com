// import express from "express";

// import {
//   signup,
//   login,
// } from "../controllers/authController.js";

// const router = express.Router();

// /*
// |--------------------------------------------------------------------------
// | Test Route
// |--------------------------------------------------------------------------
// */

// router.get("/test", (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: "Auth Route Working 🚀",
//   });
// });

// /*
// |--------------------------------------------------------------------------
// | Auth Routes
// |--------------------------------------------------------------------------
// */

// router.post(
//   "/signup",
//   signup
// );

// router.post(
//   "/login",
//   login
// );

// /*
// |--------------------------------------------------------------------------
// | Future Routes
// |--------------------------------------------------------------------------
// */

// // router.post("/forgot-password", forgotPassword);

// // router.post("/verify-otp", verifyOtp);

// // router.post("/resend-otp", resendOtp);

// // router.post("/reset-password", resetPassword);

// export default router;





// import express from "express";

// import {
//   signup,
//   login,
//   forgotPassword,
// } from "../controllers/authController.js";




// const router = express.Router();

// /*
// |--------------------------------------------------------------------------
// | Test Route
// |--------------------------------------------------------------------------
// */

// router.get("/test", (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: "Auth Route Working 🚀",
//   });
// });

// /*
// |--------------------------------------------------------------------------
// | Signup
// |--------------------------------------------------------------------------
// */

// router.post(
//   "/signup",
//   signup
// );

// /*
// |--------------------------------------------------------------------------
// | Login
// |--------------------------------------------------------------------------
// */

// router.post(
//   "/login",
//   login
// );

// /*
// |--------------------------------------------------------------------------
// | Forgot Password
// |--------------------------------------------------------------------------
// */

// /*
//  * Temporary GET Route
//  * Browser se test karne ke liye
//  */



// router.post(
//   "/forgot-password",
//   forgotPassword
// );

// /*
// |--------------------------------------------------------------------------
// | Future Routes
// |--------------------------------------------------------------------------
// */

// // router.post("/verify-otp", verifyOtp);

// // router.post("/resend-otp", resendOtp);

// // router.post("/reset-password", resetPassword);

// export default router;




import express from "express";
import User from "../models/User.js";

import {
  signup,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  firebaseLogin,
} from "../controllers/authController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Test Route
|--------------------------------------------------------------------------
*/

router.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Auth Route Working 🚀",
  });
});

/*
|--------------------------------------------------------------------------
| Auth Routes
|--------------------------------------------------------------------------
*/

router.post("/signup", signup);

router.post("/login", login);

router.post("/forgot-password", forgotPassword);

router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.post("/token-refresh", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const user = await User.findOne({ _id: userId });
    if (!user) return res.status(404).json({ message: "User not found" });
    const generateToken = (await import("../../utils/generateToken.js")).default;
    const token = generateToken(user._id);
    res.json({ success: true, token });
  } catch (error) {
    res.status(555).json({ message: error.message });
  }
});

/*
|--------------------------------------------------------------------------
| Firebase Login — shared by Customer / Vendor / Delivery Boy / Admin
|--------------------------------------------------------------------------
*/

router.post("/firebase-login", firebaseLogin);

export default router;