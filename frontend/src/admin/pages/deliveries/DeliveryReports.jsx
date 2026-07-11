import { useState, useEffect } from "react";
import { TrendingUp, Award, Clock, Store, FileSpreadsheet, RefreshCw, Calendar, Sparkles } from "lucide-react";
import axios from "axios";

export default function DeliveryReports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // Date range filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const headers = { Authorization: `Bearer ${token}` };

      let url = `${import.meta.env.VITE_API_URL}/admin/reports/deliveries`;
      if (startDate && endDate) url += `?startDate=${startDate}&endDate=${endDate}`;
      else if (startDate) url += `?startDate=${startDate}`;
      else if (endDate) url += `?endDate=${endDate}`;

      const res = await axios.get(url, { headers });
      if (res.data.success) {
        setReport(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const handleExportCSV = () => {
    const token = localStorage.getItem("adminToken");
    let url = `${import.meta.env.VITE_API_URL}/admin/reports/deliveries/export?token=${token}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    window.open(url, "_blank");
  };

  if (loading && !report) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const metrics = report?.metrics || { totalCompleted: 0, onTimeCount: 0, delayedCount: 0, onTimeRate: 100 };
  const leaderboard = report?.leaderboard || [];
  const vendorVolume = report?.vendorVolume || [];

  // Determine top vendor volume for graph calculations
  const maxVendorOrders = vendorVolume.length > 0 ? Math.max(...vendorVolume.map(v => v.orderCount)) : 10;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Performance Reports</h1>
          <p className="text-slate-500 font-medium">Aggregated logs, leaderboard stats, and vendor delivery counts</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <FileSpreadsheet size={16} /> Export Leaderboard CSV
          </button>
          <button 
            onClick={fetchReports}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition text-slate-600 shadow-sm cursor-pointer"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Date Filters */}
      <div className="bg-white border border-slate-150 p-4 rounded-3xl shadow-sm flex items-center gap-4 flex-wrap">
        <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Calendar size={14} /> Filter Range
        </span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
        />
        <span className="text-xs text-slate-400 font-bold">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
        />
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total completed */}
        <div className="bg-white rounded-3xl border border-slate-150 p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Deliveries Completed</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800">{metrics.totalCompleted}</span>
            <span className="text-xs text-slate-400 font-bold">parcels</span>
          </div>
        </div>

        {/* On-Time Rate */}
        <div className="bg-white rounded-3xl border border-slate-150 p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">On-Time Rate</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">{metrics.onTimeRate}%</span>
            <span className="text-xs text-emerald-600 font-bold">Target 90%</span>
          </div>
        </div>

        {/* Delayed Deliveries */}
        <div className="bg-white rounded-3xl border border-slate-150 p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Delayed Deliveries</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600">{metrics.delayedCount}</span>
            <span className="text-xs text-rose-500 font-bold">&gt; 45 mins</span>
          </div>
        </div>

        {/* On Time Counts */}
        <div className="bg-white rounded-3xl border border-slate-150 p-5 shadow-sm space-y-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">On-Time Count</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-650">{metrics.onTimeCount}</span>
            <span className="text-xs text-indigo-500 font-bold">parcels</span>
          </div>
        </div>
      </div>

      {/* Leaderboard Table and Volume Breakdown split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Leaderboard list (Riders) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-150 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-yellow-600" />
            <h3 className="font-extrabold text-slate-800 text-sm">Rider Performance Leaderboard</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-slate-650">
              <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-wider border-b border-slate-150">
                <tr>
                  <th className="px-4 py-3">Rider Name</th>
                  <th className="px-4 py-3 text-center">Total Orders</th>
                  <th className="px-4 py-3 text-center">Completed</th>
                  <th className="px-4 py-3 text-center">Cancelled</th>
                  <th className="px-4 py-3 text-right">Commission Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-slate-400 font-bold">No rider records found.</td>
                  </tr>
                ) : (
                  leaderboard.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3 font-extrabold text-slate-800 flex items-center gap-1.5">
                        {idx === 0 && <Sparkles size={12} className="text-yellow-500" />}
                        <span>{r.riderName || "Deleted Rider"}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-700">{r.totalOrders}</td>
                      <td className="px-4 py-3 text-center text-emerald-700 font-black">{r.completedOrders}</td>
                      <td className="px-4 py-3 text-center text-rose-600 font-bold">{r.cancelledOrders}</td>
                      <td className="px-4 py-3 text-right font-black text-slate-800">₹{r.totalEarnings}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Vendor volume breakdown Custom CSS bar charts */}
        <div className="bg-white rounded-3xl border border-slate-150 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Store size={18} className="text-indigo-650" />
            <h3 className="font-extrabold text-slate-800 text-sm">Vendor Delivery Volume</h3>
          </div>

          {vendorVolume.length === 0 ? (
            <p className="text-center py-10 text-xs font-semibold text-slate-400">No vendor delivery records found.</p>
          ) : (
            <div className="space-y-4 pt-2">
              {vendorVolume.slice(0, 5).map((v, idx) => {
                const pct = Math.round((v.orderCount / maxVendorOrders) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-750 font-extrabold truncate max-w-[150px]">{v.shopName || "Merchant Store"}</span>
                      <span className="text-slate-400 font-bold">{v.orderCount} orders ({v.deliveredCount} del)</span>
                    </div>
                    {/* Bar graphic */}
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-700" 
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
