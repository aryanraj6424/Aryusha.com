import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, CheckCircle, Clock, MapPin, ArrowRight, Wallet, HelpCircle, Phone } from "lucide-react";
import axios from "axios";

export default function DeliveryBoyDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("deliveryBoyToken");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/delivery-boy/dashboard`, { headers });
      
      if (res.data.success) {
        setStats(res.data.stats);
        setEarnings(res.data.earnings);
        setActiveDeliveries(res.data.activeDeliveries || []);
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
    }, 6000);

    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Earnings mock weekly trend for graph representation
  const weeklyData = [
    { day: "Mon", amount: 240 },
    { day: "Tue", amount: 350 },
    { day: "Wed", amount: 180 },
    { day: "Thu", amount: 420 },
    { day: "Fri", amount: 310 },
    { day: "Sat", amount: 550 },
    { day: "Sun", amount: earnings?.totalEarnings ? (earnings.totalEarnings % 300) + 100 : 290 },
  ];

  const maxAmount = Math.max(...weeklyData.map(d => d.amount));

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-650 to-indigo-600 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <p className="text-[10px] uppercase font-bold tracking-widest text-purple-200">Welcome Back</p>
          <h2 className="text-xl font-black">Let's Deliver Smiles Today!</h2>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
            <div>
              <p className="text-[10px] text-purple-200 font-semibold">Wallet Balance</p>
              <p className="text-lg font-black">₹{earnings?.walletBalance || 0}</p>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div>
              <p className="text-[10px] text-purple-200 font-semibold">Completed Deliveries</p>
              <p className="text-lg font-black">{stats?.completedDeliveries || 0}</p>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-3 gap-3">
        {/* Today's Earnings */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
          <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center mx-auto text-[#6d28d9] mb-2">
            <Wallet size={18} />
          </div>
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Today's Pay</p>
          <p className="text-sm font-black text-slate-800 mt-0.5">₹{stats?.todayEarnings || 0}</p>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
          <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center mx-auto text-amber-600 mb-2">
            <Clock size={18} />
          </div>
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Pending</p>
          <p className="text-sm font-black text-slate-800 mt-0.5">{stats?.pendingOrders || 0}</p>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
          <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto text-indigo-600 mb-2">
            <ShoppingBag size={18} />
          </div>
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Active</p>
          <p className="text-sm font-black text-slate-800 mt-0.5">{stats?.inProgressOrders || 0}</p>
        </div>
      </div>

      {/* Active Assignment Cards */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-extrabold text-slate-800 text-sm">Active Assignments ({activeDeliveries.length})</h3>
          <button onClick={() => navigate("/delivery-boy/orders")} className="text-xs text-[#6d28d9] font-bold hover:underline flex items-center gap-0.5">
            View All <ArrowRight size={12} />
          </button>
        </div>

        {activeDeliveries.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 text-center text-xs font-semibold text-slate-400 shadow-sm">
            🎉 All caught up! No active assignments.
          </div>
        ) : (
          <div className="space-y-3">
            {activeDeliveries.map((order) => (
              <div 
                key={order._id}
                onClick={() => navigate(`/delivery-boy/orders/${order._id}`)}
                className="bg-white rounded-2xl border border-slate-150 p-4 shadow-sm hover:border-purple-200 transition cursor-pointer flex justify-between items-center gap-3"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-[#6d28d9]">#{order.orderId}</span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                      order.deliveryStatus === 'Assigned' ? 'bg-amber-100 text-amber-800 border border-amber-250' : 'bg-purple-100 text-purple-800 border border-purple-250'
                    }`}>
                      {order.deliveryStatus.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="space-y-0.5 text-xs text-slate-500 font-semibold">
                    <p className="truncate"><span className="font-bold text-slate-400">Store:</span> {order.vendorId?.shopName}</p>
                    <p className="truncate"><span className="font-bold text-slate-400">Drop:</span> {order.deliveryAddress?.fullName} - {order.deliveryAddress?.area}</p>
                  </div>
                </div>

                <div className="text-slate-400 bg-slate-50 p-2 rounded-xl">
                  <ArrowRight size={16} />
                </div>
              </div>
            ))}
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
                    className="w-full bg-gradient-to-t from-indigo-500 to-purple-650 rounded-t-lg group-hover:opacity-85 transition-all duration-500" 
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

      {/* Support & Notification Widgets */}
      <div className="bg-slate-100 border border-slate-200 rounded-3xl p-4 flex items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 text-[#6d28d9] rounded-xl shadow-sm">
            <HelpCircle size={18} />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800">Need Help or Support?</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Quickly contact dispatcher support</p>
          </div>
        </div>
        <button 
          onClick={() => navigate("/delivery-boy/support")}
          className="px-3 py-1.5 bg-white border rounded-xl hover:bg-slate-50 font-black text-[10px] text-slate-700 transition cursor-pointer flex items-center gap-1 shadow-sm"
        >
          <Phone size={10} /> Call Dispatch
        </button>
      </div>

    </div>
  );
}
