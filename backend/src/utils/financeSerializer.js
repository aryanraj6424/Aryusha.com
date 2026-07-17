import { buildWaterfall } from "./ledgerSyncHelper.js";

/**
 * Serializer helpers for CustomerOrder documents.
 * Uses the buildWaterfall helper for consistent, annotated fee separation.
 *
 * Business rules baked in:
 *  - Commission is on itemSubtotal ONLY.
 *  - Coupon discount is absorbed by admin — does NOT reduce vendor earning.
 *  - Platform fees (handling, smallCart, delivery) are admin-only revenue.
 *  - Vendor net payout = itemSubtotal − commission (coupon and platform fees do not affect this).
 *  - Admin net revenue = commission + platformFees − couponDiscount.
 */

/** Strip all commission/fee metadata before sending to a customer. */
export const serializeCustomerOrder = (order) => {
  if (!order) return null;
  const obj = typeof order.toObject === "function" ? order.toObject() : JSON.parse(JSON.stringify(order));
  delete obj.vendorCommission;
  if (Array.isArray(obj.items)) {
    obj.items = obj.items.map(item => {
      delete item.calculatedCommissionAmount;
      delete item.commissionRateApplied;
      delete item.commissionResolutionLevel;
      return item;
    });
  }
  if (Array.isArray(obj.feeBreakdown)) {
    obj.feeBreakdown = obj.feeBreakdown.filter(f => f.feeType !== "commission");
  }
  return obj;
};

/**
 * Vendor view — shows itemSubtotal, commission, and netPayout only.
 * Does NOT expose coupon discount or admin revenue (admin-internal figures).
 */
export const serializeVendorOrder = (order, vendorId) => {
  if (!order) return null;
  const obj = typeof order.toObject === "function" ? order.toObject() : JSON.parse(JSON.stringify(order));

  const orderVendorId = obj.vendorId?._id ? obj.vendorId._id.toString() : obj.vendorId?.toString();
  if (orderVendorId !== vendorId.toString()) return null;

  const wf = buildWaterfall(order);

  obj.waterfall = {
    itemSubtotal:       wf.itemSubtotal,
    commissionType:     wf.commissionType,
    commissionRate:     wf.commissionRate,
    commissionAmount:   wf.commissionAmount,
    netPayout:          wf.netPayout,
    // Informational note for vendor
    note: "Commission is calculated on your item total only. Platform fees and coupon discounts are handled by the platform.",
  };

  // Also expose as flat fields for backwards compatibility
  obj.itemSubtotal     = wf.itemSubtotal;
  obj.commissionAmount = wf.commissionAmount;
  obj.netPayout        = wf.netPayout;

  return obj;
};

/**
 * Admin view — full waterfall including coupon, platform fees, and admin revenue.
 */
export const serializeAdminOrder = (order) => {
  if (!order) return null;
  const obj = typeof order.toObject === "function" ? order.toObject() : JSON.parse(JSON.stringify(order));

  const wf = buildWaterfall(order);

  obj.waterfall = {
    grandTotal:       wf.grandTotal,
    itemSubtotal:     wf.itemSubtotal,
    couponCode:       wf.couponCode,
    couponDiscount:   wf.couponDiscount,
    platformFees:     wf.platformFees,
    commissionType:   wf.commissionType,
    commissionRate:   wf.commissionRate,
    commissionAmount: wf.commissionAmount,
    netPayout:        wf.netPayout,
    adminNetRevenue:  wf.adminNetRevenue,
  };

  // Flat fields for backwards compatibility
  obj.itemSubtotal     = wf.itemSubtotal;
  obj.commissionAmount = wf.commissionAmount;
  obj.netPayout        = wf.netPayout;
  obj.platformFees     = wf.platformFees;
  obj.adminNetRevenue  = wf.adminNetRevenue;

  obj.adminCommissionDetails = {
    resolutionLevel:  obj.items?.[0]?.commissionResolutionLevel || "global",
    commissionType:   wf.commissionType,
    rate:             wf.commissionRate,
    amount:           wf.commissionAmount,
    itemSubtotal:     wf.itemSubtotal,
    netPayout:        wf.netPayout,
    platformFees:     wf.platformFees,
    couponDiscount:   wf.couponDiscount,
    adminNetRevenue:  wf.adminNetRevenue,
  };

  return obj;
};
