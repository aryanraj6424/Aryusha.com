import { useState, useEffect } from "react";
import { Search, MapPin, User, Clock, CheckCircle2, ArrowRight, ShieldCheck, HelpCircle, Calendar, RefreshCw, X, FileSpreadsheet, Eye } from "lucide-react";
import axios from "axios";
import { useToast } from "../../../components/Toast";

export default function DeliveriesMonitor() {
  const { showToast } = useToast();
  const [deliveries, setDeliveries] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  // Filter States
  const [status, setStatus] = useState("");
  const [riderId, setRiderId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRiders = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/delivery-boys`, { headers });
      if (res.data.success) {
        setRiders(res.data.riders || []);
      }
    } catch (err) {
      console.error("Failed to load riders list:", err);
    }
  };

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const headers = { Authorization: `Bearer ${token}` };
      
      let url = `${import.meta.env.VITE_API_URL}/admin/deliveries?page=${page}&limit=8`;
      if (status) url += `&status=${status}`;
      if (riderId) url += `&deliveryBoy=${riderId}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const res = await axios.get(url, { headers });
      if (res.data.success) {
        setDeliveries(res.data.deliveries || []);
        setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load deliveries:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveriesSilent = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const headers = { Authorization: `Bearer ${token}` };
      
      let url = `${import.meta.env.VITE_API_URL}/admin/deliveries?page=${page}&limit=8`;
      if (status) url += `&status=${status}`;
      if (riderId) url += `&deliveryBoy=${riderId}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const res = await axios.get(url, { headers });
      if (res.data.success) {
        setDeliveries(res.data.deliveries || []);
        setTotalPages(res.data.pagination.totalPages || 1);
        
        // Silent reload for currently selected timeline drawer if active
        if (selectedDelivery) {
          const fresh = res.data.deliveries.find(d => d._id === selectedDelivery._id);
          if (fresh) {
            const detailRes = await axios.get(`${import.meta.env.VITE_API_URL}/admin/deliveries/${selectedDelivery._id}`, { headers });
            if (detailRes.data.success) {
              setSelectedDelivery(detailRes.data.order);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed silent reload of deliveries:", err);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  useEffect(() => {
    fetchDeliveries();

    const timer = setInterval(() => {
      fetchDeliveriesSilent();
    }, 6000);

    return () => clearInterval(timer);
  }, [status, riderId, startDate, endDate, page, selectedDelivery?._id]);

  const getStatusStyle = (state) => {
    switch (state) {
      case "Assigned":
        return "bg-amber-100 text-amber-800 border-amber-250";
      case "Picked_Up":
        return "bg-indigo-100 text-indigo-850 border-indigo-250";
      case "On_the_Way":
        return "bg-purple-100 text-purple-850 border-purple-250";
      case "Reached_Customer":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-250";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const handleDrilldown = async (id) => {
    try {
      const token = localStorage.getItem("adminToken");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/deliveries/${id}`, { headers });
      if (res.data.success) {
        setSelectedDelivery(res.data.order);
      }
    } catch (err) {
      showToast({ type: "error", message: "Failed to load delivery timeline details" });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Delivery Operations</h1>
          <p className="text-slate-500 font-medium">Real-time status tracking and dispatcher monitors across all vendors</p>
        </div>
        <button 
          onClick={fetchDeliveries}
          className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition shadow-sm text-slate-650 cursor-pointer"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-800 text-sm">Dispatcher Filters</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Status filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Statuses</option>
              <option value="Assigned">Assigned</option>
              <option value="Picked_Up">Picked Up</option>
              <option value="On_the_Way">On the Way</option>
              <option value="Reached_Customer">Reached Customer</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>

          {/* Rider filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Rider</label>
            <select
              value={riderId}
              onChange={(e) => { setRiderId(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Riders</option>
              {riders.map((r) => (
                <option key={r._id} value={r._id}>{r.fullName}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Table Data */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center text-slate-400 font-bold shadow-sm">
          No live deliveries found matching the filters.
        </div>
      ) : (
        <div className="bg-white border border-slate-150 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-slate-650">
              <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-wider border-b border-slate-150">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Rider</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveries.map((del) => (
                  <tr key={del._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-extrabold text-slate-800">#{del.orderId}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{del.vendorId?.shopName || "N/A"}</td>
                    <td className="px-6 py-4 text-slate-700">{del.customerId?.fullName || del.deliveryAddress?.fullName}</td>
                    <td className="px-6 py-4 font-bold text-[#6d28d9]">
                      {del.deliveryBoyId?.fullName || "Unassigned"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${getStatusStyle(del.deliveryStatus)}`}>
                        {del.deliveryStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-850">₹{del.grandTotal.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDrilldown(del._id)}
                        className="p-1.5 bg-slate-50 hover:bg-green-50 hover:text-green-700 border rounded-lg text-slate-500 cursor-pointer transition"
                        title="View timeline logs"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-150 bg-slate-50">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs text-slate-400 font-bold">Page {page} of {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Timeline Drilldown Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div 
            onClick={() => setSelectedDelivery(null)} 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
          />

          <div className="bg-white h-screen w-full max-w-md shadow-2xl relative z-10 p-6 overflow-y-auto flex flex-col border-l border-slate-200">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg">Delivery Timeline</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Order #{selectedDelivery.orderId}</p>
              </div>
              <button 
                onClick={() => setSelectedDelivery(null)} 
                className="p-1.5 hover:bg-slate-100 border rounded-xl text-slate-400 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content info cards */}
            <div className="space-y-6 flex-1">
              {/* Partner info */}
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-2">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Assigned Rider</p>
                {selectedDelivery.deliveryBoyId ? (
                  <div>
                    <p className="font-black text-xs text-slate-850">{selectedDelivery.deliveryBoyId.fullName}</p>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">{selectedDelivery.deliveryBoyId.phone}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                      Vehicle: {selectedDelivery.deliveryBoyId.vehicleDetails?.type} ({selectedDelivery.deliveryBoyId.vehicleDetails?.number})
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-semibold italic">Unassigned</p>
                )}
              </div>

              {/* Steps timeline logs */}
              <div className="space-y-4 pl-4 relative border-l-2 border-slate-100 ml-2 py-2">
                {selectedDelivery.deliveryLogs?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No timeline audit events logged yet.</p>
                ) : (
                  selectedDelivery.deliveryLogs.map((log, idx) => (
                    <div key={idx} className="relative pl-6 space-y-1">
                      {/* Timeline circle badge */}
                      <span className="absolute -left-[27px] top-0.5 w-3 h-3 bg-green-600 rounded-full border-2 border-white shadow"></span>
                      
                      <div className="text-xs">
                        <span className="font-black text-slate-800 uppercase tracking-wider block text-[10px]">
                          {log.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                        <p className="text-slate-500 font-medium mt-1 leading-relaxed">{log.note}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer close */}
            <div className="pt-4 border-t border-slate-100 flex">
              <button 
                onClick={() => setSelectedDelivery(null)}
                className="w-full py-3 bg-slate-50 border hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
