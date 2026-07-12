import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Trash2, ShoppingBag, Heart, Loader2, ArrowLeft, HeartOff, ChevronRight } from "lucide-react";
import axios from "axios";
import { useToast } from "../../../components/Toast";

export default function WishlistPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("userToken");
      if (!token) {
        setWishlist([]);
        setLoading(false);
        return;
      }

      // Read stored coordinates from localStorage to get the correct nearest vendor prices
      const storedAddress = localStorage.getItem("selectedAddress");
      const params = {};
      if (storedAddress) {
        try {
          const parsed = JSON.parse(storedAddress);
          if (parsed.latitude) params.latitude = parsed.latitude;
          if (parsed.longitude) params.longitude = parsed.longitude;
          if (parsed.pincode) params.pincode = parsed.pincode;
        } catch (e) {
          console.error("Error parsing stored address:", e);
        }
      }

      const res = await axios.get(`${import.meta.env.VITE_API_URL}/customer/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (res.data.success) {
        setWishlist(res.data.wishlist || []);
      }
    } catch (err) {
      console.error("Failed to load wishlist items:", err);
      showToast({ type: "error", message: "Failed to load wishlist items" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();

    const syncWishlist = () => {
      fetchWishlist();
    };
    window.addEventListener("wishlist-updated", syncWishlist);
    return () => {
      window.removeEventListener("wishlist-updated", syncWishlist);
    };
  }, []);

  const handleRemoveFromWishlist = async (e, productId) => {
    e.stopPropagation(); // Prevent navigating to detail page
    try {
      const token = localStorage.getItem("userToken");
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.delete(`${import.meta.env.VITE_API_URL}/customer/wishlist/${productId}`, { headers });
      if (res.data.success) {
        setWishlist(prev => prev.filter(item => item._id !== productId));
        showToast({ type: "success", message: "Product removed from wishlist" });
        window.dispatchEvent(new Event("wishlist-updated"));
      }
    } catch (err) {
      console.error("Error removing from wishlist:", err);
      showToast({ type: "error", message: "Failed to remove item" });
    }
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation(); // Prevent navigating to detail page
    const variant = product.variants?.[0] || product;
    if (!variant) return;

    const cartStr = localStorage.getItem("cart");
    let cart = [];
    try {
      cart = cartStr ? JSON.parse(cartStr) : [];
      if (!Array.isArray(cart)) cart = [];
    } catch {
      cart = [];
    }

    const packSizeLabel = variant.packSize
      ? (typeof variant.packSize === "object" && variant.packSize.value 
          ? `${variant.packSize.value} ${variant.packSize.unit}`
          : variant.packSize)
      : product.primaryUnit || "1 Unit";

    const displayPrice = variant.sellingPrice || product.primaryPrice || 0;
    const displayMrp = variant.mrp || product.primaryMrp || displayPrice;

    const existingIndex = cart.findIndex((item) => item.variantId === variant._id);
    if (existingIndex > -1) {
      cart[existingIndex].qty += 1;
    } else {
      cart.push({
        variantId: variant._id,
        productId: product._id,
        name: product.name,
        brand: product.brand || "Generic",
        price: displayPrice,
        mrp: displayMrp,
        qty: 1,
        img: variant.images?.[0] || product.images?.[0] || "https://via.placeholder.com/150",
        vendorName: variant.vendorName || product.primaryVendorName || "",
        vendorId: variant.vendorId || product.primaryVendorId || null,
        packSize: packSizeLabel
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
    showToast({ type: "success", message: `${product.name} added to cart!` });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
        <p className="text-slate-500 font-extrabold text-sm">Loading your wishlist...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold flex-wrap">
        <Link to="/customer/dashboard" className="hover:text-purple-600 transition">Home</Link>
        <ChevronRight size={12} className="text-slate-300" />
        <Link to="/customer/profile" className="hover:text-purple-600 transition">My Profile</Link>
        <ChevronRight size={12} className="text-slate-300" />
        <span className="text-purple-600 font-bold">Wishlist</span>
      </nav>

      {/* Header Bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 border rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition shadow-sm"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800">My Wishlist</h2>
          <p className="text-xs font-semibold text-slate-400">
            {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved for later
          </p>
        </div>
      </div>

      {wishlist.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4 text-center px-6">
          <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
            <HeartOff className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="font-extrabold text-slate-800 text-lg">Your Wishlist is Empty</h3>
            <p className="text-slate-400 text-sm font-semibold">
              Explore our fresh catalogs and save products you love to purchase them later.
            </p>
          </div>
          <button
            onClick={() => navigate("/customer/dashboard")}
            className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-6 py-3 rounded-2xl transition shadow-sm text-sm"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        /* Wishlist Items List */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wishlist.map((product) => {
            const variant = product.variants?.[0] || product;
            const displayPrice = variant.sellingPrice || product.primaryPrice || 0;
            const displayMrp = variant.mrp || product.primaryMrp || displayPrice;
            const discount = displayMrp > displayPrice 
              ? Math.round(((displayMrp - displayPrice) / displayMrp) * 100)
              : 0;

            const isOutOfStock = variant.stockQty <= 0 || product.primaryStockStatus === "out_of_stock";

            return (
              <div
                key={product._id}
                onClick={() => navigate(`/customer/product/${product._id}`)}
                className="bg-white border border-slate-100 rounded-2xl p-4 flex gap-4 hover:shadow-md transition cursor-pointer relative justify-between flex-wrap sm:flex-nowrap"
              >
                {/* Product Image and Details */}
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                    {discount > 0 && (
                      <span className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full z-10">
                        {discount}% OFF
                      </span>
                    )}
                    <img
                      src={variant.images?.[0] || product.images?.[0] || "https://via.placeholder.com/150"}
                      alt={product.name}
                      className="max-h-full max-w-full object-cover"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                      {product.brand || "Generic"}
                    </span>
                    <h3 className="font-extrabold text-slate-800 text-sm line-clamp-2 leading-tight">
                      {product.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-bold">
                      {variant.variantLabel || "1 Unit"}
                    </p>

                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-purple-700 font-black text-sm">
                        ₹{displayPrice}
                      </span>
                      {displayMrp > displayPrice && (
                        <span className="text-slate-400 text-xs line-through">
                          ₹{displayMrp}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row sm:flex-col justify-between items-end gap-3 w-full sm:w-auto">
                  <button
                    onClick={(e) => handleRemoveFromWishlist(e, product._id)}
                    className="p-2.5 border border-slate-150 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition shadow-sm"
                    title="Remove from Wishlist"
                  >
                    <Trash2 size={16} />
                  </button>

                  <button
                    onClick={(e) => handleAddToCart(e, product)}
                    disabled={isOutOfStock}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition shadow-sm ${
                      isOutOfStock
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-purple-600 hover:bg-purple-700 text-white"
                    }`}
                  >
                    <ShoppingBag size={14} />
                    {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}