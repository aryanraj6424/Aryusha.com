import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDeliveryBoy } from "../context/DeliveryBoyContext";
import { LayoutDashboard, ShoppingBag, Wallet, User, Bell, Shield } from "lucide-react";

export default function DeliveryBoyLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { deliveryBoy, loading } = useDeliveryBoy();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("deliveryBoyToken");
    if (!token && !loading) {
      navigate("/delivery-boy/login");
    }
  }, [deliveryBoy, loading, navigate]);

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
            <button 
              onClick={() => setIsOnline(!isOnline)}
              className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full transition-all border flex items-center gap-1 cursor-pointer ${
                isOnline 
                  ? "bg-emerald-500/20 border-emerald-400 text-emerald-100" 
                  : "bg-slate-500/20 border-slate-400 text-slate-300"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-400 animate-ping" : "bg-slate-400"}`}></span>
              {isOnline ? "Online" : "Offline"}
            </button>

            {/* Notification Badge */}
            <button className="relative p-1.5 hover:bg-white/10 rounded-lg transition">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Page Content Area */}
        <main className="flex-1 overflow-y-auto p-4 bg-slate-50">
          <Outlet />
        </main>

        {/* Bottom Navigation */}
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

      </div>
    </div>
  );
}
