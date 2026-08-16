import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Search, Eye, Pencil, Trash2, FileText } from "lucide-react";
import { useToast } from "../../../components/Toast";
import ConfirmDialog from "../../../components/Toast/ConfirmDialog";
import { InvoiceModal } from "../customers/CustomerList";

export default function OrderList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [confirmState, setConfirmState] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/orders`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (orderId) => {
    setConfirmState({
      message: "Are you sure you want to delete this order?",
      type: "danger",
      onConfirm: async () => {
        setConfirmState(null);
        try {
          const token = localStorage.getItem("adminToken");
          await axios.delete(
            `${import.meta.env.VITE_API_URL}/admin/orders/${orderId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          showToast({ type: "success", message: "Order deleted successfully" });
          fetchOrders();
        } catch (error) {
          console.error("Error deleting order:", error);
          showToast({ type: "error", message: "Failed to delete order" });
        }
      }
    });
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      showToast({ type: "error", message: "Failed to update order status" });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-gray-500">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Orders Management</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border rounded-xl border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 text-sm border rounded-xl border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer font-medium text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto -webkit-overflow-scrolling-touch">
        <table className="w-full min-w-[750px] sm:min-w-[850px] divide-y divide-gray-200">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="hidden lg:table-cell px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="hidden md:table-cell px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="hidden sm:table-cell px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 sm:px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-sm">
            {filteredOrders.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap font-mono font-bold text-slate-800">
                  {order.orderId || order._id}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="font-semibold text-slate-900">{order.customer?.name || "N/A"}</div>
                  {order.customer?.phone && (
                    <div className="text-xs text-slate-500 font-mono md:hidden">{order.customer.phone}</div>
                  )}
                  {order.customer?.email && (
                    <div className="text-xs text-slate-400 truncate max-w-[160px] lg:hidden">{order.customer.email}</div>
                  )}
                </td>
                <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-slate-600">
                  {order.customer?.email || "N/A"}
                </td>
                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-slate-600 font-mono">
                  {order.customer?.phone || "N/A"}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap font-mono font-bold text-slate-900">
                  ₹{Number(order.grandTotal !== undefined ? order.grandTotal : order.totalAmount || 0).toFixed(2)}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border-0 cursor-pointer focus:ring-2 focus:ring-purple-500/20 ${getStatusColor(
                      order.status
                    )}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-slate-500">
                  {new Date(order.createdAt || order.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={() => navigate(`/admin/orders/${order._id}`)}
                      className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-blue-600 hover:bg-blue-50 flex items-center gap-1 text-xs font-semibold cursor-pointer transition-colors"
                      title="View Order Details"
                    >
                      <Eye size={15} />
                      <span className="hidden sm:inline">View</span>
                    </button>
                    <button
                      onClick={() => setSelectedInvoiceOrder(order)}
                      className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-purple-600 hover:bg-purple-50 flex items-center gap-1 text-xs font-semibold cursor-pointer transition-colors"
                      title="Print Tax Invoice"
                    >
                      <FileText size={15} />
                      <span className="hidden sm:inline">Invoice</span>
                    </button>
                    <button
                      className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-emerald-600 hover:bg-emerald-50 flex items-center gap-1 text-xs font-semibold cursor-pointer transition-colors"
                      title="Edit Order"
                    >
                      <Pencil size={15} />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(order._id)}
                      className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-red-600 hover:bg-red-50 flex items-center gap-1 text-xs font-semibold cursor-pointer transition-colors"
                      title="Delete Order"
                    >
                      <Trash2 size={15} />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No orders found
          </div>
        )}
      </div>
      {selectedInvoiceOrder && (
        <InvoiceModal order={selectedInvoiceOrder} onClose={() => setSelectedInvoiceOrder(null)} />
      )}
      {confirmState && (
        <ConfirmDialog
          message={confirmState.message}
          type={confirmState.type || "warning"}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}
