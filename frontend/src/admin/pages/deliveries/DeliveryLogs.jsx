import { useState, useEffect } from "react";
import { Clock, Search, User, Store, Calendar, RefreshCw, FileSpreadsheet, KeyRound, AlertTriangle } from "lucide-react";
import axios from "axios";

export default function DeliveryLogs() {
  const [logs, setLogs] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [orderId, setOrderId] = useState("");
  const [riderId, setRiderId] = useState("");
  const [eventType, setEventType] = useState("");
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
      console.error(err);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const headers = { Authorization: `Bearer ${token}` };

      let url = `${import.meta.env.VITE_API_URL}/admin/delivery-logs?page=${page}&limit=12`;
      if (orderId) url += `&orderId=${orderId}`;
      if (riderId) url += `&deliveryBoy=${riderId}`;
      if (eventType) url += `&eventType=${eventType}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const res = await axios.get(url, { headers });
      if (res.data.success) {
        setLogs(res.data.logs || []);
        setTotalPages(res.data.pagination.totalPages || 1);
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

  useEffect(() => {
    fetchLogs();
  }, [orderId, riderId, eventType, startDate, endDate, page]);

  const handleExportCSV = () => {
    const token = localStorage.getItem("adminToken");
    let url = `${import.meta.env.VITE_API_URL}/admin/delivery-logs/export?token=${token}`;
    if (orderId) url += `&orderId=${orderId}`;
    if (riderId) url += `&deliveryBoy=${riderId}`;
    if (eventType) url += `&eventType=${eventType}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    // Trigger file download
    window.open(url, "_blank");
  };

  const getLogBadge = (status, note) => {
    if (note.includes("OTP")) {
      if (note.includes("fail") || note.includes("invalid")) {
        return <span className="p-1 bg-rose-50 text-rose-600 rounded-lg"><AlertTriangle size={14} /></span>;
      }
      return <span className="p-1 bg-emerald-50 text-emerald-600 rounded-lg"><KeyRound size={14} /></span>;
    }
    return <span className="p-1 bg-slate-50 text-slate-500 rounded-lg"><Clock size={14} /></span>;
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Audit Logs</h1>
          <p className="text-slate-500 font-medium">Immutable chronological trail of delivery state changes and security pins</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <FileSpreadsheet size={16} /> Export CSV
          </button>
          <button 
            onClick={fetchLogs}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition text-slate-600 shadow-sm cursor-pointer"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Dispatch Filters */}
      <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-800 text-sm">Audit Filters</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Order ID */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Order ID</label>
            <input
              type="text"
              placeholder="e.g. QK-1234"
              value={orderId}
              onChange={(e) => { setOrderId(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Rider */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Rider</label>
            <select
              value={riderId}
              onChange={(e) => { setRiderId(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
            >
              <option value="">All Riders</option>
              {riders.map((r) => (
                <option key={r._id} value={r._id}>{r.fullName}</option>
              ))}
            </select>
          </div>

          {/* Event Type */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Event Type</label>
            <select
              value={eventType}
              onChange={(e) => { setEventType(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
            >
              <option value="">All Events</option>
              <option value="status_change">Status Changes</option>
              <option value="otp_verified">OTP Verifications</option>
              <option value="otp_failed">Failed Verification OTP</option>
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

      {/* Logs Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400 font-bold shadow-sm">
          No logs found matching search criteria.
        </div>
      ) : (
        <div className="bg-white border border-slate-150 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-slate-650">
              <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-wider border-b border-slate-150">
                <tr>
                  <th className="px-6 py-4 w-12 text-center">Type</th>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Rider</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Audit Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        {getLogBadge(log.status, log.note)}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-slate-800">#{log.orderId}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{log.vendorName || "N/A"}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{log.riderName || "N/A"}</td>
                    <td className="px-6 py-4">
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                        {log.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-bold">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium leading-relaxed max-w-xs truncate" title={log.note}>
                      {log.note}
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

    </div>
  );
}
