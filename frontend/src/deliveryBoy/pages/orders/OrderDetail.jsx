import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Phone, MapPin, Store, ShoppingCart, IndianRupee, AlertCircle, Play, Navigation, CheckCircle } from "lucide-react";
import axios from "axios";
import { useToast } from "../../../components/Toast";
import { getSocket, joinRoom, leaveRoom } from "../../../services/socket";

export default function OrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { showToast } = useToast();

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("deliveryBoyToken");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/delivery-boy/orders/${id}`, { headers });
      if (res.data.success) {
        setOrder(res.data.order);
      }
    } catch (error) {
      console.error("Error loading order detail:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();

    const rider = JSON.parse(localStorage.getItem("deliveryBoy") || "{}");
    const riderId = rider._id || rider.id;
    if (riderId) {
      const socket = getSocket();
      joinRoom(`deliveryBoy:${riderId}`);

      const handlePayoutUpdate = () => {
        fetchOrderDetails();
      };

      socket.on("payout:updated", handlePayoutUpdate);

      return () => {
        socket.off("payout:updated", handlePayoutUpdate);
        leaveRoom(`deliveryBoy:${riderId}`);
      };
    }
  }, [id]);

  const handleUpdateStatus = async (nextStatus) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem("deliveryBoyToken");
      const headers = { Authorization: `Bearer ${token}` };
      
      const storeObj = order.vendorId || order.primaryVendor || (order.vendorSubOrders && order.vendorSubOrders[0]?.vendorId);
      // Send coordinate mock data (representing rider coordinates)
      const payload = {
        status: nextStatus,
        latitude: storeObj?.latitude || 28.6139,
        longitude: storeObj?.longitude || 77.2090,
        note: `Order marked as ${nextStatus.replace(/_/g, " ")}`
      };

      const res = await axios.put(`${import.meta.env.VITE_API_URL}/delivery-boy/orders/${id}/status`, payload, { headers });
      
      if (res.data.success) {
        setOrder(res.data.order);
        showToast({ type: "success", message: `Order status updated to: ${nextStatus.replace(/_/g, " ")}` });
        
        // Navigation shortcuts depending on transition
        if (nextStatus === "On_the_Way" || nextStatus === "Reached_Customer") {
          navigate(`/delivery-boy/orders/${id}/map`);
        }
      }
    } catch (err) {
      console.error(err);
      showToast({ type: "error", message: err.response?.data?.message || "Failed to update status" });
    } finally {
      setUpdating(false);
    }
  };

  const handleVendorPickup = async (targetVendorId) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem("deliveryBoyToken");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/delivery-boy/orders/${id}/pickup-vendor`,
        { targetVendorId, status: "PICKED" },
        { headers }
      );

      if (res.data.success) {
        setOrder(res.data.order);
        showToast({ type: "success", message: res.data.message });
      }
    } catch (err) {
      console.error(err);
      showToast({ type: "error", message: err.response?.data?.message || "Failed to update vendor pickup" });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0B2214]"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-slate-100 text-center shadow-sm space-y-4">
        <AlertCircle className="mx-auto text-rose-500" size={32} />
        <h3 className="font-extrabold text-slate-800">Assignment Not Found</h3>
        <button onClick={() => navigate("/delivery-boy/dashboard")} className="px-4 py-2 bg-[#0B2214] text-white rounded-xl text-xs font-bold font-sans">
          Back Dashboard
        </button>
      </div>
    );
  }

  const subOrders = order.vendorSubOrders || [];
  const isMultiVendor = subOrders.length > 1;
  const storeObj = order.vendorId || order.primaryVendor || (order.vendorSubOrders && order.vendorSubOrders[0]?.vendorId);

  return (
    <div className="space-y-6 pb-6">
      {/* Header Back Link */}
      <button 
        onClick={() => navigate("/delivery-boy/orders")}
        className="flex items-center gap-2 text-slate-400 hover:text-[#0B2214] font-extrabold text-xs transition"
      >
        <ArrowLeft size={16} /> Back to Assignments
      </button>

      {/* Main card */}
      <div className="space-y-4">
        
        {/* Order Details Header */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">Order ID</span>
              <h3 className="text-md font-black text-[#0B2214]">#{order.orderId}</h3>
            </div>
            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${order.paymentMethod === "COD" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-[#047857]"}`}>
              {order.paymentMethod === "COD" ? "COD" : "PREPAID"} - {order.paymentStatus === "Paid" ? "PAID" : "PENDING"}
            </span>
          </div>

          <div className="flex gap-4 pt-3 border-t border-slate-50 text-xs font-bold text-slate-500">
            <div>
              <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-bold">Payout</span>
              <span className="text-[#0B2214] font-black">₹{order.riderPayout || order.deliveryCharge || 35}</span>
            </div>
            <div>
              <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-bold font-sans">Items</span>
              <span className="text-slate-700 font-black">{order.items?.reduce((sum, i) => sum + (i.qty || i.quantity || 1), 0) || 0} items</span>
            </div>
            {isMultiVendor && (
              <div>
                <span className="text-[8px] text-[#047857] uppercase tracking-wider block font-bold font-sans">Stores</span>
                <span className="text-[#047857] font-extrabold">{subOrders.filter(s => s.pickupStatus === "PICKED").length}/{subOrders.length} Picked</span>
              </div>
            )}
          </div>
        </div>

        {/* Multi-Vendor Pickup Checklist / Single Pickup Location */}
        {isMultiVendor ? (
          <div className="bg-white border border-emerald-100 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-[#0B2214] rounded-xl">
                  <Store size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800">Multi-Vendor Pickup Checklist</h4>
                  <p className="text-[10px] text-[#047857] font-bold">Collect parcels from {subOrders.length} stores before delivery</p>
                </div>
              </div>
              <span className="text-xs font-black bg-emerald-100 text-[#0B2214] px-2.5 py-1 rounded-full">
                {subOrders.filter(s => s.pickupStatus === "PICKED").length}/{subOrders.length} Completed
              </span>
            </div>

            <div className="space-y-4">
              {subOrders.map((sub, idx) => {
                const subVendorObj = sub.vendorId || {};
                const isPicked = sub.pickupStatus === "PICKED";
                return (
                  <div key={idx} className={`p-4 rounded-2xl border ${isPicked ? "bg-emerald-50/60 border-emerald-200" : "bg-slate-50 border-slate-200"} space-y-3 transition`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-extrabold text-xs text-slate-800">{subVendorObj.shopName || "Partner Store"}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{subVendorObj.address?.village || "Merchant Address"}, {subVendorObj.address?.district || "Store District"}</p>
                      </div>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${isPicked ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                        {isPicked ? "Picked" : "Pending"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                      {subVendorObj.phone ? (
                        <a href={`tel:${subVendorObj.phone}`} className="text-[10px] font-extrabold text-[#047857] flex items-center gap-1">
                          <Phone size={10} /> Call Merchant
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold">No Phone</span>
                      )}

                      {!isPicked && (
                        <button
                          onClick={() => handleVendorPickup(subVendorObj._id || subVendorObj.id)}
                          disabled={updating}
                          className="px-3.5 py-1.5 bg-[#0B2214] hover:bg-[#047857] text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
                        >
                          {updating ? "Updating..." : "Mark Store Picked Up"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-[#0B2214] rounded-xl">
                <Store size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800">Pickup Store</h4>
                <p className="text-[10px] text-slate-400 font-bold">Collect parcels from here</p>
              </div>
            </div>

            <div className="text-xs font-semibold text-slate-600 pl-1">
              <p className="font-extrabold text-slate-800">{storeObj?.shopName || "Aryusha Merchant Store"}</p>
              <p className="mt-1 leading-relaxed">{storeObj?.address?.village || storeObj?.address?.area || "Merchant Address"}, {storeObj?.address?.district || storeObj?.address?.city || "Store District"}</p>
              
              {storeObj?.phone && (
                <a 
                  href={`tel:${storeObj.phone}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-[#047857] font-black border border-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-50 transition cursor-pointer"
                >
                  <Phone size={12} /> Contact Merchant
                </a>
              )}
            </div>
          </div>
        )}

        {/* Dropoff customer location */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <MapPin size={18} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800">Delivery Dropoff</h4>
              <p className="text-[10px] text-slate-400 font-bold">Handover to client address</p>
            </div>
          </div>

          <div className="text-xs font-semibold text-slate-600 pl-1">
            <p className="font-extrabold text-slate-800">{order.deliveryAddress?.fullName}</p>
            <p className="mt-1 leading-relaxed">
              {order.deliveryAddress?.houseNo}, {order.deliveryAddress?.area}, {order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}
            </p>
            
            {order.deliveryAddress?.phoneNumber && (
              <a 
                href={`tel:${order.deliveryAddress.phoneNumber}`}
                className="mt-3 inline-flex items-center gap-1.5 text-indigo-700 font-black border border-indigo-200 px-3 py-1.5 rounded-xl hover:bg-indigo-50 transition cursor-pointer"
              >
                <Phone size={12} /> Call Customer
              </a>
            )}
          </div>
        </div>

        {/* Order Items Table */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <ShoppingCart size={18} />
            </div>
            <h4 className="text-xs font-black text-slate-800">Parcels checklist</h4>
          </div>

          <div className="divide-y divide-slate-50 text-xs pl-1">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-2.5 flex justify-between font-semibold">
                <span className="text-slate-700">{item.name} <span className="text-slate-400">x{item.qty}</span></span>
                <span className="text-slate-800 font-bold">₹{(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment & Collection Details Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${order.paymentMethod === "COD" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
              <IndianRupee size={18} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800">Payment Collection</h4>
              <p className="text-[10px] text-slate-400 font-bold font-sans">
                {order.paymentMethod === "COD" ? "Cash on Delivery collection required" : "Prepaid transaction"}
              </p>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-50 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold">Payment Mode:</span>
            <span className="font-extrabold text-slate-800">{order.paymentMethod === "COD" ? "Cash on Delivery (COD)" : "Online / Prepaid"}</span>
          </div>

          {order.paymentMethod === "COD" ? (
            <div className="bg-amber-50 border border-amber-250 rounded-2xl p-3 flex items-center justify-between mt-2">
              <div>
                <span className="text-[10px] text-amber-800 font-bold block uppercase tracking-wider">Collect Cash from Customer</span>
                <span className="text-lg font-black text-amber-950">₹{order.grandTotal?.toFixed(2)}</span>
              </div>
              <span className="px-2 py-1 bg-amber-100 text-amber-800 font-black text-[9px] rounded-lg uppercase">
                Collect Cash
              </span>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-250 rounded-2xl p-3 flex items-center justify-between mt-2">
              <div>
                <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider">Prepaid Order</span>
                <span className="text-lg font-black text-emerald-950">₹{order.grandTotal?.toFixed(2)}</span>
              </div>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-800 font-black text-[9px] rounded-lg uppercase">
                No Cash Collection
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Sequential Action Button Sticky Bottom shell equivalent */}
      <div className="pt-2">
        {order.deliveryStatus === "Assigned" && (
          <button
            onClick={() => handleUpdateStatus("Picked_Up")}
            disabled={updating}
            className="w-full py-4 bg-[#0B2214] hover:bg-[#153e25] text-white rounded-2xl font-bold transition shadow-lg shadow-purple-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play size={18} /> {updating ? "Processing..." : "Confirm Pickup Order"}
          </button>
        )}

        {order.deliveryStatus === "Picked_Up" && (
          <button
            onClick={() => handleUpdateStatus("On_the_Way")}
            disabled={updating}
            className="w-full py-4 bg-[#047857] hover:bg-[#065f46] text-white rounded-2xl font-bold transition shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Navigation size={18} /> {updating ? "Processing..." : "Start Journey (On the Way)"}
          </button>
        )}

        {order.deliveryStatus === "On_the_Way" && (
          <div className="space-y-2">
            <button
              onClick={() => navigate(`/delivery-boy/orders/${id}/map`)}
              className="w-full py-4 bg-[#047857] hover:bg-[#065f46] text-white rounded-2xl font-bold transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Navigation size={18} /> Track Route Map
            </button>
            <button
              onClick={() => handleUpdateStatus("Reached_Customer")}
              disabled={updating}
              className="w-full py-4.5 bg-[#0B2214] hover:bg-[#062c1a] text-white rounded-2xl font-bold transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle size={18} /> {updating ? "Processing..." : "I have Reached Customer"}
            </button>
          </div>
        )}

        {order.deliveryStatus === "Reached_Customer" && (
          <button
            onClick={() => navigate(`/delivery-boy/orders/${id}/verify`)}
            className="w-full py-4 bg-[#047857] hover:bg-[#065f46] text-white rounded-2xl font-bold transition shadow-lg shadow-emerald-250 flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle size={18} /> Enter Customer OTP
          </button>
        )}

        {order.deliveryStatus === "Delivered" && (
          <div className="bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-3xl p-4 text-center font-black text-xs flex items-center justify-center gap-2 shadow-sm">
            <CheckCircle size={18} className="text-emerald-700" />
            Parcels Delivered Successfully!
          </div>
        )}
      </div>

    </div>
  );
}
