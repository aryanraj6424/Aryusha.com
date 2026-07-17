import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Search,
  Eye,
  ChevronDown,
  ChevronUp,
  X,
  Printer,
  Package,
  Calendar,
  CreditCard,
  Store,
  Filter,
  Users,
} from "lucide-react";
import { useToast } from "../../../components/Toast";

// ─── Invoice Modal ─────────────────────────────────────────────────────────────
function InvoiceModal({ order, onClose }) {
  const invoiceRef = useRef();

  const handlePrint = () => {
    const content = invoiceRef.current.innerHTML;
    const printWin = window.open("", "_blank", "width=800,height=600");
    printWin.document.write(`
      <html><head><title>Invoice ${order.orderId}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #1e293b; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; font-size: 13px; }
        th { background: #f1f5f9; font-weight: 700; }
        .header { display: flex; justify-content: space-between; margin-bottom: 24px; }
        .total-row { font-weight: 700; background: #f8fafc; }
        .badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
      </style>
      </head><body>${content}</body></html>
    `);
    printWin.document.close();
    printWin.print();
  };

  const statusColors = {
    Pending: "#f59e0b",
    Accepted: "#3b82f6",
    Packed: "#8b5cf6",
    Out_for_Delivery: "#f97316",
    Delivered: "#22c55e",
    Cancelled: "#ef4444",
    Rejected: "#ef4444",
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-slate-800">
            Invoice — <span className="text-purple-600">{order.orderId}</span>
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition"
            >
              <Printer size={14} /> Print
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-6" ref={invoiceRef}>
          {/* Header */}
          <div className="flex justify-between mb-6">
            <div>
              <h3 className="text-xl font-black text-purple-700">QuickCart</h3>
              <p className="text-xs text-slate-500">Tax Invoice / Bill of Supply</p>
            </div>
            <div className="text-right text-sm text-slate-600">
              <p className="font-bold">{order.orderId}</p>
              <p>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
              <span
                className="badge"
                style={{ background: (statusColors[order.orderStatus] || "#94a3b8") + "22", color: statusColors[order.orderStatus] || "#94a3b8" }}
              >
                {order.orderStatus}
              </span>
            </div>
          </div>

          {/* Customer & Vendor Info */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div className="bg-slate-50 p-3 rounded-xl">
              <p className="font-bold text-slate-700 mb-1">Billed To</p>
              <p className="font-semibold">{order.deliveryAddress?.fullName || order.customerId?.fullName}</p>
              <p className="text-slate-500">{order.deliveryAddress?.phoneNumber}</p>
              <p className="text-slate-500">
                {order.deliveryAddress?.houseNo} {order.deliveryAddress?.area}, {order.deliveryAddress?.city} — {order.deliveryAddress?.pincode}
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl">
              <p className="font-bold text-slate-700 mb-1">Fulfilled By</p>
              <p className="font-semibold">{order.vendorId?.shopName || "N/A"}</p>
              <p className="text-slate-500">{order.vendorId?.phone}</p>
              <p className="text-slate-500">{order.vendorId?.address?.city}</p>
            </div>
          </div>

          {/* Items Table */}
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.qty}</td>
                  <td>₹{item.price?.toFixed(2)}</td>
                  <td>₹{(item.price * item.qty)?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {order.couponDiscount > 0 && (
                <tr>
                  <td colSpan={4} className="text-right font-semibold text-green-600">Coupon Discount ({order.couponCode})</td>
                  <td className="text-green-600 font-semibold">- ₹{order.couponDiscount?.toFixed(2)}</td>
                </tr>
              )}
              <tr>
                <td colSpan={4} className="text-right font-semibold">Delivery Charge</td>
                <td>₹{(order.deliveryCharge || 0).toFixed(2)}</td>
              </tr>
              <tr className="total-row">
                <td colSpan={4} className="text-right font-bold">Grand Total</td>
                <td className="font-bold text-purple-700">₹{order.grandTotal?.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Payment Info */}
          <div className="mt-4 flex justify-between text-sm text-slate-600">
            <p>Payment Method: <strong>{order.paymentMethod}</strong></p>
            <p>Payment Status: <strong>{order.paymentStatus}</strong></p>
          </div>
          <p className="mt-6 text-xs text-slate-400 text-center">
            This is a system-generated invoice. No signature required.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Order History Panel ────────────────────────────────────────────────────────
function CustomerOrdersPanel({ customer, onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const ORDER_STATUSES = ["Pending", "Accepted", "Packed", "Out_for_Delivery", "Delivered", "Cancelled", "Rejected"];
  const STATUS_COLORS = {
    Pending: "bg-yellow-100 text-yellow-700",
    Accepted: "bg-blue-100 text-blue-700",
    Packed: "bg-violet-100 text-violet-700",
    Out_for_Delivery: "bg-orange-100 text-orange-700",
    Delivered: "bg-green-100 text-green-700",
    Cancelled: "bg-red-100 text-red-700",
    Rejected: "bg-red-100 text-red-700",
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("vendorToken");
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/vendor/customers/${customer._id}/orders`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOrders(res.data.orders || []);
      } catch (err) {
        console.error("Error fetching customer orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [customer._id]);

  const filtered = statusFilter === "all" ? orders : orders.filter(o => o.orderStatus === statusFilter);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b bg-gradient-to-r from-purple-700 to-violet-700 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{customer.fullName}</h2>
            <p className="text-purple-200 text-xs">{customer.phoneNumber} · {customer.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition">
            <X size={18} />
          </button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b bg-slate-50 flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${statusFilter === "all" ? "bg-purple-700 text-white" : "bg-white border text-slate-600 hover:bg-slate-50"}`}
          >
            All ({orders.length})
          </button>
          {ORDER_STATUSES.map(s => {
            const count = orders.filter(o => o.orderStatus === s).length;
            if (!count) return null;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${statusFilter === s ? "bg-purple-700 text-white" : "bg-white border text-slate-600 hover:bg-slate-50"}`}
              >
                {s.replace(/_/g, " ")} ({count})
              </button>
            );
          })}
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Loading orders...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Package size={40} className="mb-3 opacity-40" />
              <p className="font-semibold">No orders found</p>
            </div>
          ) : (
            filtered.map((order) => (
              <div key={order._id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg">{order.orderId}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_COLORS[order.orderStatus] || "bg-slate-100 text-slate-600"}`}>
                        {order.orderStatus?.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard size={11} /> {order.paymentMethod}
                      </span>
                      <span className="flex items-center gap-1">
                        <Store size={11} /> {order.vendorId?.shopName || "N/A"}
                      </span>
                    </div>
                    <div className="mt-1.5 text-xs text-slate-500">
                      {order.items?.length} item{order.items?.length !== 1 ? "s" : ""} · {order.items?.map(i => i.name).join(", ").slice(0, 60)}{order.items?.map(i => i.name).join(", ").length > 60 ? "…" : ""}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <p className="text-base font-extrabold text-slate-800">₹{order.grandTotal?.toFixed(2)}</p>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold hover:bg-purple-100 transition"
                    >
                      <Eye size={11} /> Invoice
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats Footer */}
        <div className="p-4 border-t bg-slate-50 flex justify-between text-sm">
          <span className="text-slate-500 font-semibold">{filtered.length} order{filtered.length !== 1 ? "s" : ""}</span>
          <span className="font-bold text-purple-700">
            Total: ₹{filtered.reduce((sum, o) => sum + (o.grandTotal || 0), 0).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Invoice Modal */}
      {selectedOrder && (
        <InvoiceModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </>
  );
}

// ─── Main Vendor CustomerList Page ──────────────────────────────────────────────
export default function VendorCustomerList() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, newThisMonth: 0 });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("vendorToken");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/vendor/customers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const customersData = response.data.customers || [];
      setCustomers(customersData);

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStats({
        total: customersData.length,
        active: customersData.filter((c) => c.status === "active").length,
        inactive: customersData.filter((c) => c.status !== "active").length,
        newThisMonth: customersData.filter((c) => new Date(c.createdAt) >= firstDayOfMonth).length,
      });
    } catch (error) {
      console.error("Error fetching vendor customers:", error);
      showToast({ type: "error", message: "Failed to load customers" });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700";
      case "inactive": return "bg-gray-100 text-gray-600";
      case "blocked": return "bg-red-100 text-red-700";
      default: return "bg-green-100 text-green-700";
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phoneNumber?.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <div className="text-slate-400 text-sm font-semibold">Loading customer base...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Users className="text-purple-600" /> My Customers
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Overview of customer base executing orders at your store</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border rounded-xl text-xs font-semibold w-full sm:w-64 outline-none focus:border-purple-500 bg-white transition"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-xl text-xs font-semibold outline-none focus:border-purple-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Eligible Customers", value: stats.total, color: "text-slate-800" },
          { label: "Active Status", value: stats.active, color: "text-green-600" },
          { label: "Inactive / Blocked", value: stats.inactive, color: "text-slate-500" },
          { label: "Joined This Month", value: stats.newThisMonth, color: "text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xxs font-bold text-slate-400 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-slate-400 font-bold">
                {["Customer", "Contact", "Store Orders", "Store Spent", "Status", "Joined", "Actions"].map((col) => (
                  <th key={col} className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCustomers.map((customer) => (
                <tr key={customer._id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0">
                        {customer.fullName?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{customer.fullName || "N/A"}</p>
                        <p className="text-xxs text-slate-400 font-mono">{customer._id?.slice(-8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-slate-700">{customer.phoneNumber}</p>
                    <p className="text-slate-400">{customer.email}</p>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-slate-700">{customer.totalOrders || 0}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-slate-700">₹{(customer.totalSpent || 0).toFixed(0)}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-xxs font-bold ${getStatusColor(customer.status)}`}>
                      {customer.status || "active"}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 font-semibold">
                    {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setSelectedCustomer(customer)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold hover:bg-purple-100 transition"
                    >
                      <Eye size={12} /> Orders
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            <Search size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No customers matched your filters</p>
          </div>
        )}
      </div>

      {/* Customer Orders Slide-out Panel */}
      {selectedCustomer && (
        <CustomerOrdersPanel
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}
