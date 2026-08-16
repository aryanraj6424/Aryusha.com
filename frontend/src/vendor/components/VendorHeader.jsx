import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, User, ChevronDown, LogOut, Shield, Menu, CheckCheck, ShoppingBag, AlertTriangle, CheckCircle, Package } from "lucide-react";
import { useVendor } from "../context/VendorContext";
import {
  fetchVendorNotifications,
  fetchUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from "../services/vendorNotificationApi";
import { getSocket, joinRoom, leaveRoom } from "../../services/socket";
import { useToast } from "../../components/Toast";

import { searchVendorEntities } from "../services/vendorSearchApi";
import { Loader2, X } from "lucide-react";

export default function VendorHeader({ onMenuClick }) {
  const navigate = useNavigate();
  const { vendor, logout } = useVendor();
  const { showToast } = useToast();
  const [showSearch, setShowSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const socketRef = useRef(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ products: [], orders: [] });
  const [searching, setSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const abortControllerRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/vendor/login");
  };

  // Helper: Format relative timestamp
  const getRelativeTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 30) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return "Yesterday";
    return date.toLocaleDateString();
  };

  // Fetch notifications
  const loadNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const data = await fetchVendorNotifications(1, 15);
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const data = await fetchUnreadNotificationCount();
      if (data.success) {
        setUnreadCount(data.count || 0);
      }
    } catch (err) {
      console.error("Failed to load unread count:", err);
    }
  };

  useEffect(() => {
    if (vendor?._id) {
      loadUnreadCount();

      // Join vendor socket room for real-time notification pushes
      const socket = getSocket();
      socketRef.current = socket;
      const roomName = `vendor:${vendor._id}`;
      joinRoom(roomName);

      const handleLiveNotification = (newNotif) => {
        setNotifications((prev) => {
          if (prev.some((n) => n._id === newNotif._id)) return prev;
          return [newNotif, ...prev];
        });
        setUnreadCount((prev) => prev + 1);
        if (showToast) {
          showToast({
            type: "info",
            message: `Notification: ${newNotif.title}`
          });
        }
      };

      socket.on("vendor:notification", handleLiveNotification);

      // Polling fallback every 45s
      const pollTimer = setInterval(loadUnreadCount, 45000);

      return () => {
        socket.off("vendor:notification", handleLiveNotification);
        leaveRoom(roomName);
        clearInterval(pollTimer);
      };
    }
  }, [vendor?._id, showToast]);

  const handleToggleNotifDropdown = () => {
    const nextState = !showNotifDropdown;
    setShowNotifDropdown(nextState);
    if (nextState) {
      loadNotifications();
    }
  };

  const handleNotificationClick = async (notif, e) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      const isCurrentlyRead = Boolean(notif.read || notif.isRead);
      if (!isCurrentlyRead) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        try {
          const res = await markNotificationAsRead(notif._id);
          if (res && res.success && res.unreadCount !== undefined) {
            setUnreadCount(res.unreadCount);
          }
        } catch (err) {
          console.error("Error marking vendor notification read:", err);
        }
      }

      setShowNotifDropdown(false);

      const orderId = typeof notif.relatedOrderId === "object"
        ? notif.relatedOrderId?._id || notif.relatedOrderId?.id
        : notif.relatedOrderId;

      const productId = typeof notif.relatedProductId === "object"
        ? notif.relatedProductId?._id || notif.relatedProductId?.id
        : notif.relatedProductId;

      if (orderId || ["NEW_ORDER", "ORDER_DELIVERED", "ORDER_REJECTED"].includes(notif.type)) {
        if (orderId) {
          sessionStorage.setItem("vendor_selected_order_id", orderId);
          window.dispatchEvent(new CustomEvent("vendor-order-selected", { detail: { orderId } }));
          navigate("/vendor/orders", { state: { selectedOrderId: orderId } });
        } else {
          navigate("/vendor/orders");
        }
      } else if (productId || notif.type === "LOW_STOCK") {
        if (productId) {
          sessionStorage.setItem("vendor_selected_product_id", productId);
          window.dispatchEvent(new CustomEvent("vendor-product-selected", { detail: { productId } }));
          navigate("/vendor/products", { state: { selectedProductId: productId } });
        } else {
          navigate("/vendor/products");
        }
      }
    } catch (err) {
      console.error("Error handling vendor notification click:", err);
    }
  };

  const handleMarkAllRead = async (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })));
      setUnreadCount(0);

      const res = await markAllNotificationsAsRead();
      if (res && res.success && res.unreadCount !== undefined) {
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error("Error marking all vendor notifications read:", err);
    }
  };

  // Debounced Search Effect
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults({ products: [], orders: [] });
      setSearching(false);
      setShowSearchDropdown(false);
      return;
    }

    setSearching(true);
    setShowSearchDropdown(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const data = await searchVendorEntities(query, controller.signal);
        if (data.success) {
          setSearchResults({
            products: data.products || [],
            orders: data.orders || []
          });
        }
      } catch (err) {
        if (err.name !== "CanceledError" && err.name !== "AbortError") {
          console.error("Search error:", err);
        }
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleSelectSearchResult = (type, item) => {
    setShowSearchDropdown(false);
    setShowSearch(false);
    setSearchQuery("");

    if (type === "order") {
      sessionStorage.setItem("vendor_selected_order_id", item._id);
      window.dispatchEvent(new CustomEvent("vendor-order-selected", { detail: { orderId: item._id } }));
      navigate("/vendor/orders", { state: { selectedOrderId: item._id } });
    } else if (type === "product") {
      const pName = item.name || "";
      sessionStorage.setItem("vendor_selected_product_id", item._id);
      sessionStorage.setItem("vendor_selected_product_name", pName);
      window.dispatchEvent(new CustomEvent("vendor-product-selected", { detail: { productId: item._id, productName: pName } }));
      navigate("/vendor/products", { state: { selectedProductId: item._id, productName: pName } });
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case "NEW_ORDER":
        return <ShoppingBag size={16} className="text-purple-600" />;
      case "LOW_STOCK":
        return <AlertTriangle size={16} className="text-amber-500" />;
      case "ORDER_DELIVERED":
        return <CheckCircle size={16} className="text-emerald-600" />;
      default:
        return <Package size={16} className="text-blue-500" />;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left - Menu Button (mobile only) and Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer text-gray-600"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg lg:text-xl font-bold text-gray-800 tracking-wide">
          Vendor Panel
        </h1>
      </div>

      {/* Right - Search, Notifications, Profile */}
      <div className="flex items-center gap-2 lg:gap-4 relative">
        {/* Search Bar - Mobile Toggle */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Search size={20} className="text-gray-600" />
        </button>

        {/* Search Bar - Desktop */}
        <div className="hidden lg:block relative">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim().length >= 2 && setShowSearchDropdown(true)}
              placeholder="Search products, orders..."
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64 text-sm font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setShowSearchDropdown(false); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Search Dropdown Panel (Desktop) */}
          {showSearchDropdown && (
            <>
              <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowSearchDropdown(false)} />
              <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-150 z-50 overflow-hidden transform origin-top-left transition-all">
                {searching ? (
                  <div className="p-6 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin text-purple-600" /> Searching store catalog & orders...
                  </div>
                ) : searchResults.products.length === 0 && searchResults.orders.length === 0 ? (
                  <div className="p-6 text-center text-xs font-bold text-slate-500">
                    No products or orders found for <span className="text-purple-700 font-extrabold">"{searchQuery}"</span>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                    {/* Products Section */}
                    {searchResults.products.length > 0 && (
                      <div className="p-2 space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 py-1 block">
                          Products ({searchResults.products.length})
                        </span>
                        {searchResults.products.map((prod) => (
                          <div
                            key={prod._id}
                            onClick={() => handleSelectSearchResult("product", prod)}
                            className="p-2.5 hover:bg-purple-50/50 rounded-xl transition cursor-pointer flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {prod.images?.[0] ? (
                                  <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package size={14} className="text-slate-400" />
                                )}
                              </div>
                              <div className="truncate">
                                <p className="font-extrabold text-slate-800 truncate">{prod.name}</p>
                                <span className="text-[10px] text-slate-400 font-bold block">{prod.brand || "Catalog Product"}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 flex-shrink-0">
                              Stock: {prod.stock || 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Orders Section */}
                    {searchResults.orders.length > 0 && (
                      <div className="p-2 space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 py-1 block">
                          Orders ({searchResults.orders.length})
                        </span>
                        {searchResults.orders.map((ord) => (
                          <div
                            key={ord._id}
                            onClick={() => handleSelectSearchResult("order", ord)}
                            className="p-2.5 hover:bg-purple-50/50 rounded-xl transition cursor-pointer flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="truncate space-y-0.5">
                              <p className="font-black text-purple-700 flex items-center gap-1">
                                Order #{ord.orderId}
                              </p>
                              <p className="text-[10px] text-slate-500 font-bold truncate">
                                {ord.deliveryAddress?.fullName || "Customer"}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="font-black text-slate-800 block text-xs">₹{ord.grandTotal?.toFixed(2)}</span>
                              <span className="text-[9px] font-bold text-emerald-700 uppercase block">{ord.orderStatus}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile Search Input & Dropdown */}
        {showSearch && (
          <div className="lg:hidden fixed top-16 left-3 right-3 sm:left-auto sm:right-4 sm:w-96 z-50">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim().length >= 2 && setShowSearchDropdown(true)}
                placeholder="Search products, orders..."
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-lg text-sm font-medium"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); setShowSearchDropdown(false); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Mobile Search Dropdown Panel */}
            {showSearchDropdown && (
              <>
                <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowSearchDropdown(false)} />
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-150 z-50 overflow-hidden transform origin-top transition-all">
                  {searching ? (
                    <div className="p-6 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin text-purple-600" /> Searching store catalog & orders...
                    </div>
                  ) : searchResults.products.length === 0 && searchResults.orders.length === 0 ? (
                    <div className="p-6 text-center text-xs font-bold text-slate-500">
                      No products or orders found for <span className="text-purple-700 font-extrabold">"{searchQuery}"</span>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {/* Products Section */}
                      {searchResults.products.length > 0 && (
                        <div className="p-2 space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 py-1 block">
                            Products ({searchResults.products.length})
                          </span>
                          {searchResults.products.map((prod) => (
                            <div
                              key={prod._id}
                              onClick={() => handleSelectSearchResult("product", prod)}
                              className="p-2.5 hover:bg-purple-50/50 active:bg-purple-100/50 rounded-xl transition cursor-pointer flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {prod.images?.[0] ? (
                                    <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package size={14} className="text-slate-400" />
                                  )}
                                </div>
                                <div className="truncate">
                                  <p className="font-extrabold text-slate-800 truncate">{prod.name}</p>
                                  <span className="text-[10px] text-slate-400 font-bold block">{prod.brand || "Catalog Product"}</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 flex-shrink-0">
                                Stock: {prod.stock || 0}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Orders Section */}
                      {searchResults.orders.length > 0 && (
                        <div className="p-2 space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 py-1 block">
                            Orders ({searchResults.orders.length})
                          </span>
                          {searchResults.orders.map((ord) => (
                            <div
                              key={ord._id}
                              onClick={() => handleSelectSearchResult("order", ord)}
                              className="p-2.5 hover:bg-purple-50/50 active:bg-purple-100/50 rounded-xl transition cursor-pointer flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="truncate space-y-0.5">
                                <p className="font-black text-purple-700 flex items-center gap-1">
                                  Order #{ord.orderId}
                                </p>
                                <p className="text-[10px] text-slate-500 font-bold truncate">
                                  {ord.deliveryAddress?.fullName || "Customer"}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="font-black text-slate-800 block text-xs">₹{ord.grandTotal?.toFixed(2)}</span>
                                <span className="text-[9px] font-bold text-emerald-700 uppercase block">{ord.orderStatus}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Notifications Bell Button */}
        <div className="relative">
          <button
            onClick={handleToggleNotifDropdown}
            className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer text-gray-600"
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-purple-600 text-white font-black text-[10px] rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Menu */}
          {showNotifDropdown && (
            <>
              {/* Overlay to close menu on click outside */}
              <div
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setShowNotifDropdown(false)}
              />

              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-150 z-50 overflow-hidden transform origin-top-right transition-all">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-purple-50/40">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-800 text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-200">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={(e) => handleMarkAllRead(e)}
                      className="text-xs font-bold text-purple-700 hover:text-purple-900 transition flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck size={14} /> Mark all read
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {loadingNotifs ? (
                    <div className="p-6 text-center text-xs font-semibold text-slate-400">
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <Bell size={24} className="mx-auto text-slate-300" />
                      <p className="text-xs font-bold text-slate-600">No Notifications Yet</p>
                      <p className="text-[10px] text-slate-400">Updates regarding orders, low stock, and payouts will appear here.</p>
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item._id}
                        onClick={(e) => handleNotificationClick(item, e)}
                        className={`p-3.5 flex items-start gap-3 hover:bg-purple-50/50 transition cursor-pointer ${
                          !item.read ? "bg-purple-50/20 font-bold" : "bg-white text-slate-600"
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0 mt-0.5">
                          {getNotifIcon(item.type)}
                        </div>

                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className={`text-xs ${!item.read ? "font-black text-slate-850" : "font-semibold text-slate-700"}`}>
                              {item.title}
                            </h4>
                            <span className="text-[9px] font-semibold text-slate-400 whitespace-nowrap">
                              {getRelativeTime(item.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug font-medium line-clamp-2">
                            {item.message}
                          </p>
                        </div>

                        {!item.read && (
                          <span className="w-2 h-2 bg-purple-600 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile Dropdown Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            {vendor?.storeDetails?.storeLogo ? (
              <img
                src={vendor.storeDetails.storeLogo}
                alt="Store Logo"
                className="w-8 h-8 rounded-full object-cover border border-purple-100"
              />
            ) : vendor?.ownerDetails?.profilePhoto ? (
              <img
                src={vendor.ownerDetails.profilePhoto}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border border-purple-100"
              />
            ) : (
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
            )}
            <ChevronDown size={16} className="text-gray-600 hidden sm:block" />
          </button>

          {/* Profile Dropdown Menu */}
          {showDropdown && (
            <>
              {/* Overlay to close menu on click outside */}
              <div
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setShowDropdown(false)}
              />
              
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden transform origin-top-right transition-all">
                {/* User Info Header */}
                <div className="p-4 border-b border-gray-50 bg-purple-50/30">
                  <p className="font-extrabold text-gray-800 truncate text-sm">
                    {vendor?.shopName || "Vendor Partner"}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5 font-medium">
                    {vendor?.businessEmail || vendor?.ownerDetails?.email || ""}
                  </p>
                  {vendor?.accountStatus === "active" && (
                    <span className="inline-flex items-center gap-0.5 mt-2 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-100">
                      <Shield size={10} /> Verified Partner
                    </span>
                  )}
                </div>

                {/* Menu Items */}
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate("/vendor/profile");
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition font-semibold flex items-center gap-2"
                  >
                    <User size={16} />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition font-semibold flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

