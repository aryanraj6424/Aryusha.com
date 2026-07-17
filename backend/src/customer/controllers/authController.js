import User from "../models/User.js";
import bcrypt from "bcryptjs";
import generateOtp from "../../utils/generateOtp.js";
import generateToken from "../../utils/generateToken.js";
import Vendor from "../../vendor/models/Vendor.js";
import DeliveryBoy from "../../deliveryBoy/models/DeliveryBoy.js";
import Admin from "../../admin/models/Admin.js";
import { generateVendorToken } from "../../vendor/utils/generateVendorToken.js";
import { generateAdminToken } from "../../admin/utils/generateAdminToken.js";
import { getFirebaseAdmin } from "../../config/firebase.js";
import { verifyGoogleToken } from "../../config/googleOAuth.js";

/*
|--------------------------------------------------------------------------
| Signup
|--------------------------------------------------------------------------
*/
export const signup = async (req, res) => {
  try {
    const { fullName, phoneNumber, email, password } = req.body;

    const userExists = await User.findOne({ phoneNumber });
    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ fullName, phoneNumber, email, password: hashedPassword });
    const token = generateToken(user._id);

    res.status(201).json({ success: true, message: "Account Created Successfully", user, token });
  } catch (error) {
    console.error("SIGNUP ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/
export const login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid Credentials" });
    }

    const token = generateToken(user._id);
    res.status(200).json({ success: true, message: "Login Successful", user, token });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/*
|--------------------------------------------------------------------------
| Google OAuth Login / Signup
| Verifies a Google ID token (from GIS frontend) without Firebase.
|--------------------------------------------------------------------------
*/
export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: "Google ID token is required." });
    }

    // Verify with google-auth-library
    const { email, name, picture, googleId } = await verifyGoogleToken(idToken);

    if (!email) {
      return res.status(400).json({ success: false, message: "Google account has no email." });
    }

    // Find existing user by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Sync Google fields in case they changed
      if (!user.googleId) user.googleId = googleId;
      if (picture && !user.photoURL) user.photoURL = picture;
      user.provider = "google";
      await user.save();
    } else {
      // First-time Google sign-up — create account
      user = await User.create({
        fullName: name,
        email,
        googleId,
        photoURL: picture,
        provider: "google",
        isVerified: true,
      });
    }

    const token = generateToken(user._id);
    res.status(200).json({ success: true, message: "Google login successful", user, token });
  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(401).json({
      success: false,
      message: "Google authentication failed. Please try again.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Forgot Password
|--------------------------------------------------------------------------
*/
export const forgotPassword = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = Date.now() + 30 * 60 * 1000;
    await user.save();

    console.log("Generated OTP:", otp);
    res.status(200).json({ success: true, message: "OTP Sent Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
|--------------------------------------------------------------------------
| Verify OTP
|--------------------------------------------------------------------------
*/
export const verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (!user.otpExpires || user.otpExpires.getTime() < Date.now()) {
      return res.status(400).json({ message: "OTP Expired" });
    }

    const token = generateToken(user._id);
    res.status(200).json({ success: true, message: "OTP Verified", user, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
|--------------------------------------------------------------------------
| Reset Password
|--------------------------------------------------------------------------
*/
export const resetPassword = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({ success: true, message: "Password Updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
|--------------------------------------------------------------------------
| Update Profile
|--------------------------------------------------------------------------
*/
export const updateProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!fullName?.trim()) {
      return res.status(400).json({ success: false, message: "Full name is required." });
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { fullName: fullName.trim(), ...(phoneNumber ? { phoneNumber } : {}) },
      { new: true, runValidators: false }
    );

    res.status(200).json({ success: true, message: "Profile updated successfully.", user: updated });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/*
|--------------------------------------------------------------------------
| Firebase Phone OTP Login — shared by Customer / Vendor / Delivery Boy / Admin
| (Kept for Phone OTP flow — separate from Google OAuth)
|--------------------------------------------------------------------------
*/
export const firebaseLogin = async (req, res) => {
  try {
    const { idToken, role } = req.body;

    if (!idToken || !role) {
      return res.status(400).json({ success: false, message: "Firebase ID token and role are required." });
    }

    const admin = getFirebaseAdmin();
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const verifiedPhone = decodedToken.phone_number;

    if (!verifiedPhone) {
      return res.status(400).json({ success: false, message: "No phone number associated with this Firebase credential." });
    }

    const last10Digits = verifiedPhone.replace(/\D/g, "").slice(-10);
    const possiblePhones = [verifiedPhone, last10Digits, `+91${last10Digits}`];

    if (role === "customer") {
      let user = await User.findOne({ phoneNumber: { $in: possiblePhones } });
      if (!user) {
        const dummyPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
        user = await User.create({
          fullName: "Customer",
          phoneNumber: last10Digits,
          password: dummyPassword,
          isVerified: true,
        });
      }
      const token = generateToken(user._id);
      return res.status(200).json({ success: true, message: "Login successful", token, user });
    }

    if (role === "vendor") {
      const vendor = await Vendor.findOne({ phone: { $in: possiblePhones } });
      if (!vendor) {
        return res.status(404).json({ success: false, message: `Vendor account not found for phone number: ${verifiedPhone}` });
      }
      if (vendor.status === "pending") return res.status(403).json({ success: false, message: "Your account is under verification. Please wait for admin approval." });
      if (vendor.status === "rejected") return res.status(403).json({ success: false, message: "Your vendor account has been rejected." });
      if (vendor.accountStatus === "hold") return res.status(403).json({ success: false, message: "Your account is currently on hold." });
      if (vendor.accountStatus === "suspended") return res.status(403).json({ success: false, message: "Your account has been suspended by admin." });
      if (vendor.accountStatus === "deactivated") return res.status(403).json({ success: false, message: "Your account has been deactivated." });

      const token = generateVendorToken(vendor._id);
      return res.status(200).json({ success: true, message: "Login successful", token, vendor });
    }

    if (role === "delivery-boy") {
      const deliveryBoy = await DeliveryBoy.findOne({ phone: { $in: possiblePhones } });
      if (!deliveryBoy) {
        return res.status(404).json({ success: false, message: `Delivery Boy account not found for phone number: ${verifiedPhone}` });
      }
      if (deliveryBoy.status !== "approved") return res.status(403).json({ success: false, message: `Your account is pending verification or rejected. Current status: ${deliveryBoy.status}` });
      if (deliveryBoy.accountStatus !== "active") return res.status(403).json({ success: false, message: `Your account is ${deliveryBoy.accountStatus}.` });

      const token = generateToken(deliveryBoy._id);
      return res.status(200).json({ success: true, message: "Login successful", token, deliveryBoy });
    }

    if (role === "admin") {
      const adminUser = await Admin.findOne({ phone: { $in: possiblePhones } });
      if (!adminUser) {
        return res.status(404).json({ success: false, message: `Admin account not found for phone number: ${verifiedPhone}` });
      }
      const token = generateAdminToken(adminUser._id);
      return res.status(200).json({ success: true, message: "Login successful", token, admin: adminUser });
    }

    return res.status(400).json({ success: false, message: "Invalid role specified." });
  } catch (error) {
    console.error("Firebase Login Error:", error);
    res.status(401).json({ success: false, message: "Invalid or expired Firebase token." });
  }
};