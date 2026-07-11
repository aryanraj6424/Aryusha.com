import jwt from "jsonwebtoken";
import Vendor from "../models/Vendor.js";

export const protectVendor = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No Token Provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const vendor = await Vendor.findById(decoded.id).select("-password");

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor Account Not Found",
      });
    }

    // Check Approval Status
    if (vendor.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: `Access Denied - Account status is '${vendor.status}'`,
      });
    }

    // Check Account Status (active, hold, suspended, deactivated)
    if (vendor.accountStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: `Access Denied - Account is ${vendor.accountStatus}`,
      });
    }

    req.vendor = vendor;
    next();
  } catch (error) {
    console.error("Vendor Auth Error:", error);
    res.status(401).json({
      success: false,
      message: "Token Invalid or Expired",
    });
  }
};
