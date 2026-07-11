import Coupon from "../models/Coupon.js";

// @desc    Get all coupons (CRUD read - list)
// @route   GET /api/admin/coupons/all
// @access  Private (Admin)
export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ created_at: -1 });
    res.status(200).json({
      success: true,
      data: coupons
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching coupons",
      error: error.message
    });
  }
};

// @desc    Get single coupon details (CRUD read - detail)
// @route   GET /api/admin/coupons/:id
// @access  Private (Admin)
export const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found"
      });
    }
    res.status(200).json({
      success: true,
      data: coupon
    });
  } catch (error) {
    console.error("Error fetching coupon:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching coupon",
      error: error.message
    });
  }
};

// @desc    Create a new coupon (CRUD create)
// @route   POST /api/admin/coupons/create
// @access  Private (Admin)
export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minCartValue,
      maxDiscountCap,
      startDate,
      expiryDate,
      usageLimit,
      perCustomerLimit,
      status
    } = req.body;

    if (!code || !discountType || discountValue === undefined || !startDate || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: "Required coupon fields are missing (code, discountType, discountValue, startDate, expiryDate)"
      });
    }

    // Format & check unique code
    const formattedCode = code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code: formattedCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Coupon code "${formattedCode}" already exists`
      });
    }

    // Validate bounds
    if (discountValue < 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value cannot be negative"
      });
    }

    if (discountType === "percentage" && discountValue > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount rate cannot exceed 100%"
      });
    }

    if (minCartValue !== undefined && minCartValue < 0) {
      return res.status(400).json({
        success: false,
        message: "Minimum cart value cannot be negative"
      });
    }

    if (maxDiscountCap !== undefined && maxDiscountCap !== null && maxDiscountCap < 0) {
      return res.status(400).json({
        success: false,
        message: "Maximum discount cap cannot be negative"
      });
    }

    // Date validations
    const start = new Date(startDate);
    const expiry = new Date(expiryDate);
    if (start >= expiry) {
      return res.status(400).json({
        success: false,
        message: "Expiry date must be after the start date"
      });
    }

    const coupon = new Coupon({
      code: formattedCode,
      discountType,
      discountValue,
      minCartValue: minCartValue || 0,
      maxDiscountCap: maxDiscountCap || null,
      startDate: start,
      expiryDate: expiry,
      usageLimit: usageLimit !== undefined ? usageLimit : null,
      perCustomerLimit: perCustomerLimit !== undefined ? perCustomerLimit : 1,
      status: status || "active"
    });

    await coupon.save();

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: coupon
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({
      success: false,
      message: "Error creating coupon",
      error: error.message
    });
  }
};

// @desc    Update coupon details (CRUD update)
// @route   PUT /api/admin/coupons/update/:id
// @access  Private (Admin)
export const updateCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      minCartValue,
      maxDiscountCap,
      startDate,
      expiryDate,
      usageLimit,
      perCustomerLimit,
      status
    } = req.body;

    let coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found"
      });
    }

    // If changing code, check uniqueness
    if (code) {
      const formattedCode = code.trim().toUpperCase();
      if (formattedCode !== coupon.code) {
        const existing = await Coupon.findOne({ code: formattedCode });
        if (existing) {
          return res.status(400).json({
            success: false,
            message: `Coupon code "${formattedCode}" already exists`
          });
        }
        coupon.code = formattedCode;
      }
    }

    // Validate bounds
    if (discountValue !== undefined) {
      if (discountValue < 0) {
        return res.status(400).json({
          success: false,
          message: "Discount value cannot be negative"
        });
      }
      const type = discountType || coupon.discountType;
      if (type === "percentage" && discountValue > 100) {
        return res.status(400).json({
          success: false,
          message: "Percentage discount rate cannot exceed 100%"
        });
      }
      coupon.discountValue = discountValue;
    }

    if (discountType !== undefined) {
      coupon.discountType = discountType;
    }

    if (minCartValue !== undefined) {
      if (minCartValue < 0) {
        return res.status(400).json({
          success: false,
          message: "Minimum cart value cannot be negative"
        });
      }
      coupon.minCartValue = minCartValue;
    }

    if (maxDiscountCap !== undefined) {
      if (maxDiscountCap !== null && maxDiscountCap < 0) {
        return res.status(400).json({
          success: false,
          message: "Maximum discount cap cannot be negative"
        });
      }
      coupon.maxDiscountCap = maxDiscountCap;
    }

    // Dates check
    const start = startDate ? new Date(startDate) : coupon.startDate;
    const expiry = expiryDate ? new Date(expiryDate) : coupon.expiryDate;
    if (start >= expiry) {
      return res.status(400).json({
        success: false,
        message: "Expiry date must be after the start date"
      });
    }

    if (startDate) coupon.startDate = start;
    if (expiryDate) coupon.expiryDate = expiry;

    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (perCustomerLimit !== undefined) coupon.perCustomerLimit = perCustomerLimit;
    if (status !== undefined) coupon.status = status;

    await coupon.save();

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: coupon
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).json({
      success: false,
      message: "Error updating coupon",
      error: error.message
    });
  }
};

// @desc    Delete a coupon (CRUD delete)
// @route   DELETE /api/admin/coupons/delete/:id
// @access  Private (Admin)
export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting coupon",
      error: error.message
    });
  }
};
