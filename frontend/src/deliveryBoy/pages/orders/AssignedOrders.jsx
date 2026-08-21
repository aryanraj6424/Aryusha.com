import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle2, ChevronRight, MapPin, Inbox, Navigation, X, Route, Zap, ShieldCheck, Map as MapIcon, List } from "lucide-react";
import axios from "axios";
import { useToast } from "../../../components/Toast";
import { getSocket, joinRoom, leaveRoom } from "../../../services/socket";
import { loadGoogleMaps } from "../../../utils/googleMapsLoader";

export default function AssignedOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'pending', 'progress', 'completed'
  const [loading, setLoading] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState("list"); // 'list' or 'map'
  const { showToast } = useToast();

  const mapRef = useRef(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("deliveryBoyToken");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/delivery-boy/orders?tab=${activeTab}`, { headers });
      if (res.data.success) {
        setOrders(res.data.orders || []);
      }
    } catch (error) {
      console.error("Failed to load assigned orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersSilent = async () => {
    try {
      const token = localStorage.getItem("deliveryBoyToken");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/delivery-boy/orders?tab=${activeTab}`, { headers });
      if (res.data.success) {
        setOrders(res.data.orders || []);
      }
    } catch (error) {
      console.error("Failed silent reload of orders:", error);
    }
  };

  const handleCalculateRoute = async () => {
    try {
      setRouteLoading(true);
      const token = localStorage.getItem("deliveryBoyToken");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/delivery-boy/optimize-route`, { headers });
      if (res.data.success) {
        setOptimizedRoute(res.data);
        setShowRouteModal(true);
        setActiveModalTab("list");
        if (res.data.totalOrders === 0) {
          showToast({ type: "info", message: "No active assigned orders to optimize right now." });
        } else {
          showToast({ type: "success", message: `Calculated optimal TSP route for ${res.data.totalOrders} active orders!` });
        }
      }
    } catch (err) {
      console.error(err);
      showToast({ type: "error", message: err.response?.data?.message || "Failed to calculate optimal route" });
    } finally {
      setRouteLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const timer = setInterval(() => {
      fetchOrdersSilent();
    }, 4000);

    // Socket real-time integration
    const rider = JSON.parse(localStorage.getItem("deliveryBoy") || "{}");
    const riderId = rider._id || rider.id;
    if (riderId) {
      const socket = getSocket();
      joinRoom(`deliveryBoy:${riderId}`);

      const handleAssigned = (data) => {
        showToast({
          type: "info",
          message: data.message || "A new order has been assigned to you!",
        });
        fetchOrdersSilent();
      };

      const handlePayoutUpdate = () => {
        fetchOrdersSilent();
      };

      socket.on("order:assigned", handleAssigned);
      socket.on("order:updated", handleAssigned);
      socket.on("order:status_changed", handleAssigned);
      socket.on("payout:updated", handlePayoutUpdate);

      return () => {
        clearInterval(timer);
        socket.off("order:assigned", handleAssigned);
        socket.off("order:updated", handleAssigned);
        socket.off("order:status_changed", handleAssigned);
        socket.off("payout:updated", handlePayoutUpdate);
        leaveRoom(`deliveryBoy:${riderId}`);
      };
    }

    return () => clearInterval(timer);
  }, [activeTab]);

  // Google Maps visualization effect for TSP sequence
  useEffect(() => {
    if (!showRouteModal || activeModalTab !== "map" || !mapRef.current || !optimizedRoute) return;

    let isMounted = true;
    loadGoogleMaps().then((google) => {
      if (!isMounted || !mapRef.current) return;

      const startLat = optimizedRoute.startPoint?.lat || 28.6139;
      const startLng = optimizedRoute.startPoint?.lng || 77.2090;

      const map = new google.maps.Map(mapRef.current, {
        center: { lat: startLat, lng: startLng },
        zoom: 13,
        disableDefaultUI: true,
        zoomControl: true,
      });

      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: startLat, lng: startLng });

      // Start Marker (Rider / Store Location)
      const startSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="34" height="34" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">
          <circle cx="17" cy="17" r="15" fill="#0B2214" stroke="#FFFFFF" stroke-width="3"/>
          <text x="17" y="22" font-size="14" font-weight="900" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif">S</text>
        </svg>
      `)}`;

      new google.maps.Marker({
        position: { lat: startLat, lng: startLng },
        map,
        title: "Rider Start Location",
        icon: {
          url: startSvg,
          scaledSize: new google.maps.Size(34, 34),
          anchor: new google.maps.Point(17, 17)
        }
      });

      const pathCoords = [{ lat: startLat, lng: startLng }];

      // Numbered Sequence Markers 1, 2, 3...
      optimizedRoute.optimizedSequence?.forEach((node) => {
        const pos = { lat: Number(node.lat), lng: Number(node.lng) };
        bounds.extend(pos);
        pathCoords.push(pos);

        const markerSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="#047857" stroke="#FFFFFF" stroke-width="2.5"/>
            <text x="16" y="21" font-size="13" font-weight="900" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif">${node.step}</text>
          </svg>
        `)}`;

        const marker = new google.maps.Marker({
          position: pos,
          map,
          title: `Drop #${node.step} (${node.customerName})`,
          icon: {
            url: markerSvg,
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 16)
          }
        });

        const infoContent = `
          <div style="padding:4px; font-family:sans-serif; min-width:180px;">
            <div style="font-size:10px; font-weight:900; color:#047857; text-transform:uppercase;">Priority Drop #${node.step}</div>
            <div style="font-size:12px; font-weight:800; color:#0B2214; margin-top:2px;">#${node.orderId} · ${node.customerName}</div>
            <div style="font-size:10px; color:#475569; margin-top:3px; line-height:1.3;">${node.address}</div>
            <div style="font-size:10px; font-weight:700; color:#047857; margin-top:4px;">+${node.distanceFromPrev} km (~${node.estimatedMinutes} mins)</div>
          </div>
        `;

        const infoWindow = new google.maps.InfoWindow({ content: infoContent });
        marker.addListener("click", () => infoWindow.open(map, marker));
      });

      // Sequence Connect Polyline
      new google.maps.Polyline({
        path: pathCoords,
        geodesic: true,
        strokeColor: "#047857",
        strokeOpacity: 0.85,
        strokeWeight: 4,
        map
      });

      map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
    });

    return () => {
      isMounted = false;
    };
  }, [showRouteModal, activeModalTab, optimizedRoute]);

  const activeOrdersCount = orders.filter(o => o.deliveryStatus !== "Delivered" && o.orderStatus !== "Cancelled" && o.orderStatus !== "Rejected").length;

  const getStatusStyle = (status) => {
    switch (status) {
      case "Assigned":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Picked_Up":
        return "bg-emerald-50 text-[#047857] border-emerald-200";
      case "On_the_Way":
        return "bg-[#0B2214] text-white border-[#0B2214]";
      case "Reached_Customer":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Delivered":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const tabs = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "progress", label: "Active" },
    { id: "completed", label: "Completed" }
  ];

  return (
    <div className="space-y-4">
      {/* Title & Route Calculate Button */}
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-black text-[#0B2214]">My Assignments</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Manage and track your delivery routes</p>
        </div>
        <button
          onClick={handleCalculateRoute}
          disabled={routeLoading}
          className={`px-3.5 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer ${
            activeOrdersCount >= 2 
              ? "bg-gradient-to-r from-[#0B2214] via-[#047857] to-[#065f46] text-white ring-2 ring-emerald-300 animate-pulse" 
              : "bg-gradient-to-r from-[#0B2214] to-[#047857] text-white hover:opacity-95"
          }`}
        >
          <Navigation size={14} className={routeLoading ? "animate-spin" : ""} />
          {routeLoading ? "Calculating..." : activeOrdersCount >= 2 ? `Calculate Route (${activeOrdersCount} Orders)` : "Calculate Route"}
        </button>
      </div>

      {/* 2+ Active Orders TSP Banner Notification */}
      {activeOrdersCount >= 2 && (
        <div className="bg-gradient-to-r from-[#0B2214] to-[#047857] text-white p-3.5 rounded-2xl flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-400/20 rounded-lg text-emerald-200">
              <Zap size={16} />
            </div>
            <div>
              <p className="text-xs font-black">Multi-Order Route Optimization Available!</p>
              <p className="text-[10px] text-emerald-100 font-bold">{activeOrdersCount} active orders assigned. Click to calculate the shortest TSP route sequence.</p>
            </div>
          </div>
          <button
            onClick={handleCalculateRoute}
            disabled={routeLoading}
            className="px-3 py-1.5 bg-white text-[#0B2214] rounded-xl font-black text-xs hover:bg-emerald-50 transition cursor-pointer shrink-0"
          >
            Calculate Now
          </button>
        </div>
      )}

      {/* Tabs list */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-[#0B2214] text-white shadow-sm font-extrabold"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B2214]"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center shadow-sm space-y-3">
          <div className="w-12 h-12 bg-emerald-50 text-[#047857] rounded-full flex items-center justify-center mx-auto">
            <Inbox size={24} />
          </div>
          <div>
            <p className="font-extrabold text-slate-700 text-sm">No assignments found</p>
            <p className="text-xs text-slate-400 font-medium mt-1">There are no orders matching this status.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const shopName = order.vendorId?.shopName || order.primaryVendor?.shopName || "Aryusha Partner Store";
            return (
              <div
                key={order._id}
                onClick={() => navigate(`/delivery-boy/orders/${order._id}`)}
                className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm hover:border-[#047857] transition cursor-pointer flex justify-between items-center gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-[#0B2214]">#{order.orderId}</span>
                    <span
                      className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${getStatusStyle(
                        order.deliveryStatus
                      )}`}
                    >
                      {order.deliveryStatus?.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 font-semibold">
                    <p className="truncate">
                      <span className="font-bold text-slate-400">Vendor:</span> {shopName}
                    </p>
                    <p className="truncate">
                      <span className="font-bold text-slate-400">Customer:</span> {order.deliveryAddress?.fullName}
                    </p>
                    <p className="truncate flex items-center gap-0.5 text-[#047857] font-bold">
                      <MapPin size={10} />
                      <span>Drop: {order.deliveryAddress?.area}, {order.deliveryAddress?.city}</span>
                    </p>
                  </div>
                </div>

                {/* Payout & Action */}
                <div className="flex flex-col items-end gap-1.5 text-right self-stretch justify-between py-0.5">
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Payout</span>
                    <span className="font-black text-[#0B2214] text-sm">₹{order.riderPayout || order.deliveryCharge || 35}</span>
                  </div>
                  <div className="bg-emerald-50 text-[#047857] p-1.5 rounded-lg border border-emerald-100">
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TSP Route Optimization Modal Drawer */}
      {showRouteModal && optimizedRoute && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-center items-end sm:items-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Modal Header */}
            <div className="bg-[#0B2214] text-white p-4 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-300">
                  <Route size={20} />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-wide">Optimized Delivery Route</h3>
                  <p className="text-[10px] text-emerald-200 font-bold">TSP Shortest Path Sequence</p>
                </div>
              </div>
              <button
                onClick={() => setShowRouteModal(false)}
                className="p-1.5 hover:bg-white/10 rounded-full text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Metrics & Tab Switcher Bar */}
            <div className="bg-emerald-50 border-b border-emerald-100 p-3 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 px-1">
                <div className="flex items-center gap-1">
                  <Zap size={14} className="text-[#047857]" />
                  <span>{optimizedRoute.totalOrders} Stops</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={14} className="text-[#047857]" />
                  <span>{optimizedRoute.totalDistanceKm} km total</span>
                </div>
                <div className="flex items-center gap-1 text-[#0B2214] font-black">
                  <Clock size={14} />
                  <span>~{optimizedRoute.totalEstimatedMinutes} mins</span>
                </div>
              </div>

              {/* View Switcher: List vs Map */}
              <div className="flex bg-white p-1 rounded-xl border border-emerald-200">
                <button
                  onClick={() => setActiveModalTab("list")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    activeModalTab === "list" ? "bg-[#0B2214] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <List size={13} /> Sequence List
                </button>
                <button
                  onClick={() => setActiveModalTab("map")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    activeModalTab === "map" ? "bg-[#0B2214] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <MapIcon size={13} /> Map Route View
                </button>
              </div>
            </div>

            {/* Modal Body */}
            {activeModalTab === "list" ? (
              /* Priority Sequence List View */
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Start Location Node */}
                <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="w-7 h-7 bg-[#0B2214] text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">
                    S
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <span className="font-black text-slate-800 uppercase tracking-wider text-[10px]">Start Location</span>
                    <p className="text-slate-600 font-bold mt-0.5">Rider Current Location / Primary Merchant Store</p>
                  </div>
                </div>

                {/* Sequence Nodes */}
                {optimizedRoute.optimizedSequence?.map((node) => (
                  <div
                    key={node.step}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-[#047857] transition space-y-2 relative"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-[#047857] text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">
                          {node.step}
                        </span>
                        <div>
                          <span className="font-mono text-xs font-black text-[#0B2214]">#{node.orderId}</span>
                          <span className="text-[10px] text-slate-400 font-bold block">Priority Drop #{node.step}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-extrabold text-[#047857] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 block">
                          +{node.distanceFromPrev} km (~{node.estimatedMinutes}m)
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                          Cumulative: {node.cumulativeDistance} km
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 font-semibold pt-1 border-t border-slate-100">
                      <p className="font-extrabold text-slate-800 flex items-center justify-between">
                        <span>{node.customerName}</span>
                        {node.customerPhone && <span className="text-[10px] text-slate-400 font-mono">📞 {node.customerPhone}</span>}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                        <span className="font-bold text-slate-700">Drop Address:</span> {node.address}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold pt-0.5">
                        Store: {node.storeName} · Payment: <span className="font-bold text-slate-700">{node.paymentMethod}</span> ({node.paymentStatus})
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setShowRouteModal(false);
                        navigate(`/delivery-boy/orders/${node.orderDbId}`);
                      }}
                      className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-[#0B2214] border border-emerald-200 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1 mt-2"
                    >
                      View Order #{node.orderId} <ChevronRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              /* Map Route View */
              <div className="flex-1 p-3 flex flex-col min-h-[360px]">
                <div ref={mapRef} className="w-full h-80 sm:h-96 rounded-2xl border border-slate-200 shadow-inner overflow-hidden relative">
                  <div className="flex items-center justify-center h-full text-slate-400 text-xs font-bold">
                    Loading Route Map...
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-bold text-center mt-2">
                  Click any marker (S, 1, 2, 3...) on map to inspect drop location details.
                </p>
              </div>
            )}

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <button
                onClick={() => setShowRouteModal(false)}
                className="w-full py-3 bg-[#0B2214] text-white rounded-xl font-extrabold text-xs transition hover:bg-[#062c1a] cursor-pointer"
              >
                Close Route Sequence
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
