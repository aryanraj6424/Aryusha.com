import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Coins, Download, RefreshCw, Database, Settings, CheckCircle,
  TrendingUp, FileText, Calendar, Edit3, X, Search,
  Wallet, ShoppingBag, Tag, ChevronLeft, ChevronRight, Info
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

// ── Tooltip helper ──────────────────────────────────────────────────────────
function Tooltip({ text }) {
  return (
    <span className="group relative ml-1 inline-flex items-center cursor-help">
      <Info size={12} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-lg bg-slate-800 px-3 py-2 text-xxs text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 leading-relaxed">
        {text}
      </span>
    </span>
  );
}

// ── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ icon, iconBg, iconColor, label, value, subLabel, tooltip, valueColor = "text-slate-800" }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start gap-3">
      <div className={`p-3 ${iconBg} rounded-xl ${iconColor} flex-shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider flex items-center">
          {label}
          {tooltip && <Tooltip text={tooltip} />}
        </p>
        <h3 className={`text-xl font-extrabold mt-0.5 ${valueColor}`}>{value}</h3>
        {subLabel && <p className="text-xxs text-slate-400 mt-0.5">{subLabel}</p>}
      </div>
    </div>
  );
}

// ── Number formatter ────────────────────────────────────────────────────────
const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Main Component ──────────────────────────────────────────────────────────
export default function AdminFinance() {
  const { showToast } = useToast();

  const EMPTY_SUMMARY = {
    totalOrders: 0, totalItemSubtotal: 0, totalCouponDiscount: 0,
    totalPlatformFees: 0, totalCommissionAmount: 0, totalNetPayout: 0, totalAdminNetRevenue: 0,
  };

  const [summary,  setSummary]  = useState(EMPTY_SUMMARY);
  const [timeline, setTimeline] = useState([]);
  const [vendors,  setVendors]  = useState([]);
  const [orders,   setOrders]   = useState([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPage,  setOrdersPage]  = useState(1);
  const PER_PAGE = 50;

  const [loading,         setLoading]         = useState(true);
  const [ordersLoading,   setOrdersLoading]   = useState(false);
  const [reconLoading,    setReconLoading]     = useState(false);
  const [backfillLoading, setBackfillLoading] = useState(false);

  const [reconReport,          setReconReport]          = useState(null);
  const [searchQuery,          setSearchQuery]          = useState("");
  const [startDate,            setStartDate]            = useState("");
  const [endDate,              setEndDate]              = useState("");
  const [selectedVendorFilter, setSelectedVendorFilter] = useState("");
  const [editingVendor,        setEditingVendor]        = useState(null);
  const [commissionType,       setCommissionType]       = useState("percentage");
  const [commissionValue,      setCommissionValue]      = useState("");
  const [savingConfig,         setSavingConfig]         = useState(false);

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("adminToken")}` });

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const params = [];
      if (startDate)            params.push(`startDate=${startDate}`);
      if (endDate)              params.push(`endDate=${endDate}`);
      if (selectedVendorFilter) params.push(`vendorId=${selectedVendorFilter}`);
      const qs = params.length ? `?${params.join("&")}` : "";

      const [sumRes, vendRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/admin/finance/summary${qs}`, { headers: headers() }),
        axios.get(`${import.meta.env.VITE_API_URL}/admin/finance/vendors`,       { headers: headers() }),
      ]);
      if (sumRes.data?.success)  { setSummary(sumRes.data.summary); setTimeline(sumRes.data.timeline || []); }
      if (vendRes.data?.success) setVendors(vendRes.data.data || []);
    } catch (e) {
      showToast({ type: "error", message: "Failed to load financial data." });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedVendorFilter]);

  const fetchOrders = useCallback(async (page = 1) => {
    try {
      setOrdersLoading(true);
      const params = [`page=${page}`, `limit=${PER_PAGE}`];
      if (startDate)            params.push(`startDate=${startDate}`);
      if (endDate)              params.push(`endDate=${endDate}`);
      if (selectedVendorFilter) params.push(`vendorId=${selectedVendorFilter}`);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/finance/orders?${params.join("&")}`, { headers: headers() });
      if (res.data?.success) { setOrders(res.data.data || []); setOrdersTotal(res.data.total || 0); setOrdersPage(page); }
    } catch (e) { /* silent */ } finally { setOrdersLoading(false); }
  }, [startDate, endDate, selectedVendorFilter]);

  useEffect(() => { fetchAll(); fetchOrders(1); }, [startDate, endDate, selectedVendorFilter]);

  const handleSaveCommission = async () => {
    if (!editingVendor) return;
    try {
      setSavingConfig(true);
      const val = Number(commissionValue);
      if (isNaN(val) || val < 0) return showToast({ type: "warning", message: "Commission must be positive." });
      if (commissionType === "percentage" && val > 100) return showToast({ type: "warning", message: "Cannot exceed 100%." });
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/finance/vendors/${editingVendor._id}`,
        { commissionType, commissionValue: val },
        { headers: headers() }
      );
      if (res.data?.success) { showToast({ type: "success", message: "Commission updated." }); setEditingVendor(null); fetchAll(); }
    } catch (e) { showToast({ type: "error", message: e.response?.data?.message || "Save failed." }); }
    finally { setSavingConfig(false); }
  };

  const handleReconcile = async () => {
    try {
      setReconLoading(true); setReconReport(null);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/admin/finance/reconcile`, {}, { headers: headers() });
      if (res.data?.success) { setReconReport(res.data.report); showToast({ type: "success", message: "Reconciliation done." }); fetchAll(); fetchOrders(1); }
    } catch (e) { showToast({ type: "error", message: "Reconciliation failed." }); }
    finally { setReconLoading(false); }
  };

  const handleBackfill = async () => {
    try {
      setBackfillLoading(true);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/admin/finance/backfill`, {}, { headers: headers() });
      if (res.data?.success) {
        const r = res.data.report;
        showToast({ type: "success", message: `Backfill done! Scanned ${r.totalOrdersScanned}, updated ${r.ordersUpdated}, created ${r.ledgersCreated} ledger entries.` });
        fetchAll(); fetchOrders(1);
      }
    } catch (e) { showToast({ type: "error", message: "Backfill failed." }); }
    finally { setBackfillLoading(false); }
  };

  const handleExportCSV = () => {
    const qs = selectedVendorFilter ? `?vendorId=${selectedVendorFilter}` : "";
    const a = document.createElement("a");
    a.href = `${import.meta.env.VITE_API_URL}/admin/finance/export${qs}`;
    a.setAttribute("download", "finance_report.csv");
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const filteredVendors = vendors.filter(v =>
    v.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.businessEmail || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.ceil(ordersTotal / PER_PAGE);

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Coins className="text-emerald-600" /> Commission & Payout Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Commission is calculated on <strong>Item Total only</strong>. Platform fees and coupon discounts are tracked separately as admin revenue.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExportCSV} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2 px-4 rounded-xl font-semibold flex items-center gap-2 text-sm cursor-pointer">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={handleBackfill} disabled={backfillLoading} className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-2 px-4 rounded-xl font-semibold flex items-center gap-2 text-sm cursor-pointer">
            <Database size={16} /> {backfillLoading ? "Backfilling…" : "Backfill History"}
          </button>
          <button onClick={handleReconcile} disabled={reconLoading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-xl font-semibold flex items-center gap-2 text-sm cursor-pointer">
            <RefreshCw className={reconLoading ? "animate-spin" : ""} size={16} /> {reconLoading ? "Auditing…" : "Reconcile Audit"}
          </button>
        </div>
      </div>

      {/* ── Audit Report ── */}
      {reconReport && (
        <div className="bg-slate-800 text-slate-100 p-5 rounded-2xl relative">
          <button onClick={() => setReconReport(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20} /></button>
          <h2 className="font-bold flex items-center gap-2 mb-3"><CheckCircle className="text-emerald-500" size={18} /> Reconciliation Audit Report</h2>
          <div className="grid grid-cols-3 gap-4 text-sm bg-slate-900 p-3 rounded-xl mb-3">
            <div>Processed: <span className="font-bold text-sky-400">{reconReport.processedDates} days</span></div>
            <div>Mismatches: <span className="font-bold text-amber-400">{reconReport.mismatchesFound}</span></div>
            <div>Written: <span className="font-bold text-emerald-400">{reconReport.correctionsApplied}</span></div>
          </div>
          {reconReport.logs?.length > 0
            ? <div className="max-h-32 overflow-y-auto font-mono text-xs text-slate-300 bg-slate-950 p-3 rounded-xl space-y-1">
                {reconReport.logs.map((l, i) => <div key={i} className="border-b border-slate-900 pb-1 last:border-0">{l}</div>)}
              </div>
            : <p className="text-xs text-slate-400 italic">All fields synchronized. No anomalies detected.</p>
          }
        </div>
      )}

      {/* ── Waterfall KPI Cards ── */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <TrendingUp size={14} /> Revenue Waterfall Summary
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <KpiCard
            icon={<TrendingUp size={20} />} iconBg="bg-emerald-50" iconColor="text-emerald-600"
            label="Item Sales Total" value={fmt(summary.totalItemSubtotal)}
            subLabel="Commission base"
            tooltip="Sum of item prices × quantities across all vendor orders. This is the only base used for commission calculation." />
          <KpiCard
            icon={<Tag size={20} />} iconBg="bg-pink-50" iconColor="text-pink-500"
            label="Coupon Discounts" value={fmt(summary.totalCouponDiscount)} valueColor="text-pink-600"
            subLabel="Absorbed by admin"
            tooltip="Total coupon discount given to customers. This is absorbed by the platform — it reduces admin net revenue but does NOT reduce vendor earnings." />
          <KpiCard
            icon={<ShoppingBag size={20} />} iconBg="bg-amber-50" iconColor="text-amber-600"
            label="Platform Fees" value={fmt(summary.totalPlatformFees)} valueColor="text-amber-600"
            subLabel="Handling + Cart + Delivery"
            tooltip="Sum of Handling Fee + Small Cart Fee + Delivery Partner Fee. These go entirely to the platform and are NOT included in vendor commission math." />
          <KpiCard
            icon={<Coins size={20} />} iconBg="bg-sky-50" iconColor="text-sky-600"
            label="Commission Earned" value={fmt(summary.totalCommissionAmount)} valueColor="text-sky-700"
            subLabel="Admin cut from vendors"
            tooltip="Platform commission deducted from vendor item totals. Calculated as: Item Total × Commission Rate." />
          <KpiCard
            icon={<Wallet size={20} />} iconBg="bg-violet-50" iconColor="text-violet-600"
            label="Vendor Net Payout" value={fmt(summary.totalNetPayout)} valueColor="text-violet-700"
            subLabel="Item Total − Commission"
            tooltip="What vendors receive after commission deduction. Formula: Item Total − Commission Amount. Coupon discounts and platform fees do NOT affect this." />
          <KpiCard
            icon={<TrendingUp size={20} />} iconBg="bg-teal-50" iconColor="text-teal-600"
            label="Admin Net Revenue" value={fmt(summary.totalAdminNetRevenue)} valueColor="text-teal-700"
            subLabel="Commission + Fees − Coupons"
            tooltip="Total platform revenue: Commission + Platform Fees − Coupon Discounts. This is the admin's actual net earnings after absorbing coupon costs." />
        </div>
      </div>

      {/* ── Filters + Vendor Config + Daily Ledger ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Vendor Configurations */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><Settings size={16} className="text-slate-400" /> Vendor Configs</h2>
            <div className="relative">
              <Search className="absolute left-2 top-2 text-slate-300" size={13} />
              <input type="text" placeholder="Search…" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-7 pr-2 py-1.5 text-xs border border-slate-200 rounded-lg w-32 focus:outline-none focus:border-emerald-400" />
            </div>
          </div>

          {/* Date + vendor filter */}
          <div className="space-y-2 mb-3">
            <div className="flex gap-1.5">
              <div className="flex-1">
                <p className="text-xxs font-bold text-slate-400 mb-0.5">Start</p>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg p-1" />
              </div>
              <div className="flex-1">
                <p className="text-xxs font-bold text-slate-400 mb-0.5">End</p>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full text-xs border border-slate-200 rounded-lg p-1" />
              </div>
            </div>
            <div className="flex gap-1">
              <select value={selectedVendorFilter} onChange={e => setSelectedVendorFilter(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg p-1 flex-1">
                <option value="">All Vendors</option>
                {vendors.map(v => <option key={v._id} value={v._id}>{v.shopName}</option>)}
              </select>
              {(startDate || endDate || selectedVendorFilter) && (
                <button onClick={() => { setStartDate(""); setEndDate(""); setSelectedVendorFilter(""); }}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400"><X size={15} /></button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
            {filteredVendors.map(v => (
              <div key={v._id} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-between border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-800">{v.shopName}</p>
                  <p className="text-xxs text-slate-400">{v.phone || v.businessEmail || "—"}</p>
                  <span className={`mt-1 inline-block text-xxs font-bold px-1.5 py-0.5 rounded-full ${v.resolvedFrom === "vendor" ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800"}`}>
                    {v.commissionValue}{v.commissionType === "percentage" ? "%" : "₹"} · {v.resolvedFrom === "vendor" ? "Override" : "Global"}
                  </span>
                </div>
                <button onClick={() => { setEditingVendor(v); setCommissionType(v.commissionType || "percentage"); setCommissionValue(v.commissionValue?.toString() || "0"); }}
                  className="p-2 hover:bg-white rounded-lg text-sky-600 border border-transparent hover:border-slate-200 cursor-pointer">
                  <Edit3 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Revenue Ledger */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 lg:col-span-2 flex flex-col h-[500px]">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-4"><Calendar size={16} className="text-slate-400" /> Daily Revenue Ledger</h2>
          <div className="flex-1 overflow-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold text-xxs">
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Vendor</th>
                  <th className="p-2.5">Orders</th>
                  <th className="p-2.5">Item Total <Tooltip text="Commission base: sum of item prices × qty" /></th>
                  <th className="p-2.5">Coupon <Tooltip text="Admin absorbs this cost" /></th>
                  <th className="p-2.5">Platform Fees</th>
                  <th className="p-2.5">Commission</th>
                  <th className="p-2.5">Vendor Payout</th>
                  <th className="p-2.5">Admin Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {timeline.length > 0 ? timeline.map(row => {
                  const it  = row.totalItemSubtotal   ?? row.totalSalesAmount   ?? 0;
                  const co  = row.totalCouponDiscount  || 0;
                  const pf  = row.totalPlatformFees    || 0;
                  const cm  = row.totalCommissionAmount || 0;
                  const np  = row.totalNetPayout        || 0;
                  const ar  = row.totalAdminNetRevenue  || 0;
                  return (
                    <tr key={row._id} className="hover:bg-slate-50/60">
                      <td className="p-2.5 font-semibold text-slate-600 whitespace-nowrap">
                        {new Date(row.date).toLocaleDateString("en-IN", { timeZone: "UTC", day: "numeric", month: "short" })}
                      </td>
                      <td className="p-2.5 font-bold text-slate-800 max-w-[100px] truncate">
                        {vendors.find(v => v._id === row.vendorId)?.shopName || "Platform"}
                      </td>
                      <td className="p-2.5 text-slate-500">{row.totalOrders}</td>
                      <td className="p-2.5 font-bold text-slate-800">₹{it.toFixed(2)}</td>
                      <td className="p-2.5 text-pink-500">{co > 0 ? `−₹${co.toFixed(2)}` : "—"}</td>
                      <td className="p-2.5 text-amber-600">₹{pf.toFixed(2)}</td>
                      <td className="p-2.5 text-sky-700 font-bold">₹{cm.toFixed(2)}</td>
                      <td className="p-2.5 text-violet-700 font-bold">₹{np.toFixed(2)}</td>
                      <td className="p-2.5 text-teal-700 font-bold">₹{ar.toFixed(2)}</td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan="9" className="p-8 text-center text-slate-400 italic">No data. Use "Backfill History" to populate.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Per-Order Commission Breakdown ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><FileText size={16} className="text-slate-400" /> Per-Order Commission Breakdown</h2>
            <p className="text-xxs text-slate-400 mt-0.5">Each row shows the full waterfall for a single order.</p>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{ordersTotal} records</span>
        </div>

        {ordersLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>
        ) : (
          <>
            <div className="overflow-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold text-xxs">
                    <th className="p-2.5">Order ID</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Vendor</th>
                    <th className="p-2.5">
                      Item Total
                      <Tooltip text="Commission base = sum of item prices × qty. Platform fees and coupons are excluded." />
                    </th>
                    <th className="p-2.5">
                      Coupon Applied
                      <Tooltip text="Coupon discount absorbed by admin — does NOT reduce vendor earning." />
                    </th>
                    <th className="p-2.5">
                      Platform Fees
                      <Tooltip text="Handling + Small Cart + Delivery fees. These are admin-only revenue and are NOT part of commission calculation." />
                    </th>
                    <th className="p-2.5">Comm. Rate</th>
                    <th className="p-2.5">
                      Commission
                      <Tooltip text="Calculated as: Item Total × Commission Rate (or flat amount)." />
                    </th>
                    <th className="p-2.5">
                      Vendor Net Earning
                      <Tooltip text="Item Total − Commission. Coupon discounts and platform fees do NOT affect vendor earnings." />
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
                      <td className="p-2.5 text-slate-700 font-semibold max-w-[80px] truncate">{row.vendorName || "—"}</td>
                      <td className="p-2.5 font-bold text-slate-800">₹{Number(row.itemSubtotal).toFixed(2)}</td>
                      <td className="p-2.5">
                        {row.couponDiscount > 0 ? (
                          <div>
                            <span className="text-pink-500 font-bold">−₹{Number(row.couponDiscount).toFixed(2)}</span>
                            {row.couponCode && <div className="text-xxs text-slate-400 mt-0.5 font-mono">{row.couponCode}</div>}
                          </div>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="p-2.5">
                        {row.platformFees?.total > 0 ? (
                          <div className="text-xxs space-y-0.5">
                            {row.platformFees.handlingFee    > 0 && <div className="text-amber-600">H: ₹{row.platformFees.handlingFee}</div>}
                            {row.platformFees.smallCartFee   > 0 && <div className="text-amber-600">S: ₹{row.platformFees.smallCartFee}</div>}
                            {row.platformFees.deliveryCharge > 0 && <div className="text-amber-600">D: ₹{row.platformFees.deliveryCharge}</div>}
                          </div>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="p-2.5 text-slate-500">
                        {row.commissionRateApplied}{row.commissionType === "percentage" ? "%" : "₹"}
                      </td>
                      <td className="p-2.5 text-sky-700 font-bold">₹{Number(row.commissionAmount).toFixed(2)}</td>
                      <td className="p-2.5 text-emerald-700 font-extrabold">₹{Number(row.netPayout).toFixed(2)}</td>
                      <td className="p-2.5">
                        <span className={`text-xxs font-bold px-1.5 py-0.5 rounded-full ${STATUS_COLORS[row.orderStatus] || "bg-slate-100 text-slate-600"}`}>
                          {row.orderStatus?.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="10" className="p-8 text-center text-slate-400 italic">No records. Click "Backfill History" to populate ledger data.</td></tr>
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

      {/* ── Edit Commission Modal ── */}
      {editingVendor && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Configure Commission Override</h3>
                <p className="text-xs text-slate-400 mt-0.5">{editingVendor.shopName}</p>
              </div>
              <button onClick={() => setEditingVendor(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Commission Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {["percentage", "flat"].map(t => (
                    <button key={t} onClick={() => setCommissionType(t)}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${commissionType === t ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                      {t === "percentage" ? "Percentage (%)" : "Flat Fee (₹)"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Value {commissionType === "percentage" ? "(%)" : "(₹)"}</label>
                <div className="relative">
                  <input type="number" value={commissionValue} onChange={e => setCommissionValue(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-400"
                    placeholder="Enter value…" />
                  <span className="absolute right-3 top-3 text-slate-400 text-xs font-bold">{commissionType === "percentage" ? "%" : "₹"}</span>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button onClick={() => setEditingVendor(null)} className="bg-white text-slate-600 py-2 px-4 rounded-xl border border-slate-200 font-bold text-xs cursor-pointer">Cancel</button>
              <button onClick={handleSaveCommission} disabled={savingConfig}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white py-2 px-4 rounded-xl font-bold text-xs cursor-pointer">
                {savingConfig ? "Saving…" : "Save Configuration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
