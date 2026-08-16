import React, { useState, useEffect } from "react";
import axios from "axios";
import { TrendingUp, ShoppingCart, Users, Coins, Package } from "lucide-react";

export default function ReportsAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/analytics/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        setData(res.data.reports);
      }
    } catch (err) {
      console.error("Failed to fetch reports analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const fmtCurrency = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-semibold text-sm">
        Loading Reports & Analytics...
      </div>
    );
  }

  const reports = data || {
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    activeCustomers: 0,
    totalProducts: 0,
    growthPct: 0,
    topProducts: []
  };

  return (
    <div className="p-6 space-y-6 max-w-full overflow-x-hidden">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Reports & Analytics</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">Real-Time Performance Overview Across All Orders & Catalog</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400 font-bold text-xxs uppercase tracking-wider">
            <span>Total Revenue</span>
            <Coins size={18} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{fmtCurrency(reports.totalRevenue)}</p>
          <p className="text-xxs font-semibold text-slate-400 flex items-center gap-1">
            <span className={reports.growthPct >= 0 ? "text-emerald-600 font-bold" : "text-red-500 font-bold"}>
              {reports.growthPct >= 0 ? `+${reports.growthPct}%` : `${reports.growthPct}%`}
            </span> MoM revenue growth
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400 font-bold text-xxs uppercase tracking-wider">
            <span>Total Orders</span>
            <ShoppingCart size={18} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600">{reports.totalOrders}</p>
          <p className="text-xxs font-semibold text-slate-400">Total orders processed</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400 font-bold text-xxs uppercase tracking-wider">
            <span>Avg. Order Value (AOV)</span>
            <TrendingUp size={18} className="text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-600">{fmtCurrency(reports.averageOrderValue)}</p>
          <p className="text-xxs font-semibold text-slate-400">Revenue per order</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-400 font-bold text-xxs uppercase tracking-wider">
            <span>Active Customers</span>
            <Users size={18} className="text-orange-500" />
          </div>
          <p className="text-2xl font-black text-orange-600">{reports.activeCustomers}</p>
          <p className="text-xxs font-semibold text-slate-400">Registered platform users</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Package size={18} className="text-purple-600" /> Top Selling Products
            </h2>
            <span className="text-xs text-slate-400 font-semibold">{reports.topProducts?.length || 0} items</span>
          </div>

          {reports.topProducts && reports.topProducts.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {reports.topProducts.map((item, idx) => (
                <div key={idx} className="py-2.5 flex justify-between items-center text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400 text-xxs font-bold">#{idx + 1}</span>
                    <span className="font-bold text-slate-800">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-slate-900 block">{fmtCurrency(item.sales)}</span>
                    <span className="text-xxs text-slate-400 font-bold">{item.qty} units sold</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs italic">
              No orders placed yet to calculate top products.
            </div>
          )}
        </div>

        {/* Live Platform Catalog Summary */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-600" /> Platform Overview
            </h2>
          </div>
          <div className="space-y-3 text-xs font-semibold text-slate-600">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span>Total Active Products in Catalog</span>
              <span className="font-black text-slate-900 text-sm">{reports.totalProducts}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span>Month-over-Month Revenue Growth</span>
              <span className={reports.growthPct >= 0 ? "font-black text-emerald-600 text-sm" : "font-black text-red-500 text-sm"}>
                {reports.growthPct >= 0 ? `+${reports.growthPct}%` : `${reports.growthPct}%`}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span>Average Order Value</span>
              <span className="font-black text-slate-900 text-sm">{fmtCurrency(reports.averageOrderValue)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
