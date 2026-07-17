import Vendor from "../vendor/models/Vendor.js";
import PlatformFeeSettings from "../admin/models/PlatformFeeSettings.js";
import { Product } from "../models/catalog.js";

/**
 * Calculates commission on the item/product subtotal for a vendor's items in the order.
 * Follows the hierarchy: Product-level override -> Vendor-level override -> Global platform default.
 * Excludes delivery charge, handling fee, GST, small cart fee, rain fee, etc.
 * 
 * @param {Object} order - The order document/object containing items (with productId, price, qty).
 * @param {String} vendorId - The ID of the vendor.
 * @returns {Promise<Object>} - { commissionAmount, rate, type, itemSubtotal, resolutionLevel, items }
 */
export const calculateVendorOrderCommission = async (order, vendorId) => {
  // 1. Fetch vendor to check override commission settings
  const vendor = await Vendor.findById(vendorId);
  
  // 2. Fetch platform global default commission settings
  const platformSettings = await PlatformFeeSettings.findOne() || {
    defaultCommissionType: "percentage",
    defaultCommissionValue: 8
  };

  // Determine vendor/global level configuration
  const vendorOrGlobalType = vendor?.commissionValue !== null && vendor?.commissionValue !== undefined && vendor?.commissionValue !== ""
    ? vendor.commissionType 
    : platformSettings.defaultCommissionType || "percentage";
      
  const vendorOrGlobalVal = vendor?.commissionValue !== null && vendor?.commissionValue !== undefined && vendor?.commissionValue !== ""
    ? vendor.commissionValue 
    : platformSettings.defaultCommissionValue ?? 8;

  const vendorOrGlobalLevel = vendor?.commissionValue !== null && vendor?.commissionValue !== undefined && vendor?.commissionValue !== ""
    ? "vendor"
    : "global";

  const orderItems = order.items || [];
  let itemSubtotal = 0;
  let totalCommissionAmount = 0;
  
  let hasProductOverride = false;
  let hasVendorOverride = vendorOrGlobalLevel === "vendor";

  // Accumulate inherited items subtotal for order-level processing (like flat commission)
  let inheritedSubtotal = 0;
  const processedItems = [];

  // Step 1: Identify product-level overrides and accumulate inherited items
  for (const item of orderItems) {
    const itemQty = item.qty || item.quantity || 0;
    const itemPrice = item.price || 0;
    const subtotal = itemPrice * itemQty;
    itemSubtotal += subtotal;

    // Fetch the product to check per-product commission rate
    const product = await Product.findById(item.productId);
    
    if (product && product.commissionType !== "inherit" && product.commissionValue !== null && product.commissionValue !== undefined) {
      hasProductOverride = true;
      let itemCommission = 0;
      if (product.commissionType === "percentage") {
        itemCommission = subtotal * (product.commissionValue / 100);
      } else if (product.commissionType === "flat") {
        itemCommission = product.commissionValue * itemQty; // Flat rate per unit sold
      }

      processedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        price: itemPrice,
        qty: itemQty,
        img: item.img,
        calculatedCommissionAmount: Math.round((itemCommission + Number.EPSILON) * 100) / 100,
        commissionRateApplied: product.commissionValue,
        commissionResolutionLevel: "product"
      });

      totalCommissionAmount += itemCommission;
    } else {
      inheritedSubtotal += subtotal;
      processedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        price: itemPrice,
        qty: itemQty,
        img: item.img,
        // will calculate in second step
        calculatedCommissionAmount: 0,
        commissionRateApplied: vendorOrGlobalVal,
        commissionResolutionLevel: vendorOrGlobalLevel
      });
    }
  }

  // Step 2: Process inherited items using vendor-level or global default
  if (inheritedSubtotal > 0) {
    let inheritedCommission = 0;
    if (vendorOrGlobalType === "percentage") {
      inheritedCommission = inheritedSubtotal * (vendorOrGlobalVal / 100);
    } else if (vendorOrGlobalType === "flat") {
      // If flat commission on the sale, apply once to the inherited total
      inheritedCommission = vendorOrGlobalVal;
    }

    totalCommissionAmount += inheritedCommission;

    // Distribute inherited commission among inherited items
    for (const item of processedItems) {
      if (item.commissionResolutionLevel !== "product") {
        const itemSubtotal = item.price * item.qty;
        let itemCommission = 0;
        if (vendorOrGlobalType === "percentage") {
          itemCommission = itemSubtotal * (vendorOrGlobalVal / 100);
        } else if (vendorOrGlobalType === "flat") {
          // Distribute the flat fee proportionally based on item value
          itemCommission = inheritedSubtotal > 0 ? (itemSubtotal / inheritedSubtotal) * inheritedCommission : 0;
        }
        item.calculatedCommissionAmount = Math.round((itemCommission + Number.EPSILON) * 100) / 100;
      }
    }
  }

  // Resolve overall order resolution level by priority hierarchy
  let resolvedLevel = "global";
  if (hasProductOverride) {
    resolvedLevel = "product";
  } else if (hasVendorOverride) {
    resolvedLevel = "vendor";
  }

  totalCommissionAmount = Math.round((totalCommissionAmount + Number.EPSILON) * 100) / 100;

  return {
    commissionAmount: totalCommissionAmount,
    rate: hasProductOverride ? 0 : vendorOrGlobalVal, // rate is mixed if per-product applies
    type: hasProductOverride ? "mixed" : vendorOrGlobalType,
    itemSubtotal,
    resolutionLevel: resolvedLevel,
    items: processedItems
  };
};

/**
 * Synchronous commission calculator.
 * Sums pre-calculated item-level commission amounts, or falls back to legacy order-level math.
 */
export const calculateCommissionSync = (order, commType, commVal) => {
  const orderItems = order.items || [];
  let hasItemCommission = false;
  let totalCommission = 0;

  for (const item of orderItems) {
    if (item.calculatedCommissionAmount !== undefined && item.calculatedCommissionAmount !== null) {
      hasItemCommission = true;
      totalCommission += item.calculatedCommissionAmount;
    }
  }

  if (hasItemCommission) {
    return Math.round((totalCommission + Number.EPSILON) * 100) / 100;
  }

  // Fallback for legacy orders (prior to item-level commission tracking)
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
