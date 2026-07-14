import mongoose from "mongoose";
import { Product, ProductVariant, VendorListing, VendorProduct } from "../../models/catalog.js";
import Coupon from "../../admin/models/Coupon.js";
import { calculateOrderFees } from "../../utils/feeCalculator.js";
import CustomerOrder from "../models/CustomerOrder.js";
import DeliverySlot from "../models/DeliverySlot.js";

/**
 * Helper: Resolve cart items with current database prices and MRP to prevent client-side price tampering.
 */
const resolveCartItems = async (items, vendorId) => {
  const resolved = [];
  if (!Array.isArray(items) || items.length === 0) return resolved;

  for (const item of items) {
    let price = item.price;
    let mrp = item.mrp;
    let name = item.name;
    let img = item.img;
    let brand = item.brand;
    let packSize = item.packSize;

    try {
      // 1. Resolve from VendorListing (standard variant catalog link)
      const listing = await VendorListing.findOne({
        vendorId,
        variantId: item.variantId
      }).populate("variantId");

      if (listing) {
        price = listing.sellingPrice;
        if (listing.variantId) {
          mrp = listing.variantId.mrp;
          packSize = listing.variantId.packSize;
        }
      } else {
        // 2. Fallback to VendorProduct reference
        const vpLink = await VendorProduct.findOne({
          vendorId,
          masterProductId: item.productId
        }).populate("masterProductId");

        if (vpLink) {
          price = vpLink.price;
          mrp = vpLink.mrp; // optional mrp
          if (vpLink.masterProductId) {
            name = vpLink.masterProductId.name;
            brand = vpLink.masterProductId.brand;
            if (vpLink.masterProductId.images && vpLink.masterProductId.images.length > 0) {
              img = vpLink.masterProductId.images[0];
            }
          }
        }
      }
    } catch (err) {
      console.error("Error resolving item price:", err);
    }

    resolved.push({
      productId: item.productId,
      variantId: item.variantId,
      name: name || item.name,
      brand: brand || item.brand || "Generic",
      img: img || item.img,
      packSize: typeof packSize === "object" && packSize?.value ? `${packSize.value} ${packSize.unit}` : packSize || item.packSize || "1 Unit",
      qty: Number(item.qty || 1),
      price: Number(price),
      mrp: mrp ? Number(mrp) : null,
      vendorId
    });
  }
  return resolved;
};

/**
 * Helper: Suggest related products (from same category, excluding existing cart products, top by stock)
 */
const getCrossSellSuggestions = async (items, vendorId) => {
  try {
    if (!Array.isArray(items) || items.length === 0) return [];
    
    const resolvedItems = await resolveCartItems(items, vendorId);
    const productIds = resolvedItems.map(i => i.productId).filter(Boolean);

    const productsInCart = await Product.find({ _id: { $in: productIds } });
    const categoryIds = productsInCart.map(p => p.categoryId).filter(Boolean);

    if (categoryIds.length === 0) return [];

    // Find other products in the same category
    const suggestedProducts = await Product.find({
      categoryId: { $in: categoryIds },
      _id: { $nin: productIds },
      status: "approved",
      isDeleted: { $ne: true }
    }).limit(15);

    const suggestions = [];
    for (const prod of suggestedProducts) {
      // Lookup variant details & check if vendor has listing
      const variant = await ProductVariant.findOne({ productId: prod._id, status: "active" });
      if (!variant) continue;

      let price = variant.basePrice;
      let mrp = variant.mrp;
      
      const listing = await VendorListing.findOne({ vendorId, variantId: variant._id });
      if (listing) {
        price = listing.sellingPrice;
      } else {
        const vpLink = await VendorProduct.findOne({ vendorId, masterProductId: prod._id });
        if (vpLink) {
          price = vpLink.price;
          mrp = vpLink.mrp;
        } else {
          continue; // Skip if not listed by the area's single vendor
        }
      }

      suggestions.push({
        productId: prod._id,
        variantId: variant._id,
        name: prod.name,
        brand: prod.brand || "Generic",
        price,
        mrp: mrp || null,
        img: variant.images?.[0] || prod.images?.[0] || "https://via.placeholder.com/150",
        packSize: variant.packSize && typeof variant.packSize === "object" && variant.packSize.value ? `${variant.packSize.value} ${variant.packSize.unit}` : variant.packSize || prod.unitType,
        vendorId
      });
    }

    return suggestions.slice(0, 8); // return top 5-8 recommendations
  } catch (error) {
    console.error("Cross-sell fetch failure (handled gracefully):", error);
    return []; // Return empty array on failure instead of crashing
  }
};

/**
 * Endpoint: Calculate full cart breakdown (GET/POST /customer/cart/summary)
 */
export const getCartSummary = async (req, res) => {
  try {
    const rawItems = req.body.items || (req.query.items ? JSON.parse(req.query.items) : []);
    const couponCode = req.body.couponCode || req.query.couponCode || null;
    const customerId = req.user ? req.user._id : null;

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return res.json({
        success: true,
        summary: {
          items: [],
          itemTotal: 0,
          mrpTotal: 0,
          couponDiscount: 0,
          handlingFee: 0,
          smallCartFee: 0,
          deliveryPartnerFee: 0,
          gst: 0,
          toPay: 0,
          appliedCoupon: null,
          suggestions: []
        }
      });
    }

    // Area-specific vendor is determined by first item's vendorId
    const vendorId = rawItems[0].vendorId || req.body.vendorId || req.query.vendorId;
    if (!vendorId) {
      return res.status(400).json({ success: false, message: "vendorId is required to calculate fees and resolve items." });
    }

    const items = await resolveCartItems(rawItems, vendorId);

    // Calculate Item Total and MRP Total
    let itemTotal = 0;
    let mrpTotal = 0;
    for (const item of items) {
      itemTotal += item.price * item.qty;
      mrpTotal += (item.mrp || item.price) * item.qty;
    }



    let couponDiscount = 0;
    let appliedCoupon = null;
    let couponError = null;

    // Validate and apply coupon if provided
    if (couponCode) {
      const codeUpper = String(couponCode).toUpperCase().trim();
      const coupon = await Coupon.findOne({ code: codeUpper });

      if (!coupon) {
        couponError = "Invalid coupon code";
      } else if (coupon.status !== "active") {
        couponError = "This coupon is inactive";
      } else if (new Date() < coupon.startDate) {
        couponError = "This coupon is not active yet";
      } else if (new Date() > coupon.expiryDate) {
        couponError = "This coupon has expired";
      } else if (itemTotal < coupon.minCartValue) {
        couponError = `Minimum order amount of ₹${coupon.minCartValue} is required to use this coupon`;
      } else if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        couponError = "Coupon usage limit has been reached";
      } else {
        if (customerId && coupon.perCustomerLimit !== null) {
          const count = await CustomerOrder.countDocuments({ customerId, couponCode: codeUpper });
          if (count >= coupon.perCustomerLimit) {
            couponError = "You have already used this coupon maximum times";
          }
        }
      }

      if (!couponError && coupon) {
        if (coupon.discountType === "flat") {
          couponDiscount = Math.min(coupon.discountValue, itemTotal);
        } else if (coupon.discountType === "percentage") {
          let discount = (itemTotal * coupon.discountValue) / 100;
          if (coupon.maxDiscountCap !== null) {
            discount = Math.min(discount, coupon.maxDiscountCap);
          }
          couponDiscount = Math.min(discount, itemTotal);
        }
        appliedCoupon = {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountAmount: couponDiscount
        };
      }
    }

    // Bill calculations using dynamic FeeConfig overrides
    const zoneId = req.body.zoneId || req.query.zoneId || "";
    const { breakdown, totalFees } = await calculateOrderFees(itemTotal, zoneId);

    const handlingFee = breakdown.find(f => f.feeType === "handling")?.amount || 0;
    const smallCartFee = breakdown.find(f => f.feeType === "small_cart")?.amount || 0;
    const deliveryPartnerFee = breakdown.find(f => f.feeType === "delivery_partner")?.amount || 0;
    const gst = breakdown.find(f => f.feeType === "gst")?.amount || 0;
    const rainFee = breakdown.find(f => f.feeType === "rain")?.amount || 0;
    const customFees = breakdown.filter(f => !["handling", "small_cart", "delivery_partner", "gst", "rain"].includes(f.feeType)).reduce((sum, f) => sum + f.amount, 0);

    const totalCalculatedFees = handlingFee + smallCartFee + deliveryPartnerFee + gst + rainFee + customFees;
    const toPay = Math.max(0, itemTotal - couponDiscount + totalCalculatedFees);

    const suggestions = await getCrossSellSuggestions(rawItems, vendorId);

    res.json({
      success: true,
      summary: {
        items,
        itemTotal,
        mrpTotal,
        couponDiscount,
        handlingFee,
        smallCartFee,
        deliveryPartnerFee,
        gst,
        rainFee,
        customFees,
        feeBreakdown: breakdown,
        toPay,
        appliedCoupon,
        couponError,
        suggestions
      }
    });

  } catch (error) {
    console.error("Cart summary calculation failure:", error);
    res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

/**
 * Endpoint: Get all active delivery slots (GET /customer/cart/slots)
 */
export const getDeliverySlots = async (req, res) => {
  try {
    let slots = await DeliverySlot.find();
    if (slots.length === 0) {
      const defaults = [
        { name: "Early Morning Slot", startTime: "07:00 AM", endTime: "10:00 AM", cutoffTime: "06:00" },
        { name: "Mid Day Slot", startTime: "11:00 AM", endTime: "02:00 PM", cutoffTime: "10:00" },
        { name: "Evening Rush Slot", startTime: "03:00 PM", endTime: "06:00 PM", cutoffTime: "14:00" },
        { name: "Night Delivery Slot", startTime: "07:00 PM", endTime: "10:00 PM", cutoffTime: "18:00" }
      ];
      slots = await DeliverySlot.insertMany(defaults);
    }
    res.json({ success: true, slots });
  } catch (error) {
    console.error("Get Delivery Slots Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Endpoint: Apply a coupon code (POST /customer/cart/apply-coupon)
 */
export const applyCoupon = async (req, res) => {
  try {
    const { couponCode, items, vendorId } = req.body;
    if (!couponCode) {
      return res.status(400).json({ success: false, message: "Coupon code is required" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart items are required to apply coupon" });
    }

    // Directly populate req.body and delegate to summary calculator
    req.body.couponCode = couponCode;
    return getCartSummary(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Endpoint: Remove currently applied coupon (POST /customer/cart/remove-coupon)
 */
export const removeCoupon = async (req, res) => {
  try {
    // Clear coupon and calculate updated summary
    req.body.couponCode = null;
    req.query.couponCode = null;
    return getCartSummary(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Endpoint: Get all active coupons (GET /customer/cart/coupons)
 */
export const getActiveCoupons = async (req, res) => {
  try {
    const subtotal = Number(req.query.subtotal || 0);
    const currentDate = new Date();

    const query = {
      status: "active",
      startDate: { $lte: currentDate },
      expiryDate: { $gte: currentDate }
    };

    if (subtotal > 0) {
      query.minCartValue = { $lte: subtotal };
    }

    const coupons = await Coupon.find(query).sort({ expiryDate: 1 });
    res.json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
