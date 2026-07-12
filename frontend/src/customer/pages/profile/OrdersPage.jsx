import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Clock, ShoppingBag, CheckCircle, XCircle, Download, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "../../../components/Toast";

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const { showToast } = useToast();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!user) {
      showToast({ type: "warning", message: "Please login first." });
      navigate("/login");
      return;
    }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("userToken");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/customer/orders/user/${user._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (orderId, orderCode) => {
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/customer/orders/${orderId}/invoice`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const file = new Blob([res.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = fileURL;
      link.download = `invoice_${orderCode}.pdf`;
      link.click();
    } catch (err) {
      console.error(err);
      showToast({ type: "error", message: "Failed to download invoice. Please make sure the order is Delivered." });
    }
  };

  const toggleExpand = (id) => {
    setExpandedOrder(expandedOrder === id ? null : id);
  };

  // Timeline definition
  const steps = ["Pending", "Accepted", "Packed", "Out_for_Delivery", "Delivered"];

  const getStepIndex = (status) => {
    return steps.indexOf(status);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Accepted":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Packed":
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
      case "Out_for_Delivery":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "Delivered":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Rejected":
      case "Cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-3 animate-pulse"></div>
        <p className="text-slate-500 font-bold text-sm">Loading order history...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mx-auto text-purple-500 shadow-inner">
          <ShoppingBag size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800">No Orders Yet</h2>
          <p className="text-slate-500 text-sm font-semibold">
            Once you place an order, you will see its history and track its status here.
          </p>
        </div>
        <button
          onClick={() => navigate("/customer/dashboard")}
          className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold transition shadow-md"
        >
          Shop Now
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate("/customer/dashboard")}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-extrabold text-sm transition"
      >
        <ArrowLeft size={16} /> Back to Catalog
      </button>

      <h1 className="text-2xl md:text-3xl font-black text-slate-800">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => {
          const isDelivered = order.orderStatus === "Delivered";
          const isFailed = order.orderStatus === "Rejected" || order.orderStatus === "Cancelled";
          const currentStepIdx = getStepIndex(order.orderStatus);

          return (
            <div
              key={order._id}
              className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden transition hover:shadow-md"
            >
              {/* Header card view */}
              <div
                onClick={() => toggleExpand(order._id)}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none bg-slate-50/50"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-800 text-sm">Order #{order.orderId}</span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getStatusColor(
                        order.orderStatus
                      )}`}
                    >
                      {order.orderStatus}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    Placed: {new Date(order.createdAt).toLocaleDateString()} at{" "}
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Total Amount</span>
                    <span className="font-black text-purple-700 text-sm">₹{order.grandTotal.toFixed(2)}</span>
                  </div>

                  <div className="text-slate-400">
                    {expandedOrder === order._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>

              {/* Expandable details view */}
              {expandedOrder === order._id && (
                <div className="p-6 border-t border-slate-50 space-y-6">
                  {/* Items List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Ordered Items</h4>
                    <div className="divide-y divide-slate-100">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="py-2.5 flex justify-between items-center text-xs font-semibold">
                          <span className="text-slate-700">{item.name} <span className="text-slate-400">x{item.qty}</span></span>
                          <span className="text-slate-800 font-bold">₹{(item.price * item.qty).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipment Tracking Timeline */}
                  {!isFailed ? (
                    <div className="space-y-4 pt-2">
                      <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Order Status Timeline</h4>
                      
                      {/* Tracking timeline bubbles */}
                      <div className="flex justify-between items-center relative py-4">
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
                        <div
                          className="absolute top-1/2 left-0 h-0.5 bg-purple-500 -translate-y-1/2 z-0 transition-all duration-300"
                          style={{
                            width: `${(currentStepIdx / (steps.length - 1)) * 100}%`,
                          }}
                        ></div>

                        {steps.map((step, idx) => {
                          const isCompleted = idx <= currentStepIdx;
                          const isActive = idx === currentStepIdx;
                          return (
                            <div key={step} className="flex flex-col items-center z-10 space-y-1">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition ${
                                  isCompleted
                                    ? "bg-purple-650 border-purple-650 text-white shadow-sm"
                                    : "bg-white border-slate-200 text-slate-400"
                                } ${isActive ? "ring-4 ring-purple-100 animate-pulse" : ""}`}
                              >
                                {isCompleted ? "✓" : idx + 1}
                              </div>
                              <span
                                className={`text-[9px] font-bold ${
                                  isCompleted ? "text-purple-700" : "text-slate-400"
                                }`}
                              >
                                {step.replace(/_/g, " ")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-50 border border-red-150 p-4 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-bold">
                      <XCircle size={18} />
                      This order has been {order.orderStatus.toLowerCase()}.
                    </div>
                  )}

                  {/* Delivery Rider Assignment Details */}
                  {order.deliveryBoyId && (
                    <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase text-purple-650 tracking-wider block">Assigned Delivery Agent</span>
                        <p className="text-xs font-extrabold text-slate-800">{order.deliveryBoyId.fullName || "Delivery Partner"}</p>
                        <p className="text-[10px] text-slate-400 font-bold">Phone: {order.deliveryBoyId.phone || "N/A"}</p>
                      </div>

                      {order.deliveryStatus !== "Delivered" && order.deliveryOtp && (
                        <div className="bg-white px-3 py-2 border border-purple-150 rounded-xl text-center shadow-sm w-full sm:w-auto">
                          <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block mb-0.5">Delivery OTP</span>
                          <span className="text-sm font-black text-[#6d28d9] tracking-widest bg-[#f5f3ff] px-2.5 py-0.5 rounded border border-purple-200">
                            {order.deliveryOtp}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Delivery details and actions */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="text-xs font-semibold text-slate-500">
                      <span className="text-[10px] uppercase text-slate-400 block font-bold mb-0.5">Delivered to</span>
                      {order.deliveryAddress?.fullName}, {order.deliveryAddress?.pincode}
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => navigate(`/customer/orders/${order._id}/track`)}
                        className="flex-1 sm:flex-none bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        Track Order
                      </button>

                      {isDelivered ? (
                        <button
                          onClick={() => handleDownloadInvoice(order._id, order.orderId)}
                          className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                        >
                          <Download size={14} /> Download Invoice
                        </button>
                      ) : (
                        <button
                          disabled
                          className="flex-1 sm:flex-none bg-slate-100 text-slate-400 px-4 py-2.5 rounded-xl text-xs font-bold cursor-not-allowed flex items-center justify-center gap-1.5"
                          title="Invoice only available after order is delivered."
                        >
                          <Download size={14} /> Download Invoice
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}