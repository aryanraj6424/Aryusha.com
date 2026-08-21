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

  const [ratingSelected, setRatingSelected] = useState({});
  const [ratingFeedback, setRatingFeedback] = useState({});
  const [reorderingId, setReorderingId] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast({ type: "success", message: "Order ID copied to clipboard!" });
  };

  const handleRepeatOrder = async (order) => {
    if (!order?.items || order.items.length === 0) {
      showToast({ type: "warning", message: "No items found in this order." });
      return;
    }

    try {
      setReorderingId(order._id);

      // Fetch live catalog products with location context if available
      const storedAddr = localStorage.getItem("selectedAddress");
      const params = {};
      if (storedAddr) {
        try {
          const parsed = JSON.parse(storedAddr);
          if (parsed.latitude) params.latitude = parsed.latitude;
          if (parsed.longitude) params.longitude = parsed.longitude;
          if (parsed.pincode) params.pincode = parsed.pincode;
        } catch (e) {
          console.error("Error parsing stored address:", e);
        }
      }

      const res = await axios.get(`${import.meta.env.VITE_API_URL}/products`, { params });
      const liveProducts = res.data.products || [];

      const storedCart = localStorage.getItem("cart");
      let currentCart = [];
      try {
        currentCart = storedCart ? JSON.parse(storedCart) : [];
        if (!Array.isArray(currentCart)) currentCart = [];
      } catch {
        currentCart = [];
      }

      const updatedCart = [...currentCart];
      const skippedItemNames = [];
      let addedCount = 0;

      for (const oldItem of order.items) {
        const targetVariantId = oldItem.variantId ? oldItem.variantId.toString() : null;
        const targetProductId = oldItem.productId ? oldItem.productId.toString() : null;

        let matchedProduct = null;
        let matchedVariant = null;

        for (const prod of liveProducts) {
          if (targetProductId && prod._id.toString() === targetProductId) {
            matchedProduct = prod;
            if (targetVariantId) {
              matchedVariant = (prod.variants || []).find(v => v._id.toString() === targetVariantId);
            }
            if (!matchedVariant && prod.variants?.length > 0) {
              matchedVariant = prod.variants[0];
            }
            break;
          }

          if (targetVariantId) {
            const vFound = (prod.variants || []).find(v => v._id.toString() === targetVariantId);
            if (vFound) {
              matchedProduct = prod;
              matchedVariant = vFound;
              break;
            }
          }
        }

        const isAvailable = matchedProduct && matchedVariant && (matchedVariant.stockQty > 0 || matchedVariant.stockStatus === "in_stock");

        if (isAvailable) {
          const livePrice = Number(matchedVariant.sellingPrice || matchedVariant.price || oldItem.price || 0);
          const liveMrp = Number(matchedVariant.mrp || matchedVariant.sellingPrice || oldItem.mrp || livePrice);
          const liveVendorId = matchedVariant.vendorId || matchedProduct.primaryVendorId || oldItem.vendorId;
          const liveVendorName = matchedVariant.vendorName || matchedProduct.primaryVendorName || oldItem.vendorName || "";
          const packLabel = matchedVariant.variantLabel || (matchedVariant.packSize ? `${matchedVariant.packSize.value} ${matchedVariant.packSize.unit}` : "") || oldItem.packSize || "";
          const liveImg = matchedVariant.images?.[0] || matchedProduct.images?.[0] || oldItem.img || "https://via.placeholder.com/150";

          const existingIdx = updatedCart.findIndex(c => c.variantId.toString() === matchedVariant._id.toString());
          if (existingIdx > -1) {
            updatedCart[existingIdx].qty += (oldItem.qty || 1);
            updatedCart[existingIdx].price = livePrice;
            updatedCart[existingIdx].mrp = liveMrp;
            updatedCart[existingIdx].vendorId = liveVendorId;
            updatedCart[existingIdx].vendorName = liveVendorName;
          } else {
            updatedCart.push({
              variantId: matchedVariant._id,
              productId: matchedProduct._id,
              name: matchedProduct.name || oldItem.name,
              brand: matchedProduct.brand || oldItem.brand || "",
              price: livePrice,
              mrp: liveMrp,
              qty: oldItem.qty || 1,
              img: liveImg,
              vendorName: liveVendorName,
              vendorId: liveVendorId,
              packSize: packLabel
            });
          }
          addedCount++;
        } else {
          skippedItemNames.push(oldItem.name || "Unknown Item");
        }
      }

      if (addedCount === 0) {
        showToast({
          type: "error",
          message: "None of the items from this order are currently available for delivery at your location."
        });
        return;
      }

      localStorage.setItem("cart", JSON.stringify(updatedCart));
      window.dispatchEvent(new Event("cart-updated"));

      if (skippedItemNames.length > 0) {
        showToast({
          type: "warning",
          message: `Added ${addedCount} item(s) to cart. Skipped unavailable: ${skippedItemNames.join(", ")}`
        });
      } else {
        showToast({ type: "success", message: "All items from this order added to cart with current prices!" });
      }

      navigate("/customer/cart");
    } catch (err) {
      console.error("Repeat order fail:", err);
      showToast({ type: "error", message: "Failed to repeat order. Please try again." });
    } finally {
      setReorderingId(null);
    }
  };

  const submitOrderRating = async (orderId) => {
    const star = ratingSelected[orderId];
    const text = ratingFeedback[orderId] || "";
    if (!star) return;
    try {
      const token = localStorage.getItem("userToken");
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/customer/orders/${orderId}/rate`,
        { rating: star, feedback: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        showToast({ type: "success", message: res.data.message });
        fetchOrders();
      }
    } catch (err) {
      console.error("Failed to rate order:", err);
      showToast({ type: "error", message: err.response?.data?.message || "Failed to submit rating." });
    }
  };

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
      showToast({ type: "error", message: "Failed to download invoice. Please try again." });
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
    <div className="max-w-3xl mx-auto py-8 px-0 sm:px-4 space-y-6">
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
                    <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1">
                      Order #{order.orderId}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(order.orderId);
                        }}
                        className="p-1 hover:bg-slate-200 rounded text-slate-400 transition cursor-pointer text-xs"
                        title="Copy Order ID"
                      >
                        📋
                      </button>
                    </span>
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
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Ordered Items</h4>
                    <div className="divide-y divide-slate-100">
                      {order.items.map((item, idx) => {
                        const variantText = item.variantLabel || item.variantName || (item.packSize ? (typeof item.packSize === 'string' ? item.packSize : `${item.packSize.value} ${item.packSize.unit}`) : "") || item.unit || item.weight || (item.variantId && typeof item.variantId === 'object' ? (item.variantId.variantLabel || (item.variantId.packSize ? `${item.variantId.packSize.value} ${item.variantId.packSize.unit}` : "")) : "");
                        return (
                          <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs font-semibold">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                                {item.img ? (
                                  <img src={item.img} alt={item.name} className="max-h-full max-w-full object-contain p-1" />
                                ) : (
                                  <ShoppingBag className="text-slate-350" size={16} />
                                )}
                              </div>
                              <div>
                                <h5 className="font-extrabold text-slate-800 leading-snug">{item.name}</h5>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {variantText && (
                                    <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-bold border border-purple-100">
                                      {variantText}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400 font-bold">Qty: {item.qty || item.quantity}</span>
                                </div>
                              </div>
                            </div>
                            <span className="text-slate-800 font-black text-sm">₹{((item.price || 0) * (item.qty || item.quantity || 1)).toFixed(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Shipment Tracking Timeline */}
                  {!isFailed ? (
                    <div className="space-y-4 pt-2">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Order Status Timeline</h4>
                      
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
                            <div key={step} className="flex flex-col items-center z-10 space-y-1 flex-1">
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
                                className={`text-[8px] sm:text-[10px] text-center font-bold break-all leading-tight px-0.5 mt-1 block ${
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
                    <div className="bg-red-50 border border-red-150 p-4 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-bold animate-pulse">
                      <XCircle size={18} />
                      This order has been {order.orderStatus.toLowerCase()}.
                    </div>
                  )}

                  {/* Delivery Rider Assignment Details */}
                  {order.deliveryBoyId && (
                    <div className="p-4 bg-purple-50/30 border border-purple-100 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase text-purple-650 tracking-wider block">Assigned Delivery Agent</span>
                        <p className="text-xs font-extrabold text-slate-800">{order.deliveryBoyId.fullName || "Delivery Partner"}</p>
                        <p className="text-[10px] text-slate-400 font-bold">Phone: {order.deliveryBoyId.phone || "N/A"}</p>
                      </div>

                      {order.deliveryStatus !== "Delivered" && order.deliveryOtp && (
                        <div className="bg-white px-3 py-2 border border-purple-150 rounded-xl text-center shadow-sm w-full sm:w-auto">
                          <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block mb-0.5">Delivery OTP</span>
                          <span className="text-sm font-black text-[#0B2214] tracking-widest bg-[#f5f3ff] px-2.5 py-0.5 rounded border border-purple-200">
                            {order.deliveryOtp}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rate your order experience card */}
                  {order.orderStatus === "Delivered" && !order.rating && (
                    <div className="bg-purple-50/20 border border-purple-100 rounded-2xl p-5 space-y-4">
                      <div className="text-center space-y-1">
                        <h4 className="font-extrabold text-slate-805 text-xs tracking-wide uppercase">Rate Your Order</h4>
                        <p className="text-[10px] text-slate-400 font-bold">Help us improve by rating your grocery quality & rider service</p>
                      </div>
                      <div className="flex justify-center gap-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatingSelected({ ...ratingSelected, [order._id]: star })}
                            className="text-2xl transition hover:scale-125 focus:outline-none cursor-pointer"
                            title={`Rate ${star} Stars`}
                          >
                            {star <= (ratingSelected[order._id] || 0) ? "⭐" : "☆"}
                          </button>
                        ))}
                      </div>
                      {ratingSelected[order._id] && (
                        <div className="space-y-3 animate-fade-in">
                          <textarea
                            value={ratingFeedback[order._id] || ""}
                            onChange={(e) => setRatingFeedback({ ...ratingFeedback, [order._id]: e.target.value })}
                            placeholder="Tell us what you liked or how we can improve (optional)..."
                            className="w-full border p-2.5 rounded-xl text-xs font-semibold outline-none focus:border-purple-650 bg-white"
                            rows="2"
                          />
                          <button
                            type="button"
                            onClick={() => submitOrderRating(order._id)}
                            className="w-full bg-purple-600 hover:bg-purple-750 text-white font-extrabold text-xs py-2 rounded-xl transition cursor-pointer"
                          >
                            Submit Review
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {order.orderStatus === "Delivered" && order.rating && (
                    <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 text-xs font-semibold text-emerald-850">
                      <span className="text-xl">✨</span>
                      <div>
                        <p className="font-bold">You rated this order {order.rating} / 5 stars</p>
                        {order.ratingFeedback && <p className="text-[10px] text-emerald-600 italic font-medium mt-0.5">"{order.ratingFeedback}"</p>}
                      </div>
                    </div>
                  )}

                  {/* Dynamic Bill Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Bill Summary</h4>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs font-semibold text-slate-600">
                      <div className="flex justify-between">
                        <span>Item Total:</span>
                        <span className="text-slate-800">₹{(order.totalAmount || (order.grandTotal - (order.deliveryCharge || 0) - (order.taxAmount || 0) - (order.handlingFee || 0) - (order.smallCartFee || 0) - (order.rainFee || 0) + (order.couponDiscount || 0))).toFixed(2)}</span>
                      </div>
                      {order.couponDiscount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Coupon Discount {order.couponCode ? `(${order.couponCode})` : ""}:</span>
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
                        <span>Delivery Partner Fee:</span>
                        <span className={order.deliveryCharge === 0 ? "text-emerald-600 font-black bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] uppercase" : "text-slate-800"}>
                          {order.deliveryCharge === 0 ? "FREE" : `₹${order.deliveryCharge.toFixed(2)}`}
                        </span>
                      </div>
                      {order.taxAmount > 0 && (
                        <div className="flex justify-between">
                          <span>GST & Charges:</span>
                          <span>₹{order.taxAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between font-black text-slate-850 text-sm">
                        <span>Paid via {order.paymentMethod || "COD"}:</span>
                        <span className="text-purple-700 font-black text-base">₹{order.grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Customer support row entry point */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs text-slate-500 font-semibold">Need help with this order?</span>
                    <button
                      type="button"
                      onClick={() => navigate("/customer/support")}
                      className="text-xs font-extrabold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      Get Support
                    </button>
                  </div>

                  {/* Delivery details and actions */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="text-xs font-semibold text-slate-500">
                      <span className="text-[10px] uppercase text-slate-400 block font-bold mb-0.5">Delivered to</span>
                      <p className="text-slate-800 font-extrabold">{order.deliveryAddress?.fullName}</p>
                      <p className="text-[10px] text-slate-400">{order.deliveryAddress?.houseNo}, {order.deliveryAddress?.area}, {order.deliveryAddress?.city} - {order.deliveryAddress?.pincode}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => handleRepeatOrder(order)}
                        disabled={reorderingId === order._id}
                        className="flex-1 md:flex-none bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-700 px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        {reorderingId === order._id ? "Reordering..." : "Repeat Order"}
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/customer/orders/${order._id}/track`)}
                        className="flex-1 md:flex-none bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        Track Order
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(order._id, order.orderId)}
                        className="flex-1 md:flex-none bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                      >
                        <Download size={14} /> Download Invoice
                      </button>
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