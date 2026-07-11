import { useNavigate } from "react-router-dom";
import ComingSoon from "../location/ComingSoon";

function TrendingProducts({ products = [], groupedProducts = {}, isFilterActive = false, serviceAvailable = true }) {
  const navigate = useNavigate();

  const handleAddToCart = (product) => {
    const variant = product.variants?.[0];
    if (!variant) return;

    const cartStr = localStorage.getItem("cart");
    let cart = [];
    try {
      cart = cartStr ? JSON.parse(cartStr) : [];
      if (!Array.isArray(cart)) cart = [];
    } catch {
      cart = [];
    }

    const existingIndex = cart.findIndex((item) => item.variantId === variant._id);
    if (existingIndex > -1) {
      cart[existingIndex].qty += 1;
    } else {
      cart.push({
        variantId: variant._id,
        productId: product._id,
        name: product.name,
        brand: product.brand,
        price: product.primaryPrice,
        mrp: product.primaryMrp,
        qty: 1,
        img: variant.images?.[0] || product.images?.[0] || "https://via.placeholder.com/150",
        vendorName: product.primaryVendorName,
        vendorId: product.primaryVendorId,
        packSize: variant.packSize || product.primaryUnit
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
    alert(`${product.name} added to cart!`);
  };

  const renderProductCard = (product) => {
    const isOutOfStock = product.primaryStockStatus === "out_of_stock";
    const isLowStock = product.primaryStockStatus === "low_stock";

    return (
      <div key={product._id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between relative">
        {/* Discount Badge */}
        {product.primaryDiscount > 0 && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full z-10">
            {product.primaryDiscount}% OFF
          </span>
        )}

        <div>
          {/* Product Image */}
          <div 
            onClick={() => navigate(`/customer/product/${product._id}`)}
            className="h-36 w-full rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden mb-3 cursor-pointer hover:opacity-90 transition"
          >
            <img
              src={product.variants?.[0]?.images?.[0] || product.images?.[0] || "https://via.placeholder.com/150"}
              alt={product.name}
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
            {product.name}
          </h3>
          <p className="text-xs text-slate-500 font-medium mb-2">
            Pack: {product.primaryUnit || "1 Unit"}
          </p>

          {/* Vendor name */}
          <div className="flex items-center gap-1.5 mb-2 bg-slate-50 px-2 py-1 rounded-lg text-slate-600 text-xs font-semibold w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            Seller: {product.primaryVendorName}
          </div>

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
              ₹{product.primaryPrice}
            </span>
            {product.primaryMrp > product.primaryPrice && (
              <span className="text-slate-400 text-xs line-through">
                ₹{product.primaryMrp}
              </span>
            )}
          </div>

          {/* Action button */}
          <button
            onClick={() => handleAddToCart(product)}
            disabled={isOutOfStock}
            className={`w-full py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 text-sm ${
              isOutOfStock
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
            }`}
          >
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>
    );
  };

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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {products.map((product) => renderProductCard(product))}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {groupedProducts.featured.map((product) => renderProductCard(product))}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {groupedProducts.recentlyAdded.map((product) => renderProductCard(product))}
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {group.products.slice(0, 4).map((product) => renderProductCard(product))}
              </div>
            </div>
          );
        })}
    </div>
  );
}

export default TrendingProducts;