import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, Truck, Wallet, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import axios from "axios";
import { useToast } from "../../../components/Toast";

export default function DeliveryBoyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [rider, setRider] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRiderDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/delivery-boys/${id}`, { headers });
      if (res.data.success) {
        setRider(res.data.rider);
        setEarnings(res.data.earnings);
        setHistory(res.data.history || []);
      }
    } catch (err) {
      console.error(err);
      showToast({ type: "error", message: "Failed to load rider details" });
      navigate("/admin/delivery-boys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiderDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!rider) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case "Assigned":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Picked_Up":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "On_the_Way":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Reached_Customer":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-250";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Back button */}
      <button 
        onClick={() => navigate("/admin/delivery-boys")}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-extrabold text-xs transition"
      >
        <ArrowLeft size={16} /> Back to Riders List
      </button>

      {/* Profile and Wallet grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
            <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl">
              <User size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-850 text-sm">Rider Profile</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Approved Delivery Partner</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-600 font-semibold pl-1">
            <div>
              <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-bold">Full Name</span>
              <span className="text-slate-850 font-extrabold text-xs">{rider.fullName}</span>
            </div>
            <div>
              <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-bold">Contact Number</span>
              <span className="text-slate-850 font-extrabold text-xs">{rider.phone}</span>
            </div>
            <div>
              <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-bold">Linked Vehicle</span>
              <span className="text-slate-850 font-extrabold text-xs">
                {rider.vehicleDetails?.type} ({rider.vehicleDetails?.number || "No Plate"})
              </span>
            </div>
            <div>
              <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-bold">Account Access</span>
              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border mt-1 inline-block ${
                rider.accountStatus === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-150" : "bg-rose-50 text-rose-600 border-rose-150"
              }`}>
                {rider.accountStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Wallet stats */}
        <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
            <div className="p-3 bg-green-50 text-green-700 rounded-2xl">
              <Wallet size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-855 text-sm">Payout Status</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Rider Wallet Settlement Values</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Wallet Balance</span>
              <span className="text-lg font-black text-slate-800 mt-1 block">₹{earnings?.walletBalance || 0}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Settled Payouts</span>
              <span className="text-lg font-black text-slate-800 mt-1 block">₹{earnings?.settledBalance || 0}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Total Earned</span>
              <span className="text-lg font-black text-emerald-700 mt-1 block">₹{earnings?.totalEarnings || 0}</span>
            </div>
          </div>
        </div>

      </div>

      {/* History table */}
      <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-800 text-sm">Assigned Delivery History</h3>
        
        {history.length === 0 ? (
          <p className="text-center py-6 text-xs font-semibold text-slate-400">No delivery assignments recorded for this rider.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-slate-650">
              <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-wider border-b border-slate-150">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated At</th>
                  <th className="px-4 py-3 text-right">Rider Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((h) => (
                  <tr key={h._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3 font-extrabold text-slate-800">#{h.orderId}</td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{h.vendorId?.shopName || "N/A"}</td>
                    <td className="px-4 py-3 text-slate-700">{h.customerId?.fullName || h.deliveryAddress?.fullName}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${getStatusColor(h.deliveryStatus)}`}>
                        {h.deliveryStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-bold">
                      {new Date(h.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-800">₹{h.deliveryCharge || 35}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
