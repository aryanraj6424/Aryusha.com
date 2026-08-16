import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Coins, TrendingUp, FileText, Calendar, Wallet, X,
  TrendingDown, ChevronLeft, ChevronRight, Info, ShieldCheck
} from "lucide-react";
import { useToast } from "../../../components/Toast";

// ── Status badge colours ───────────────────────────────────────────────────
const STATUS_COLORS = {
  Delivered:        "bg-emerald-100 text-emerald-700",
  Pending:          "bg-amber-100 text-amber-700",
  Accepted:         "bg-sky-100 text-sky-700",
  Packed:           "bg-indigo-100 text-indigo-700",
  Out_for_Delivery: "bg-purple-100 text-purple-700",
  Cancelled:        "bg-red-100 text-red-700",
  Rejected:         "bg-rose-100 text-rose-700",
  Returned:         "bg-orange-100 text-orange-700",
};

// ── Tooltip ────────────────────────────────────────────────────────────────
function Tooltip({ text }) {
  return (
    <span className="group relative ml-1 inline-flex items-center cursor-help">
      <Info size={11} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg bg-slate-800 px-3 py-2 text-xxs text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 leading-relaxed">
        {text}
      </span>
    </span>
  );
}

// ── Number formatter ───────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Main Component ──────────────────────────────────────────────────────────
export default function VendorFinance() {
  const { showToast } = useToast();

  const [rateConfig, setRateConfig] = useState({ commissionType: "percentage", commissionValue: 8, resolvedFrom: "global" });
  const [summary,    setSummary]    = useState({ totalOrders: 0, totalItemSubtotal: 0, totalCommissionAmount: 0, totalNetPayout: 0 });
  const [timeline,   setTimeline]   = useState([]);
  const [orders,     setOrders]     = useState([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPage,  setOrdersPage]  = useState(1);
  const PER_PAGE = 50;

  const [loading,       setLoading]       = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [startDate,     setStartDate]     = useState("");
  const [endDate,       setEndDate]       = useState("");

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("vendorToken")}` });

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const params = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate)   params.push(`endDate=${endDate}`);
      const qs = params.length ? `?${params.join("&")}` : "";

      const [rateRes, sumRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/vendor/finance/commission-rate`, { headers: headers() }),
        axios.get(`${import.meta.env.VITE_API_URL}/vendor/finance/summary${qs}`,    { headers: headers() }),
      ]);
      if (rateRes.data?.success) setRateConfig(rateRes.data.data);
      if (sumRes.data?.success)  { setSummary(sumRes.data.summary); setTimeline(sumRes.data.timeline || []); }
    } catch (e) {
      showToast({ type: "error", message: "Failed to load financial data." });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const fetchOrders = useCallback(async (page = 1) => {
    try {
      setOrdersLoading(true);
      const params = [`page=${page}`, `limit=${PER_PAGE}`];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate)   params.push(`endDate=${endDate}`);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/vendor/finance/orders?${params.join("&")}`, { headers: headers() });
      if (res.data?.success) { setOrders(res.data.data || []); setOrdersTotal(res.data.total || 0); setOrdersPage(page); }
    } catch (e) { /* silent */ } finally { setOrdersLoading(false); }
  }, [startDate, endDate]);

  useEffect(() => { fetchSummary(); fetchOrders(1); }, [startDate, endDate]);

  const totalPages = Math.ceil(ordersTotal / PER_PAGE);

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">

      {/* ── Header ── */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-full">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="text-purple-600" /> My Commissions & Payouts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Commission is calculated <strong>only on your item sales</strong>. Delivery fees, customer GST, platform fees, and coupon discounts are handled by the platform and do not reduce your earnings.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-100 max-w-full w-full sm:w-auto justify-start sm:justify-end">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="text-xxs border border-slate-200 rounded-lg p-1.5 bg-white font-semibold text-slate-600 focus:outline-none" />
          <span className="text-slate-300 text-xs">to</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="text-xxs border border-slate-200 rounded-lg p-1.5 bg-white font-semibold text-slate-600 focus:outline-none" />
          {(startDate || endDate) && (
            <button onClick={() => { setStartDate(""); setEndDate(""); }} className="p-1 hover:bg-slate-200 rounded text-slate-400 cursor-pointer"><X size={15} /></button>
          )}
        </div>
      </div>

      {/* ── Commission Rate Banner ── */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-4 sm:p-5 rounded-2xl border border-purple-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 max-w-full">
        <div className="space-y-1 min-w-0">
          <p className="text-purple-300 text-xxs font-bold uppercase tracking-wider">Commission Rate on Your Sales</p>
          <h2 className="text-xl sm:text-2xl font-extrabold">
            {rateConfig.commissionValue} {rateConfig.commissionType === "percentage" ? "%" : "₹ Flat"}
          </h2>
          <p className="text-xs text-purple-200">
            {rateConfig.resolvedFrom === "vendor"
              ? "Custom rate configured for your store by platform admin."
              : "Standard platform rate applied to your store."}
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2 min-w-0 shrink-0">
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xxs font-bold border border-white/10 uppercase tracking-wider text-purple-200 select-none cursor-default">
            Status: {rateConfig.resolvedFrom === "vendor" ? "Custom Rate Active" : "Standard Rate Active"}
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl text-xxs border border-white/10 select-none">
            <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
            <span className="text-purple-100 font-medium">Platform fees are NOT charged from your earnings</span>
          </div>
        </div>
      </div>

      {/* ── Vendor Waterfall KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-full">
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-3 min-w-0">
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600 flex-shrink-0"><TrendingUp size={22} /></div>
          <div className="min-w-0">
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span>Item Sales</span>
              <Tooltip text="Sum of your item prices × quantity. This is the sales total on which commission is calculated. Platform fees and coupon discounts are excluded." />
            </p>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 mt-0.5 truncate">{fmt(summary.totalItemSubtotal)}</h3>
            <p className="text-xxs text-slate-400">Total sales base</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-3 min-w-0">
          <div className="p-3 bg-red-50 rounded-xl text-red-500 flex-shrink-0"><TrendingDown size={22} /></div>
          <div className="min-w-0">
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span>Commission Deducted</span>
              <Tooltip text="Platform commission deducted from item sales. Formula: Item Sales × Commission Rate." />
            </p>
            <h3 className="text-lg sm:text-xl font-extrabold text-red-600 mt-0.5 truncate">{fmt(summary.totalCommissionAmount)}</h3>
            <p className="text-xxs text-slate-400">Platform commission</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-3 min-w-0">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 flex-shrink-0"><Coins size={22} /></div>
          <div className="min-w-0">
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span>Your Net Earnings</span>
              <Tooltip text="Item Sales − Commission Deducted. Delivery charges, customer GST, and platform fees are NOT deducted from your earnings." />
            </p>
            <h3 className="text-lg sm:text-xl font-extrabold text-emerald-600 mt-0.5 truncate">{fmt(summary.totalNetPayout)}</h3>
            <p className="text-xxs text-slate-400">Item Sales − Commission</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-3 min-w-0">
          <div className="p-3 bg-sky-50 rounded-xl text-sky-600 flex-shrink-0"><FileText size={22} /></div>
          <div className="min-w-0">
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Eligible Orders</p>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 mt-0.5 truncate">{summary.totalOrders || 0}</h3>
            <p className="text-xxs text-slate-400">Delivered & active orders</p>
          </div>
        </div>
      </div>

      {/* ── Daily Payout Summary ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-4">
          <Calendar size={16} className="text-slate-400" /> Payout Summary History
        </h2>
        <div className="overflow-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold text-xxs">
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Orders</th>
                <th className="p-2.5">
                  Item Sales
                  <Tooltip text="Your item sales total (commission base). Platform fees and coupons excluded." />
                </th>
                <th className="p-2.5">
                  Commission Deducted
                  <Tooltip text="Platform commission = Item Sales × Rate." />
                </th>
                <th className="p-2.5">
                  Your Net Earnings
                  <Tooltip text="Item Sales − Commission Deducted. This is your net payout." />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {timeline.length > 0 ? timeline.map(row => {
                const it = row.totalItemSubtotal ?? row.totalSalesAmount ?? 0;
                const cm = row.totalCommissionAmount || 0;
                const np = row.totalNetPayout        || 0;
                return (
                  <tr key={row._id} className="hover:bg-slate-50/60">
                    <td className="p-2.5 font-semibold text-slate-600 whitespace-nowrap">
                      {new Date(row.date).toLocaleDateString("en-IN", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="p-2.5 text-slate-500">{row.totalOrders}</td>
                    <td className="p-2.5 font-bold text-slate-800">₹{it.toFixed(2)}</td>
                    <td className="p-2.5 text-red-500 font-bold">−₹{cm.toFixed(2)}</td>
                    <td className="p-2.5 text-emerald-700 font-extrabold">₹{np.toFixed(2)}</td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="5" className="p-8 text-center text-slate-400 italic">No payout records found. Check back once orders are delivered.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Per-Order Commission Breakdown ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <FileText size={16} className="text-purple-500" /> Per-Order Commission Breakdown
            </h2>
            <p className="text-xxs text-slate-400 mt-0.5">Commission breakdown per order — calculated strictly on your item sales.</p>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{ordersTotal} records</span>
        </div>

        {ordersLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" /></div>
        ) : (
          <>
            <div className="overflow-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold text-xxs">
                    <th className="p-2.5">Order ID</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">
                      Item Sales
                      <Tooltip text="Your item prices × quantity. Commission is calculated on this amount only." />
                    </th>
                    <th className="p-2.5">Commission Rate</th>
                    <th className="p-2.5">
                      Commission Deducted
                      <Tooltip text="Platform commission = Item Sales × Rate. Platform fees and customer coupons do NOT affect this calculation." />
                    </th>
                    <th className="p-2.5">
                      Your Net Earnings
                      <Tooltip text="Item Sales − Commission Deducted. This is what you earn for this order." />
                    </th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.length > 0 ? orders.map(row => (
                    <tr key={row._id} className="hover:bg-slate-50/60">
                      <td className="p-2.5 font-mono font-bold text-slate-700 text-xxs">#{row.orderIdStr}</td>
                      <td className="p-2.5 text-slate-500 whitespace-nowrap">
                        {new Date(row.orderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                      </td>
                      <td className="p-2.5 font-bold text-slate-800">₹{Number(row.itemSubtotal).toFixed(2)}</td>
                      <td className="p-2.5 text-slate-500">
                        {row.commissionType === "percentage" 
                          ? `${row.commissionRateApplied}%` 
                          : row.commissionType === "flat" 
                            ? `₹${row.commissionRateApplied}` 
                            : row.commissionType === "mixed"
                              ? "Mixed"
                              : `${row.commissionRateApplied}%`}
                        <span className="ml-1 text-slate-300 italic text-xxs">({row.resolutionLevel})</span>
                      </td>
                      <td className="p-2.5 text-red-500 font-bold">−₹{Number(row.commissionAmount).toFixed(2)}</td>
                      <td className="p-2.5 text-emerald-700 font-extrabold">₹{Number(row.netPayout).toFixed(2)}</td>
                      <td className="p-2.5">
                        <span className={`text-xxs font-bold px-1.5 py-0.5 rounded-full ${STATUS_COLORS[row.orderStatus] || "bg-slate-100 text-slate-600"}`}>
                          {row.orderStatus?.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="7" className="p-8 text-center text-slate-400 italic">No commission records found for this period.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
                <span>Page {ordersPage} of {totalPages}</span>
                <div className="flex gap-2">
                  <button disabled={ordersPage <= 1} onClick={() => fetchOrders(ordersPage - 1)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed font-semibold">
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button disabled={ordersPage >= totalPages} onClick={() => fetchOrders(ordersPage + 1)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed font-semibold">
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
