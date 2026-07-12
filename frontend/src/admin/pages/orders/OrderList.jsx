import React, { useState, useEffect } from "react";
import axios from "axios";
import { Search, Eye, Pencil, Trash2 } from "lucide-react";
import { useToast } from "../../../components/Toast";
import ConfirmDialog from "../../../components/Toast/ConfirmDialog";

export default function OrderList() {
  const { showToast } = useToast();
  const [confirmState, setConfirmState] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Orders Management</h1>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-auto"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {order._id?.slice(-8) || order.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{order.customer?.name || "N/A"}</td>
                <td className="px-6 py-4 whitespace-nowrap">{order.customer?.email || "N/A"}</td>
                <td className="px-6 py-4 whitespace-nowrap">{order.customer?.phone || "N/A"}</td>
                <td className="px-6 py-4 whitespace-nowrap">₹{order.totalAmount || order.total || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                    className={`px-2 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer ${getStatusColor(
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
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(order.createdAt || order.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button className="text-blue-600 hover:text-blue-800 mr-3 flex items-center gap-1">
                    <Eye size={16} />
                    View
                  </button>
                  <button className="text-green-600 hover:text-green-800 mr-3 flex items-center gap-1">
                    <Pencil size={16} />
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(order._id)}
                    className="text-red-600 hover:text-red-800 flex items-center gap-1"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
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
