import User from "../models/User.js";
import bcrypt from "bcryptjs";
import generateOtp from "../../utils/generateOtp.js";
import generateToken from "../../utils/generateToken.js";

/*
|--------------------------------------------------------------------------
| Signup
|--------------------------------------------------------------------------
*/

export const signup = async (req, res) => {

  try {

    const {
      fullName,
      phoneNumber,
      email,
      password,
    } = req.body;

    const userExists =
      await User.findOne({
        phoneNumber,
      });

    if (userExists) {

      return res.status(400).json({
        success: false,
        message: "User already exists",
      });

    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user =
      await User.create({
        fullName,
        phoneNumber,
        email,
        password: hashedPassword,
      });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "Account Created Successfully",
      user,
      token,
    });

  } catch (error) {

  console.error("SIGNUP ERROR:", error);

  res.status(500).json({
    success: false,
    message: error.message,
  });

}

};

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

export const login = async (req, res) => {

  try {

    const {
      phoneNumber,
      password,
    } = req.body;

    const user =
      await User.findOne({
        phoneNumber,
      });

    if (!user) {

      return res.status(404).json({
        success: false,
        message: "User not found",
      });

    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {

      return res.status(401).json({
        success: false,
        message: "Invalid Credentials",
      });

    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login Successful",
      user,
      token,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};



export const forgotPassword = async (
  req,
  res
) => {

  try {

    const {
      phoneNumber,
    } = req.body;

    const user =
      await User.findOne({
        phoneNumber,
      });

    if (!user) {

      return res.status(404).json({
        message: "User not found",
      });

    }

    const otp =
      generateOtp();

    user.otp = otp;

    user.otpExpires =
      Date.now() +
      30 * 60 * 1000;

    await user.save();

    console.log(
      "Generated OTP:",
      otp
    );

    res.status(200).json({
      success: true,
      message:
        "OTP Sent Successfully",
    });

  } catch (error) {

    res.status(500).json({
      message:
        error.message,
    });

  }

};


export const verifyOtp = async (
  req,
  res
) => {

  try {

    const {
      phoneNumber,
      otp,
    } = req.body;

    const user =
      await User.findOne({
        phoneNumber,
      });

    if (!user) {

      return res.status(404).json({
        message: "User not found",
      });

    }

    if (
      user.otp !== otp
    ) {

      return res.status(400).json({
        message: "Invalid OTP",
      });

    }

    if (
  !user.otpExpires ||
  user.otpExpires.getTime() < Date.now()
) {

      return res.status(400).json({
        message: "OTP Expired",
      });

    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "OTP Verified",
      user,
      token,
    });

  } catch (error) {

    res.status(500).json({
      message:
        error.message,
    });

  }

};




export const resetPassword = async (
  req,
  res
) => {

  try {

    const {
      phoneNumber,
      password,
    } = req.body;

    const user =
      await User.findOne({
        phoneNumber,
      });

    if (!user) {

      return res.status(404).json({
        message: "User not found",
      });

    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    user.password =
      hashedPassword;

    user.otp = null;

    user.otpExpires = null;

    await user.save();

    res.status(200).json({
      success: true,
      message:
        "Password Updated",
    });

  } catch (error) {

    res.status(500).json({
      message:
        error.message,
    });

  }

};