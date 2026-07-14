import { useState, useEffect, useRef } from "react";
import { Search, MapPin, User, Clock, CheckCircle, ArrowRight, ShieldCheck, ChevronDown, Check, Phone, RefreshCw, ShoppingCart, Info, Lock } from "lucide-react";
import axios from "axios";
import { useToast } from "../../../components/Toast";
import { getSocket, joinRoom, leaveRoom } from "../../../services/socket";

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const { showToast } = useToast();
  const socketRef = useRef(null);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("vendorToken");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/vendor/orders`, { headers });
      if (res.data.success) {
        setOrders(res.data.orders || []);
        
        // Auto-select the first order in list or update selectedOrder with fresh database states
        if (res.data.orders?.length > 0) {
          if (selectedOrder) {
            const fresh = res.data.orders.find(o => o._id === selectedOrder._id);
            setSelectedOrder(fresh || res.data.orders[0]);
          } else if (window.innerWidth >= 1024) {
            setSelectedOrder(res.data.orders[0]);
          }
        } else {
          setSelectedOrder(null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch vendor orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRiders = async () => {
    try {
      const token = localStorage.getItem("vendorToken");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/vendor/delivery-boys`, { headers });
      if (res.data.success) {
        setRiders(res.data.riders || []);
      }
    } catch (error) {
      console.error("Failed to fetch active riders:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchRiders();

    const timer = setInterval(() => {
      fetchOrders();
    }, 7000);

    // Join vendor's socket room for real-time delivery status updates
    const vendor = JSON.parse(localStorage.getItem("vendor") || "{}");
    const vendorId = vendor._id;
    if (vendorId) {
      const socket = getSocket();
      socketRef.current = socket;
      joinRoom(`vendor:${vendorId}`);

      const handleStatusUpdate = (data) => {
        const statusMessages = {
          "order:pickedUp": "Order picked up by delivery rider!",
          "order:onTheWay": "Delivery rider is on the way!",
          "order:reachedCustomer": "Delivery rider reached the customer!",
          "order:delivered": "Order delivered successfully!",
        };
        const msg = statusMessages[data.event] || "Order status updated";
        showToast({ type: "info", message: msg });
        fetchOrders();
      };

      socket.on("order:pickedUp", (d) => { showToast({ type: "info", message: "Order picked up by delivery rider!" }); fetchOrders(); });
      socket.on("order:onTheWay", (d) => { showToast({ type: "info", message: "Delivery rider is on the way!" }); fetchOrders(); });
      socket.on("order:reachedCustomer", (d) => { showToast({ type: "info", message: "Delivery rider reached the customer!" }); fetchOrders(); });
      socket.on("order:delivered", (d) => { showToast({ type: "success", message: "Order delivered successfully!" }); fetchOrders(); });
    }

    return () => {
      clearInterval(timer);
      if (vendorId && socketRef.current) {
        socketRef.current.off("order:pickedUp");
        socketRef.current.off("order:onTheWay");
        socketRef.current.off("order:reachedCustomer");
        socketRef.current.off("order:delivered");
        leaveRoom(`vendor:${vendorId}`);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedOrder) {
      const itemsSum = selectedOrder.items?.reduce((sum, item) => sum + item.price * item.qty, 0) || 0;
      if (selectedOrder.totalAmount && Math.abs(itemsSum - selectedOrder.totalAmount) > 0.01) {
        console.warn(`Safeguard Warning: Parcels checklist sum (₹${itemsSum.toFixed(2)}) does not match order items subtotal (₹${selectedOrder.totalAmount.toFixed(2)}) for Order #${selectedOrder.orderId}`);
      }
    }
  }, [selectedOrder]);

  const handleAssignRider = async (riderId) => {
    if (!selectedOrder) return;
    
    try {
      setAssigning(true);
      const token = localStorage.getItem("vendorToken");
      const headers = { Authorization: `Bearer ${token}` };
      const orderId = selectedOrder._id;

      // Call reassign API if it's already assigned, otherwise call standard assign-delivery-boy
      const isReassign = !!selectedOrder.deliveryBoyId;
      const endpoint = isReassign 
        ? `${import.meta.env.VITE_API_URL}/vendor/orders/${orderId}/reassign-delivery-boy`
        : `${import.meta.env.VITE_API_URL}/vendor/orders/${orderId}/assign-delivery-boy`;

      const method = isReassign ? "put" : "post";

      const res = await axios[method](endpoint, { deliveryBoyId: riderId }, { headers });

      if (res.data.success) {
        showToast({ type: "success", message: isReassign ? "Delivery Rider reassigned successfully!" : "Delivery Rider assigned successfully!" });
        setShowAssignModal(false);
        fetchOrders();
      }
    } catch (error) {
      console.error("Error assigning delivery boy:", error);
      showToast({ type: "error", message: error.response?.data?.message || "Failed to assign delivery boy." });
    } finally {
      setAssigning(false);
    }
  };

  const handleAcceptOrder = async () => {
    if (!selectedOrder) return;
    try {
      setAccepting(true);
      const token = localStorage.getItem("vendorToken");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/vendor/orders/${selectedOrder._id}/accept`,
        {},
        { headers }
      );
      if (res.data.success) {
        showToast({ type: "success", message: "Order accepted successfully!" });
        await fetchOrders();
      }
    } catch (error) {
      console.error("Failed to accept order:", error);
      showToast({ type: "error", message: error.response?.data?.message || "Failed to accept order." });
    } finally {
      setAccepting(false);
    }
  };

  // Filter orders based on active tab state
  const filteredOrders = orders.filter((order) => {
    if (activeTab === "pending") {
      return !order.deliveryBoyId || order.deliveryStatus === "None";
    }
    if (activeTab === "assigned") {
      return order.deliveryBoyId && order.deliveryStatus === "Assigned";
    }
    if (activeTab === "transit") {
      return order.deliveryBoyId && ["Picked_Up", "On_the_Way", "Reached_Customer"].includes(order.deliveryStatus);
    }
    if (activeTab === "completed") {
      return order.deliveryStatus === "Delivered";
    }
    return true; // 'all'
  });

  const getDeliveryStatusColor = (status) => {
    switch (status) {
      case "Assigned":
        return "bg-amber-100 text-amber-800 border border-amber-250";
      case "Picked_Up":
        return "bg-indigo-100 text-indigo-800 border border-indigo-250";
      case "On_the_Way":
        return "bg-purple-100 text-purple-800 border border-purple-250";
      case "Reached_Customer":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "Delivered":
        return "bg-emerald-100 text-emerald-800 border border-emerald-250";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  // Timeline Helper to parse timestamps from deliveryLogs
  const getTimelineLogTime = (statusName) => {
    if (!selectedOrder?.deliveryLogs) return null;
    const log = selectedOrder.deliveryLogs.find(l => l.status === statusName);
    return log ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
  };

  const steps = [
    { label: "Assigned", key: "Assigned" },
    { label: "Picked Up", key: "Picked_Up" },
    { label: "On the Way", key: "On_the_Way" },
    { label: "Reached Customer", key: "Reached_Customer" },
    { label: "Delivered", key: "Delivered" }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === selectedOrder?.deliveryStatus);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Order dispatching</h1>
          <p className="text-slate-500 font-medium">Assign riders and track active customer delivery statuses</p>
        </div>
        <button 
          onClick={fetchOrders}
          className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer text-slate-605"
          title="Refresh orders lists"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        {[
          { id: "all", label: "All Orders" },
          { id: "pending", label: "Unassigned" },
          { id: "assigned", label: "Assigned" },
          { id: "transit", label: "In Transit" },
          { id: "completed", label: "Delivered" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              // Reset selection when changing tabs to prevent state mismatch
              setSelectedOrder(null);
            }}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all relative border-b-2 cursor-pointer ${
              activeTab === tab.id 
                ? "border-[#6d28d9] text-[#6d28d9]" 
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Split Screen Container */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-650"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left panel: Orders list */}
          <div className={`space-y-3 lg:col-span-1 max-h-[70vh] overflow-y-auto pr-1 ${selectedOrder ? "hidden lg:block" : "block"}`}>
            {filteredOrders.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center text-slate-400 font-bold shadow-sm">
                No orders match this status tab.
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div 
                  key={order._id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedOrder?._id === order._id 
                      ? "bg-purple-50/50 border-[#6d28d9] shadow-inner" 
                      : "bg-white border-slate-150 shadow-sm hover:border-purple-250"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-extrabold text-xs text-slate-800">#{order.orderId}</span>
                    <span className="text-[9px] text-slate-400 font-bold">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-500 font-semibold mb-2">
                    <p className="truncate"><span className="text-slate-400 font-bold">Client:</span> {order.deliveryAddress?.fullName}</p>
                    <p className="font-bold text-slate-700">₹{order.grandTotal.toFixed(2)}</p>
                  </div>

                  <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-50">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                      order.orderStatus === "Pending" ? "bg-slate-100 text-slate-650" : "bg-purple-50 text-[#6d28d9]"
                    }`}>
                      {order.orderStatus}
                    </span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${getDeliveryStatusColor(order.deliveryStatus)}`}>
                      {order.deliveryStatus.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right panel: Details details card */}
          <div className={`lg:col-span-2 ${selectedOrder ? "block" : "hidden lg:block"}`}>
            {!selectedOrder ? (
              <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400 font-bold shadow-sm">
                Select an order from the list to display dispatch controls and logs.
              </div>
            ) : (
              <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-6">
                
                {/* Back to list button on mobile */}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="lg:hidden mb-4 flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  &larr; Back to Orders List
                </button>
                
                {/* Header card summary */}
                <div className="flex justify-between items-start gap-4 pb-4 border-b border-slate-50">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block">Order Detail</span>
                    <h2 className="text-lg font-black text-slate-850">#{selectedOrder.orderId}</h2>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                      Placed on: {new Date(selectedOrder.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="text-sm font-black text-[#6d28d9] block">₹{selectedOrder.grandTotal.toFixed(2)}</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {selectedOrder.paymentMethod}
                    </span>
                  </div>
                </div>

                {/* Split grid: Delivery status and Rider info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-slate-50">
                  {/* Left: Customer Address details */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-[#6d28d9]" />
                      <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Customer Drop</h3>
                    </div>
                    <div className="text-xs font-semibold text-slate-600 pl-1 leading-relaxed space-y-1">
                      <p className="font-extrabold text-slate-850">{selectedOrder.deliveryAddress?.fullName}</p>
                      <p>{selectedOrder.deliveryAddress?.houseNo}, {selectedOrder.deliveryAddress?.area}</p>
                      <p>{selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.state} - {selectedOrder.deliveryAddress?.pincode}</p>
                      {selectedOrder.deliveryAddress?.phoneNumber && (
                        <p className="pt-1.5 font-bold text-slate-500">Contact: {selectedOrder.deliveryAddress.phoneNumber}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: Assigned Delivery Boy card */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-[#6d28d9]" />
                      <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Delivery Agent</h3>
                    </div>
                    
                    {selectedOrder.deliveryBoyId ? (
                      <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-black text-xs text-slate-850">{selectedOrder.deliveryBoyId.fullName}</p>
                            <p className="text-[9px] text-slate-400 font-bold">{selectedOrder.deliveryBoyId.phone}</p>
                          </div>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${getDeliveryStatusColor(selectedOrder.deliveryStatus)}`}>
                            {selectedOrder.deliveryStatus.replace(/_/g, " ")}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <a 
                            href={`tel:${selectedOrder.deliveryBoyId.phone}`}
                            className="flex-1 py-1.5 bg-white border border-purple-200 hover:bg-purple-100 rounded-lg text-center font-bold text-[10px] text-purple-750 flex items-center justify-center gap-1 transition"
                          >
                            <Phone size={10} /> Call Rider
                          </a>
                          
                          {/* Re-assign trigger */}
                          {selectedOrder.deliveryStatus === "Assigned" && (
                            <button
                              onClick={() => setShowAssignModal(true)}
                              className="flex-1 py-1.5 bg-[#6d28d9] hover:bg-[#5b21b6] rounded-lg text-center font-bold text-[10px] text-white flex items-center justify-center gap-1 transition cursor-pointer"
                            >
                              <RefreshCw size={10} /> Change
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex flex-col justify-center items-center text-center space-y-3 min-h-[90px]">
                        <p className="text-slate-400 text-xs font-semibold">No Rider Assigned Yet</p>
                        
                        {/* Constraints Check: Enable assign button only if orderStatus !== 'Pending' */}
                        {selectedOrder.orderStatus === "Pending" ? (
                          <div className="flex flex-col gap-2.5 w-full items-center">
                            <div className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl flex items-center gap-1">
                              <Lock size={12} /> Accept order before dispatch assignment
                            </div>
                            <button
                              onClick={handleAcceptOrder}
                              disabled={accepting}
                              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-350 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition flex items-center justify-center gap-1.5"
                            >
                              {accepting ? "Accepting..." : "Accept Order"}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowAssignModal(true)}
                            className="px-4 py-2 bg-[#6d28d9] hover:bg-[#5b21b6] text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition flex items-center gap-1"
                          >
                            Assign Delivery Boy <ArrowRight size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Logs / Timeline */}
                {selectedOrder.deliveryBoyId && (
                  <div className="space-y-4 pb-4 border-b border-slate-50">
                    <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Live Delivery Timeline</h3>
                    
                    <div className="relative pl-6 space-y-6">
                      {/* Timeline line connector */}
                      <div className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 bg-slate-100"></div>

                      {steps.map((step, idx) => {
                        const isDone = steps.findIndex(s => s.key === selectedOrder.deliveryStatus) >= idx;
                        const isCurrent = selectedOrder.deliveryStatus === step.key;
                        const time = getTimelineLogTime(step.key);

                        return (
                          <div key={idx} className="relative flex items-start gap-4">
                            {/* Bullet indicator */}
                            <div className={`absolute -left-6 w-5 h-5 rounded-full border-4 flex items-center justify-center transition-all ${
                              isCurrent 
                                ? "bg-white border-[#6d28d9]" 
                                : isDone 
                                  ? "bg-[#6d28d9] border-[#6d28d9]" 
                                  : "bg-white border-slate-200"
                            }`}>
                              {isDone && !isCurrent && <Check size={8} className="text-white" />}
                            </div>

                            <div className="flex-1 text-xs">
                              <p className={`font-black uppercase tracking-wider ${isCurrent ? "text-[#6d28d9]" : isDone ? "text-slate-800" : "text-slate-400"}`}>
                                {step.label}
                              </p>
                              {time && (
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Timestamp: {time}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Block Reassignment Warn */}
                    {selectedOrder.deliveryStatus !== "None" && selectedOrder.deliveryStatus !== "Assigned" && (
                      <div className="bg-slate-50 border border-slate-250 p-3 rounded-2xl text-[10px] text-slate-500 font-bold flex items-center gap-2">
                        <Info size={14} className="text-slate-400 flex-shrink-0" />
                        <span>Rider is currently delivering. Re-assignment is locked to prevent routes confusion.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Items summary */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ShoppingCart size={16} className="text-[#6d28d9]" />
                    <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Parcels checklist</h3>
                  </div>
                  <div className="divide-y divide-slate-50 text-xs pl-1">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex justify-between font-semibold">
                        <span className="text-slate-700">{item.name} <span className="text-slate-400 font-bold">x{item.qty}</span></span>
                        <span className="text-slate-800 font-bold">₹{(item.price * item.qty).toFixed(2)}</span>
                      </div>
                    ))}

                    <div className="pt-2 mt-2 border-t border-dashed border-slate-200 text-[11px] font-bold text-slate-500 space-y-1.5">
                      <div className="flex justify-between">
                        <span>Items Subtotal:</span>
                        <span>₹{selectedOrder.totalAmount?.toFixed(2) || selectedOrder.items?.reduce((sum, item) => sum + item.price * item.qty, 0).toFixed(2)}</span>
                      </div>
                      {selectedOrder.couponDiscount > 0 && (
                        <div className="flex justify-between text-emerald-600">
                          <span>Coupon Discount:</span>
                          <span>-₹{selectedOrder.couponDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedOrder.deliveryCharge > 0 && (
                        <div className="flex justify-between">
                          <span>Delivery Fee:</span>
                          <span>₹{selectedOrder.deliveryCharge.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedOrder.taxAmount > 0 && (
                        <div className="flex justify-between">
                          <span>Taxes & GST:</span>
                          <span>₹{selectedOrder.taxAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {/* Calculate any residual fees (Handling fee, small cart fee) */}
                      {selectedOrder.grandTotal - (selectedOrder.totalAmount - (selectedOrder.couponDiscount || 0) + (selectedOrder.deliveryCharge || 0) + (selectedOrder.taxAmount || 0)) > 0 && (
                        <div className="flex justify-between">
                          <span>Platform Fees:</span>
                          <span>₹{(selectedOrder.grandTotal - (selectedOrder.totalAmount - (selectedOrder.couponDiscount || 0) + (selectedOrder.deliveryCharge || 0) + (selectedOrder.taxAmount || 0))).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs font-black text-slate-850 pt-1 border-t border-slate-100">
                        <span>Order Total:</span>
                        <span className="text-[#6d28d9]">₹{selectedOrder.grandTotal.toFixed(2)}</span>
                      </div>
                      {(() => {
                        const hasCommission = selectedOrder.vendorCommission && selectedOrder.vendorCommission.amount !== undefined;
                        const commRate = hasCommission ? selectedOrder.vendorCommission.rate : 8;
                        const commType = hasCommission ? selectedOrder.vendorCommission.commissionType : "percentage";
                        
                        const itemSubtotal = selectedOrder.totalAmount || selectedOrder.items?.reduce((sum, item) => sum + item.price * item.qty, 0) || 0;
                        const commAmount = hasCommission 
                          ? selectedOrder.vendorCommission.amount 
                          : (commType === "percentage" ? itemSubtotal * (commRate / 100) : commRate);
                        const finalComm = Math.round(commAmount * 100) / 100;
                        const payout = Math.max(0, itemSubtotal - finalComm);

                        return (
                          <>
                            <div className="flex justify-between text-red-500 font-bold border-t border-slate-100 pt-1.5 mt-1.5">
                              <span>Platform Commission ({commRate}{commType === "percentage" ? "%" : " flat"}):</span>
                              <span>-₹{finalComm.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-black text-emerald-700 pt-1">
                              <span>Your Payout:</span>
                              <span>₹{payout.toFixed(2)}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      )}

      {/* Assignment Modal dialog */}
      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setShowAssignModal(false)} 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
          />

          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 relative z-10 border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="mb-4">
              <h3 className="font-extrabold text-slate-800 text-lg">Dispatch Rider</h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                {selectedOrder.deliveryBoyId ? "Select a new rider to reassign Order #" : "Select a rider for Order #"}
                {selectedOrder.orderId}
              </p>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 py-2">
              {riders.length === 0 ? (
                <p className="text-center py-6 text-xs font-semibold text-slate-400">No active delivery boys registered.</p>
              ) : (
                riders.map((rider) => {
                  const isCurrentRider = selectedOrder.deliveryBoyId?._id === rider._id;
                  
                  // Mock a simple distance/area indicator based on coordinates
                  const diffLat = Math.abs((rider.latitude || 28.6139) - (selectedOrder.vendorId?.latitude || 28.6139));
                  const diffLng = Math.abs((rider.longitude || 77.2090) - (selectedOrder.vendorId?.longitude || 77.2090));
                  const distance = ((diffLat + diffLng) * 111).toFixed(1); // crude approximation of km

                  return (
                    <div 
                      key={rider._id}
                      onClick={() => !isCurrentRider && handleAssignRider(rider._id)}
                      className={`p-3.5 border rounded-2xl flex items-center justify-between gap-3 transition select-none ${
                        isCurrentRider 
                          ? "bg-slate-50 border-slate-200 cursor-not-allowed opacity-65" 
                          : "border-slate-200 hover:border-purple-200 hover:bg-purple-50 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-50 rounded-xl text-slate-500">
                          <User size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-black text-xs text-slate-800">{rider.fullName}</p>
                            <span className="text-[8px] font-bold text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                              {rider.vehicleDetails?.type || "Rider"}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                            Active Load: <span className={rider.activeLoad > 0 ? "text-amber-600 font-black" : "text-emerald-700 font-black"}>
                              {rider.activeLoad} active
                            </span>
                            {distance && ` • ${distance} km away`}
                          </p>
                        </div>
                      </div>
                      <div className="text-slate-400 pr-1">
                        {isCurrentRider ? (
                          <span className="text-[8px] font-black uppercase text-purple-750 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                            Current
                          </span>
                        ) : (
                          <ArrowRight size={14} />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end">
              <button 
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 border rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
