import Vendor from "../vendor/models/Vendor.js";
import PlatformFeeSettings from "../admin/models/PlatformFeeSettings.js";

/**
 * Calculates commission strictly on the item/product subtotal for a vendor's items in the order.
 * Excludes delivery charge, handling fee, GST, small cart fee, rain fee, etc.
 * 
 * @param {Object} order - The order document/object containing items, grandTotal, etc.
 * @param {String} vendorId - The ID of the vendor to calculate commission for.
 * @returns {Promise<Object>} - { commissionAmount, rate, type, itemSubtotal }
 */
export const calculateVendorOrderCommission = async (order, vendorId) => {
  // 1. Fetch vendor to check override commission settings
  const vendor = await Vendor.findById(vendorId);
  
  // 2. Fetch platform global default commission settings
  const platformSettings = await PlatformFeeSettings.findOne() || {
    defaultCommissionType: "percentage",
    defaultCommissionValue: 8
  };

  const commType = vendor?.commissionValue !== null && vendor?.commissionValue !== undefined && vendor?.commissionValue !== ""
    ? vendor.commissionType 
    : platformSettings.defaultCommissionType || "percentage";
    
  const commVal = vendor?.commissionValue !== null && vendor?.commissionValue !== undefined && vendor?.commissionValue !== ""
    ? vendor.commissionValue 
    : platformSettings.defaultCommissionValue ?? 8;

  // 3. Compute item total strictly for items belonging to this vendor (price * qty)
  const orderItems = order.items || [];
  let itemSubtotal = 0;
  
  for (const item of orderItems) {
    const itemQty = item.qty || item.quantity || 0;
    const itemPrice = item.price || 0;
    itemSubtotal += itemPrice * itemQty;
  }

  // 4. Calculate commission amount
  let commissionAmount = 0;
  if (commType === "percentage") {
    commissionAmount = itemSubtotal * (commVal / 100);
  } else if (commType === "flat") {
    commissionAmount = itemSubtotal > 0 ? commVal : 0;
  }

  // Round to 2 decimal places
  commissionAmount = Math.round((commissionAmount + Number.EPSILON) * 100) / 100;

  return {
    commissionAmount,
    rate: commVal,
    type: commType,
    itemSubtotal
  };
};

/**
 * Synchronous commission calculator when vendor settings and platform settings are already fetched.
 */
export const calculateCommissionSync = (order, commType, commVal) => {
  const orderItems = order.items || [];
  let itemSubtotal = 0;
  
  for (const item of orderItems) {
    const itemQty = item.qty || item.quantity || 0;
    const itemPrice = item.price || 0;
    itemSubtotal += itemPrice * itemQty;
  }

  let commissionAmount = 0;
  if (commType === "percentage") {
    commissionAmount = itemSubtotal * (commVal / 100);
  } else if (commType === "flat") {
    commissionAmount = itemSubtotal > 0 ? commVal : 0;
  }

  return Math.round((commissionAmount + Number.EPSILON) * 100) / 100;
};
