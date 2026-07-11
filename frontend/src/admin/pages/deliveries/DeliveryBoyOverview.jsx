import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Phone, CheckCircle, Ban, Eye, Settings, RefreshCw, Star, Wallet, Truck } from "lucide-react";
import axios from "axios";

export default function DeliveryBoyOverview() {
  const navigate = useNavigate();
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRiders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/delivery-boys`, { headers });
      if (res.data.success) {
        setRiders(res.data.riders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    const confirmMsg = `Are you sure you want to ${nextStatus === "suspended" ? "SUSPEND" : "ACTIVATE"} this rider's account?`;
    if (!confirm(confirmMsg)) return;

    try {
      const token = localStorage.getItem("adminToken");
      const headers = { Authorization: `Bearer ${token}` };
      
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/delivery-boys/${id}/status`,
        { accountStatus: nextStatus },
        { headers }
      );

      if (res.data.success) {
        alert(res.data.message);
        fetchRiders();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update account status.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Rider Management</h1>
          <p className="text-slate-500 font-medium">Verify credentials, inspect payouts, and control partner access</p>
        </div>
        <button 
          onClick={fetchRiders}
          className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition text-slate-655 shadow-sm cursor-pointer"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Grid Stats quick summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-700 rounded-2xl">
            <User size={24} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Total Active Partners</span>
            <span className="text-xl font-black text-slate-800">
              {riders.filter(r => r.accountStatus === 'active').length} Riders
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
            <Ban size={24} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Suspended Riders</span>
            <span className="text-xl font-black text-slate-800">
              {riders.filter(r => r.accountStatus === 'suspended').length} Suspended
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl">
            <Wallet size={24} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Riders Outstanding Payouts</span>
            <span className="text-xl font-black text-slate-800">
              ₹{riders.reduce((sum, r) => sum + (r.walletBalance || 0), 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Riders List Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : riders.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400 font-bold shadow-sm">
          No delivery boys registered in the system yet.
        </div>
      ) : (
        <div className="bg-white border border-slate-150 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-slate-650">
              <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-wider border-b border-slate-150">
                <tr>
                  <th className="px-6 py-4">Rider</th>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4 text-center">Deliveries Completed</th>
                  <th className="px-6 py-4 text-center">Active Load</th>
                  <th className="px-6 py-4 text-right">Wallet Balance</th>
                  <th className="px-6 py-4 text-center">Account Access</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {riders.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-50 text-purple-700 rounded-full flex items-center justify-center font-black">
                          {r.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800">{r.fullName}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{r.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Truck size={14} className="text-slate-400" />
                        <span>{r.vehicleDetails?.type || "N/A"} • {r.vehicleDetails?.number || "No Plate"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-800 font-extrabold">{r.completedDeliveries}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        r.activeDeliveries > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {r.activeDeliveries} active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-850">₹{r.walletBalance.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        r.accountStatus === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-150" : "bg-rose-50 text-rose-600 border-rose-150"
                      }`}>
                        {r.accountStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/delivery-boys/${r._id}`)}
                          className="p-1.5 bg-slate-50 hover:bg-purple-50 hover:text-purple-700 border rounded-lg text-slate-500 cursor-pointer transition"
                          title="View rider detail profile"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(r._id, r.accountStatus)}
                          className={`p-1.5 border rounded-lg transition cursor-pointer ${
                            r.accountStatus === "active" 
                              ? "bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-150" 
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-150"
                          }`}
                          title={r.accountStatus === "active" ? "Suspend rider" : "Activate rider"}
                        >
                          {r.accountStatus === "active" ? <Ban size={14} /> : <CheckCircle size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
