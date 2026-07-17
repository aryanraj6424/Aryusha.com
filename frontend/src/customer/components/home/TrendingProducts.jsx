import { useNavigate } from "react-router-dom";
import { Plus, Minus, Heart, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import ComingSoon from "../location/ComingSoon";
import { useToast } from "../../../components/Toast";
import useProductVariant from "../../hooks/useProductVariant";

function ProductCard({ product }) {
  const navigate = useNavigate();
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  const {
    selectedVariant,
    handleVariantChange,
    selectedImage,
    handleAddToCart,
    handleDecrementCart,
    cartQty,
    displayPrice,
    displayMrp,
    displayDiscount,
    isOutOfStock,
    isLowStock,
    packSizeLabel,
    cleanName
  } = useProductVariant(product);

  const fetchWishlist = async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) return;
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/customer/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const inWishlist = (res.data.wishlist || []).some(item => item._id === product._id);
        setIsWishlisted(inWishlist);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWishlist();
    window.addEventListener("wishlist-updated", fetchWishlist);
    return () => {
      window.removeEventListener("wishlist-updated", fetchWishlist);
    };
  }, [product._id]);

  const toggleWishlist = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem("userToken");
    if (!token) return;
    try {
      if (isWishlisted) {
        await axios.delete(`${import.meta.env.VITE_API_URL}/customer/wishlist/${product._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsWishlisted(false);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/customer/wishlist/${product._id}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsWishlisted(true);
      }
      window.dispatchEvent(new Event("wishlist-updated"));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-2.5 sm:p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between relative overflow-hidden">
      {/* Discount Badge */}
      {displayDiscount > 0 && (
        <span className="absolute top-0 left-0 bg-[#FF3F3F] text-white text-[9px] font-black px-2 py-0.5 rounded-br-lg rounded-tl-2xl z-10">
          {displayDiscount}% OFF
        </span>
      )}

      {/* Wishlist Heart */}
      <button
        onClick={toggleWishlist}
        className="absolute top-2 right-2 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow z-10 border border-slate-50 cursor-pointer"
        title="Add to wishlist"
      >
        <Heart size={12} className={isWishlisted ? "text-red-500 fill-red-500" : "text-slate-400"} />
      </button>

      <div>
        {/* Product Image */}
        <div 
          onClick={() => navigate(`/customer/product/${product._id}`)}
          className="h-28 sm:h-36 md:h-40 w-full rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden mb-2 cursor-pointer hover:opacity-90 transition p-1"
        >
          <img
            src={selectedImage || "https://via.placeholder.com/150"}
            alt={cleanName || product.name}
            className="h-full w-auto max-w-full object-contain"
          />
        </div>

        {/* Product Info */}
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="text-[9px] uppercase tracking-wider text-[#B45309] font-black block">
            {product.brand || "Generic"}
          </span>
          {product.totalReviews > 0 && (
            <div className="flex items-center gap-0.5 text-[9px] font-black text-amber-650 bg-amber-50/70 px-1 py-0.2 rounded">
              <span>★</span>
              <span>{product.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <h3 
          onClick={() => navigate(`/customer/product/${product._id}`)}
          className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2 min-h-[32px] sm:min-h-[40px] cursor-pointer hover:text-purple-650 transition leading-tight mb-1"
        >
          {cleanName || product.name}
        </h3>
        <p className="text-[10px] sm:text-xs text-slate-500 font-bold mb-1">
          Pack: {packSizeLabel}
        </p>

        {/* Stock Status */}
        <div className="mb-2">
          {isOutOfStock ? (
            <span className="text-[9px] font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="text-[9px] font-black text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">
              Low Stock
            </span>
          ) : (
            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              In Stock
            </span>
          )}
        </div>
      </div>

      <div>
        {/* Price details */}
        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="text-[#6B21D9] font-black text-sm sm:text-base">
            ₹{displayPrice}
          </span>
          {displayMrp > displayPrice && (
            <span className="text-slate-400 text-[10px] sm:text-xs line-through">
              ₹{displayMrp}
            </span>
          )}
        </div>

        {/* Variant Selector Pills */}
        {product.variants && product.variants.length > 1 && (
          <div className="flex gap-1 mb-2 overflow-x-auto pb-1 scrollbar-hide">
            {product.variants.map((v) => (
              <button
                key={v._id}
                onClick={() => handleVariantChange(v)}
                className={`flex-shrink-0 px-2 py-0.5 text-[9px] font-black rounded-md border transition ${
                  selectedVariant?._id === v._id
                    ? "border-purple-600 bg-purple-50 text-[#6B21D9]"
                    : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {v.variantLabel}
              </button>
            ))}
          </div>
        )}

        {/* Action Button */}
        {isOutOfStock ? (
          <button
            disabled
            className="w-full py-1.5 rounded-lg font-black bg-slate-100 text-slate-400 cursor-not-allowed flex items-center justify-center text-[10px] h-[34px]"
          >
            Out of Stock
          </button>
        ) : cartQty > 0 ? (
          <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg overflow-hidden shadow-sm h-[34px] w-full">
            <button
              onClick={() => handleDecrementCart()}
              className="h-full w-8 flex-shrink-0 hover:bg-purple-100 text-[#6B21D9] font-black transition flex items-center justify-center cursor-pointer"
            >
              <Minus size={12} />
            </button>
            <span className="text-xs font-black text-purple-800 flex-1 text-center select-none">{cartQty}</span>
            <button
              onClick={() => handleAddToCart(1)}
              className="h-full w-8 flex-shrink-0 hover:bg-purple-100 text-[#6B21D9] font-black transition flex items-center justify-center cursor-pointer"
            >
              <Plus size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleAddToCart(1)}
            className="w-full py-1.5 rounded-lg font-black bg-[#6B21D9] hover:bg-[#5B18C2] text-white shadow-sm transition flex items-center justify-center gap-1 text-[11px] h-[34px] cursor-pointer"
          >
            <ShoppingCart size={11} className="stroke-[2.5]" /> Add
          </button>
        )}
      </div>
    </div>
  );
}

function TrendingProducts({ products = [], groupedProducts = {}, isFilterActive = false, serviceAvailable = true }) {

  // If service is not available
  if (!serviceAvailable) {
    return <ComingSoon />;
  }

  // If searching or filtering is active: Render Flat Grid View
  if (isFilterActive) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-xl font-bold text-slate-800">Search Results</h2>
          <span className="text-xs font-bold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full">
            {products.length} Products Found
          </span>
        </div>

        {products.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-3xl border p-8">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No Matching Products</h3>
            <p className="text-slate-500 text-sm">
              We found active vendors in your area, but no products matched your current filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {products.map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        )}
      </div>
    );
  }

  // Grouped Mode (Homepage View)
  const hasFeatured = groupedProducts.featured && groupedProducts.featured.length > 0;
  const hasRecent = groupedProducts.recentlyAdded && groupedProducts.recentlyAdded.length > 0;
  const hasCategoryGroups = groupedProducts.byCategory && groupedProducts.byCategory.length > 0;

  if (!hasFeatured && !hasRecent && !hasCategoryGroups) {
    return (
      <div className="py-12 text-center bg-white rounded-3xl border p-8">
        <div className="text-4xl mb-3">📦</div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">No Products Available</h3>
        <p className="text-slate-500 text-sm">
          There are vendors serving your area, but they haven't uploaded any products for sale yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Featured Products */}
      {hasFeatured && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              🔥 Featured Offers
            </h2>
            <span className="text-xs font-semibold text-purple-600">Great Discounts</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {groupedProducts.featured.map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        </div>
      )}

      {/* Recently Added */}
      {hasRecent && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              ✨ Fresh Arrivals
            </h2>
            <span className="text-xs font-semibold text-purple-600">Newly Uploaded</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {groupedProducts.recentlyAdded.map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        </div>
      )}

      {/* Products by Category */}
      {hasCategoryGroups &&
        groupedProducts.byCategory.map((group) => {
          if (!group.products || group.products.length === 0) return null;
          return (
            <div key={group.category._id} className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-xl font-bold text-slate-800">
                  {group.category.name}
                </h2>
                <span className="text-xs font-semibold text-purple-600">Explore Category</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {group.products.slice(0, 4).map((product) => <ProductCard key={product._id} product={product} />)}
              </div>
            </div>
          );
        })}
    </div>
  );
}

export default TrendingProducts;