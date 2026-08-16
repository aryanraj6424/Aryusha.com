import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  User,
  ChevronDown,
  Menu,
  CheckCheck,
  ShoppingBag,
  Store,
  CreditCard,
  Package,
  Loader2,
  X
} from "lucide-react";
import {
  fetchAdminNotifications,
  fetchAdminUnreadCount,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead
} from "../services/adminNotificationApi";
import { searchAdminEntities } from "../services/adminSearchApi";
import { getSocket, joinRoom, leaveRoom } from "../../services/socket";
import { useToast } from "../../components/Toast";

export default function AdminHeader({ onMenuClick }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const socketRef = useRef(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ vendors: [], products: [], orders: [] });
  const [searching, setSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const abortControllerRef = useRef(null);

  // Format relative time
  const getRelativeTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSecs = Math.floor((now - date) / 1000);
    if (diffInSecs < 60) return "Just now";
    if (diffInSecs < 3600) return `${Math.floor(diffInSecs / 60)}m ago`;
    if (diffInSecs < 86400) return `${Math.floor(diffInSecs / 3600)}h ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  // Socket setup & notification unread count fetch
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const res = await fetchAdminUnreadCount();
        if (res.success) {
          setUnreadCount(res.count);
        }
      } catch (err) {
        // Silent error handling for initial load
      }
    };

    loadUnreadCount();

    // Socket.io Real-time Setup
    const socket = getSocket();
    socketRef.current = socket;

    joinRoom("admin:global");

    const handleNewAdminNotif = (notif) => {
      setNotifications((prev) => {
        if (prev.some((n) => n._id === notif._id)) return prev;
        return [notif, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
      if (showToast) {
        showToast({
          type: "info",
          message: `Notification: ${notif.title}`
        });
      }
    };

    socket.on("admin:notification", handleNewAdminNotif);

    return () => {
      if (socketRef.current) {
        socketRef.current.off("admin:notification", handleNewAdminNotif);
      }
      leaveRoom("admin:global");
    };
  }, [showToast]);

  // Debounced Search Effect
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults({ vendors: [], products: [], orders: [] });
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
        const data = await searchAdminEntities(query, controller.signal);
        if (data.success) {
          setSearchResults({
            vendors: data.vendors || [],
            products: data.products || [],
            orders: data.orders || []
          });
        }
      } catch (err) {
        if (err.name !== "CanceledError" && err.name !== "AbortError") {
          // Silent error handling
        }
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleToggleNotifDropdown = async () => {
    const nextState = !showNotifDropdown;
    setShowNotifDropdown(nextState);
    if (nextState) {
      try {
        setLoadingNotifs(true);
        const res = await fetchAdminNotifications(1, 15);
        if (res.success) {
          setNotifications(res.notifications);
          setUnreadCount(res.unreadCount);
        }
      } catch (err) {
        // Silent catch
      } finally {
        setLoadingNotifs(false);
      }
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      const isCurrentlyRead = Boolean(notif.read || notif.isRead);
      if (!isCurrentlyRead) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        try {
          const res = await markAdminNotificationAsRead(notif._id);
          if (res && res.success && res.unreadCount !== undefined) {
            setUnreadCount(res.unreadCount);
          }
        } catch (err) {
          console.error("Error marking admin notification read:", err);
        }
      }

      setShowNotifDropdown(false);

      const orderId = typeof notif.relatedOrderId === "object"
        ? notif.relatedOrderId?._id || notif.relatedOrderId?.id
        : notif.relatedOrderId;

      const vendorId = typeof notif.relatedVendorId === "object"
        ? notif.relatedVendorId?._id || notif.relatedVendorId?.id
        : notif.relatedVendorId;

      if (orderId || notif.type === "NEW_ORDER_PLACED") {
        if (orderId) {
          sessionStorage.setItem("admin_selected_order_id", orderId);
          window.dispatchEvent(new CustomEvent("admin-order-selected", { detail: { orderId } }));
          navigate(`/admin/orders/${orderId}`);
        } else {
          navigate("/admin/orders");
        }
      } else if (notif.type === "NEW_VENDOR_ONBOARDING" || vendorId) {
        if (vendorId) {
          navigate(`/admin/vendors/${vendorId}`);
        } else {
          navigate("/admin/vendors");
        }
      } else if (notif.type === "PAYOUT_REQUESTED") {
        navigate("/admin/finance");
      }
    } catch (err) {
      console.error("Error in admin notification click:", err);
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

      const res = await markAllAdminNotificationsAsRead();
      if (res && res.success && res.unreadCount !== undefined) {
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      console.error("Error marking all admin notifications read:", err);
    }
  };

  const handleSelectSearchResult = (type, item) => {
    setShowSearchDropdown(false);
    setShowSearch(false);
    setSearchQuery("");

    if (type === "vendor") {
      navigate("/admin/vendors");
    } else if (type === "product") {
      navigate("/admin/products");
    } else if (type === "order") {
      sessionStorage.setItem("admin_selected_order_id", item._id);
      window.dispatchEvent(new CustomEvent("admin-order-selected", { detail: { orderId: item._id } }));
      navigate("/admin/orders", { state: { selectedOrderId: item._id } });
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case "NEW_VENDOR_ONBOARDING":
        return <Store size={16} className="text-emerald-600" />;
      case "NEW_ORDER_PLACED":
        return <ShoppingBag size={16} className="text-blue-600" />;
      case "PAYOUT_REQUESTED":
        return <CreditCard size={16} className="text-amber-500" />;
      default:
        return <Package size={16} className="text-purple-600" />;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left - Menu Button (mobile only) and Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer text-gray-700"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg lg:text-xl font-bold text-gray-800 tracking-wide">
          Admin Panel
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
              placeholder="Search vendors, products, orders..."
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-72 text-sm font-medium"
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
                    <Loader2 size={16} className="animate-spin text-green-600" /> Searching platform entities...
                  </div>
                ) : searchResults.vendors.length === 0 && searchResults.products.length === 0 && searchResults.orders.length === 0 ? (
                  <div className="p-6 text-center text-xs font-bold text-slate-500">
                    No vendors, products, or orders found matching <span className="text-green-700 font-extrabold">"{searchQuery}"</span>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                    {/* Vendors Section */}
                    {searchResults.vendors.length > 0 && (
                      <div className="p-2 space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 py-1 block">
                          Vendors ({searchResults.vendors.length})
                        </span>
                        {searchResults.vendors.map((v) => (
                          <div
                            key={v._id}
                            onClick={() => handleSelectSearchResult("vendor", v)}
                            className="p-2.5 hover:bg-green-50/50 rounded-xl transition cursor-pointer flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold">
                                <Store size={15} />
                              </div>
                              <div className="truncate">
                                <p className="font-extrabold text-slate-800 truncate">{v.shopName || v.storeDetails?.storeName || "Vendor"}</p>
                                <span className="text-[10px] text-slate-400 font-bold block">{v.phone || v.ownerDetails?.fullName || v.businessEmail}</span>
                              </div>
                            </div>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0 ${v.accountStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {v.accountStatus || 'Pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

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
                            className="p-2.5 hover:bg-green-50/50 rounded-xl transition cursor-pointer flex items-center justify-between gap-3 text-xs"
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
                                <span className="text-[10px] text-slate-400 font-bold block">{prod.brand || prod.category || "Catalog"}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-extrabold text-emerald-700 flex-shrink-0">
                              ₹{prod.price?.toFixed(2)}
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
                            className="p-2.5 hover:bg-green-50/50 rounded-xl transition cursor-pointer flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="truncate space-y-0.5">
                              <p className="font-black text-green-700 flex items-center gap-1">
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
                placeholder="Search vendors, products, orders..."
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white shadow-lg text-sm font-medium"
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
                      <Loader2 size={16} className="animate-spin text-green-600" /> Searching platform entities...
                    </div>
                  ) : searchResults.vendors.length === 0 && searchResults.products.length === 0 && searchResults.orders.length === 0 ? (
                    <div className="p-6 text-center text-xs font-bold text-slate-500">
                      No vendors, products, or orders found matching <span className="text-green-700 font-extrabold">"{searchQuery}"</span>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {/* Vendors Section */}
                      {searchResults.vendors.length > 0 && (
                        <div className="p-2 space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 py-1 block">
                            Vendors ({searchResults.vendors.length})
                          </span>
                          {searchResults.vendors.map((v) => (
                            <div
                              key={v._id}
                              onClick={() => handleSelectSearchResult("vendor", v)}
                              className="p-2.5 hover:bg-green-50/50 active:bg-green-100/50 rounded-xl transition cursor-pointer flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold">
                                  <Store size={15} />
                                </div>
                                <div className="truncate">
                                  <p className="font-extrabold text-slate-800 truncate">{v.shopName || v.storeDetails?.storeName || "Vendor"}</p>
                                  <span className="text-[10px] text-slate-400 font-bold block">{v.phone || v.ownerDetails?.fullName || v.businessEmail}</span>
                                </div>
                              </div>
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex-shrink-0 ${v.accountStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                {v.accountStatus || 'Pending'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

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
                              className="p-2.5 hover:bg-green-50/50 active:bg-green-100/50 rounded-xl transition cursor-pointer flex items-center justify-between gap-3 text-xs"
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
                                  <span className="text-[10px] text-slate-400 font-bold block">{prod.brand || prod.category || "Catalog"}</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-extrabold text-emerald-700 flex-shrink-0">
                                ₹{prod.price?.toFixed(2)}
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
                              className="p-2.5 hover:bg-green-50/50 active:bg-green-100/50 rounded-xl transition cursor-pointer flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="truncate space-y-0.5">
                                <p className="font-black text-green-700 flex items-center gap-1">
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
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-600 text-white font-black text-[10px] rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Menu */}
          {showNotifDropdown && (
            <>
              <div
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setShowNotifDropdown(false)}
              />

              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-150 z-50 overflow-hidden transform origin-top-right transition-all">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/40">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-800 text-sm">Admin Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-emerald-200/60 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={(e) => handleMarkAllRead(e)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition"
                    >
                      <CheckCheck size={14} /> Mark all read
                    </button>
                  )}
                </div>

                {/* Notifications List Body */}
                <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                  {loadingNotifs ? (
                    <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
                      <Loader2 size={16} className="animate-spin text-emerald-600" /> Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <Bell size={24} className="mx-auto mb-2 opacity-30 text-slate-500" />
                      <p className="text-xs font-bold text-slate-500">No admin notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3.5 transition cursor-pointer hover:bg-slate-50 flex items-start gap-3 relative ${
                          !notif.read ? "bg-emerald-50/20" : ""
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-slate-100 text-slate-600 flex-shrink-0 mt-0.5">
                          {getNotifIcon(notif.type)}
                        </div>

                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h4 className="text-xs font-extrabold text-slate-800 truncate">
                              {notif.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-medium flex-shrink-0">
                              {getRelativeTime(notif.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                            {notif.message}
                          </p>
                        </div>

                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600 flex-shrink-0 self-center" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile Dropdown */}
        <button className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <ChevronDown size={16} className="text-gray-600 hidden sm:block" />
        </button>
      </div>
    </header>
  );
}
