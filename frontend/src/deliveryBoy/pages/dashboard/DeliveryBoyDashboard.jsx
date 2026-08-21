import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, CheckCircle, Clock, MapPin, ArrowRight, Wallet, HelpCircle, Phone, Navigation, Route } from "lucide-react";
import axios from "axios";
import { useToast } from "../../../components/Toast";
import { getSocket, joinRoom, leaveRoom } from "../../../services/socket";

export default function DeliveryBoyDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [weeklyBreakdown, setWeeklyBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("deliveryBoyToken");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/delivery-boy/dashboard`, { headers });
      
      if (res.data.success) {
        setStats(res.data.stats);
        setEarnings(res.data.earnings);
        setActiveDeliveries(res.data.activeDeliveries || []);
        setWeeklyBreakdown(res.data.weeklyBreakdown || []);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const timer = setInterval(() => {
      fetchDashboardData();
    }, 4000);

    // Socket real-time integration
    const rider = JSON.parse(localStorage.getItem("deliveryBoy") || "{}");
    const riderId = rider._id || rider.id;
    if (riderId) {
      const socket = getSocket();
      joinRoom(`deliveryBoy:${riderId}`);

      const handleAssigned = (data) => {
        showToast({
          type: "info",
          message: data.message || "A new order has been assigned to you!",
        });
        fetchDashboardData();
      };

      const handlePayoutUpdate = () => {
        fetchDashboardData();
      };

      socket.on("order:assigned", handleAssigned);
      socket.on("order:updated", handleAssigned);
      socket.on("order:status_changed", handleAssigned);
      socket.on("payout:updated", handlePayoutUpdate);

      return () => {
        clearInterval(timer);
        socket.off("order:assigned", handleAssigned);
        socket.off("order:updated", handleAssigned);
        socket.off("order:status_changed", handleAssigned);
        socket.off("payout:updated", handlePayoutUpdate);
        leaveRoom(`deliveryBoy:${riderId}`);
      };
    }

    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0B2214]"></div>
      </div>
    );
  }

  // Use real weekly breakdown from API; fall back to empty zeros if not yet loaded
  const weeklyData = weeklyBreakdown.length > 0
    ? weeklyBreakdown
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => ({ day, amount: 0 }));

  const maxAmount = Math.max(...weeklyData.map(d => d.amount), 1); // avoid division by zero

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner - Zepto / Blinkit Green Theme */}
      <div className="bg-gradient-to-r from-[#0B2214] via-[#047857] to-[#065f46] text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-200">Welcome Back</p>
          <h2 className="text-xl font-black">Let's Deliver Smiles Today!</h2>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/15">
            <div>
              <p className="text-[10px] text-emerald-100 font-semibold">Wallet Balance</p>
              <p className="text-lg font-black text-emerald-300">₹{earnings?.walletBalance || 0}</p>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div>
              <p className="text-[10px] text-emerald-100 font-semibold">Completed Deliveries</p>
              <p className="text-lg font-black">{stats?.completedDeliveries || 0}</p>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-400/10 rounded-full blur-xl"></div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-3 gap-3">
        {/* Today's Earnings */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-3.5 text-center shadow-sm">
          <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto text-[#047857] mb-1.5">
            <Wallet size={18} />
          </div>
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Today's Pay</p>
          <p className="text-sm font-black text-[#0B2214] mt-0.5">₹{stats?.todayEarnings || 0}</p>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-2xl border border-amber-100 p-3.5 text-center shadow-sm">
          <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center mx-auto text-amber-600 mb-1.5">
            <Clock size={18} />
          </div>
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Pending</p>
          <p className="text-sm font-black text-amber-700 mt-0.5">{stats?.pendingOrders || 0}</p>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-2xl border border-blue-100 p-3.5 text-center shadow-sm">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center mx-auto text-blue-600 mb-1.5">
            <ShoppingBag size={18} />
          </div>
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Active</p>
          <p className="text-sm font-black text-blue-700 mt-0.5">{stats?.inProgressOrders || 0}</p>
        </div>
      </div>

      {/* Active Assignment Cards */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-extrabold text-slate-800 text-sm">Active Assignments ({activeDeliveries.length})</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/delivery-boy/orders")} className="px-2.5 py-1 bg-emerald-50 text-[#047857] border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition flex items-center gap-1 cursor-pointer">
              <Navigation size={11} /> Calculate Route
            </button>
            <button onClick={() => navigate("/delivery-boy/orders")} className="text-xs text-[#047857] font-extrabold hover:underline flex items-center gap-0.5 cursor-pointer">
              View All <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {activeDeliveries.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 text-center text-xs font-semibold text-slate-400 shadow-sm">
            🎉 All caught up! No active assignments.
          </div>
        ) : (
          <div className="space-y-3">
            {activeDeliveries.map((order) => {
              const shopName = order.vendorId?.shopName || order.primaryVendor?.shopName || "Aryusha Partner Store";
              return (
                <div 
                  key={order._id}
                  onClick={() => navigate(`/delivery-boy/orders/${order._id}`)}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-[#047857] transition cursor-pointer flex justify-between items-center gap-3"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-[#0B2214]">#{order.orderId}</span>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                        order.deliveryStatus === 'Assigned' 
                          ? 'bg-amber-100 text-amber-800 border border-amber-250' 
                          : 'bg-emerald-100 text-[#0B2214] border border-emerald-250'
                      }`}>
                        {order.deliveryStatus?.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="space-y-0.5 text-xs text-slate-600 font-semibold">
                      <p className="truncate"><span className="font-bold text-slate-400">Store:</span> {shopName}</p>
                      <p className="truncate"><span className="font-bold text-slate-400">Drop:</span> {order.deliveryAddress?.fullName} - {order.deliveryAddress?.area}</p>
                    </div>
                  </div>

                  <div className="text-[#047857] bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                    <ArrowRight size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Weekly Earnings Trend Graph */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
        <div>
          <h3 className="font-extrabold text-slate-800 text-sm">Weekly Earnings Trend</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5">Rider payouts over last 7 days</p>
        </div>

        {/* Graphical Representation */}
        <div className="flex justify-between items-end h-32 pt-4 px-1 gap-2">
          {weeklyData.map((d, index) => {
            const pct = (d.amount / maxAmount) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-slate-100 rounded-t-lg relative h-full flex items-end">
                  <div 
                    className="w-full bg-gradient-to-t from-[#0B2214] to-[#047857] rounded-t-lg group-hover:opacity-85 transition-all duration-500" 
                    style={{ height: `${pct}%` }}
                  >
                    {/* Tooltip on hover */}
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-850 text-white text-[8px] font-bold px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition shadow">
                      ₹{d.amount}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">{d.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Support Widget */}
      <div className="bg-emerald-50/60 border border-emerald-100 rounded-3xl p-4 flex items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#0B2214] text-white rounded-xl shadow-sm">
            <HelpCircle size={18} />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">Need Help or Support?</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Quickly contact dispatcher support</p>
          </div>
        </div>
        <button 
          onClick={() => navigate("/delivery-boy/support")}
          className="px-3 py-1.5 bg-white border border-emerald-200 rounded-xl hover:bg-emerald-50 font-black text-[10px] text-[#0B2214] transition cursor-pointer flex items-center gap-1 shadow-sm"
        >
          <Phone size={10} /> Call Dispatch
        </button>
      </div>

    </div>
  );
}
