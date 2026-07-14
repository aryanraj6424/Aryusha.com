import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, User, MapPin, ShoppingBag, Coins, ShieldAlert, Truck } from "lucide-react";
import { useToast } from "../../../components/Toast";

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/orders/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setOrder(res.data.order);
      }
    } catch (error) {
      console.error("Error loading order details:", error);
      showToast({ type: "error", message: "Failed to load order details" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mb-3 animate-pulse"></div>
        <p className="text-gray-500 font-bold text-sm">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-700">Order Not Found</h2>
        <button
          onClick={() => navigate("/admin/orders")}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition cursor-pointer"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-250";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-250";
      case "shipped":
      case "out_for_delivery":
        return "bg-purple-100 text-purple-800 border-purple-255";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-250";
      case "cancelled":
      case "rejected":
        return "bg-red-100 text-red-800 border-red-250";
      default:
        return "bg-gray-100 text-gray-800 border-gray-250";
    }
  };

  // Commission Calculations
  const hasCommission = order.vendorCommission && order.vendorCommission.amount !== undefined;
  const commRate = hasCommission ? order.vendorCommission.rate : 8;
  const commType = hasCommission ? order.vendorCommission.commissionType : "percentage";
  const itemSubtotal = order.totalAmount || order.items?.reduce((sum, item) => sum + item.price * item.qty, 0) || 0;
  
  const commAmount = hasCommission 
    ? order.vendorCommission.amount 
    : (commType === "percentage" ? itemSubtotal * (commRate / 100) : commRate);
  const finalComm = Math.round(commAmount * 100) / 100;
  const payout = Math.max(0, itemSubtotal - finalComm);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Back header */}
      <button
        onClick={() => navigate("/admin/orders")}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-extrabold text-sm transition cursor-pointer"
      >
        <ArrowLeft size={16} /> Back to Orders List
      </button>

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-800">Order #{order.orderId || order._id}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase border ${getStatusColor(order.status)}`}>
              {order.orderStatus || order.status}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 font-semibold">
            Placed on: {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Grand Total</span>
          <span className="text-xl font-black text-green-700">₹{order.grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left 2 Columns: Order details, items */}
        <div className="md:col-span-2 space-y-6">
          {/* Ordered items */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              <ShoppingBag size={18} className="text-green-600" />
              Parcels Checklist
            </h3>
            <div className="divide-y divide-slate-100">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-3 flex justify-between items-center text-xs font-semibold text-slate-700">
                  <span>
                    {item.name} <span className="text-slate-405 font-black">x{item.qty}</span>
                  </span>
                  <span className="font-extrabold text-slate-900">₹{(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown (Admin Payout Details) */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              <Coins size={18} className="text-green-600" />
              Financial & Payout Summary
            </h3>
            <div className="space-y-2.5 text-xs font-semibold text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="text-slate-800">₹{itemSubtotal.toFixed(2)}</span>
              </div>
              {order.couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount ({order.couponCode || "COUPON"}):</span>
                  <span>-₹{order.couponDiscount.toFixed(2)}</span>
                </div>
              )}
              {order.handlingFee > 0 && (
                <div className="flex justify-between">
                  <span>Handling Fee:</span>
                  <span>₹{order.handlingFee.toFixed(2)}</span>
                </div>
              )}
              {order.smallCartFee > 0 && (
                <div className="flex justify-between">
                  <span>Small Cart Fee:</span>
                  <span>₹{order.smallCartFee.toFixed(2)}</span>
                </div>
              )}
              {order.rainFee > 0 && (
                <div className="flex justify-between">
                  <span>Rain Fee:</span>
                  <span>₹{order.rainFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charge:</span>
                <span>₹{(order.deliveryCharge || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes & GST:</span>
                <span>₹{(order.taxAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-slate-850 text-sm border-t border-dashed pt-2">
                <span>Grand Total (Paid by Customer):</span>
                <span>₹{order.grandTotal.toFixed(2)}</span>
              </div>

              {/* Commission details - admin only */}
              <div className="border-t border-slate-100 pt-3 mt-1 space-y-2.5 bg-slate-50 p-4 rounded-xl border">
                <div className="flex justify-between text-red-600 font-bold">
                  <span>Platform Commission ({commRate}{commType === "percentage" ? "%" : " flat"}):</span>
                  <span>-₹{finalComm.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-slate-855 text-sm">
                  <span>Vendor Payout (Subtotal - Commission):</span>
                  <span className="text-green-700">₹{payout.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold italic leading-tight">
                  * Note: Commission is calculated strictly on the items subtotal (₹{itemSubtotal.toFixed(2)}) and excludes taxes, delivery, or handling charges.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Customers, Riders, Vendors */}
        <div className="space-y-6">
          {/* Customer info */}
          <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 border-b pb-1.5">
              <User size={14} className="text-green-600" />
              Customer Details
            </h4>
            <div className="text-xs font-semibold text-slate-700 space-y-1">
              <p className="font-extrabold text-slate-900">{order.customer?.name}</p>
              <p>Email: {order.customer?.email}</p>
              <p>Phone: {order.customer?.phone}</p>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 border-b pb-1.5">
              <MapPin size={14} className="text-green-600" />
              Delivery Address
            </h4>
            <div className="text-xs font-semibold text-slate-700 space-y-1 leading-snug">
              <p className="font-extrabold text-slate-900">{order.deliveryAddress?.fullName}</p>
              <p>{order.deliveryAddress?.houseNo}, {order.deliveryAddress?.area}</p>
              <p>{order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}</p>
            </div>
          </div>

          {/* Vendor Details */}
          <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 border-b pb-1.5">
              <ShieldAlert size={14} className="text-green-600" />
              Vendor Details
            </h4>
            <div className="text-xs font-semibold text-slate-700 space-y-1">
              <p className="font-extrabold text-slate-900">{order.vendorId?.shopName || "N/A"}</p>
              <p>Phone: {order.vendorId?.phone || "N/A"}</p>
            </div>
          </div>

          {/* Delivery Boy details */}
          {order.deliveryBoyId && (
            <div className="bg-white rounded-2xl border p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 border-b pb-1.5">
                <Truck size={14} className="text-green-600" />
                Delivery Agent
              </h4>
              <div className="text-xs font-semibold text-slate-700 space-y-1">
                <p className="font-extrabold text-slate-900">{order.deliveryBoyId.fullName}</p>
                <p>Phone: {order.deliveryBoyId.phone}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
