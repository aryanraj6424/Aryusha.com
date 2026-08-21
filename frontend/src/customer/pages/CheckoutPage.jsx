import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getUserAddresses } from "../../services/addressApi";
import { ArrowLeft, MapPin, Truck, Check, Loader2, Calendar, Clock, CreditCard, Sparkles, Plus, Minus, ShoppingBag, Trash2, X, Tag, ChevronRight } from "lucide-react";
import { useToast } from "../../components/Toast";
import { getSocket, joinRoom, leaveRoom } from "../../services/socket";
import SEO from "../../components/SEO";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [cart, setCart] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  
  // Slot selection state
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [activeDateTab, setActiveDateTab] = useState("Today");
  const [selectedSlot, setSelectedSlot] = useState(null); // { date: "Today"/"Tomorrow", slotId, name, time }
  const [isSlotConfirmed, setIsSlotConfirmed] = useState(false);

  // Expanded items state
  const [viewItems, setViewItems] = useState(false);

  // Payment selection state
  const [paymentMethod, setPaymentMethod] = useState("COD");
  
  // Checkout process states
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [checkoutSummary, setCheckoutSummary] = useState(null);
  const [mockPaymentLoading, setMockPaymentLoading] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponErrorState, setCouponErrorState] = useState("");
  const [eligibleCoupons, setEligibleCoupons] = useState([]);
  const [loadingEligibleCoupons, setLoadingEligibleCoupons] = useState(false);
  const [eligibleCouponsError, setEligibleCouponsError] = useState(false);
  const [showAllCouponsModal, setShowAllCouponsModal] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!user) {
      showToast({ type: "warning", message: "Please login first." });
      navigate("/login");
      return;
    }
    loadCart();
    loadAddresses();
    fetchSlots();
  }, []);

  const isSlotAvailableToday = (cutoffTimeStr) => {
    if (!cutoffTimeStr) return true;
    try {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      let [hours, minutes] = cutoffTimeStr.split(":").map(Number);
      if (isNaN(hours)) hours = 18;
      if (isNaN(minutes)) minutes = 0;

      const cutoffMinutes = hours * 60 + minutes;
      return currentMinutes < cutoffMinutes;
    } catch {
      return true;
    }
  };

  useEffect(() => {
    if (slots.length > 0) {
      const anyAvailableToday = slots.some(s => isSlotAvailableToday(s.cutoffTime));
      if (!anyAvailableToday) {
        setActiveDateTab("Tomorrow");
      }
    }
  }, [slots]);

  const lastJoinedZoneRef = useRef(null);

  // Re-fetch bill summary and delivery slots when active address/zone changes
  useEffect(() => {
    if (selectedAddress) {
      if (cart.length > 0) {
        const appliedCode = checkoutSummary?.appliedCoupon?.code || localStorage.getItem("appliedCouponCode");
        fetchSummary(cart, appliedCode);
      }
      fetchSlots(selectedAddress.city);
    }
  }, [selectedAddress?._id, selectedAddress?.city]);

  // Socket connection & real-time fee & slot update listeners
  useEffect(() => {
    const socket = getSocket();
    joinRoom("fees:global");
    joinRoom("slots:global");

    const handleFeesUpdated = () => {
      if (cart.length > 0) {
        const appliedCode = checkoutSummary?.appliedCoupon?.code || localStorage.getItem("appliedCouponCode");
        fetchSummary(cart, appliedCode);
      }
    };

    const handleSlotsUpdated = () => {
      fetchSlots(selectedAddress?.city || "");
    };

    socket.on("fees:updated", handleFeesUpdated);
    socket.on("slots:updated", handleSlotsUpdated);

    return () => {
      socket.off("fees:updated", handleFeesUpdated);
      socket.off("slots:updated", handleSlotsUpdated);
      leaveRoom("fees:global");
      leaveRoom("slots:global");
    };
  }, [cart, checkoutSummary?.appliedCoupon?.code, selectedAddress?.city]);

  useEffect(() => {
    if (!selectedAddress) return;
    const zoneName = selectedAddress.city;

    if (lastJoinedZoneRef.current && lastJoinedZoneRef.current !== zoneName) {
      leaveRoom(`zone:${lastJoinedZoneRef.current}`);
    }

    joinRoom(`zone:${zoneName}`);
    lastJoinedZoneRef.current = zoneName;

    return () => {
      if (lastJoinedZoneRef.current) {
        leaveRoom(`zone:${lastJoinedZoneRef.current}`);
      }
    };
  }, [selectedAddress?.city]);

  const loadCart = () => {
    try {
      const stored = localStorage.getItem("cart");
      const parsed = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        showToast({ type: "warning", message: "Your cart is empty." });
        navigate("/customer/dashboard");
        return;
      }
      setCart(parsed);
      fetchEligibleCoupons(parsed);

      const storedSummary = localStorage.getItem("checkoutSummary");
      if (storedSummary) {
        setCheckoutSummary(JSON.parse(storedSummary));
      } else {
        fetchSummary(parsed);
      }
    } catch {
      navigate("/customer/dashboard");
    }
  };

  const fetchEligibleCoupons = async (currentCart = cart) => {
    const targetCart = currentCart && currentCart.length > 0 ? currentCart : cart;
    if (!targetCart || targetCart.length === 0) {
      setEligibleCoupons([]);
      return;
    }
    try {
      setLoadingEligibleCoupons(true);
      setEligibleCouponsError(false);
      const token = localStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const payload = {
        items: targetCart.map(item => ({
          productId: item.productId,
          qty: item.qty,
          price: item.price,
          vendorId: item.vendorId
        })),
        vendorId: targetCart[0]?.vendorId
      };

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/customer/cart/eligible-coupons`,
        payload,
        { headers }
      );

      if (res.data.success) {
        setEligibleCoupons(res.data.coupons || []);
      }
    } catch (error) {
      console.error("Error fetching eligible coupons:", error);
      setEligibleCouponsError(true);
    } finally {
      setLoadingEligibleCoupons(false);
    }
  };

  const loadAddresses = async () => {
    try {
      setPageLoading(true);
      const res = await getUserAddresses(user._id);
      const list = res.addresses || [];
      setAddresses(list);

      // Default to stored selected address, or first address
      const stored = localStorage.getItem("selectedAddress");
      if (stored && stored !== "null") {
        const parsed = JSON.parse(stored);
        const found = list.find((a) => a._id === parsed._id);
        if (found) {
          setSelectedAddress(found);
        } else if (list.length > 0) {
          setSelectedAddress(list[0]);
        }
      } else if (list.length > 0) {
        setSelectedAddress(list[0]);
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
    } finally {
      setPageLoading(false);
    }
  };

  const fetchSlots = async (cityParam = "") => {
    try {
      setLoadingSlots(true);
      const token = localStorage.getItem("userToken");
      const headers = { Authorization: `Bearer ${token}` };
      const targetCity = cityParam || selectedAddress?.city || "";
      const vendorId = cart[0]?.vendorId || "";
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/customer/cart/slots?city=${encodeURIComponent(targetCity)}&vendorId=${encodeURIComponent(vendorId)}`,
        { headers }
      );
      if (res.data.success) {
        setSlots(res.data.slots || []);
      }
    } catch (error) {
      console.error("Error loading slots:", error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchSummary = async (currentCart, appliedCouponCode = null) => {
    if (currentCart.length === 0) {
      setCheckoutSummary(null);
      return;
    }
    try {
      const token = localStorage.getItem("userToken");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      };

      const payload = {
        items: currentCart.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          qty: item.qty,
          price: item.price,
          mrp: item.mrp,
          name: item.name,
          brand: item.brand,
          img: item.img,
          packSize: item.packSize,
          vendorId: item.vendorId
        })),
        couponCode: appliedCouponCode || localStorage.getItem("appliedCouponCode"),
        vendorId: currentCart[0]?.vendorId,
        zoneId: selectedAddress?.city || "",
      };

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/customer/cart/summary`,
        payload,
        { headers }
      );

      if (res.data.success) {
        setCheckoutSummary(res.data.summary);
      }
    } catch (error) {
      console.error("Error fetching checkout summary:", error);
    }
  };

  const handleApplyCoupon = async (codeToApply = null) => {
    const code = (typeof codeToApply === "string" ? codeToApply : couponInput).toUpperCase().trim();
    if (!code) return;
    setCouponInput(code);
    setCouponErrorState("");
    try {
      const token = localStorage.getItem("userToken");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      };

      const payload = {
        items: cart.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          qty: item.qty,
          price: item.price,
          mrp: item.mrp,
          name: item.name,
          brand: item.brand,
          img: item.img,
          packSize: item.packSize,
          vendorId: item.vendorId
        })),
        couponCode: code,
        vendorId: cart[0]?.vendorId,
        zoneId: selectedAddress?.city || "",
      };

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/customer/cart/summary`,
        payload,
        { headers }
      );

      if (res.data.success) {
        if (res.data.summary.couponError) {
          setCouponErrorState(res.data.summary.couponError);
          showToast({ type: "error", message: res.data.summary.couponError });
        } else if (res.data.summary.appliedCoupon) {
          setCheckoutSummary(res.data.summary);
          localStorage.setItem("appliedCouponCode", code);
          showToast({ type: "success", message: `Coupon "${code}" applied successfully!` });
          setShowAllCouponsModal(false);
        } else {
          setCouponErrorState("Coupon could not be applied.");
        }
      }
    } catch (err) {
      console.error(err);
      setCouponErrorState("Error applying coupon.");
    }
  };

  const handleRemoveCoupon = () => {
    localStorage.removeItem("appliedCouponCode");
    setCouponInput("");
    setCouponErrorState("");
    fetchSummary(cart, null);
    showToast({ type: "info", message: "Coupon removed." });
  };

  const selectAddress = (addr) => {
    setSelectedAddress(addr);
    localStorage.setItem("selectedAddress", JSON.stringify(addr));
  };

  // Quantity updates
  const updateQty = (index, delta) => {
    const updated = [...cart];
    const newQty = updated[index].qty + delta;
    if (newQty <= 0) {
      removeListItem(index);
      return;
    }
    updated[index].qty = newQty;
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cart-updated"));
    fetchSummary(updated, checkoutSummary?.appliedCoupon?.code);
  };

  const removeListItem = (index) => {
    const updated = cart.filter((_, idx) => idx !== index);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cart-updated"));
    if (updated.length === 0) {
      setCheckoutSummary(null);
      localStorage.removeItem("appliedCouponCode");
      showToast({ type: "warning", message: "Your cart is empty." });
      navigate("/customer/dashboard");
    } else {
      fetchSummary(updated, checkoutSummary?.appliedCoupon?.code);
    }
  };

  const handleAddCrossSell = (prod) => {
    const updated = [...cart];
    const existingIndex = updated.findIndex((item) => item.variantId === prod.variantId);
    if (existingIndex > -1) {
      updated[existingIndex].qty += 1;
    } else {
      updated.push({
        variantId: prod.variantId,
        productId: prod.productId,
        name: prod.name,
        brand: prod.brand,
        price: prod.price,
        mrp: prod.mrp,
        qty: 1,
        img: prod.img,
        vendorId: prod.vendorId || cart[0]?.vendorId,
        packSize: prod.packSize
      });
    }
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cart-updated"));
    fetchSummary(updated, checkoutSummary?.appliedCoupon?.code);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot({
      date: activeDateTab,
      slotId: slot._id,
      name: slot.name,
      time: `${slot.startTime} - ${slot.endTime}`
    });
    setIsSlotConfirmed(false); // Must re-confirm when changing selection
  };

  const handleConfirmSlot = () => {
    if (!selectedSlot) return;
    setIsSlotConfirmed(true);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      showToast({ type: "warning", message: "Please select a delivery address." });
      return;
    }
    if (!isSlotConfirmed || !selectedSlot) {
      showToast({ type: "warning", message: "Please select and confirm a delivery slot." });
      return;
    }
    if (!paymentMethod) {
      showToast({ type: "warning", message: "Please choose a payment method." });
      return;
    }
    if (cart.length === 0) return;

    // Simulated Online Payment Flow
    if (paymentMethod === "Online") {
      setMockPaymentLoading(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setMockPaymentLoading(false);
    }

    try {
      setLoading(true);

      // Capture customer's real GPS coordinates at order time (one-shot, high accuracy)
      const getLiveLocation = () => {
        return new Promise((resolve) => {
          if (!navigator.geolocation) {
            resolve({ customerLiveLocation: null, locationUnavailable: true });
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                customerLiveLocation: {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                  capturedAt: new Date(position.timestamp || Date.now())
                },
                locationUnavailable: false
              });
            },
            (error) => {
              console.warn("One-shot GPS capture failed or denied:", error);
              resolve({ customerLiveLocation: null, locationUnavailable: true });
            },
            { enableHighAccuracy: true, timeout: 6000 }
          );
        });
      };

      const locResult = await getLiveLocation();
      const token = localStorage.getItem("userToken");
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const orderData = {
        customerId: user._id,
        vendorId: cart[0].vendorId,
        items: cart.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          price: item.price,
          qty: item.qty,
          vendorId: item.vendorId,
        })),
        deliveryAddress: {
          fullName: selectedAddress.fullName,
          phoneNumber: selectedAddress.phoneNumber,
          houseNo: selectedAddress.houseNo,
          area: selectedAddress.area,
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode,
          latitude: selectedAddress.latitude,
          longitude: selectedAddress.longitude,
        },
        totalAmount: subtotal,
        deliveryCharge: deliveryCharge,
        taxAmount: tax,
        grandTotal: grandTotal,
        couponCode: couponCode,
        couponDiscount: couponDiscount,
        paymentMethod: paymentMethod,
        deliverySlot: {
          date: selectedSlot.date,
          time: selectedSlot.time
        },
        customerLiveLocation: locResult.customerLiveLocation,
        locationUnavailable: locResult.locationUnavailable,
      };

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/customer/orders`,
        orderData,
        { headers }
      );

      if (res.data.success) {
        showToast({ type: "success", message: res.data.message || "Order placed successfully!" });
        localStorage.removeItem("cart");
        localStorage.removeItem("checkoutSummary");
        localStorage.removeItem("appliedCouponCode");
        localStorage.removeItem("selectedAddress");
        window.dispatchEvent(new Event("cart-updated"));
        navigate("/customer/orders");
      }
    } catch (error) {
      console.error("Order placement error:", error);
      showToast({ type: "error", message: error.response?.data?.message || "Failed to place order. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // Calculation parameters from checkoutSummary state
  const hasSummary = !!checkoutSummary;
  const subtotal = hasSummary ? checkoutSummary.itemTotal : cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const couponDiscount = hasSummary ? checkoutSummary.couponDiscount : 0;
  const couponCode = hasSummary ? checkoutSummary.appliedCoupon?.code : null;
  const handlingFee = hasSummary ? checkoutSummary.handlingFee : 10;
  const smallCartFee = hasSummary ? checkoutSummary.smallCartFee : 0;
  const deliveryCharge = hasSummary ? checkoutSummary.deliveryPartnerFee : 0;
  const tax = hasSummary ? checkoutSummary.gst : Math.round(subtotal * 0.05);
  const rainFee = hasSummary ? (checkoutSummary.rainFee || 0) : 0;
  const customFees = hasSummary ? (checkoutSummary.customFees || 0) : 0;
  const grandTotal = hasSummary ? checkoutSummary.toPay : (subtotal + tax + deliveryCharge + handlingFee + smallCartFee + rainFee + customFees - couponDiscount);

  // Eligibility checking for Place Order button
  const isPlaceOrderEnabled = selectedAddress && isSlotConfirmed && paymentMethod && !loading;

  if (pageLoading && !checkoutSummary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-3 animate-pulse"></div>
        <p className="text-slate-500 font-bold text-sm">Loading checkout details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-8 px-3.5 sm:px-6 space-y-5 sm:space-y-6 pb-36 sm:pb-16 select-none font-semibold text-slate-700">
      <SEO title="Checkout | Aryusha" noindex={true} />
      
      {/* Mock Payment Processing Modal */}
      {mockPaymentLoading && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 text-center space-y-4 shadow-2xl animate-scale-in">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-purple-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-850 text-base">Securing Online Checkout</h3>
              <p className="text-xs text-slate-500 font-medium">Validating parameters and processing transaction...</p>
            </div>
          </div>
        </div>
      )}

      {/* Back to Cart */}
      <button
        onClick={() => navigate("/customer/cart")}
        className="flex items-center gap-2 text-slate-550 hover:text-slate-800 font-extrabold text-xs transition cursor-pointer"
      >
        <ArrowLeft size={16} /> Back to Cart
      </button>

      <h1 className="text-3xl font-black text-slate-800 tracking-tight">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Left Columns */}
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">
          
          {/* Order Summary & Collapsible list */}
          <div className="bg-white border border-slate-200/80 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xs space-y-4 font-semibold">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-purple-50 text-purple-755 rounded-xl flex items-center justify-center">
                  <ShoppingBag size={16} />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-800 text-sm">Order Summary</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{cart.reduce((sum, i) => sum + i.qty, 0)} Items</p>
                </div>
              </div>
              <button
                onClick={() => setViewItems(!viewItems)}
                className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-2 min-h-[38px] rounded-xl transition cursor-pointer flex items-center justify-center"
              >
                {viewItems ? "Hide Items" : "View Items"}
              </button>
            </div>

            {viewItems && (
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                {cart.map((item, idx) => {
                  const showStrikethrough = item.mrp && item.mrp > item.price;
                  return (
                    <div key={idx} className="flex gap-4 items-center justify-between py-3">
                      <div className="flex gap-3 items-center min-w-0">
                        <div className="w-12 h-12 bg-slate-50 border rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                          <img src={item.img} alt={item.name} className="max-h-full max-w-full object-contain p-1" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-850 truncate max-w-xs">{item.name}</h4>
                          <span className="text-[10px] text-slate-400 font-bold block">
                            ₹{item.price} • {item.packSize}
                          </span>
                        </div>
                      </div>

                      {/* Adjusters */}
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center border rounded-lg bg-white shadow-inner">
                          <button
                            onClick={() => updateQty(idx, -1)}
                            className="px-2 py-1 hover:bg-slate-50 text-slate-600 font-black cursor-pointer"
                          >
                            <Minus size={10} />
                          </button>
                          <span className="px-2 text-xs font-black text-slate-800">{item.qty}</span>
                          <button
                            onClick={() => updateQty(idx, 1)}
                            className="px-2 py-1 hover:bg-slate-50 text-slate-600 font-black cursor-pointer"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeListItem(idx)}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Delivery Slot Selection tabs */}
          <div className="bg-white border border-slate-200/80 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xs space-y-4 font-semibold">
            <h2 className="font-extrabold text-slate-855 text-sm flex items-center gap-2">
              <Calendar size={16} className="text-purple-650" /> Select Delivery Slot
            </h2>

            {/* Date Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
              {["Today", "Tomorrow"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveDateTab(tab);
                    setSelectedSlot(null);
                    setIsSlotConfirmed(false);
                  }}
                  className={`flex-1 py-2.5 min-h-[44px] text-xs font-extrabold rounded-xl transition flex items-center justify-center ${
                    activeDateTab === tab
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Slots options grid */}
            {loadingSlots ? (
              <div className="py-6 text-center text-slate-400 text-xs font-semibold animate-pulse">
                Loading delivery slots...
              </div>
            ) : slots.length === 0 ? (
              <div className="py-6 text-center bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-1">
                <p className="text-xs font-bold text-slate-700">No delivery slots available for {selectedAddress?.city || "your area"} yet</p>
                <p className="text-[10px] text-slate-400 font-medium">Please select a different delivery address or check back later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {slots.map((s) => {
                  const isToday = activeDateTab === "Today";
                  const isAvailable = isToday ? (s.isActive !== false && isSlotAvailableToday(s.cutoffTime)) : (s.isActive !== false);
                  const isSelected = selectedSlot?.slotId === s._id && selectedSlot?.date === activeDateTab;

                  return (
                    <div
                      key={s._id}
                      onClick={() => isAvailable && handleSlotSelect(s)}
                      className={`border rounded-2xl p-3.5 sm:p-4 min-h-[64px] flex flex-col justify-between transition ${
                        !isAvailable
                          ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                          : isSelected
                            ? "border-purple-600 bg-purple-50/10 shadow-xs cursor-pointer"
                            : "border-slate-200/80 hover:border-purple-300 cursor-pointer"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-extrabold text-slate-800 text-xs">{s.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-1">
                            <Clock size={12} /> {s.startTime} - {s.endTime}
                          </p>
                        </div>
                        {isSelected && (
                          <span className="bg-purple-600 text-white rounded-full p-0.5">
                            <Check size={12} />
                          </span>
                        )}
                      </div>

                      {!isAvailable && (
                        <p className="text-[9px] text-rose-600 font-black uppercase mt-3 bg-rose-50 self-start px-2 py-0.5 rounded border border-rose-100">
                          {s.isActive === false ? "Disabled" : "Not available today"}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Explicit Confirm Slot */}
            {selectedSlot && (
              <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                <div className="text-xs">
                  <span className="text-slate-400 font-bold block uppercase text-[9px]">Chose Slot</span>
                  <span className="text-slate-800 font-extrabold">
                    {selectedSlot.date}, {selectedSlot.time}
                  </span>
                </div>
                
                {isSlotConfirmed ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-100/50 px-3.5 py-2 min-h-[40px] rounded-xl font-black">
                    <Check size={14} /> Confirmed
                  </span>
                ) : (
                  <button
                    onClick={handleConfirmSlot}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-5 py-2.5 min-h-[44px] rounded-xl shadow-xs cursor-pointer transition flex items-center justify-center"
                  >
                    Confirm Slot
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Delivery Address selection list */}
          <div className="bg-white border border-slate-200/80 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xs space-y-4 font-semibold">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <MapPin size={16} className="text-purple-605" /> Delivery Address
              </h2>
              <button
                onClick={() => navigate("/customer/addresses")}
                className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-2 min-h-[38px] rounded-xl transition cursor-pointer flex items-center justify-center"
              >
                Manage Addresses
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="py-6 text-center space-y-3">
                <p className="text-slate-500 text-xs font-semibold">No delivery addresses found.</p>
                <button
                  onClick={() => navigate("/customer/addresses")}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Add New Address
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {addresses.map((addr) => (
                  <div
                    key={addr._id}
                    onClick={() => selectAddress(addr)}
                    className={`border rounded-2xl p-3.5 sm:p-4 min-h-[60px] cursor-pointer relative transition ${
                      selectedAddress?._id === addr._id
                        ? "border-purple-500 bg-purple-50/10 shadow-xs"
                        : "border-slate-200/80 hover:border-purple-300"
                    }`}
                  >
                    {selectedAddress?._id === addr._id && (
                      <span className="absolute top-4 right-4 bg-purple-600 text-white rounded-full p-0.5">
                        <Check size={12} />
                      </span>
                    )}
                    <span className="inline-block text-[9px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-extrabold uppercase mb-2">
                      {addr.addressType || "Home"}
                    </span>
                    <h4 className="text-xs font-extrabold text-slate-850">{addr.fullName}</h4>
                    <p className="text-[11px] text-slate-500 font-semibold mt-1">
                      {addr.houseNo}, {addr.area}, {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                    <p className="text-[11px] text-slate-550 font-semibold mt-0.5">Phone: {addr.phoneNumber}</p>
                  </div>
                ))}
              </div>
            )}
          </div>



          {/* Cross Sell Suggestions slider widget */}
          {checkoutSummary?.suggestions && checkoutSummary.suggestions.length > 0 && (
            <div className="space-y-3.5">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-yellow-600" />
                <h2 className="text-base uppercase tracking-wider text-slate-400 font-bold">Frequently Bought Together</h2>
              </div>
              
              <div className="flex overflow-x-auto gap-4 py-2 scrollbar-thin scrollbar-thumb-purple-200">
                {checkoutSummary.suggestions.map((prod) => {
                  const showCSStrikethrough = prod.mrp && prod.mrp > prod.price;
                  return (
                    <div
                      key={prod.variantId}
                      className="bg-white border border-slate-150 rounded-2xl p-3 flex flex-col justify-between w-40 flex-shrink-0 shadow-sm hover:shadow-md transition"
                    >
                      <div className="w-full aspect-square bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center overflow-hidden relative">
                        <img src={prod.img} alt={prod.name} className="max-h-full max-w-full object-contain p-1" />
                      </div>
                      
                      <div className="mt-2.5 flex-1 flex flex-col justify-between space-y-2 text-xs">
                        <div className="min-h-[48px]">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">
                            {prod.brand}
                          </span>
                          <h4 className="font-bold text-slate-800 line-clamp-2 leading-tight mt-0.5" title={prod.name}>
                            {prod.name}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                            {prod.packSize}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-slate-900">₹{prod.price}</span>
                            {showCSStrikethrough && (
                              <span className="text-[9px] text-slate-400 line-through">₹{prod.mrp}</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleAddCrossSell(prod)}
                            className="bg-purple-50 text-purple-750 hover:bg-purple-600 hover:text-white rounded-lg p-1.5 transition cursor-pointer shadow-sm"
                            title="Quick Add"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Right Columns: Bill Details card */}
        <div className="space-y-5 sm:space-y-6 lg:sticky lg:top-24">
          
          {/* Coupon Promo Card */}
          <div className="bg-white border border-slate-200/80 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xs space-y-3 font-semibold">
            <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
              <Sparkles size={16} className="text-purple-650" /> Apply Coupon
            </h4>
            
            {checkoutSummary?.appliedCoupon ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-xs">
                <div>
                  <p className="font-black text-emerald-850">
                    "{checkoutSummary.appliedCoupon.code}" APPLIED!
                  </p>
                  <p className="text-emerald-700 font-semibold mt-0.5">
                    Saved ₹{checkoutSummary.appliedCoupon.discountAmount.toFixed(2)} on this order
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-xs font-extrabold text-rose-650 hover:text-rose-800 transition cursor-pointer min-h-[36px] px-2 flex items-center"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter Promo Code"
                    className="flex-1 border border-slate-200 px-3.5 py-2.5 min-h-[44px] rounded-xl outline-none focus:border-purple-600 text-xs font-mono uppercase font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon()}
                    className="bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-extrabold px-4 min-h-[44px] rounded-xl transition cursor-pointer flex items-center justify-center shrink-0"
                  >
                    Apply
                  </button>
                </div>
                {couponErrorState && (
                  <p className="text-[10px] text-red-650 font-bold bg-red-50/50 p-2 rounded-lg">
                    ⚠️ {couponErrorState}
                  </p>
                )}

                {/* Available Eligible Coupons — Top 1-2 Inline + View All Button */}
                <div className="space-y-2 pt-2 border-t border-slate-100 mt-2">
                  <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase block">
                    Available Coupons
                  </span>
                  {loadingEligibleCoupons ? (
                    <div className="text-[11px] text-slate-400 font-medium py-1 animate-pulse flex items-center gap-1.5">
                      <Loader2 size={12} className="animate-spin text-purple-600" /> Checking available coupons...
                    </div>
                  ) : eligibleCouponsError ? (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 py-1 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
                      <span>Could not load available coupons</span>
                      <button
                        type="button"
                        onClick={() => fetchEligibleCoupons(cart)}
                        className="text-purple-700 font-bold underline hover:text-purple-900 cursor-pointer"
                      >
                        Retry
                      </button>
                    </div>
                  ) : eligibleCoupons.length === 0 ? (
                    <p className="text-[11px] text-slate-400 font-medium py-1 italic bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-150">
                      No coupons available for this order
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {/* Top 1-2 Coupons Inline */}
                      {eligibleCoupons.slice(0, 2).map((c) => {
                        const discText = (c.discount_type === "percentage" || c.discountType === "percentage")
                          ? `${c.discount_value || c.discountValue}% off${(c.max_discount_cap || c.maxDiscountCap) ? `, up to ₹${c.max_discount_cap || c.maxDiscountCap}` : ''}`
                          : `₹${c.discount_value || c.discountValue} off`;
                        const minOrder = c.min_order_value !== undefined ? c.min_order_value : (c.minCartValue || 0);

                        return (
                          <div
                            key={c._id || c.code}
                            onClick={() => handleApplyCoupon(c.code)}
                            className="p-2.5 rounded-xl border border-purple-150 bg-purple-50/40 hover:bg-purple-100/60 hover:border-purple-300 transition cursor-pointer flex items-center justify-between group shadow-2xs"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-xs text-purple-900 font-mono tracking-wide bg-white px-2 py-0.5 rounded border border-purple-200 shadow-2xs">
                                  {c.code}
                                </span>
                                <span className="text-[11px] font-bold text-slate-700">
                                  — {discText}
                                </span>
                              </div>
                              {minOrder > 0 && (
                                <p className="text-[10px] text-slate-500 font-medium">
                                  Min order: ₹{minOrder}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              className="text-[11px] font-extrabold text-purple-700 group-hover:bg-purple-600 group-hover:text-white bg-white px-2.5 py-1 rounded-lg border border-purple-200 transition cursor-pointer shrink-0 ml-2 shadow-2xs"
                            >
                              Apply
                            </button>
                          </div>
                        );
                      })}

                      {/* View All Coupons Link Button */}
                      {eligibleCoupons.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowAllCouponsModal(true)}
                          className="w-full py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center justify-between border border-purple-100 mt-2 min-h-[40px]"
                        >
                          <span className="flex items-center gap-1.5">
                            <Tag size={13} /> View All Coupons ({eligibleCoupons.length})
                          </span>
                          <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200/80 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xs space-y-6 font-semibold">
            <h3 className="font-extrabold text-slate-800 text-lg border-b pb-2">Bill Summary</h3>

            <div className="space-y-3.5 text-sm font-semibold text-slate-600">
              {/* Item Total */}
              <div className="flex justify-between">
                <span>Item Total:</span>
                <span className="text-slate-850 font-bold">₹{subtotal.toFixed(2)}</span>
              </div>

              {/* Coupon Discount */}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount ({couponCode}):</span>
                  <span>-₹{couponDiscount.toFixed(2)}</span>
                </div>
              )}

              {/* Dynamic Fee Breakdown */}
              {checkoutSummary?.feeBreakdown ? (
                checkoutSummary.feeBreakdown.map((fee) => {
                  if (fee.amount === 0 && fee.feeType !== "delivery_partner") return null;

                  const isDelivery = fee.feeType === "delivery_partner";
                  const isFreeDelivery = isDelivery && fee.amount === 0;

                  return (
                    <div key={fee.feeType} className={`flex justify-between ${fee.feeType === "small_cart" ? "text-amber-800 font-bold" : ""}`}>
                      <span>{fee.label}:</span>
                      <span className={isFreeDelivery ? "text-emerald-600 font-black bg-emerald-50/50 px-2 py-0.5 rounded text-xs uppercase" : "text-slate-800"}>
                        {isFreeDelivery ? "FREE" : `₹${fee.amount.toFixed(2)}`}
                      </span>
                    </div>
                  );
                })
              ) : (
                <>
                  {/* Handling Fee */}
                  <div className="flex justify-between">
                    <span>Handling Fee:</span>
                    <span className="text-slate-800">₹{handlingFee.toFixed(2)}</span>
                  </div>

                  {/* Small Cart Fee */}
                  {smallCartFee > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>Small Cart Fee:</span>
                      <span>₹{smallCartFee.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Delivery Fee */}
                  <div className="flex justify-between">
                    <span>Delivery Partner Fee:</span>
                    <span className={deliveryCharge === 0 ? "text-emerald-600 font-black bg-emerald-50/50 px-2 py-0.5 rounded text-xs uppercase" : "text-slate-800"}>
                      {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge.toFixed(2)}`}
                    </span>
                  </div>

                  {/* Tax GST */}
                  <div className="flex justify-between">
                    <span>GST & Taxes (5%):</span>
                    <span className="text-slate-800">₹{tax.toFixed(2)}</span>
                  </div>
                </>
              )}

              {/* Final Grand Total */}
              <div className="border-t pt-3 flex justify-between text-base font-black text-slate-850">
                <span>Total Amount:</span>
                <span className="text-purple-700 text-lg">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Placement guidelines checklist in card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <p className="text-[9px] font-black uppercase text-slate-450 tracking-wider">Placement checklist</p>
              <ul className="space-y-1 text-[11px] font-bold text-slate-500">
                <li className="flex items-center gap-1.5">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] text-white ${selectedAddress ? "bg-emerald-600" : "bg-slate-300"}`}>
                    ✓
                  </span>
                  <span>Delivery Address</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] text-white ${isSlotConfirmed ? "bg-emerald-600" : "bg-slate-300"}`}>
                    ✓
                  </span>
                  <span>Confirmed Delivery Slot</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] text-white ${paymentMethod ? "bg-emerald-600" : "bg-slate-300"}`}>
                    ✓
                  </span>
                  <span>Payment Method Chosen</span>
                </li>
              </ul>
            </div>

            {/* Direct place order button (also visible in sticky footer) */}
            <button
              onClick={handlePlaceOrder}
              disabled={!isPlaceOrderEnabled}
              className={`w-full py-4 min-h-[48px] rounded-2xl font-black text-sm transition flex items-center justify-center gap-2 shadow ${
                isPlaceOrderEnabled
                  ? "bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Placing Order...
                </>
              ) : (
                <>
                  <Truck size={16} /> Place Order
                </>
              )}
            </button>
            {!isPlaceOrderEnabled && (
              <p className="text-[10px] text-amber-700 font-bold text-center mt-2.5">
                {!selectedAddress 
                  ? "⚠️ Select a delivery address to proceed" 
                  : !isSlotConfirmed 
                    ? "⚠️ Select and click 'Confirm Slot' to proceed" 
                    : !paymentMethod 
                      ? "⚠️ Choose a payment method to proceed" 
                      : ""}
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Sticky Bottom Confirmation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 py-3.5 px-4 sm:px-6 shadow-[0_-8px_20px_rgba(0,0,0,0.08)] z-40 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Total To Pay</span>
            <span className="text-lg font-black text-purple-750">₹{grandTotal.toFixed(2)}</span>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={!isPlaceOrderEnabled}
            className={`px-8 py-3.5 min-h-[48px] rounded-xl font-black text-xs transition flex items-center justify-center gap-2 ${
              isPlaceOrderEnabled
                ? "bg-purple-600 hover:bg-purple-700 text-white cursor-pointer shadow-md"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : "Place Order"}
          </button>
        </div>
      </div>
      {!isPlaceOrderEnabled && (
        <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-35 flex justify-center pointer-events-none px-4">
          <div className="bg-amber-50 border border-amber-250 text-amber-900 px-4 py-2 rounded-full text-[10px] font-extrabold shadow-md text-center max-w-xs">
            {!selectedAddress 
              ? "⚠️ Select a delivery address to place order" 
              : !isSlotConfirmed 
                ? "⚠️ Select and click 'Confirm Slot' to place order" 
                : !paymentMethod 
                  ? "⚠️ Select a payment method to place order" 
                  : ""}
          </div>
        </div>
      )}

      {/* All Coupons Bottom Sheet / Modal */}
      {showAllCouponsModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm p-0 sm:p-4 transition-all duration-300">
          <div 
            className="fixed inset-0"
            onClick={() => setShowAllCouponsModal(false)}
          />
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh] z-10 relative animate-slide-up">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-150 flex items-center justify-between bg-purple-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-850 text-sm">Available Coupons</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Eligible discounts for your current cart</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAllCouponsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body - List of Coupons */}
            <div className="p-4 sm:p-5 space-y-3 overflow-y-auto max-h-[60vh]">
              {eligibleCoupons.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <p className="text-xs font-bold text-slate-600">No coupons available for this order</p>
                  <p className="text-[11px] text-slate-400">Add more items or check back later for special offers.</p>
                </div>
              ) : (
                eligibleCoupons.map((c) => {
                  const discText = (c.discount_type === "percentage" || c.discountType === "percentage")
                    ? `${c.discount_value || c.discountValue}% off${(c.max_discount_cap || c.maxDiscountCap) ? `, up to ₹${c.max_discount_cap || c.maxDiscountCap}` : ''}`
                    : `₹${c.discount_value || c.discountValue} off`;
                  const minOrder = c.min_order_value !== undefined ? c.min_order_value : (c.minCartValue || 0);

                  return (
                    <div
                      key={c._id || c.code}
                      className="p-3.5 rounded-2xl border border-purple-200 bg-purple-50/40 hover:bg-purple-50 flex items-center justify-between gap-3 transition shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-purple-900 bg-white px-2.5 py-1 rounded-lg border border-purple-200 shadow-2xs tracking-wide">
                            {c.code}
                          </span>
                          <span className="text-xs font-extrabold text-slate-800">
                            {discText}
                          </span>
                        </div>
                        {minOrder > 0 && (
                          <p className="text-[11px] text-slate-500 font-medium">
                            Minimum cart value: ₹{minOrder}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon(c.code)}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-4 py-2 min-h-[36px] rounded-xl shadow-xs transition cursor-pointer shrink-0"
                      >
                        Apply
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-150 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAllCouponsModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl transition cursor-pointer min-h-[40px]"
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
