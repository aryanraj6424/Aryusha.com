import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  TrendingUp,
  Package,
  MapPin
} from "lucide-react";
import axios from "axios";
import { useVendor } from "../../context/VendorContext";

export default function VendorDashboard() {
  const { vendor, refresh } = useVendor(); // use vendor context dynamically
  
  const [orders, setOrders] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("vendorToken");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.get(`${import.meta.env.VITE_API_URL}/vendor/dashboard`, { headers });
      if (res.data.success) {
        setOrders(res.data.orders || []);
        setTotalProducts(res.data.totalProducts || 0);
      }
    } catch (error) {
      console.error("Error loading vendor dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading || !vendor) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const isAreaAssigned = vendor?.latitude && vendor?.longitude && vendor?.deliveryRadius;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 font-medium">Welcome back, {vendor?.shopName || "Partner"}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refresh()}
            className="px-3.5 py-2.5 border rounded-xl hover:bg-slate-50 font-bold text-xs text-slate-600 transition flex items-center gap-1.5 shadow-sm bg-white cursor-pointer"
            title="Force refresh backend data"
          >
            🔄 Sync Data
          </button>
        </div>
      </div>

      {/* Core summary stats */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total products */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-purple-50 rounded-2xl text-purple-600">
            <Package size={24} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Products</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{totalProducts}</p>
          </div>
        </div>

        {/* Total orders */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Orders</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{orders.length}</p>
          </div>
        </div>

        {/* Assigned Area */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-center gap-4">
          <div className={`p-4 rounded-2xl ${isAreaAssigned ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
            <MapPin size={24} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Assigned Area</p>
            <p className="text-lg font-black text-slate-800 mt-1.5 leading-none">
              {isAreaAssigned ? "Active Coverage" : "Not Assigned"}
            </p>
          </div>
        </div>

        {/* Radius */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-50 rounded-2xl text-amber-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Delivery Radius</p>
            <p className="text-2xl font-black text-slate-800 mt-1">
              {vendor?.deliveryRadius ? `${vendor.deliveryRadius} KM` : "0 KM"}
            </p>
          </div>
        </div>
      </div>

      {/* Orders Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <h3 className="font-extrabold text-slate-800 text-lg">Recent Orders</h3>
          <span className="text-xs font-bold text-slate-400">Total: {orders.length}</span>
        </div>
        <div className="p-6">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-bold text-sm">
              No orders received yet. Once customers purchase from your service area, details will appear here.
            </div>
          ) : (
            <div className="space-y-4">
              {orders.slice(0, 5).map((order) => (
                <div key={order.orderId} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 gap-3">
                  <div>
                    <p className="font-extrabold text-slate-800">{order.orderId}</p>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Customer: {order.customerName}</p>
                  </div>
                  <div className="flex items-center gap-4 text-right self-stretch sm:self-auto justify-between">
                    <div>
                      <p className="font-extrabold text-slate-800">₹{order.totalAmount}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">Net Payout: ₹{order.netAmount}</p>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-xl tracking-wide ${
                      order.status === 'completed' || order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                      order.status === 'pending' || order.status === 'processing' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
