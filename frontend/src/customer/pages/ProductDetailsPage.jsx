import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { ShoppingBag, ShoppingCart, Heart, Info, CheckCircle, AlertTriangle, Truck, RotateCcw, ShieldCheck, ChevronDown, ChevronRight, Share2, Plus, Minus } from "lucide-react";
import { useToast } from "../../components/Toast";
import DOMPurify from "dompurify";
import useProductVariant from "../hooks/useProductVariant";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [product, setProduct] = useState(null);
  const {
    selectedVariant,
    handleVariantChange,
    selectedImage,
    setSelectedImage,
    handleAddToCart,
    handleDecrementCart,
    cartQty,
    displayPrice,
    displayMrp,
    displayDiscount,
    displayVendorName,
    isOutOfStock,
    packSizeLabel,
    cleanName
  } = useProductVariant(product);
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [descExpanded, setDescExpanded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(true);

  const fetchSimilarProducts = async () => {
    if (!product?.categoryId?._id) return;
    try {
      setSimilarLoading(true);
      const params = { category: product.categoryId._id };
      const stored = localStorage.getItem("selectedAddress");
      if (stored) {
        const address = JSON.parse(stored);
        if (address.pincode) params.pincode = address.pincode;
        if (address.latitude) params.latitude = address.latitude;
        if (address.longitude) params.longitude = address.longitude;
      }
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/products`, { params });
      if (res.data.success || res.data.products) {
        const filtered = (res.data.products || []).filter(p => p._id !== product._id);
        setSimilarProducts(filtered);
      }
    } catch (err) {
      console.error("Failed to fetch similar products:", err);
    } finally {
      setSimilarLoading(false);
    }
  };

  useEffect(() => {
    if (product?.categoryId?._id) {
      fetchSimilarProducts();
    }
  }, [product]);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [eligibility, setEligibility] = useState({ eligible: false, hasReviewed: false, existingReview: null });

  const targetVendorId = selectedVariant?.vendorId || product?.primaryVendorId;

  const fetchReviewsAndEligibility = async () => {
    if (!id || !targetVendorId) return;
    try {
      const token = localStorage.getItem("userToken");
      if (token) {
        const eligRes = await axios.get(`${import.meta.env.VITE_API_URL}/products/${id}/review-eligibility`, {
          params: { vendorId: targetVendorId },
          headers: { Authorization: `Bearer ${token}` }
        });
        if (eligRes.data.success) {
          setEligibility(eligRes.data);
          if (eligRes.data.hasReviewed && eligRes.data.existingReview) {
            setReviewRating(eligRes.data.existingReview.rating);
            setReviewText("");
          } else {
            setReviewRating(5);
            setReviewText("");
          }
        }
      } else {
        setEligibility({ eligible: false, hasReviewed: false, existingReview: null });
      }
    } catch (err) {
      console.error("Failed to fetch product reviews/eligibility:", err);
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("userToken");
    if (!token) {
      showToast({ type: "error", message: "Please log in to submit a review." });
      return;
    }

    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      showToast({ type: "error", message: "Please select a rating between 1 and 5." });
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/products/${id}/reviews`,
        { rating: reviewRating, reviewText: "", vendorId: targetVendorId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        showToast({ type: "success", message: res.data.message });
        fetchReviewsAndEligibility();
        if (product) {
          setProduct({
            ...product,
            averageRating: res.data.averageRating,
            totalReviews: res.data.totalReviews
          });
        }
      }
    } catch (err) {
      console.error("Failed to submit review:", err);
      showToast({ type: "error", message: err.response?.data?.message || "Failed to submit review." });
    }
  };

  useEffect(() => {
    if (id && targetVendorId) {
      fetchReviewsAndEligibility();
    }
  }, [id, targetVendorId]);

  const renderRatingForm = () => {
    const isLoggedIn = !!localStorage.getItem("userToken");
    if (!eligibility.eligible || eligibility.hasReviewed) return null;

    return (
      <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 space-y-4">
        <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider">
          Rate this Product
        </h4>
        {isLoggedIn ? (
          <form onSubmit={handleAddReview} className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Your Rating</span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="transition hover:scale-110 focus:outline-none cursor-pointer"
                  >
                    <span className={`text-2xl ${star <= reviewRating ? "text-amber-500" : "text-slate-200"}`}>★</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="bg-[#6B21D9] hover:bg-[#5B18C2] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-sm active:scale-[0.98]"
            >
              Submit Rating
            </button>
          </form>
        ) : (
          <div className="text-center py-2">
            <p className="text-xs text-slate-500 font-bold mb-2">You must be logged in to rate this product.</p>
            <Link
              to="/customer/login"
              className="inline-block bg-[#6B21D9] hover:bg-[#5B18C2] text-white font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
            >
              Log In
            </Link>
          </div>
        )}
      </div>
    );
  };

  const renderSimilarProducts = () => {
    if (similarLoading) {
      return (
        <div className="border-t border-slate-100 pt-6 mt-6 space-y-4">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight">Similar Products</h3>
          <div className="text-center py-6 text-xs font-bold text-slate-400 animate-pulse">
            Loading similar products...
          </div>
        </div>
      );
    }

    if (similarProducts.length === 0) return null;

    return (
      <div className="border-t border-slate-100 pt-6 mt-6 space-y-4">
        <h3 className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight">Similar Products</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {similarProducts.slice(0, 4).map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      </div>
    );
  };

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

  const selectedAddress = JSON.parse(localStorage.getItem("selectedAddress") || "null");

  return (
    <>
      {/* MOBILE ONLY VIEW (Scoped to < 768px viewports) */}
      <div className="block md:hidden w-full px-4 pb-24 pt-3 bg-white space-y-4 select-none">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold flex-wrap">
          <Link to="/customer/dashboard" className="hover:text-purple-650 transition">Home</Link>
          {product.categoryId?.name && (
            <>
              <ChevronRight size={10} className="text-slate-300" />
              <span className="truncate max-w-[80px]">{product.categoryId.name}</span>
            </>
          )}
          {product.subCategoryId?.name && (
            <>
              <ChevronRight size={10} className="text-slate-300" />
              <span className="truncate max-w-[80px]">{product.subCategoryId.name}</span>
            </>
          )}
          {product.familyId?.name && (
            <>
              <ChevronRight size={10} className="text-slate-300" />
              <span className="truncate max-w-[80px]">{product.familyId.name}</span>
            </>
          )}
        </nav>

        {/* Back and title header row */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center flex-shrink-0 cursor-pointer"
            title="Back"
          >
            <ChevronRight className="rotate-180 text-slate-700" size={18} />
          </button>
          
          <h1 className="font-extrabold text-slate-800 text-sm flex-1 truncate">
            {cleanName || product.name}
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={handleWishlistToggle}
              className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center bg-white shadow-sm cursor-pointer"
              title="Toggle Wishlist"
            >
              <Heart size={16} className={isWishlisted ? "text-red-500 fill-red-500" : "text-slate-500"} />
            </button>
            <button
              onClick={handleShareProduct}
              className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center bg-white shadow-sm cursor-pointer"
              title="Share"
            >
              <Share2 size={16} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Image Container with Badges */}
        <div className="relative w-full aspect-square bg-slate-50/50 rounded-3xl border border-slate-100/50 flex items-center justify-center overflow-hidden">
          {displayDiscount > 0 && (
            <span className="absolute top-0 left-0 bg-[#FF3F3F] text-white font-black text-[10px] px-3 py-1 rounded-br-xl rounded-tl-3xl z-10">
              {displayDiscount}% OFF
            </span>
          )}
          <img 
            src={selectedImage || allImages[0]} 
            alt={product.name} 
            className="max-h-[90%] max-w-[90%] object-contain p-2" 
          />

          {/* Carousel dots indicator overlay */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            <span className="w-4 h-1.5 rounded-full bg-[#6B21D9]" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          </div>
        </div>

        {/* Thumbnails row */}
        {allImages.length > 1 && (
          <div className="flex gap-2 pb-1 overflow-x-auto scrollbar-hide">
            {allImages.slice(0, 4).map((img, idx) => {
              const isLast = idx === 3 && allImages.length > 4;
              const isActive = (selectedImage || allImages[0]) === img;
              
              return (
                <button
                  key={idx}
                  onClick={() => !isLast && setSelectedImage(img)}
                  className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0 relative transition ${
                    isActive ? "border-purple-600 shadow-sm" : "border-slate-100"
                  } ${isLast ? "cursor-default" : "cursor-pointer"}`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  {isLast && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-black">
                      +{allImages.length - 3}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Product Brand, Title, Rating, and Stock */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold block">
            {product.brand || "Generic"}
          </span>
          <h2 className="text-lg font-black text-slate-800 leading-tight">
            {cleanName || product.name}
          </h2>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Stock badge */}
            {isOutOfStock ? (
              <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                Out of Stock
              </span>
            ) : (
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                In Stock
              </span>
            )}

            {/* Dynamic Ratings block */}
            {product.totalReviews > 0 ? (
              <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
                <span className="text-amber-500 text-sm">★</span>
                <span>{product.averageRating.toFixed(1)}</span>
                <span className="text-slate-400 font-medium">({product.totalReviews} {product.totalReviews === 1 ? 'rating' : 'ratings'})</span>
              </div>
            ) : (
              <span className="text-[10px] font-black text-slate-450 bg-slate-100 px-2 py-0.5 rounded-md">
                No ratings yet
              </span>
            )}
          </div>
        </div>

        {/* Variant selector card block */}
        {product.variants && product.variants.length > 1 && (
          <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-3">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Pack Size: {packSizeLabel}
            </span>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v._id}
                  onClick={() => handleVariantChange(v)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-black transition ${
                    selectedVariant?._id === v._id
                      ? "border-purple-600 bg-purple-50 text-[#6B21D9] shadow-sm"
                      : "border-slate-200 text-slate-650 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {v.variantLabel}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Deliverable Address Box */}
        <div className="bg-purple-50/40 border border-purple-100/60 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-2.5 min-w-0">
            <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-black flex-shrink-0 mt-0.5">✓</span>
            <div className="min-w-0">
              <span className="text-emerald-700 font-extrabold text-[11px] block">Deliverable to your address</span>
              <span className="text-slate-500 font-bold text-[10px] truncate block max-w-[200px] sm:max-w-[240px]">
                {selectedAddress
                  ? selectedAddress.fullAddress ||
                    `${selectedAddress.houseNo || ""} ${selectedAddress.area || ""}`.trim() ||
                    "Selected location"
                  : "No address selected"}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate("/customer/location")}
            className="text-[#6B21D9] font-black text-xs hover:underline flex-shrink-0 cursor-pointer"
          >
            Change
          </button>
        </div>
        {/* Scoped CSS Styles for mobile product description rendering */}
        <style>{`
          .mobile-product-description p {
            margin-bottom: 0.5rem;
            line-height: 1.6;
            color: #4b5563;
          }
          .mobile-product-description strong {
            display: block;
            font-weight: 800;
            color: #1f2937;
            margin-top: 1rem;
            margin-bottom: 0.25rem;
            font-size: 0.8rem;
            border-bottom: 1px solid #f3f4f6;
            padding-bottom: 0.15rem;
          }
          .mobile-product-description strong:first-of-type {
            margin-top: 0.15rem;
          }
          .mobile-product-description ul, .mobile-product-description ol {
            margin-bottom: 0.5rem;
            padding-left: 1rem;
            list-style-type: disc;
          }
          .mobile-product-description li {
            margin-bottom: 0.2rem;
            color: #4b5563;
          }
        `}</style>

        {/* Product specs / Details toggle strip */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-3">
          <button
            onClick={() => setDescExpanded(v => !v)}
            className="w-full flex items-center justify-between cursor-pointer"
          >
            <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
              <Info size={14} className="text-purple-600" /> Product Details
            </span>
            <span className="text-purple-600 text-[10px] font-black flex items-center gap-0.5">
              {descExpanded ? "Show less" : "Know more"} <ChevronDown size={12} className={descExpanded ? "rotate-180" : ""} />
            </span>
          </button>
          
          <div className={`overflow-hidden transition-all duration-300 text-slate-655 text-xs leading-relaxed font-medium break-words ${
            descExpanded ? "max-h-[1000px] opacity-100 mt-2" : "max-h-0 opacity-0"
          }`}>
            <div className="mobile-product-description" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description || "No description provided for this product.") }} />
            {family?.shortDescription && <p className="text-slate-500 italic mt-2 font-semibold">Note: {family.shortDescription}</p>}
          </div>
        </div>

        {/* Specifications card section on mobile */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-3">
          <h3 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 border-b pb-2">
            Specifications
          </h3>
          
          <div className="divide-y divide-slate-100 text-[11px] font-semibold">
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

        {/* Trust Badge Grid */}
        <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-slate-100">
          <div className="flex flex-col items-center gap-1 text-center">
            <Truck size={16} className="text-purple-500" />
            <span className="text-[9px] font-bold text-slate-500 leading-tight">Quick Delivery</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <ShieldCheck size={16} className="text-emerald-500" />
            <span className="text-[9px] font-bold text-slate-500 leading-tight">Quality Assured</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <RotateCcw size={16} className="text-amber-500" />
            <span className="text-[9px] font-bold text-slate-500 leading-tight">Easy Returns</span>
          </div>
        </div>

        {renderRatingForm()}
        {renderSimilarProducts()}

        {/* Bottom Fixed Action purchase bar */}
        <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-slate-100 p-3.5 flex justify-between items-center z-40 shadow-lg">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-800">₹{displayPrice}</span>
              {displayMrp > displayPrice && (
                <span className="text-slate-400 text-xs line-through">₹{displayMrp}</span>
              )}
            </div>
            {displayMrp > displayPrice && (
              <span className="text-emerald-600 font-extrabold text-[10px]">
                You Save ₹{(displayMrp - displayPrice).toFixed(0)} ({displayDiscount}% OFF)
              </span>
            )}
          </div>

          <div className="w-[50%] max-w-[200px]">
            {isOutOfStock ? (
              <button
                disabled
                className="w-full py-2.5 rounded-xl font-black bg-slate-100 text-slate-400 cursor-not-allowed text-xs flex items-center justify-center h-10"
              >
                Out of Stock
              </button>
            ) : cartQty > 0 ? (
              <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-xl overflow-hidden shadow-sm h-10 w-full">
                <button
                  onClick={() => handleDecrementCart()}
                  className="h-full w-10 flex-shrink-0 hover:bg-purple-100 text-[#6B21D9] font-black transition flex items-center justify-center cursor-pointer"
                >
                  <Minus size={14} />
                </button>
                <span className="text-xs font-black text-purple-800 flex-1 text-center select-none">{cartQty}</span>
                <button
                  onClick={() => handleAddToCart(1)}
                  className="h-full w-10 flex-shrink-0 hover:bg-purple-100 text-[#6B21D9] font-black transition flex items-center justify-center cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleAddToCart(qty)}
                className="w-full py-2.5 bg-[#6B21D9] hover:bg-[#5B18C2] active:scale-[0.98] text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 h-10 transition cursor-pointer"
              >
                <ShoppingCart size={14} className="stroke-[2.5]" /> Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DESKTOP ONLY VIEW (completely untouched) */}
      <div className="hidden md:block max-w-[1400px] mx-auto py-6 px-4 space-y-8">
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
                {product.totalReviews > 0 ? (
                  <div className="flex items-center gap-1.5 text-sm font-bold text-slate-650 mt-2">
                    <span className="text-amber-500">★</span>
                    <span>{product.averageRating.toFixed(1)}</span>
                    <span className="text-slate-400 font-medium">({product.totalReviews} {product.totalReviews === 1 ? 'rating' : 'ratings'})</span>
                  </div>
                ) : (
                  <div className="text-xs font-black text-slate-400 mt-2 bg-slate-100 px-2 py-0.5 rounded w-fit">
                    No ratings yet
                  </div>
                )}
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
                            : "border-slate-200 text-slate-650 hover:border-slate-300 hover:bg-slate-50"
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
                  {cartQty > 0 ? (
                    <div className="flex items-center border border-purple-200 bg-purple-50 rounded-xl overflow-hidden shadow-sm">
                      <button
                        onClick={() => handleDecrementCart()}
                        className="px-4 py-2 hover:bg-purple-100 text-purple-700 font-extrabold text-base transition flex items-center justify-center"
                        title="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="px-4 text-sm font-black text-purple-800 w-10 text-center select-none">{cartQty}</span>
                      <button
                        onClick={() => handleAddToCart(1)}
                        className="px-4 py-2 hover:bg-purple-100 text-purple-700 font-extrabold text-base transition flex items-center justify-center"
                        title="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                      <button
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        className="px-4 py-2 hover:bg-slate-50 text-slate-650 font-bold text-base transition flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="px-4 text-sm font-black text-slate-800">{qty}</span>
                      <button
                        onClick={() => setQty(qty + 1)}
                        className="px-4 py-2 hover:bg-slate-50 text-slate-650 font-bold text-base transition flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                {cartQty > 0 ? (
                  <button
                    onClick={() => navigate("/customer/cart")}
                    className="flex-1 py-4 rounded-2xl font-black text-sm bg-purple-700 hover:bg-purple-800 text-white shadow transition flex items-center justify-center gap-2"
                  >
                    <ShoppingBag size={18} /> View in Cart
                  </button>
                ) : (
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
                )}
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

        {renderRatingForm()}
        {renderSimilarProducts()}
      </div>
    </>
  );
}

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
