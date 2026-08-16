import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Search,
  Eye,
  Ban,
  Unlock,
  ChevronDown,
  ChevronUp,
  X,
  Printer,
  Package,
  Calendar,
  CreditCard,
  Store,
  Filter,
} from "lucide-react";
import { useToast } from "../../../components/Toast";
import ConfirmDialog from "../../../components/Toast/ConfirmDialog";
import { generatePrintInvoiceHTML } from "../../../utils/printInvoiceHelper";

// ─── Invoice Modal ─────────────────────────────────────────────────────────────
export function InvoiceModal({ order, onClose }) {
  const invoiceRef = useRef();

  const handlePrint = () => {
    const htmlContent = generatePrintInvoiceHTML(order, { isAdmin: true });
    const printWin = window.open("", "_blank", "width=850,height=750");
    printWin.document.write(htmlContent);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => { printWin.print(); }, 250);
  };

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

  // Platform fee extraction (pulling real order fee fields or residual fee)
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

  // Per-item calculations with exact mathematical reconciliation
  const rawItems = order.items || [];
  let allocatedCouponSum = 0;
  let allocatedCommSum = 0;

  const itemsWithBreakdown = rawItems.map((item, idx) => {
    const lineSubtotal = (Number(item.price) || 0) * (Number(item.qty) || 0);
    
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

    // Check last item residual to match total commAmount exactly
    if (idx === rawItems.length - 1 && commAmount > 0) {
      itemComm = Math.max(0, Math.round((commAmount - allocatedCommSum + Number.EPSILON) * 100) / 100);
    } else {
      itemComm = Math.round((itemComm + Number.EPSILON) * 100) / 100;
      allocatedCommSum += itemComm;
    }

    // Resolved Commission Label
    let itemCommLabel = "";
    const type = item.commissionType || commType;
    const val = item.commissionValue ?? item.commissionRateApplied ?? commRate;

    if (type === "flat") {
      itemCommLabel = `Flat ₹${Number(val).toFixed(2)} per item: −₹${itemComm.toFixed(2)}`;
    } else if (type === "percentage" || val > 0) {
      itemCommLabel = `${val}% of ₹${lineSubtotal.toFixed(2)}: −₹${itemComm.toFixed(2)}`;
    } else if (lineSubtotal > 0 && itemComm > 0) {
      const effRate = ((itemComm / lineSubtotal) * 100).toFixed(1);
      itemCommLabel = `${effRate}% of ₹${lineSubtotal.toFixed(2)}: −₹${itemComm.toFixed(2)}`;
    } else {
      itemCommLabel = `Platform Commission: −₹${itemComm.toFixed(2)}`;
    }

    // Net Item Earning
    const itemNetEarning = Math.max(0, lineSubtotal - itemComm);

    return {
      ...item,
      lineSubtotal,
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-100 overflow-hidden my-auto min-w-0">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-bold text-slate-800 whitespace-nowrap">Tax Invoice</span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-bold truncate">
              {order.invoiceNumber || "AR-000001"}
            </span>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-700 text-white rounded-xl text-xs font-bold hover:bg-purple-800 transition shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Printer size={14} /> Print Invoice
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-200/60 text-slate-500 rounded-xl transition cursor-pointer">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Invoice Body */}
        <div className="overflow-y-auto p-4 sm:p-8 space-y-6 min-w-0" ref={invoiceRef}>
          {/* Print-Only Context Running Header */}
          <div className="hidden print:flex justify-between items-center text-[10px] text-slate-400 font-mono border-b border-slate-200 pb-1 mb-2">
            <span>Tax Invoice: {order.invoiceNumber || order.orderId}</span>
            <span>Aryusha — Tax Invoice / Bill of Supply</span>
          </div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-100 pb-5 min-w-0">
            <div className="min-w-0">
              <h3 className="text-2xl sm:text-3xl font-black text-purple-700 tracking-tight break-words">Aryusha</h3>
              <p className="text-xxs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Tax Invoice / Bill of Supply</p>
            </div>
            <div className="text-left sm:text-right text-xs space-y-1 min-w-0 break-words">
              <p className="font-mono font-bold text-slate-900 text-sm break-all">
                <span className="text-slate-400 font-medium text-xs">Invoice No: </span>
                <span className="text-purple-700">{order.invoiceNumber || "AR-000001"}</span>
              </p>
              <p className="font-mono text-slate-600 break-all">
                <span className="text-slate-400 font-medium">Order ID: </span>
                {order.orderId}
              </p>
              <p className="text-slate-500">
                <span className="text-slate-400 font-medium">Date: </span>
                {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
              <div className="pt-1">
                <span
                  className="badge"
                  style={{ background: (statusColors[order.orderStatus] || "#94a3b8") + "22", color: statusColors[order.orderStatus] || "#94a3b8" }}
                >
                  {order.orderStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Business Compliance Block (Udyam Registration only) */}
          <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs min-w-0">
            <span className="font-bold text-slate-700 whitespace-nowrap">Udyam Registration No.</span>
            <span className="font-mono font-black text-purple-800 tracking-wide bg-white px-2.5 py-1 rounded-md border border-purple-200 break-all">
              UDYAM-BR-30-0092390
            </span>
          </div>

          {/* Customer & Vendor Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs min-w-0">
            <div className="bg-slate-50/80 border border-slate-100 p-4 rounded-xl space-y-1 min-w-0 overflow-hidden break-words">
              <p className="font-bold text-slate-400 uppercase tracking-wider text-xxs mb-1">Billed To</p>
              <p className="font-bold text-slate-800 text-sm break-words">{order.deliveryAddress?.fullName || order.customerId?.fullName}</p>
              <p className="text-slate-600 font-mono break-all">{order.deliveryAddress?.phoneNumber || order.customerId?.phoneNumber}</p>
              <p className="text-slate-500 leading-relaxed break-words">
                {order.deliveryAddress?.houseNo} {order.deliveryAddress?.area}, {order.deliveryAddress?.city} — {order.deliveryAddress?.pincode}
              </p>
              <div className="mt-2 pt-2 border-t border-slate-200/60 text-xxs">
                <span className="font-bold text-slate-500">Delivery Slot: </span>
                <span className="font-extrabold text-purple-700">
                  {order.deliverySlot?.time
                    ? `${order.deliverySlot.date ? order.deliverySlot.date + " (" + order.deliverySlot.time + ")" : order.deliverySlot.time}`
                    : "Standard Delivery"}
                </span>
              </div>
            </div>

            <div className="bg-slate-50/80 border border-slate-100 p-4 rounded-xl space-y-1 min-w-0 overflow-hidden break-words">
              <p className="font-bold text-slate-400 uppercase tracking-wider text-xxs mb-1">Fulfilled By</p>
              <p className="font-bold text-slate-800 text-sm break-words">{order.vendorId?.shopName || "N/A"}</p>
              <p className="text-slate-600 font-mono break-all">{order.vendorId?.phone || "N/A"}</p>
              <p className="text-slate-500 break-words">{formatVendorAddress(order.vendorId?.address)}</p>
            </div>
          </div>

          {/* Itemized Breakdown Cards */}
          <div className="space-y-3 min-w-0">
            <div className="flex justify-between items-center px-1 min-w-0">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Itemized Breakdown</span>
              <span className="text-xxs font-bold text-slate-400">{itemsWithBreakdown.length} Item{itemsWithBreakdown.length > 1 ? "s" : ""}</span>
            </div>

            {itemsWithBreakdown.map((item, i) => (
              <div key={i} className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs min-w-0 overflow-hidden">
                {/* Item Main Info */}
                <div className="flex justify-between items-start gap-2 min-w-0">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xxs font-bold text-slate-400 flex-shrink-0">#{i + 1}</span>
                      <span className="font-bold text-slate-800 text-xs sm:text-sm break-words min-w-0">{item.name}</span>
                    </div>
                    <p className="text-xxs text-slate-500 font-mono">
                      {item.qty} × ₹{Number(item.price || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xxs font-bold text-slate-400 block uppercase tracking-wider">Line Total</span>
                    <span className="font-mono font-black text-slate-900 text-sm">₹{item.lineSubtotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Item Deductions */}
                <div className="pt-2 border-t border-slate-200/60 space-y-1 text-xxs sm:text-xs min-w-0">
                  {/* Coupon Share */}
                  <div className="flex justify-between items-center min-w-0 gap-2">
                    <span className="text-slate-500 font-medium flex-shrink-0">Coupon Share:</span>
                    {item.itemCoupon > 0 ? (
                      <span className="font-mono font-bold text-emerald-600 truncate">
                        {order.couponCode ? `${order.couponCode} discount` : "Coupon discount"}: −₹{item.itemCoupon.toFixed(2)}
                      </span>
                    ) : (
                      <span className="font-mono text-slate-400 italic">No coupon on this item</span>
                    )}
                  </div>

                  {/* Commission */}
                  <div className="flex justify-between items-center min-w-0 gap-2">
                    <span className="text-slate-500 font-medium flex-shrink-0">Platform Commission:</span>
                    <span className="font-mono font-bold text-red-600 truncate">
                      {item.itemCommLabel}
                    </span>
                  </div>
                </div>

                {/* Net Earning Highlight Line */}
                <div className="bg-purple-100/70 border border-purple-200/80 rounded-lg px-3 py-2 flex justify-between items-center min-w-0">
                  <span className="font-bold text-purple-900 text-xxs sm:text-xs uppercase tracking-wider flex-shrink-0">
                    Vendor earns on this item
                  </span>
                  <span className="font-mono font-black text-purple-800 text-xs sm:text-sm">
                    ₹{item.itemNetEarning.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals & Financial Breakdown Section */}
          <div className="space-y-4 pt-2">
            {/* Block 1: Customer Bill */}
            <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Customer Bill</span>
                <span className="text-xxs font-bold text-slate-400">Payment Breakdown</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between py-0.5">
                  <span>Item Subtotal</span>
                  <span className="font-mono font-semibold">₹{itemSubtotal.toFixed(2)}</span>
                </div>
                {order.couponDiscount > 0 && (
                  <div className="flex justify-between py-0.5 text-emerald-600 font-medium">
                    <span>Coupon Discount ({order.couponCode || "APPLIED"})</span>
                    <span className="font-mono font-bold">- ₹{Number(order.couponDiscount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between py-0.5">
                  <span>Delivery Charge</span>
                  <span className="font-mono font-semibold">₹{Number(order.deliveryCharge || 0).toFixed(2)}</span>
                </div>
                {platformFee > 0 && (
                  <div className="flex justify-between py-0.5">
                    <span>Platform Fee</span>
                    <span className="font-mono font-semibold">₹{platformFee.toFixed(2)}</span>
                  </div>
                )}
                {order.taxAmount > 0 && (
                  <div className="flex justify-between py-0.5">
                    <span>Taxes & GST</span>
                    <span className="font-mono font-semibold">₹{Number(order.taxAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 text-sm font-extrabold text-slate-900 border-t border-slate-200">
                  <span>Customer Grand Total</span>
                  <span className="font-mono text-purple-700">₹{Number(order.grandTotal || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Thin Visual Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-xxs font-bold text-slate-400 uppercase tracking-wider bg-white px-2">
                Vendor Settlement
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Block 2: Vendor Earning */}
            <div className="bg-purple-50/70 border border-purple-200/70 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-purple-200/60">
                <span className="text-xs font-black text-purple-900 uppercase tracking-wider">Vendor Earning</span>
                <span className="text-xxs font-bold text-purple-600">Payout Breakdown</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between items-center py-0.5">
                  <span className="font-semibold text-slate-700">Vendor Item Subtotal</span>
                  <span className="font-mono font-bold text-slate-900">₹{itemSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-0.5 text-red-600">
                  <span className="font-semibold">Platform Commission ({commLabel})</span>
                  <span className="font-mono font-bold">- ₹{commAmount.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-purple-200 flex justify-between items-center">
                  <span className="text-xs font-black text-purple-900 uppercase tracking-wider">Vendor Net Earning</span>
                  <span className="text-sm font-mono font-black text-purple-700">₹{vendorNetPayout.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Thin Visual Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-xxs font-bold text-slate-400 uppercase tracking-wider bg-white px-2">
                Admin Settlement
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Block 3: Admin Earning */}
            <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-emerald-200/60">
                <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">Admin Earning</span>
                <span className="text-xxs font-bold text-emerald-600">Platform Revenue Breakdown</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between items-center py-0.5">
                  <span className="font-semibold text-slate-700">Platform Commission</span>
                  <span className="font-mono font-bold text-emerald-800">+ ₹{commAmount.toFixed(2)}</span>
                </div>
                {platformFee > 0 && (
                  <div className="flex justify-between items-center py-0.5">
                    <span className="font-semibold text-slate-700">Platform Fees</span>
                    <span className="font-mono font-bold text-emerald-800">+ ₹{platformFee.toFixed(2)}</span>
                  </div>
                )}
                {order.couponDiscount > 0 && (
                  <div className="flex justify-between items-center py-0.5 text-amber-700">
                    <span className="font-semibold">Coupon Discount Absorbed</span>
                    <span className="font-mono font-bold">- ₹{Number(order.couponDiscount).toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-emerald-200 flex justify-between items-center">
                  <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">Total Admin Earning</span>
                  <span className="text-sm font-mono font-black text-emerald-700">
                    ₹{Math.max(0, commAmount + platformFee - Number(order.couponDiscount || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap justify-between items-center gap-2 text-xs text-slate-500">
            <p>Payment Method: <strong className="text-slate-800 uppercase">{order.paymentMethod || "COD"}</strong></p>
            <p>Payment Status: <strong className="text-slate-800 uppercase">{order.paymentStatus || "PENDING"}</strong></p>
          </div>
          <p className="text-xxs text-slate-400 text-center font-medium pt-2">
            This is a system-generated invoice. No signature required.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Order History Panel ────────────────────────────────────────────────────────
function CustomerOrdersPanel({ customer, onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const ORDER_STATUSES = ["Pending", "Accepted", "Packed", "Out_for_Delivery", "Delivered", "Cancelled", "Rejected"];
  const STATUS_COLORS = {
    Pending: "bg-yellow-100 text-yellow-700",
    Accepted: "bg-blue-100 text-blue-700",
    Packed: "bg-violet-100 text-violet-700",
    Out_for_Delivery: "bg-orange-100 text-orange-700",
    Delivered: "bg-green-100 text-green-700",
    Cancelled: "bg-red-100 text-red-700",
    Rejected: "bg-red-100 text-red-700",
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("adminToken");
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/admin/customers/${customer._id}/orders`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOrders(res.data.orders || []);
      } catch (err) {
        console.error("Error fetching customer orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [customer._id]);

  const filtered = statusFilter === "all" ? orders : orders.filter(o => o.orderStatus === statusFilter);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b bg-gradient-to-r from-purple-600 to-violet-600 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{customer.fullName}</h2>
            <p className="text-purple-200 text-xs">{customer.phoneNumber} · {customer.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition">
            <X size={18} />
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b bg-slate-50 flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${statusFilter === "all" ? "bg-purple-600 text-white" : "bg-white border text-slate-600 hover:bg-slate-50"}`}
          >
            All ({orders.length})
          </button>
          {ORDER_STATUSES.map(s => {
            const count = orders.filter(o => o.orderStatus === s).length;
            if (!count) return null;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${statusFilter === s ? "bg-purple-600 text-white" : "bg-white border text-slate-600 hover:bg-slate-50"}`}
              >
                {s.replace(/_/g, " ")} ({count})
              </button>
            );
          })}
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Loading orders...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Package size={40} className="mb-3 opacity-40" />
              <p className="font-semibold">No orders found</p>
            </div>
          ) : (
            filtered.map((order) => (
              <div key={order._id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg">{order.orderId}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_COLORS[order.orderStatus] || "bg-slate-100 text-slate-600"}`}>
                        {order.orderStatus?.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard size={11} /> {order.paymentMethod}
                      </span>
                      <span className="flex items-center gap-1">
                        <Store size={11} /> {order.vendorId?.shopName || "N/A"}
                      </span>
                    </div>
                    <div className="mt-1.5 text-xs text-slate-500">
                      {order.items?.length} item{order.items?.length !== 1 ? "s" : ""} · {order.items?.map(i => i.name).join(", ").slice(0, 60)}{order.items?.map(i => i.name).join(", ").length > 60 ? "…" : ""}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <p className="text-base font-extrabold text-slate-800">₹{order.grandTotal?.toFixed(2)}</p>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold hover:bg-purple-100 transition"
                    >
                      <Eye size={11} /> Invoice
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats Footer */}
        <div className="p-4 border-t bg-slate-50 flex justify-between text-sm">
          <span className="text-slate-500 font-semibold">{filtered.length} order{filtered.length !== 1 ? "s" : ""}</span>
          <span className="font-bold text-purple-700">
            Total: ₹{filtered.reduce((sum, o) => sum + (o.grandTotal || 0), 0).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Invoice Modal */}
      {selectedOrder && (
        <InvoiceModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </>
  );
}

// ─── Main CustomerList Page ─────────────────────────────────────────────────────
export default function CustomerList() {
  const { showToast } = useToast();
  const [confirmState, setConfirmState] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, newThisMonth: 0 });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/customers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const customersData = response.data.customers || [];
      setCustomers(customersData);

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStats({
        total: customersData.length,
        active: customersData.filter((c) => c.status === "active").length,
        inactive: customersData.filter((c) => c.status !== "active").length,
        newThisMonth: customersData.filter((c) => new Date(c.createdAt) >= firstDayOfMonth).length,
      });
    } catch (error) {
      console.error("Error fetching customers:", error);
      showToast({ type: "error", message: "Failed to load customers" });
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (customerId) => {
    setConfirmState({
      message: "Are you sure you want to block this customer?",
      type: "danger",
      onConfirm: async () => {
        setConfirmState(null);
        try {
          const token = localStorage.getItem("adminToken");
          await axios.put(
            `${import.meta.env.VITE_API_URL}/admin/customers/${customerId}/block`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          showToast({ type: "success", message: "Customer blocked successfully" });
          fetchCustomers();
        } catch (error) {
          showToast({ type: "error", message: "Failed to block customer" });
        }
      },
    });
  };

  const handleUnblock = async (customerId) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/customers/${customerId}/unblock`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast({ type: "success", message: "Customer unblocked" });
      fetchCustomers();
    } catch (error) {
      showToast({ type: "error", message: "Failed to unblock customer" });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700";
      case "inactive": return "bg-gray-100 text-gray-600";
      case "blocked": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phoneNumber?.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <div className="text-slate-400 text-sm font-semibold">Loading customers...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Customer Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">View and manage your customer base</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 border rounded-xl text-sm font-semibold w-full sm:w-72 outline-none focus:border-purple-500 transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 border rounded-xl text-sm font-semibold outline-none focus:border-purple-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Customers", value: stats.total, color: "text-slate-800" },
          { label: "Active", value: stats.active, color: "text-green-600" },
          { label: "Inactive / Blocked", value: stats.inactive, color: "text-slate-500" },
          { label: "New This Month", value: stats.newThisMonth, color: "text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{s.label}</p>
            <p className={`text-3xl font-black mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {["Customer", "Contact", "Orders", "Spent", "Status", "Joined", "Actions"].map((col) => (
                <th key={col} className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredCustomers.map((customer) => (
              <tr key={customer._id} className="hover:bg-slate-50 transition">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0">
                      {customer.fullName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{customer.fullName || "N/A"}</p>
                      <p className="text-xs text-slate-400 font-mono">{customer._id?.slice(-8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm font-semibold text-slate-700">{customer.phoneNumber}</p>
                  <p className="text-xs text-slate-400">{customer.email}</p>
                </td>
                <td className="px-5 py-4">
                  <span className="font-bold text-slate-700">{customer.totalOrders || 0}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="font-bold text-slate-700">₹{(customer.totalSpent || 0).toFixed(0)}</span>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(customer.status)}`}>
                    {customer.status || "active"}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-slate-500 font-semibold">
                  {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("en-IN") : "—"}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCustomer(customer)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold hover:bg-purple-100 transition"
                    >
                      <Eye size={12} /> Orders
                    </button>
                    {customer.status !== "blocked" ? (
                      <button
                        onClick={() => handleBlock(customer._id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 transition"
                      >
                        <Ban size={12} /> Block
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnblock(customer._id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 border border-green-200 rounded-lg text-xs font-bold hover:bg-green-100 transition"
                      >
                        <Unlock size={12} /> Unblock
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCustomers.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            <Search size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No customers match your search</p>
          </div>
        )}
      </div>

      {/* Customer Orders Slide-out Panel */}
      {selectedCustomer && (
        <CustomerOrdersPanel
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          message={confirmState.message}
          type={confirmState.type || "warning"}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}
