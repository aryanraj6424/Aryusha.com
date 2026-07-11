import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle2, ChevronRight, MapPin, Inbox } from "lucide-react";
import axios from "axios";

export default function AssignedOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'pending', 'progress', 'completed'
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("deliveryBoyToken");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/delivery-boy/orders?tab=${activeTab}`, { headers });
      if (res.data.success) {
        setOrders(res.data.orders || []);
      }
    } catch (error) {
      console.error("Failed to load assigned orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersSilent = async () => {
    try {
      const token = localStorage.getItem("deliveryBoyToken");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/delivery-boy/orders?tab=${activeTab}`, { headers });
      if (res.data.success) {
        setOrders(res.data.orders || []);
      }
    } catch (error) {
      console.error("Failed silent reload of orders:", error);
    }
  };

  useEffect(() => {
    fetchOrders();

    const timer = setInterval(() => {
      fetchOrdersSilent();
    }, 6000);

    return () => clearInterval(timer);
  }, [activeTab]);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Assigned":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Picked_Up":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "On_the_Way":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Reached_Customer":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const tabs = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "progress", label: "Active" },
    { id: "completed", label: "Completed" }
  ];

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-slate-800">My Assignments</h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Manage and track your delivery routes</p>
      </div>

      {/* Tabs list */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-white text-[#6d28d9] shadow-sm font-extrabold"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6d28d9]"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center shadow-sm space-y-3">
          <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
            <Inbox size={24} />
          </div>
          <div>
            <p className="font-extrabold text-slate-600 text-sm">No assignments found</p>
            <p className="text-xs text-slate-400 font-medium mt-1">There are no orders matching this status.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order._id}
              onClick={() => navigate(`/delivery-boy/orders/${order._id}`)}
              className="bg-white rounded-3xl border border-slate-150 p-4 shadow-sm hover:border-purple-250 transition cursor-pointer flex justify-between items-center gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs text-slate-800">#{order.orderId}</span>
                  <span
                    className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${getStatusStyle(
                      order.deliveryStatus
                    )}`}
                  >
                    {order.deliveryStatus.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-500 font-semibold">
                  <p className="truncate">
                    <span className="font-bold text-slate-400">Vendor:</span> {order.vendorId?.shopName}
                  </p>
                  <p className="truncate">
                    <span className="font-bold text-slate-400">Customer:</span> {order.deliveryAddress?.fullName}
                  </p>
                  <p className="truncate flex items-center gap-0.5 text-[#6d28d9]">
                    <MapPin size={10} />
                    <span>Drop: {order.deliveryAddress?.area}, {order.deliveryAddress?.city}</span>
                  </p>
                </div>
              </div>

              {/* Payout & Action */}
              <div className="flex flex-col items-end gap-1.5 text-right self-stretch justify-between py-0.5">
                <div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Payout</span>
                  <span className="font-black text-slate-800 text-sm">₹{order.deliveryCharge || 35}</span>
                </div>
                <div className="bg-slate-50 text-slate-400 p-1.5 rounded-lg border border-slate-150">
                  <ChevronRight size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
