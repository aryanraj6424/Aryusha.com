import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { ShoppingBag, Heart, Info, CheckCircle, AlertTriangle, Truck, RotateCcw, ShieldCheck, ChevronDown, ChevronRight, Share2 } from "lucide-react";
import { useToast } from "../../components/Toast";
import DOMPurify from "dompurify";
import useProductVariant from "../hooks/useProductVariant";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [product, setProduct] = useState(null);
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [descExpanded, setDescExpanded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const fetchWishlistStatus = async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) return;
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/customer/wishlist`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const inWishlist = (res.data.wishlist || []).some(item => item._id === id);
        setIsWishlisted(inWishlist);
      }
    } catch (err) {
      console.error("Error fetching wishlist status:", err);
    }
  };

  useEffect(() => {
    if (product) {
      fetchWishlistStatus();
    }
    const syncWishlist = () => {
      if (product) fetchWishlistStatus();
    };
    window.addEventListener("wishlist-updated", syncWishlist);
    return () => {
      window.removeEventListener("wishlist-updated", syncWishlist);
    };
  }, [product, id]);

  const handleWishlistToggle = async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        showToast({ type: "error", message: "Please login to manage your wishlist." });
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };
      if (isWishlisted) {
        const res = await axios.delete(`${import.meta.env.VITE_API_URL}/customer/wishlist/${product._id}`, { headers });
        if (res.data.success) {
          setIsWishlisted(false);
          showToast({ type: "success", message: "Removed from wishlist" });
          window.dispatchEvent(new Event("wishlist-updated"));
        }
      } else {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/customer/wishlist/${product._id}`, {}, { headers });
        if (res.data.success) {
          setIsWishlisted(true);
          showToast({ type: "success", message: "Added to wishlist" });
          window.dispatchEvent(new Event("wishlist-updated"));
        }
      }
    } catch (err) {
      console.error("Error toggling wishlist:", err);
      showToast({ type: "error", message: "Failed to update wishlist" });
    }
  };

  const handleShareProduct = async () => {
    const shareData = {
      title: cleanName || product.name,
      text: `Check out ${cleanName || product.name} on QuickCart!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing via Web Share API:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast({ type: "success", message: "Link copied to clipboard!" });
      } catch (err) {
        console.error("Error copying link to clipboard:", err);
        showToast({ type: "error", message: "Could not copy link." });
      }
    }
  };

  const {
    selectedVariant,
    handleVariantChange,
    selectedImage,
    setSelectedImage,
    handleAddToCart,
    displayPrice,
    displayMrp,
    displayDiscount,
    displayVendorName,
    isOutOfStock,
    packSizeLabel,
    cleanName
  } = useProductVariant(product);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const storedAddress = localStorage.getItem("selectedAddress");
        const params = {};
        if (storedAddress) {
          const parsed = JSON.parse(storedAddress);
          if (parsed.latitude) params.latitude = parsed.latitude;
          if (parsed.longitude) params.longitude = parsed.longitude;
          if (parsed.pincode) params.pincode = parsed.pincode;
        }

        const res = await axios.get(`${import.meta.env.VITE_API_URL}/products`, { params });
        const prods = res.data.products || [];
        const found = prods.find((p) => p._id === id);

        if (found) {
          setProduct(found);
          
          // Fetch product family details to load country of origin, shelf life, FSSAI, SEO, etc.
          const famId = found.familyId?._id || found.familyId;
          if (famId) {
            try {
              const famRes = await axios.get(`${import.meta.env.VITE_API_URL}/product-families/${famId}`);
              setFamily(famRes.data);
            } catch (famErr) {
              console.error("Failed to load product family details:", famErr);
            }
          }
        } else {
          showToast({ type: "warning", message: "This product is not available for delivery at your location." });
          navigate("/customer/dashboard");
        }
      } catch (err) {
        console.error("Failed to load product details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  // SEO Rendering & JSON-LD Injection
  useEffect(() => {
    if (!product) return;

    // Resolve fallbacks dynamically at render time as required
    const seoTitle = family?.metaTitle || cleanName || product.name;
    const seoDescription = family?.metaDescription || product.description || cleanName || product.name;
    const seoCanonical = family?.canonicalUrl || window.location.href;
    const seoOgImage = family?.ogImage || selectedImage || (product.images?.[0] || "");

    document.title = `${seoTitle} | Aryusha.com`;

    const setMetaTag = (name, property, content) => {
      if (!content) return;
      const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (name) element.setAttribute('name', name);
        if (property) element.setAttribute('property', property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    setMetaTag('description', null, seoDescription);

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', seoCanonical);

    setMetaTag(null, 'og:title', seoTitle);
    setMetaTag(null, 'og:description', seoDescription);
    setMetaTag(null, 'og:image', seoOgImage);

    // Schema.org structured data block (LD+JSON)
    const structuredDataObj = {
      "@context": "https://schema.org",
      "@type": family?.structuredDataType || "Product",
      "name": cleanName || product.name,
      "image": family?.images?.map(i => i.url) || [selectedImage || (product.images?.[0] || "")],
      "description": product.description || family?.description || cleanName || product.name,
      "sku": product.variants?.[0]?.sku || "",
      "mpn": product.variants?.[0]?.barcode || "",
      "brand": {
        "@type": "Brand",
        "name": product.brand || "Generic"
      },
      "offers": {
        "@type": "Offer",
        "url": seoCanonical,
        "priceCurrency": "INR",
        "price": selectedVariant?.sellingPrice || product.primaryPrice,
        "itemCondition": "https://schema.org/NewCondition",
        "availability": (selectedVariant?.stockQty <= 0 || product.primaryStockStatus === "out_of_stock")
          ? "https://schema.org/OutOfStock" 
          : "https://schema.org/InStock",
        "seller": {
          "@type": "Store",
          "name": selectedVariant?.vendorName || product.primaryVendorName
        }
      }
    };

    if (family?.fssaiLicenseNumber) {
      structuredDataObj["fssaiLicenseNumber"] = family.fssaiLicenseNumber;
    }

    let ldScript = document.getElementById("json-ld-seo");
    if (!ldScript) {
      ldScript = document.createElement('script');
      ldScript.setAttribute('id', 'json-ld-seo');
      ldScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(ldScript);
    }
    ldScript.textContent = JSON.stringify(structuredDataObj, null, 2);

    return () => {
      // Clean up script tag on unmount
      const cleanupLd = document.getElementById("json-ld-seo");
      if (cleanupLd) cleanupLd.remove();
    };
  }, [product, family, selectedImage]);

  if (!product) return null;
  const allImages = [
    ...(product.variants?.[0]?.images || []),
    ...(product.images || [])
  ].filter((url, idx, self) => url && self.indexOf(url) === idx);

  if (allImages.length === 0) {
    allImages.push("https://via.placeholder.com/400");
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-8">

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold flex-wrap">
        <Link to="/customer/dashboard" className="hover:text-purple-600 transition">Home</Link>
        {product.categoryId?.name && (
          <>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="text-slate-500 font-semibold">{product.categoryId.name}</span>
          </>
        )}
        {product.subCategoryId?.name && (
          <>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="text-slate-500 font-semibold">{product.subCategoryId.name}</span>
          </>
        )}
        {product.familyId?.name && (
          <>
            <ChevronRight size={12} className="text-slate-300" />
            <span className="text-slate-500 font-semibold">{product.familyId.name}</span>
          </>
        )}
        <ChevronRight size={12} className="text-slate-300" />
        <span className="text-purple-600 font-bold truncate max-w-[160px]">{cleanName || product.name}</span>
      </nav>

      {/* Main product card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-sm">
        {/* Images Column */}
        <div className="space-y-4">
          <div className="w-full aspect-square bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden relative">
            {product.primaryDiscount > 0 && (
              <span className="absolute top-4 left-4 bg-red-500 text-white font-black text-xs px-3 py-1 rounded-full z-10 shadow">
                {product.primaryDiscount}% OFF
              </span>
            )}
            <img src={selectedImage || allImages[0]} alt={product.name} className="max-h-full max-w-full object-contain p-4" />
          </div>

          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0 transition ${
                    (selectedImage || allImages[0]) === img ? "border-purple-650 shadow" : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details Column */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block mb-1">
                {product.brand || "Generic"}
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight">
                {cleanName || product.name}
              </h1>
              <p className="text-sm text-slate-500 font-bold mt-1">
                Pack Size: {packSizeLabel}
              </p>
            </div>

            {/* Service Area Status (No Vendor references) */}
            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-100 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold w-fit shadow-sm">
              <CheckCircle size={14} /> Deliverable to your address
            </div>

            {/* Pricing block — refined with savings + tax note */}
            <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] text-purple-600 uppercase tracking-wider block font-bold">Special Price</span>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl font-black text-purple-700">₹{displayPrice}</span>
                {displayMrp > displayPrice && (
                  <span className="text-slate-400 text-sm line-through">M.R.P. ₹{displayMrp}</span>
                )}
              </div>
              {displayMrp > displayPrice && (
                <p className="text-emerald-600 text-xs font-black">
                  You Save ₹{(displayMrp - displayPrice).toFixed(0)} ({displayDiscount}% OFF)
                </p>
              )}
              <p className="text-[10px] text-slate-400 font-medium pt-0.5">(Inclusive of all applicable taxes)</p>
            </div>

            {/* Variant Selector */}
            {product.variants && product.variants.length > 1 && (
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">Select Variant</span>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v._id}
                      onClick={() => handleVariantChange(v)}
                      className={`px-4 py-2 rounded-xl border text-sm font-bold transition ${
                        selectedVariant?._id === v._id
                          ? "border-purple-600 bg-purple-50 text-purple-700 shadow-sm"
                          : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {v.variantLabel}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Availability */}
            <div className="flex items-center gap-2">
              {isOutOfStock ? (
                <div className="flex items-center gap-1.5 text-red-600 font-bold text-xs bg-red-50 border border-red-100 px-3 py-1 rounded-xl">
                  <AlertTriangle size={14} /> Out of Stock
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-xl">
                  <CheckCircle size={14} /> Available & In Stock
                </div>
              )}
            </div>
          </div>

          {/* Quantity and Add to Cart Section */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            {!isOutOfStock && (
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity</span>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="px-4 py-2 hover:bg-slate-50 text-slate-650 font-bold text-base transition"
                  >
                    -
                  </button>
                  <span className="px-4 text-sm font-black text-slate-800">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="px-4 py-2 hover:bg-slate-50 text-slate-650 font-bold text-base transition"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => handleAddToCart(qty)}
                disabled={isOutOfStock}
                className={`flex-1 py-4 rounded-2xl font-black text-sm transition flex items-center justify-center gap-2 shadow ${
                  isOutOfStock
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                <ShoppingBag size={18} /> {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </button>
              <button
                onClick={handleWishlistToggle}
                className={`p-4 border rounded-2xl transition shadow-sm ${
                  isWishlisted
                    ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                    : "hover:bg-slate-50 text-slate-400 hover:text-rose-500 border-slate-200"
                }`}
              >
                <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
              </button>
              <button
                onClick={handleShareProduct}
                className="p-4 border border-slate-200 rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-purple-650 transition shadow-sm"
                title="Share Product"
              >
                <Share2 size={18} />
              </button>
            </div>

            {/* Trust Strip */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
              <div className="flex flex-col items-center gap-1 text-center">
                <Truck size={18} className="text-purple-500" />
                <span className="text-[10px] font-bold text-slate-500 leading-tight">Quick Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <ShieldCheck size={18} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-slate-500 leading-tight">Quality Assured</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <RotateCcw size={18} className="text-amber-500" />
                <span className="text-[10px] font-bold text-slate-500 leading-tight">Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Additional attributes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* About details — expandable */}
        <div className="md:col-span-2 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
          <button
            onClick={() => setDescExpanded(v => !v)}
            className="w-full flex items-center justify-between group"
          >
            <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
              <Info size={18} className="text-purple-600" /> Product Details
            </h3>
            <span className={`text-purple-600 text-xs font-bold flex items-center gap-1 transition-transform ${
              descExpanded ? "rotate-180" : ""
            }`}>
              <ChevronDown size={16} />
              {descExpanded ? "Show less" : "Know more"}
            </span>
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              descExpanded ? "max-h-[2000px] opacity-100" : "max-h-24 opacity-80"
            }`}
          >
            <div 
              className="text-slate-600 text-sm leading-relaxed font-medium whitespace-pre-wrap break-words overflow-hidden"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description || "No description provided for this product.") }}
            />
            {family?.shortDescription && (
              <p className="text-slate-500 text-xs italic font-semibold mt-2">
                Note: {family.shortDescription}
              </p>
            )}
          </div>
          {!descExpanded && (
            <button
              onClick={() => setDescExpanded(true)}
              className="text-purple-600 text-xs font-extrabold hover:underline mt-1"
            >
              Know more about the product +
            </button>
          )}
        </div>

        {/* Specifications */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-lg border-b pb-2">Specifications</h3>
          
          <div className="divide-y divide-slate-100 text-xs font-semibold">
            <div className="py-2.5 flex justify-between">
              <span className="text-slate-400">Returnable</span>
              <span className={`font-extrabold text-right ${product.isReturnable ? "text-emerald-650" : "text-slate-550"}`}>
                {product.isReturnable ? "Yes" : "No"}
              </span>
            </div>
            {family?.shelfLife && (
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Shelf Life</span>
                <span className="text-slate-700 font-extrabold text-right">{family.shelfLife}</span>
              </div>
            )}
            {family?.storageInstructions && (
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Storage</span>
                <span className="text-slate-700 font-extrabold text-right">{family.storageInstructions}</span>
              </div>
            )}
            {family?.countryOfOrigin && (
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Origin</span>
                <span className="text-slate-700 font-extrabold text-right">{family.countryOfOrigin}</span>
              </div>
            )}
            {family?.fssaiLicenseNumber && (
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">FSSAI License</span>
                <span className="text-slate-700 font-extrabold text-right">{family.fssaiLicenseNumber}</span>
              </div>
            )}
            {product.attributes && product.attributes.map((attr, idx) => (
              <div key={idx} className="py-2.5 flex justify-between">
                <span className="text-slate-400">{attr.key}</span>
                <span className="text-slate-700 font-extrabold text-right">{attr.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
