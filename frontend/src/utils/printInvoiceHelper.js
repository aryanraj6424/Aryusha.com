/**
 * Utility to generate a clean, professional, document-style A4 print HTML document.
 * Sized for A4 paper (210mm x 297mm) with full-width usage, clean typography, 
 * real HTML <table> itemization, and right-aligned tabular financial summary blocks.
 */

export function generatePrintInvoiceHTML(order, { isAdmin = false } = {}) {
  const statusColors = {
    Pending: "#f59e0b",
    Accepted: "#3b82f6",
    Packed: "#1c4d2e",
    Out_for_Delivery: "#f97316",
    Delivered: "#22c55e",
    Cancelled: "#ef4444",
    Rejected: "#ef4444",
  };

  const itemSubtotal = (order.items || []).reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 0)), 0);

  // Platform fee extraction
  const computedPlatformFee = (order.handlingFee || 0) + (order.smallCartFee || 0) + (order.rainFee || 0);
  const residualFee = Number(order.grandTotal || 0) - (itemSubtotal - Number(order.couponDiscount || 0) + Number(order.deliveryCharge || 0) + Number(order.taxAmount || 0));
  const platformFee = computedPlatformFee > 0 ? computedPlatformFee : Math.max(0, residualFee);

  const vendorComm = order.vendorCommission || order.vendorSubOrders?.[0]?.vendorCommission || {};
  const commAmount = vendorComm.amount ?? 0;
  const commType = vendorComm.commissionType || "percentage";
  const commRate = vendorComm.rate ?? 0;

  let commLabel = "";
  if (commType === "flat") {
    commLabel = `₹${Number(commRate).toFixed(2)} flat`;
  } else if (commType === "percentage" || commRate > 0) {
    commLabel = `${commRate}%`;
  } else if (itemSubtotal > 0 && commAmount > 0) {
    const effectiveRate = ((commAmount / itemSubtotal) * 100);
    commLabel = effectiveRate % 1 === 0 ? `${effectiveRate.toFixed(0)}%` : `${effectiveRate.toFixed(1)}%`;
  } else {
    commLabel = `${commRate || 0}%`;
  }

  const vendorNetPayout = Math.max(0, itemSubtotal - commAmount);
  const adminEarning = commAmount + platformFee - Number(order.couponDiscount || 0);

  // Per-item calculations with exact mathematical reconciliation
  const rawItems = order.items || [];
  let allocatedCouponSum = 0;
  let allocatedCommSum = 0;

  const itemsWithBreakdown = rawItems.map((item, idx) => {
    const itemQty = Number(item.qty !== undefined && item.qty !== null ? item.qty : (item.quantity !== undefined && item.quantity !== null ? item.quantity : 1));
    const lineSubtotal = (Number(item.price) || 0) * itemQty;
    
    // 1. Coupon Discount Share
    let itemCoupon = 0;
    if (item.couponDiscount !== undefined && item.couponDiscount !== null && item.couponDiscount >= 0 && order.couponDiscount > 0) {
      itemCoupon = item.couponDiscount;
    } else if (order.couponDiscount > 0 && itemSubtotal > 0) {
      if (idx === rawItems.length - 1) {
        itemCoupon = Math.max(0, Math.round((order.couponDiscount - allocatedCouponSum + Number.EPSILON) * 100) / 100);
      } else {
        itemCoupon = Math.round(((lineSubtotal / itemSubtotal) * order.couponDiscount + Number.EPSILON) * 100) / 100;
        allocatedCouponSum += itemCoupon;
      }
    }

    // 2. Platform Commission
    let itemComm = 0;
    if (item.calculatedCommissionAmount !== undefined && item.calculatedCommissionAmount !== null && item.calculatedCommissionAmount > 0) {
      itemComm = item.calculatedCommissionAmount;
    } else if (commAmount > 0 && itemSubtotal > 0) {
      if (commType === "percentage") {
        itemComm = lineSubtotal * (commRate / 100);
      } else {
        itemComm = (lineSubtotal / itemSubtotal) * commAmount;
      }
    }

    if (idx === rawItems.length - 1 && commAmount > 0) {
      itemComm = Math.max(0, Math.round((commAmount - allocatedCommSum + Number.EPSILON) * 100) / 100);
    } else {
      itemComm = Math.round((itemComm + Number.EPSILON) * 100) / 100;
      allocatedCommSum += itemComm;
    }

    let itemCommLabel = "";
    const type = item.commissionType || commType;
    const val = item.commissionValue ?? item.commissionRateApplied ?? commRate;

    if (type === "flat") {
      itemCommLabel = `Flat ₹${Number(val).toFixed(2)}: −₹${itemComm.toFixed(2)}`;
    } else if (type === "percentage" || val > 0) {
      itemCommLabel = `${val}% of ₹${lineSubtotal.toFixed(2)}: −₹${itemComm.toFixed(2)}`;
    } else if (lineSubtotal > 0 && itemComm > 0) {
      const effRate = ((itemComm / lineSubtotal) * 100).toFixed(1);
      itemCommLabel = `${effRate}% of ₹${lineSubtotal.toFixed(2)}: −₹${itemComm.toFixed(2)}`;
    } else {
      itemCommLabel = `Platform Comm: −₹${itemComm.toFixed(2)}`;
    }

    const itemNetEarning = Math.max(0, lineSubtotal - itemComm);

    let variantText = "";
    if (item.variantLabel) {
      variantText = item.variantLabel;
    } else if (item.variantName) {
      variantText = item.variantName;
    } else if (item.variant) {
      variantText = typeof item.variant === "string" ? item.variant : (item.variant.variantLabel || item.variant.name || "");
    } else if (item.variantId && typeof item.variantId === "object") {
      if (item.variantId.variantLabel) {
        variantText = item.variantId.variantLabel;
      } else if (item.variantId.packSize && item.variantId.packSize.value && item.variantId.packSize.unit) {
        variantText = `${item.variantId.packSize.value} ${item.variantId.packSize.unit}`;
      }
    } else if (item.packSize) {
      variantText = typeof item.packSize === "string" ? item.packSize : (item.packSize.value && item.packSize.unit ? `${item.packSize.value} ${item.packSize.unit}` : "");
    } else if (item.unit) {
      variantText = item.unit;
    } else if (item.weight) {
      variantText = item.weight;
    }

    return {
      ...item,
      lineSubtotal,
      itemQty,
      variantText,
      itemCoupon,
      itemComm,
      itemCommLabel,
      itemNetEarning
    };
  });

  const formatVendorAddress = (addr) => {
    if (!addr) return "N/A";
    if (typeof addr === "string") return addr;
    if (typeof addr === "object") {
      const parts = [
        addr.shopAddress,
        addr.village,
        addr.area,
        addr.city || addr.district,
        addr.state,
        addr.pincode
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(", ") : "N/A";
    }
    return "N/A";
  };

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  const statusColor = statusColors[order.orderStatus] || "#94a3b8";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Tax Invoice - ${order.invoiceNumber || order.orderId}</title>
      <style>
        *, ::before, ::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          background: #ffffff;
          color: #0f172a;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          font-size: 11px;
          line-height: 1.4;
          width: 100%;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        @page {
          size: A4 portrait;
          margin: 12mm 15mm;
        }

        .invoice-wrapper {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
        }

        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
        }

        .header-brand {
          font-size: 24px;
          font-weight: 900;
          color: #0B2214;
          letter-spacing: -0.03em;
        }

        .header-subtitle {
          font-size: 9px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-top: 2px;
        }

        .udyam-tag {
          display: inline-block;
          margin-top: 4px;
          font-size: 9px;
          font-weight: 700;
          color: #153e25;
          font-family: ui-monospace, SFMono-Regular, monospace;
        }

        .header-meta {
          text-align: right;
          font-size: 10px;
        }

        .invoice-num {
          font-size: 14px;
          font-weight: 800;
          color: #0B2214;
          font-family: ui-monospace, SFMono-Regular, monospace;
        }

        .meta-line {
          color: #475569;
          margin-top: 2px;
        }

        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          margin-top: 4px;
        }

        .divider {
          height: 2px;
          background: #0B2214;
          margin-bottom: 14px;
          border: none;
        }

        .address-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }

        .address-cell {
          width: 48%;
          vertical-align: top;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 10px 12px;
        }

        .address-spacer {
          width: 4%;
        }

        .section-title {
          font-size: 9px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 4px;
        }

        .person-name {
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 2px;
        }

        .phone-no {
          font-family: ui-monospace, SFMono-Regular, monospace;
          color: #475569;
          font-size: 10px;
          margin-bottom: 2px;
        }

        .addr-text {
          color: #64748b;
          font-size: 10px;
          line-height: 1.35;
        }

        .slot-text {
          margin-top: 6px;
          padding-top: 4px;
          border-top: 1px dashed #cbd5e1;
          font-size: 9.5px;
          color: #475569;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }

        .items-table th {
          background: #f8fafc;
          border-top: 1px solid #cbd5e1;
          border-bottom: 2px solid #94a3b8;
          padding: 8px 10px;
          font-size: 9.5px;
          font-weight: 800;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          text-align: left;
        }

        .items-table th.num-col { text-align: center; width: 32px; }
        .items-table th.qty-col { text-align: center; width: 50px; }
        .items-table th.price-col { text-align: right; width: 85px; }
        .items-table th.total-col { text-align: right; width: 95px; }

        .items-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: top;
        }

        .items-table tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        .item-name {
          font-weight: 700;
          font-size: 11px;
          color: #0f172a;
        }

        .item-sub-info {
          font-size: 9.5px;
          margin-top: 3px;
          color: #64748b;
          line-height: 1.4;
        }

        .discount-green { color: #059669; font-weight: 600; }
        .comm-red { color: #dc2626; font-weight: 600; }
        .earning-purple { color: #0B2214; font-weight: 700; }

        .tabular-num {
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-variant-numeric: tabular-nums;
        }

        .totals-container-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        .totals-box-cell {
          width: 48%;
          vertical-align: top;
        }

        .summary-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 10px 12px;
        }

        .summary-card-purple {
          background: #faf5ff;
          border: 1px solid #bbf7d0;
          border-radius: 6px;
          padding: 10px 12px;
        }

        .summary-card-emerald {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 6px;
          padding: 10px 12px;
        }

        .summary-header {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #475569;
          margin-bottom: 6px;
          padding-bottom: 4px;
          border-bottom: 1px solid #e2e8f0;
        }

        .summary-header-purple {
          color: #07170d;
          border-bottom-color: #bbf7d0;
        }

        .summary-header-emerald {
          color: #064e3b;
          border-bottom-color: #a7f3d0;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          margin-bottom: 3px;
          color: #334155;
        }

        .summary-row-bold {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 800;
          margin-top: 6px;
          padding-top: 4px;
          border-top: 1px solid #cbd5e1;
          color: #0f172a;
        }

        .summary-row-bold-purple {
          color: #07170d;
          border-top-color: #bbf7d0;
        }

        .summary-row-bold-emerald {
          color: #065f46;
          border-top-color: #a7f3d0;
        }

        .footer-note {
          margin-top: 20px;
          padding-top: 8px;
          border-top: 1px solid #f1f5f9;
          text-align: center;
          font-size: 9px;
          color: #94a3b8;
        }
      </style>
    </head>
    <body>
      <div class="invoice-wrapper">
        <!-- Header Table -->
        <table class="header-table">
          <tr>
            <td style="vertical-align: top;">
              <div class="header-brand">Aryusha</div>
              <div class="header-subtitle">Tax Invoice / Bill of Supply</div>
              <div class="udyam-tag">Udyam Reg. No. UDYAM-BR-30-0092390</div>
            </td>
            <td class="header-meta" style="vertical-align: top;">
              <div><span style="color:#64748b; font-size:10px;">Invoice No: </span><span class="invoice-num">${order.invoiceNumber || "AR-000001"}</span></div>
              <div class="meta-line"><span style="color:#64748b;">Order ID: </span><strong class="tabular-num">${order.orderId}</strong></div>
              <div class="meta-line"><span style="color:#64748b;">Date: </span><strong>${formattedDate}</strong></div>
              <div>
                <span class="badge" style="background: ${statusColor}22; color: ${statusColor}; border: 1px solid ${statusColor}44;">
                  ${order.orderStatus}
                </span>
              </div>
            </td>
          </tr>
        </table>

        <hr class="divider">

        <!-- Address Table -->
        <table class="address-table">
          <tr>
            <td class="address-cell">
              <div class="section-title">Billed To (Customer)</div>
              <div class="person-name">${order.deliveryAddress?.fullName || order.customerId?.fullName || "Customer"}</div>
              <div class="phone-no">${order.deliveryAddress?.phoneNumber || order.customerId?.phoneNumber || ""}</div>
              <div class="addr-text">
                ${order.deliveryAddress?.houseNo ? order.deliveryAddress.houseNo + " " : ""}${order.deliveryAddress?.area || ""}, ${order.deliveryAddress?.city || ""} — ${order.deliveryAddress?.pincode || ""}
              </div>
              <div class="slot-text">
                <strong>Delivery Slot: </strong>
                <span>${order.deliverySlot?.time ? (order.deliverySlot.date ? order.deliverySlot.date + " (" + order.deliverySlot.time + ")" : order.deliverySlot.time) : "Standard Delivery"}</span>
              </div>
            </td>
            <td class="address-spacer"></td>
            <td class="address-cell">
              <div class="section-title">Fulfilled By (Vendor)</div>
              <div class="person-name">${order.vendorId?.shopName || "N/A"}</div>
              <div class="phone-no">${order.vendorId?.phone || "N/A"}</div>
              <div class="addr-text">${formatVendorAddress(order.vendorId?.address)}</div>
            </td>
          </tr>
        </table>

        <!-- Itemized Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th class="num-col">#</th>
              <th>Item Description & Deductions</th>
              <th class="qty-col">Qty</th>
              <th class="price-col">Unit Price</th>
              <th class="total-col">Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsWithBreakdown.map((item, i) => `
              <tr>
                <td class="num-col tabular-num" style="color:#64748b; font-weight:700;">${i + 1}</td>
                <td>
                  <div class="item-name">
                    ${item.name}
                    ${item.variantText ? `<span style="color:#6b21a8; font-size:10px; font-weight:700; margin-left:6px; background:#f3e8ff; padding:1px 6px; border-radius:4px; border:1px solid #e9d5ff; display:inline-block;">${item.variantText}</span>` : ""}
                  </div>
                  <div class="item-sub-info">
                    ${item.itemCoupon > 0 
                      ? `<div>• Coupon Discount: <span class="discount-green">−₹${item.itemCoupon.toFixed(2)}</span> ${order.couponCode ? "(" + order.couponCode + ")" : ""}</div>` 
                      : `<div style="color:#94a3b8; font-style:italic;">• No coupon discount</div>`
                    }
                    <div>• Platform Comm: <span class="comm-red">${item.itemCommLabel}</span></div>
                    <div>• Vendor Earning: <span class="earning-purple">₹${item.itemNetEarning.toFixed(2)}</span></div>
                  </div>
                </td>
                <td style="text-align:center;" class="tabular-num">${item.itemQty ?? item.qty ?? item.quantity ?? 1}</td>
                <td style="text-align:right;" class="tabular-num">₹${Number(item.price || 0).toFixed(2)}</td>
                <td style="text-align:right; font-weight:800;" class="tabular-num">₹${item.lineSubtotal.toFixed(2)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <!-- Totals & Settlement Table -->
        <table class="totals-container-table">
          <tr>
            <td class="totals-box-cell">
              <div class="summary-card">
                <div class="summary-header">CUSTOMER BILL SUMMARY</div>
                <div class="summary-row">
                  <span>Items Subtotal</span>
                  <span class="tabular-num">₹${itemSubtotal.toFixed(2)}</span>
                </div>
                ${Number(order.couponDiscount || 0) > 0 ? `
                  <div class="summary-row" style="color:#059669;">
                    <span>Coupon Discount</span>
                    <span class="tabular-num">−₹${Number(order.couponDiscount).toFixed(2)}</span>
                  </div>
                ` : ""}
                <div class="summary-row">
                  <span>Delivery Charge</span>
                  <span class="tabular-num">₹${Number(order.deliveryCharge || 0).toFixed(2)}</span>
                </div>
                ${Number(platformFee) > 0 ? `
                  <div class="summary-row">
                    <span>Platform Fee</span>
                    <span class="tabular-num">₹${Number(platformFee).toFixed(2)}</span>
                  </div>
                ` : ""}
                ${Number(order.taxAmount || 0) > 0 ? `
                  <div class="summary-row">
                    <span>Taxes (GST)</span>
                    <span class="tabular-num">₹${Number(order.taxAmount).toFixed(2)}</span>
                  </div>
                ` : ""}
                <div class="summary-row-bold">
                  <span>Grand Total (Customer Paid)</span>
                  <span class="tabular-num">₹${Number(order.grandTotal || 0).toFixed(2)}</span>
                </div>
              </div>
            </td>

            <td class="address-spacer"></td>

            <td class="totals-box-cell">
              ${isAdmin ? `
                <div class="summary-card-emerald">
                  <div class="summary-header summary-header-emerald">ADMIN SETTLEMENT SUMMARY</div>
                  <div class="summary-row">
                    <span>Platform Commission</span>
                    <span class="tabular-num" style="color:#059669; font-weight:600;">+₹${commAmount.toFixed(2)}</span>
                  </div>
                  <div class="summary-row">
                    <span>Platform Fee</span>
                    <span class="tabular-num" style="color:#059669; font-weight:600;">+₹${platformFee.toFixed(2)}</span>
                  </div>
                  ${Number(order.couponDiscount || 0) > 0 ? `
                    <div class="summary-row" style="color:#dc2626;">
                      <span>Coupon Discount Absorbed</span>
                      <span class="tabular-num">−₹${Number(order.couponDiscount).toFixed(2)}</span>
                    </div>
                  ` : ""}
                  <div class="summary-row-bold summary-row-bold-emerald">
                    <span>Total Admin Earning</span>
                    <span class="tabular-num">₹${adminEarning.toFixed(2)}</span>
                  </div>
                </div>
              ` : `
                <div class="summary-card-purple">
                  <div class="summary-header summary-header-purple">VENDOR SETTLEMENT SUMMARY</div>
                  <div class="summary-row">
                    <span>Item Subtotal</span>
                    <span class="tabular-num">₹${itemSubtotal.toFixed(2)}</span>
                  </div>
                  <div class="summary-row" style="color:#dc2626;">
                    <span>Platform Commission (${commLabel})</span>
                    <span class="tabular-num">−₹${commAmount.toFixed(2)}</span>
                  </div>
                  <div class="summary-row-bold summary-row-bold-purple">
                    <span>Vendor Net Payout</span>
                    <span class="tabular-num">₹${vendorNetPayout.toFixed(2)}</span>
                  </div>
                </div>
              `}
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <div class="footer-note">
          This is a computer-generated tax invoice and requires no physical signature. Thank you for doing business with Aryusha!
        </div>
      </div>
    </body>
    </html>
  `;
}
