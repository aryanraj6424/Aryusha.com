import { useNavigate } from "react-router-dom";
import { Plus, Minus } from "lucide-react";
import ComingSoon from "../location/ComingSoon";
import { useToast } from "../../../components/Toast";
import useProductVariant from "../../hooks/useProductVariant";

function ProductCard({ product }) {
  const navigate = useNavigate();
  
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
    displayVendorName,
    isOutOfStock,
    isLowStock,
    packSizeLabel,
    cleanName
  } = useProductVariant(product);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between relative">
      {/* Discount Badge */}
      {displayDiscount > 0 && (
        <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full z-10">
          {displayDiscount}% OFF
        </span>
      )}

      <div>
        {/* Product Image */}
        <div 
          onClick={() => navigate(`/customer/product/${product._id}`)}
          className="h-32 sm:h-36 md:h-40 w-full rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden mb-3 cursor-pointer hover:opacity-90 transition"
        >
          <img
            src={selectedImage || "https://via.placeholder.com/150"}
            alt={cleanName || product.name}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Product Info */}
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
          {product.brand || "Generic"}
        </span>
        <h3 
          onClick={() => navigate(`/customer/product/${product._id}`)}
          className="font-bold text-slate-800 text-sm line-clamp-2 min-h-[40px] cursor-pointer hover:text-purple-600 transition"
        >
          {cleanName || product.name}
        </h3>
        <p className="text-xs text-slate-500 font-medium mb-2">
          Pack: {packSizeLabel}
        </p>

        {/* Stock Indicator */}
        <div className="mb-3">
          {isOutOfStock ? (
            <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded animate-pulse">
              Low Stock
            </span>
          ) : (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              In Stock
            </span>
          )}
        </div>
      </div>

      <div>
        {/* Price details */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-purple-700 font-extrabold text-base">
            ₹{displayPrice}
          </span>
          {displayMrp > displayPrice && (
            <span className="text-slate-400 text-xs line-through">
              ₹{displayMrp}
            </span>
          )}
        </div>

        {/* Variant Selector Pills */}
        {product.variants && product.variants.length > 1 && (
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-hide">
            {product.variants.map((v) => (
              <button
                key={v._id}
                onClick={() => handleVariantChange(v)}
                className={`flex-shrink-0 px-2.5 py-1 text-[10px] font-bold rounded-lg border transition ${
                  selectedVariant?._id === v._id
                    ? "border-purple-600 bg-purple-50 text-purple-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {v.variantLabel}
              </button>
            ))}
          </div>
        )}

        {/* Action button / Stepper */}
        {isOutOfStock ? (
          <button
            disabled
            className="w-full py-2.5 rounded-xl font-bold bg-slate-100 text-slate-400 cursor-not-allowed flex items-center justify-center text-sm h-[44px]"
          >
            Out of Stock
          </button>
        ) : cartQty > 0 ? (
          <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-xl overflow-hidden shadow-sm h-[44px] w-full">
            <button
              onClick={() => handleDecrementCart()}
              className="h-full w-11 flex-shrink-0 hover:bg-purple-100 text-purple-700 font-bold transition flex items-center justify-center"
              title="Decrease quantity"
            >
              <Minus size={14} />
            </button>
            <span className="text-sm font-black text-purple-800 flex-1 text-center select-none">{cartQty}</span>
            <button
              onClick={() => handleAddToCart(1)}
              className="h-full w-11 flex-shrink-0 hover:bg-purple-100 text-purple-700 font-bold transition flex items-center justify-center"
              title="Increase quantity"
            >
              <Plus size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleAddToCart(1)}
            className="w-full py-2.5 rounded-xl font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition flex items-center justify-center gap-1.5 text-sm h-[44px]"
          >
            Add to Cart
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