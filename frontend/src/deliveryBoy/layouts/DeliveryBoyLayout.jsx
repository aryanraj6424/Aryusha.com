import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDeliveryBoy } from "../context/DeliveryBoyContext";
import { LayoutDashboard, ShoppingBag, Wallet, User, Bell, Shield } from "lucide-react";
import OnboardingWizard from "../pages/dashboard/OnboardingWizard";
import axios from "axios";

export default function DeliveryBoyLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { deliveryBoy, loading, refresh } = useDeliveryBoy();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("deliveryBoyToken");
    if (!token && !loading) {
      navigate("/delivery-boy/login");
    }
  }, [deliveryBoy, loading, navigate]);

  useEffect(() => {
    if (deliveryBoy) {
      setIsOnline(!!deliveryBoy.isOnline);
    }
  }, [deliveryBoy]);

  const handleToggleOnline = async () => {
    try {
      const nextOnline = !isOnline;
      const token = localStorage.getItem("deliveryBoyToken");
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/delivery-boy/go-online`,
        { isOnline: nextOnline },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setIsOnline(nextOnline);
      }
    } catch (err) {
      console.error("Failed to toggle online status:", err);
    }
  };

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("deliveryBoyToken");
      if (!token) return;
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/delivery-boy/notifications`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (deliveryBoy) {
      fetchNotifications();
    }
  }, [deliveryBoy, showNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem("deliveryBoyToken");
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/delivery-boy/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/delivery-boy/dashboard" },
    { label: "Orders", icon: ShoppingBag, path: "/delivery-boy/orders" },
    { label: "Earnings", icon: Wallet, path: "/delivery-boy/earnings" },
    { label: "Profile", icon: User, path: "/delivery-boy/profile" }
  ];

  const isOnboarded = deliveryBoy && deliveryBoy.onboardingStatus === "active";

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center">
      {/* Mobile Shell Container */}
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl flex flex-col relative pb-16">
        
        {/* Top Status Header */}
        <header className="bg-[#6d28d9] text-white px-5 py-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white/10 rounded-lg">
              <Shield size={20} className="text-purple-200" />
            </div>
            <div>
              <h1 className="text-md font-black tracking-wide">QuickKart Rider</h1>
              <p className="text-[10px] text-purple-200 font-bold -mt-0.5">Delivery Partner</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Online/Offline Toggle */}
            {isOnboarded && (
              <button 
                onClick={handleToggleOnline}
                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full transition-all border flex items-center gap-1 cursor-pointer ${
                  isOnline 
                    ? "bg-emerald-500/20 border-emerald-400 text-emerald-100" 
                    : "bg-slate-500/20 border-slate-400 text-slate-300"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-400 animate-ping" : "bg-slate-400"}`}></span>
                {isOnline ? "Online" : "Offline"}
              </button>
            )}

            {/* Notification Badge */}
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 hover:bg-white/10 rounded-lg transition cursor-pointer"
            >
              <Bell size={18} />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
              )}
            </button>
          </div>
        </header>

        {/* Notifications Center Panel */}
        {showNotifications && (
          <div className="absolute top-14 right-4 w-72 bg-white border border-purple-100 shadow-2xl rounded-2xl z-40 p-4 space-y-3 max-h-80 overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Alerts Notification Center</span>
              <button 
                onClick={() => setShowNotifications(false)}
                className="text-slate-400 hover:text-slate-700 text-[10px] font-bold"
              >
                Close
              </button>
            </div>
            {notifications.length === 0 ? (
              <p className="text-[10px] text-slate-450 font-bold text-center py-4">No notifications yet.</p>
            ) : (
              <div className="space-y-2.5 divide-y divide-slate-50">
                {notifications.map((n) => (
                  <div 
                    key={n._id} 
                    onClick={() => handleMarkAsRead(n._id)}
                    className={`pt-2.5 first:pt-0 cursor-pointer ${n.read ? "opacity-60" : ""}`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="text-[11px] font-black text-slate-800 leading-snug">{n.title}</h4>
                      {!n.read && <span className="w-1.5 h-1.5 bg-purple-605 rounded-full mt-1 flex-shrink-0" />}
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-relaxed">{n.message}</p>
                    <span className="text-[8px] text-slate-400 font-bold block mt-1">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Page Content Area */}
        <main className="flex-1 overflow-y-auto p-4 bg-slate-50">
          {isOnboarded ? (
            <Outlet />
          ) : (
            <OnboardingWizard rider={deliveryBoy} onComplete={refresh} />
          )}
        </main>

        {/* Bottom Navigation */}
        {isOnboarded && (
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-purple-100 shadow-xl grid grid-cols-4 h-16 z-30">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`relative flex flex-col items-center justify-center gap-1 transition ${
                    isActive ? "text-[#6d28d9] font-extrabold" : "text-slate-400 font-semibold"
                  }`}
                >
                  <Icon size={20} className={isActive ? "scale-110 transition-transform" : ""} />
                  <span className="text-[10px] tracking-wide">{item.label}</span>
                  {isActive && (
                    <div className="absolute top-0 w-8 h-1 bg-[#6d28d9] rounded-b-full" />
                  )}
                </button>
              );
            })}
          </nav>
        )}

      </div>
    </div>
  );
}
