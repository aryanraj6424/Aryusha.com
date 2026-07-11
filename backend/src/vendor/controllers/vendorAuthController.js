

import Vendor from "../models/Vendor.js";
import bcrypt from "bcryptjs";

import { generateVendorOtp } from "../utils/generateVendorOtp.js";
import { generateVendorToken } from "../utils/generateVendorToken.js";

// =========================
// Register Vendor
// =========================

export const registerVendor = async (
  req,
  res
) => {
  try {
    const {
      shopName,
      shopType,
      yearsInBusiness,
      employees,

      businessEmail,
      phone,
      whatsapp,

      village,
      district,
      state,
      pincode,
      country,

      businessRegNo,
      gstNumber,
      resellerCertificate,
      aadhaar,
      pan,
      storeFrontImage,
      storeBackImage,

      password,
    } = req.body;

    const vendorExists =
      await Vendor.findOne({
        $or: [
          { businessEmail },
          { phone },
        ],
      });

    if (vendorExists) {
      return res.status(400).json({
        success: false,
        message:
          "Vendor already exists",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    const vendor =
      await Vendor.create({
        shopName,
        shopType,
        yearsInBusiness,
        employees,

        businessEmail,
        phone,
        whatsapp,

        address: {
          village,
          district,
          state,
          pincode,
          country,
        },

        documents: {
          businessRegNo,
          gstNumber,
          resellerCertificate,
          aadhaar,
          pan,
          storeFrontImage,
          storeBackImage,
        },

        password:
          hashedPassword,

        status: "pending",
      });

    res.status(201).json({
      success: true,
      message:
        "Vendor registration submitted successfully. Waiting for admin approval.",
      vendor,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Server Error",
    });
  }
};

// =========================
// Login Vendor
// =========================

export const loginVendor =
  async (req, res) => {
    try {
      const {
        phone,
        password,
      } = req.body;

      const vendor =
        await Vendor.findOne({
          phone,
        });

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message:
            "Vendor not found",
        });
      }

      // Registration Approval Check

      if (
        vendor.status ===
        "pending"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your account is under verification. Please wait for admin approval.",
        });
      }

      if (
        vendor.status ===
        "rejected"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your vendor account has been rejected.",
        });
      }

      // Account Status Check

      if (
        vendor.accountStatus ===
        "hold"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your account is currently on hold.",
        });
      }

      if (
        vendor.accountStatus ===
        "suspended"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your account has been suspended by admin.",
        });
      }

      if (
        vendor.accountStatus ===
        "deactivated"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your account has been deactivated.",
        });
      }

      const isMatch =
        await bcrypt.compare(
          password,
          vendor.password
        );

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid credentials",
        });
      }

      const token =
        generateVendorToken(
          vendor._id
        );

      res.status(200).json({
        success: true,
        message:
          "Login Successful",
        token,
        vendor,
      });

    } catch (error) {
      console.log(error);

      res.status(500).json({
        success: false,
        message:
          "Server Error",
      });
    }
  };

// =========================
// Forgot Password
// =========================

export const forgotPassword = async (
  req,
  res
) => {
  try {

    console.log(
      "========== OTP API HIT =========="
    );

    console.log(
      "Request Body:",
      req.body
    );

    const { phone } = req.body;

    console.log(
      "Phone Received:",
      phone
    );

    const vendor =
      await Vendor.findOne({
        phone,
      });

    console.log(
      "Vendor Found:",
      vendor
    );

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message:
          "Vendor not found",
      });
    }

    const otp =
      generateVendorOtp();

    console.log(
      "Generated OTP:",
      otp
    );

    vendor.otp = otp;

    vendor.otpExpiry =
      Date.now() +
      10 * 60 * 1000;

    await vendor.save();

    console.log(
      "OTP Saved Successfully"
    );

    console.log(
      "================================"
    );

    console.log(
      "Vendor OTP:",
      otp
    );

    console.log(
      "================================"
    );

    res.status(200).json({
      success: true,
      message:
        "OTP sent successfully",
    });

  } catch (error) {

    console.log(
      "Forgot Password Error:"
    );

    console.log(error);

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Server Error",
    });
  }
};

// =========================
// Verify OTP
// =========================

export const verifyOtp =
  async (req, res) => {
    try {
      const {
        phone,
        otp,
      } = req.body;

      const vendor =
        await Vendor.findOne({
          phone,
        });

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message:
            "Vendor not found",
        });
      }

      if (
        vendor.otp !== otp
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid OTP",
        });
      }

      if (
        new Date() >
        vendor.otpExpiry
      ) {
        return res.status(400).json({
          success: false,
          message:
            "OTP expired",
        });
      }

      res.status(200).json({
        success: true,
        message:
          "OTP verified successfully",
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        success: false,
        message:
          "Server Error",
      });
    }
  };



  // =========================
// Send Login OTP
// =========================

export const sendLoginOtp = async (
  req,
  res
) => {
  try {
    const { phone } = req.body;

    const vendor =
      await Vendor.findOne({
        phone,
      });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message:
          "Vendor not found",
      });
    }

    // Registration Approval Check

    if (
      vendor.status ===
      "pending"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is under verification. Please wait for admin approval.",
      });
    }

    if (
      vendor.status ===
      "rejected"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your vendor account has been rejected.",
      });
    }

    // Account Status Check

    if (
      vendor.accountStatus ===
      "hold"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account is currently on hold.",
      });
    }

    if (
      vendor.accountStatus ===
      "suspended"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been suspended by admin.",
      });
    }

    if (
      vendor.accountStatus ===
      "deactivated"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been deactivated.",
      });
    }

    const otp =
      generateVendorOtp();

    vendor.otp = otp;

    vendor.otpExpiry =
      Date.now() +
      10 * 60 * 1000;

    await vendor.save();

    console.log(
      "================================"
    );

    console.log(
      "LOGIN OTP:",
      otp
    );

    console.log(
      "================================"
    );

    res.status(200).json({
      success: true,
      message:
        "OTP sent successfully",
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message:
        "Server Error",
    });
  }
};

// =========================
// Verify Login OTP
// =========================

export const verifyLoginOtp =
  async (req, res) => {
    try {
      const {
        phone,
        otp,
      } = req.body;

      const vendor =
        await Vendor.findOne({
          phone,
        });

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message:
            "Vendor not found",
        });
      }

      // Registration Status Check

      if (
        vendor.status ===
        "pending"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your account is under verification. Please wait for admin approval.",
        });
      }

      if (
        vendor.status ===
        "rejected"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your vendor account has been rejected.",
        });
      }

      // Account Status Check

      if (
        vendor.accountStatus ===
        "hold"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your account is currently on hold.",
        });
      }

      if (
        vendor.accountStatus ===
        "suspended"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your account has been suspended by admin.",
        });
      }

      if (
        vendor.accountStatus ===
        "deactivated"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your account has been deactivated.",
        });
      }

      // OTP Check

      if (
        vendor.otp !== otp
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid OTP",
        });
      }

      if (
        new Date() >
        vendor.otpExpiry
      ) {
        return res.status(400).json({
          success: false,
          message:
            "OTP expired",
        });
      }

      // Clear OTP

      vendor.otp = null;
      vendor.otpExpiry = null;

      await vendor.save();

      const token =
        generateVendorToken(
          vendor._id
        );

      res.status(200).json({
        success: true,
        message:
          "Login Successful",
        token,
        vendor,
      });

    } catch (error) {
      console.log(error);

      res.status(500).json({
        success: false,
        message:
          "Server Error",
      });
    }
  };
// =========================
// Reset Password
// =========================

export const resetPassword =
  async (req, res) => {
    try {
      const {
        phone,
        newPassword,
      } = req.body;

      const vendor =
        await Vendor.findOne({
          phone,
        });

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message:
            "Vendor not found",
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          newPassword,
          10
        );

      vendor.password =
        hashedPassword;

      vendor.otp = null;
      vendor.otpExpiry = null;

      await vendor.save();

      res.status(200).json({
        success: true,
        message:
          "Password reset successfully",
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({
        success: false,
        message:
          "Server Error",
      });
    }
  };