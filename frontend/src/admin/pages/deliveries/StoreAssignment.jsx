import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { CheckCircle, MapPin, RefreshCw, X, ArrowRight, ShieldAlert } from "lucide-react";

const formatAddress = (addr) => {
  if (!addr) return "N/A";
  if (typeof addr === "string") return addr;
  const { village, district, state, pincode } = addr;
  return [village, district, state, pincode].filter(Boolean).join(", ");
};

export default function StoreAssignment() {
  const [searchParams] = useSearchParams();
  const [riders, setRiders] = useState([]);
  const [selectedRiderId, setSelectedRiderId] = useState("");
  const [riderData, setRiderData] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState(null);

  // Fetch all riders in onboarding stage for dropdown selection
  const fetchRidersList = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/delivery-boys/onboarding?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setRiders(res.data.riders || []);
      }
    } catch (err) {
      console.error("Failed to load riders list:", err);
    }
  };

  // Fetch specific rider onboarding details and store recommendations
  const fetchRecommendations = async (riderId) => {
    if (!riderId) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      
      const detailRes = await axios.get(`${import.meta.env.VITE_API_URL}/admin/delivery-boys/${riderId}/onboarding`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const recRes = await axios.get(`${import.meta.env.VITE_API_URL}/admin/delivery-boys/${riderId}/store-recommendations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (detailRes.data.success && recRes.data.success) {
        setRiderData(detailRes.data.rider);
        setStores(recRes.data.recommendations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRidersList();
    const queryRiderId = searchParams.get("rider");
    if (queryRiderId) {
      setSelectedRiderId(queryRiderId);
      fetchRecommendations(queryRiderId);
    }
  }, [searchParams]);

  const handleRiderChange = (e) => {
    const id = e.target.value;
    setSelectedRiderId(id);
    setRiderData(null);
    setStores([]);
    fetchRecommendations(id);
  };

  const handleAssignStore = async (storeId) => {
    try {
      setAssigning(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/delivery-boys/${selectedRiderId}/assign-store`,
        { storeId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setMessage({ type: "success", text: "Store assigned successfully. Rider notified to sign agreement!" });
        fetchRecommendations(selectedRiderId);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to assign store." });
    } finally {
      setAssigning(false);
    }
  };

  const handleUnlinkStore = async () => {
    try {
      setAssigning(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/delivery-boys/${selectedRiderId}/assign-store`,
        { storeId: null },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setMessage({ type: "success", text: "Store unlinked successfully!" });
        fetchRecommendations(selectedRiderId);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to unlink store." });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Vehicle & Store Assignment</h1>
          <p className="text-sm text-slate-500 mt-1">Assign riders to dark stores based on proximity and order volume trends.</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs font-bold border ${
          message.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
            : "bg-red-50 text-red-800 border-red-100"
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="hover:opacity-70"><X size={14} /></button>
        </div>
      )}

      {/* Dropdown Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-550 uppercase tracking-wider">Select Rider Application:</label>
          <select
            value={selectedRiderId}
            onChange={handleRiderChange}
            className="flex-1 md:w-80 px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-green-650"
          >
            <option value="">-- Choose Rider --</option>
            {riders.map((r) => (
              <option key={r._id} value={r._id}>
                {r.fullName} ({r.phone}) - {r.onboardingStatus.replace(/_/g, " ").toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Recommendation Results */}
      {loading ? (
        <div className="text-center py-12 text-sm text-slate-400 font-bold">Computing nearest dark store recommendations...</div>
      ) : !riderData ? (
        <div className="text-center py-12 border border-dashed border-slate-200 bg-white rounded-3xl">
          <p className="text-sm text-slate-450 font-bold">Select a rider from the dropdown menu to inspect location parameters and assign a store.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Location Summary */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Rider Target Location Details</h3>
              <div className="flex items-start gap-2 pt-1">
                <MapPin size={16} className="text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">{riderData.preferredWorkingLocation?.address || "No address supplied"}</h4>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    Lat: {riderData.preferredWorkingLocation?.latitude || riderData.latitude} | Lng: {riderData.preferredWorkingLocation?.longitude || riderData.longitude}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Current Assigned Store</h3>
              {riderData.assignedStoreId ? (
                <div className="pt-1">
                  <h4 className="font-black text-green-800 text-sm uppercase">{riderData.assignedStoreId.shopName}</h4>
                  <p className="text-xs text-slate-500 font-semibold">{formatAddress(riderData.assignedStoreId.address)}</p>
                </div>
              ) : (
                <div className="pt-1">
                  <span className="text-xs bg-red-50 text-red-750 px-2.5 py-1 rounded font-bold border border-red-100 uppercase tracking-wider inline-block">
                    No Store Assigned
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Recommendations Table */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Proximity Recommendations (Nearest First)</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-black text-slate-450 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Store Name</th>
                    <th className="px-6 py-3.5">Address</th>
                    <th className="px-6 py-3.5">Proximity Distance</th>
                    <th className="px-6 py-3.5 text-center">Recent Demand Index</th>
                    <th className="px-6 py-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-600">
                  {stores.map((store) => (
                    <tr key={store._id} className="hover:bg-slate-50/30 transition">
                      <td className="px-6 py-4 font-extrabold text-slate-850">{store.shopName}</td>
                      <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={formatAddress(store.address)}>{formatAddress(store.address)}</td>
                      <td className="px-6 py-4 font-black text-slate-800">{store.distanceKm} km</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          store.demandIndex === "High"
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : store.demandIndex === "Medium"
                            ? "bg-amber-50 text-amber-600 border border-amber-100"
                            : "bg-slate-50 text-slate-500 border border-slate-100"
                        }`}>
                          {store.demandIndex} ({store.recentOrders} orders/day)
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {riderData.assignedStoreId && riderData.assignedStoreId._id === store._id ? (
                          <div className="flex flex-col gap-1 items-center justify-center">
                            <span className="text-[10px] text-green-700 font-extrabold bg-green-50 px-2.5 py-1 rounded-lg border border-green-150 uppercase tracking-wider">
                              Currently Linked
                            </span>
                            <button
                              disabled={assigning}
                              onClick={handleUnlinkStore}
                              className="text-[10px] text-red-650 hover:underline font-bold transition cursor-pointer"
                            >
                              Unlink Store
                            </button>
                          </div>
                        ) : (
                          <button
                            disabled={assigning}
                            onClick={() => handleAssignStore(store._id)}
                            className="px-3 py-1.5 bg-[#1a5d1a] hover:bg-[#154b15] text-white font-extrabold text-xs rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center gap-1 mx-auto"
                          >
                            Link Store <ArrowRight size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
