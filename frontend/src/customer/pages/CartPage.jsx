import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, ShoppingCart, Plus, Minus, ArrowLeft, Ticket, Percent, Coins, Check, X, ShieldCheck } from "lucide-react";
import axios from "axios";
import { useToast } from "../../components/Toast";

export default function CartPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [cart, setCart] = useState([]);
  
  // Server-side summary state
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  
  const [coupons, setCoupons] = useState([]);
  const [allCoupons, setAllCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [couponError, setCouponError] = useState(null);

  useEffect(() => {
    loadCart();
    // Only fetch coupons for authenticated users
    const token = localStorage.getItem("userToken");
    if (token) fetchAllCoupons();
  }, []);

  const fetchAllCoupons = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/customer/cart/coupons`,
        { headers }
      );
      if (res.data.success) {
        setAllCoupons(res.data.coupons || []);
      }
    } catch (err) {
      console.error("Error fetching all coupons:", err);
    }
  };

  const loadCart = () => {
    try {
      const stored = localStorage.getItem("cart");
      const parsed = stored ? JSON.parse(stored) : [];
      const validCart = Array.isArray(parsed) ? parsed : [];
      setCart(validCart);
      if (validCart.length > 0) {
        // Load initial summary from server, check if there's an already applied coupon in storage
        const savedCoupon = localStorage.getItem("appliedCouponCode");
        fetchSummary(validCart, savedCoupon);
      }
    } catch {
      setCart([]);
    }
  };

  const fetchSummary = async (currentCart, appliedCouponCode = null) => {
    if (currentCart.length === 0) {
      setSummary(null);
      return;
    }
    try {
      setLoadingSummary(true);
      const token = localStorage.getItem("userToken");
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const storedAddr = localStorage.getItem("selectedAddress");
      const parsedAddr = storedAddr ? JSON.parse(storedAddr) : null;
      const zoneId = parsedAddr?.city || "";

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
        couponCode: appliedCouponCode,
        vendorId: currentCart[0]?.vendorId,
        zoneId: zoneId
      };

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/customer/cart/summary`,
        payload,
        { headers }
      );

      if (res.data.success) {
        setSummary(res.data.summary);
        if (res.data.summary.appliedCoupon) {
          localStorage.setItem("appliedCouponCode", res.data.summary.appliedCoupon.code);
        } else {
          localStorage.removeItem("appliedCouponCode");
        }
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    } finally {
      setLoadingSummary(false);
    }
  };

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
    
    // Recalculate summary with same coupon
    fetchSummary(updated, summary?.appliedCoupon?.code);
  };

  const removeListItem = (index) => {
    const updated = cart.filter((_, idx) => idx !== index);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cart-updated"));
    
    if (updated.length === 0) {
      setSummary(null);
      localStorage.removeItem("appliedCouponCode");
    } else {
      fetchSummary(updated, summary?.appliedCoupon?.code);
    }
  };

  // Cross-sell quick add
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
    fetchSummary(updated, summary?.appliedCoupon?.code);
  };

  // Open coupon modal and fetch active coupons
  const handleOpenCouponSelector = async () => {
    setShowCouponModal(true);
    setCouponError(null);
    try {
      setLoadingCoupons(true);
      const token = localStorage.getItem("userToken");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/customer/cart/coupons`,
        { headers }
      );
      if (res.data.success) {
        setCoupons(res.data.coupons || []);
      }
    } catch (error) {
      console.error("Error loading coupons:", error);
    } finally {
      setLoadingCoupons(false);
    }
  };

  // Apply selected coupon
  const handleApplyCoupon = async (code) => {
    setCouponError(null);
    const token = localStorage.getItem("userToken");
    if (!token) {
      showToast({ type: "warning", message: "Please login to apply coupons." });
      navigate("/login");
      return;
    }
    
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      };
      
      const storedAddr = localStorage.getItem("selectedAddress");
      const parsedAddr = storedAddr ? JSON.parse(storedAddr) : null;
      const zoneId = parsedAddr?.city || "";

      const payload = {
        couponCode: code,
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
        vendorId: cart[0]?.vendorId,
        zoneId: zoneId
      };

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/customer/cart/apply-coupon`,
        payload,
        { headers }
      );

      if (res.data.success) {
        if (res.data.summary.couponError) {
          setCouponError(res.data.summary.couponError);
          showToast({ type: "error", message: res.data.summary.couponError });
        } else {
          setSummary(res.data.summary);
          localStorage.setItem("appliedCouponCode", code);
          setShowCouponModal(false);
          setCouponCodeInput("");
          showToast({ type: "success", message: `Coupon "${code}" applied successfully!` });
        }
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || "Failed to apply coupon.";
      setCouponError(errMsg);
      showToast({ type: "error", message: errMsg });
    }
  };

  // Remove coupon
  const handleRemoveCoupon = async () => {
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
        vendorId: cart[0]?.vendorId
      };

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/customer/cart/remove-coupon`,
        payload,
        { headers }
      );

      if (res.data.success) {
        setSummary(res.data.summary);
        localStorage.removeItem("appliedCouponCode");
      }
    } catch (error) {
      console.error("Failed to remove coupon:", error);
    }
  };

  const handleCheckout = () => {
    const user = localStorage.getItem("user");
    if (!user) {
      showToast({ type: "warning", message: "Please login to proceed to checkout." });
      navigate("/login", { state: { redirectTo: "/customer/checkout" } });
      return;
    }

    if (!summary) return;

    // Save calculation summary to localStorage so CheckoutPage can consume it directly
    localStorage.setItem("checkoutSummary", JSON.stringify(summary));
    navigate("/customer/checkout");
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mx-auto text-purple-600 shadow-inner">
          <ShoppingCart size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800">Your Cart is Empty</h2>
          <p className="text-slate-500 text-sm font-semibold">
            Add items to your cart from our fresh catalog to place an order.
          </p>
        </div>
        <button
          onClick={() => navigate("/customer/dashboard")}
          className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold transition shadow-md cursor-pointer"
        >
          Browse Products
        </button>
      </div>
    );
  }

  const itemsList = summary?.items || cart;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 font-semibold text-slate-700">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-850 font-extrabold text-sm transition cursor-pointer"
      >
        <ArrowLeft size={16} /> Continue Shopping
      </button>

      <h1 className="text-3xl font-black text-slate-800 tracking-tight">Review Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Items, Coupon, Suggestions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Featured Coupon Card */}
          {allCoupons.length > 0 && (() => {
            const featured = allCoupons[0];
            const subtotal = summary?.itemTotal || 0;
            const isUnlocked = subtotal >= featured.minCartValue;
            const progressPct = Math.min(100, Math.round((subtotal / featured.minCartValue) * 100));
            const remaining = featured.minCartValue - subtotal;
            const isApplied = summary?.appliedCoupon?.code === featured.code;

            return (
              <div className={`p-5 rounded-3xl border transition shadow-sm ${
                isUnlocked 
                  ? "bg-purple-50/20 border-purple-200" 
                  : "bg-slate-50/50 border-slate-200"
              }`}>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        isUnlocked ? "bg-purple-100 text-purple-750" : "bg-slate-200 text-slate-500"
                      }`}>
                        {featured.code}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">Featured Offer</span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-800">
                      {featured.discountType === "flat" ? `Save ₹${featured.discountValue}` : `Save ${featured.discountValue}%`} with {featured.code}
                    </h3>
                    {!isUnlocked ? (
                      <p className="text-xs text-slate-500 font-semibold">
                        Locked until your cart reaches ₹{featured.minCartValue}
                      </p>
                    ) : (
                      <p className="text-xs text-emerald-600 font-extrabold flex items-center gap-1">
                        <Check size={14} /> Coupon unlocked!
                      </p>
                    )}
                  </div>

                  {isUnlocked ? (
                    isApplied ? (
                      <span className="text-xs text-emerald-700 font-black bg-emerald-100/50 px-2.5 py-1 rounded-xl">Applied</span>
                    ) : (
                      <button
                        onClick={() => handleApplyCoupon(featured.code)}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs px-3.5 py-1.5 rounded-xl transition cursor-pointer"
                      >
                        Apply
                      </button>
                    )
                  ) : (
                    <button
                      onClick={handleOpenCouponSelector}
                      className="bg-slate-200 hover:bg-slate-350 text-slate-700 font-black text-xs px-3.5 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      View All
                    </button>
                  )}
                </div>

                {!isUnlocked && (
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-550">
                      <span>Add ₹{remaining.toFixed(2)} more to unlock</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
          
          {/* Cart items list */}
          <div className="space-y-4">
            <h2 className="text-base uppercase tracking-wider text-slate-400 font-bold">Items In Cart</h2>
            <div className="space-y-3.5">
              {itemsList.map((item, idx) => {
                const showStrikethrough = item.mrp && item.mrp > item.price;
                return (
                  <div
                    key={idx}
                    className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex gap-4 items-center justify-between transition hover:shadow-md"
                  >
                    <div className="flex gap-4 items-center min-w-0">
                      <div className="w-16 h-16 bg-slate-50 border rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                        <img src={item.img} alt={item.name} className="max-h-full max-w-full object-contain p-1" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                          {item.brand || "Generic"}
                        </span>
                        <h3 className="text-sm font-bold text-slate-800 truncate max-w-xs">{item.name}</h3>
                        <span className="text-xs text-slate-500 font-semibold block">
                          Pack: {item.packSize?.value ? `${item.packSize.value} ${item.packSize.unit}` : item.packSize || "1 Unit"}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-purple-700 font-black">₹{item.price}</span>
                          {showStrikethrough && (
                            <span className="text-[10px] text-slate-400 line-through">₹{item.mrp}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity Adjusters */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border rounded-lg overflow-hidden bg-white shadow-sm">
                        <button
                          onClick={() => updateQty(idx, -1)}
                          className="px-2.5 py-1.5 hover:bg-slate-50 text-slate-605 font-black cursor-pointer"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-2.5 text-xs font-black text-slate-800">{item.qty}</span>
                        <button
                          onClick={() => updateQty(idx, 1)}
                          className="px-2.5 py-1.5 hover:bg-slate-50 text-slate-605 font-black cursor-pointer"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeListItem(idx)}
                        className="p-2 hover:bg-rose-50 text-slate-405 hover:text-rose-600 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>



          {/* "Did You Forget?" suggestions */}
          {summary?.suggestions && summary.suggestions.length > 0 && (
            <div className="space-y-3.5">
              <h2 className="text-base uppercase tracking-wider text-slate-400 font-bold">Did you forget?</h2>
              
              <div className="flex overflow-x-auto gap-4 py-2 scrollbar-thin scrollbar-thumb-purple-200">
                {summary.suggestions.map((prod) => {
                  const showCSStrikethrough = prod.mrp && prod.mrp > prod.price;
                  return (
                    <div
                      key={prod.variantId}
                      className="bg-white border border-slate-100 rounded-2xl p-3 flex flex-col justify-between w-40 flex-shrink-0 shadow-sm hover:shadow-md transition"
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
                            {prod.packSize?.value ? `${prod.packSize.value} ${prod.packSize.unit}` : prod.packSize || "1 Unit"}
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
                            className="bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white rounded-lg p-1.5 transition cursor-pointer shadow-sm"
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

        {/* Right Side: Bill Details & Payment COD */}
        <div className="space-y-6">
          
          {/* Bill breakdown */}
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-6">
            <h3 className="font-extrabold text-slate-800 text-lg border-b pb-2">Bill Details</h3>

            {loadingSummary && !summary ? (
              <div className="text-center py-6 text-slate-450 text-xs animate-pulse">Calculating bill...</div>
            ) : (
              <div className="space-y-3.5 text-sm font-semibold text-slate-600">
                
                {/* Item Total */}
                <div className="flex justify-between items-baseline">
                  <span>Item Total:</span>
                  <div className="flex items-center gap-1.5">
                    {summary?.mrpTotal && summary.mrpTotal > summary.itemTotal && (
                      <span className="text-xs text-slate-400 line-through">₹{summary.mrpTotal.toFixed(2)}</span>
                    )}
                    <span className="text-slate-850 font-bold">₹{summary?.itemTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Coupon Discount */}
                {summary?.couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Coupon Discount:</span>
                    <span>-₹{summary.couponDiscount.toFixed(2)}</span>
                  </div>
                )}

                {/* Handling Fee */}
                <div className="flex justify-between">
                  <span>Handling Fee:</span>
                  <span className="text-slate-850">₹{(summary?.handlingFee || 0).toFixed(2)}</span>
                </div>

                {/* Small Cart Fee */}
                {summary?.smallCartFee > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Small Cart Fee:</span>
                    <span>₹{summary.smallCartFee.toFixed(2)}</span>
                  </div>
                )}

                {/* Delivery Fee */}
                <div className="flex justify-between">
                  <span>Delivery Partner Fee:</span>
                  <span className={summary?.deliveryPartnerFee === 0 ? "text-emerald-600 font-bold" : "text-slate-850"}>
                    {summary?.deliveryPartnerFee === 0 ? "FREE" : `₹${summary?.deliveryPartnerFee.toFixed(2)}`}
                  </span>
                </div>

                {/* GST */}
                <div className="flex justify-between">
                  <span>GST & Charges:</span>
                  <span className="text-slate-850">₹{(summary?.gst || 0).toFixed(2)}</span>
                </div>

                {/* Final To Pay */}
                <div className="border-t pt-3 flex justify-between text-base font-black text-slate-900">
                  <span>To Pay:</span>
                  <span className="text-purple-700 text-lg">₹{(summary?.toPay || 0).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Place Order checkout CTA */}
            <button
              onClick={handleCheckout}
              disabled={loadingSummary || !summary}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-2xl font-black text-sm transition flex items-center justify-center gap-2 shadow cursor-pointer"
            >
              Proceed to checkout - ₹{(summary?.toPay || 0).toFixed(2)}
            </button>
          </div>

          {/* Payment Section (Cash on Delivery display ONLY) */}
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Payment Method</p>
            
            <div className="flex items-center justify-between border border-emerald-100 bg-emerald-50/20 p-3 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <Coins size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800">Cash on Delivery</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Pay with cash/UPI at delivery</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                <Check size={10} /> Active
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold px-1">
              <ShieldCheck size={12} className="text-emerald-600" />
              <span>Safe and secure checkout processes only</span>
            </div>
          </div>

        </div>

      </div>

      {/* ── SELECT COUPONS MODAL ── */}
      {showCouponModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl border border-slate-105 font-semibold text-slate-700 animate-scale-in">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-800">Available Coupons</h3>
              <button
                onClick={() => setShowCouponModal(false)}
                className="text-slate-400 hover:text-slate-650 bg-slate-50 p-1.5 rounded-full hover:scale-105 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Custom Code Input */}
            <div className="flex gap-2 mb-5">
              <input
                type="text"
                value={couponCodeInput}
                onChange={(e) => setCouponCodeInput(e.target.value)}
                placeholder="ENTER COUPON CODE"
                className="flex-1 px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none uppercase font-black placeholder:normal-case placeholder:font-semibold text-xs tracking-wider"
              />
              <button
                onClick={() => handleApplyCoupon(couponCodeInput)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Apply
              </button>
            </div>

            {couponError && (
              <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl px-3 py-2 font-bold text-center">
                {couponError}
              </div>
            )}

            {/* Coupons List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {loadingCoupons ? (
                <div className="text-center py-8 text-slate-400 text-xs">Loading store offers...</div>
              ) : coupons.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No eligible coupons found at this time.</div>
              ) : (
                coupons.map((c) => {
                  const isCurrentApplied = summary?.appliedCoupon?.code === c.code;
                  const isUnlocked = (summary?.itemTotal || 0) >= c.minCartValue;
                  const remaining = c.minCartValue - (summary?.itemTotal || 0);

                  return (
                    <div
                      key={c._id}
                      className={`border p-4 rounded-2xl flex justify-between items-center transition ${
                        isCurrentApplied 
                          ? "border-emerald-500 bg-emerald-50/20" 
                          : !isUnlocked 
                            ? "border-slate-100 bg-slate-100/40 opacity-75"
                            : "border-slate-100 bg-slate-50/50 hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            isUnlocked ? "bg-purple-100 text-purple-750" : "bg-slate-200 text-slate-500"
                          }`}>
                            {c.code}
                          </span>
                          {!isUnlocked && (
                            <span className="text-[9px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">Locked</span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-slate-800 text-xs mt-1.5">
                          {c.discountType === "flat" ? `Flat ₹${c.discountValue} Off` : `${c.discountValue}% Off`}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          Min. Cart Value: ₹{c.minCartValue} 
                          {c.maxDiscountCap ? ` · Max Cap: ₹${c.maxDiscountCap}` : ""}
                        </p>
                        {!isUnlocked && (
                          <p className="text-[10px] text-amber-750 font-bold mt-1">
                            Add ₹{remaining.toFixed(2)} more to unlock
                          </p>
                        )}
                        <p className="text-[9px] text-slate-400 font-semibold mt-1">
                          Expires: {new Date(c.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {isCurrentApplied ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-700 font-black">
                          <Check size={14} /> Applied
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApplyCoupon(c.code)}
                          disabled={!isUnlocked}
                          className={`text-xs font-black px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                            isUnlocked 
                              ? "bg-purple-50 text-purple-750 hover:bg-purple-100" 
                              : "bg-slate-100 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
