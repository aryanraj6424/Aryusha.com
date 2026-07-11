import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, ShoppingBag, ShieldCheck, Heart, Info, CheckCircle, AlertTriangle } from "lucide-react";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");

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
          setSelectedImage(found.variants?.[0]?.images?.[0] || found.images?.[0] || "");
          
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
          alert("This product is not available for delivery at your location.");
          navigate("/dashboard");
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
    const seoTitle = family?.metaTitle || product.name;
    const seoDescription = family?.metaDescription || product.description || product.name;
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
      "name": product.name,
      "image": family?.images?.map(i => i.url) || [selectedImage || (product.images?.[0] || "")],
      "description": product.description || family?.description || product.name,
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
        "price": product.primaryPrice,
        "itemCondition": "https://schema.org/NewCondition",
        "availability": product.primaryStockStatus === "out_of_stock" 
          ? "https://schema.org/OutOfStock" 
          : "https://schema.org/InStock",
        "seller": {
          "@type": "Store",
          "name": product.primaryVendorName
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

  const handleAddToCart = () => {
    if (!product) return;
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
      cart[existingIndex].qty += qty;
    } else {
      cart.push({
        variantId: variant._id,
        productId: product._id,
        name: product.name,
        brand: product.brand,
        price: product.primaryPrice,
        mrp: product.primaryMrp,
        qty: qty,
        img: variant.images?.[0] || product.images?.[0] || "https://via.placeholder.com/150",
        vendorName: product.primaryVendorName,
        vendorId: product.primaryVendorId,
        packSize: variant.packSize || product.primaryUnit
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));
    alert(`${qty} x ${product.name} added to cart!`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-650 mb-3 animate-pulse"></div>
        <p className="text-slate-500 font-bold text-sm">Loading product details...</p>
      </div>
    );
  }

  if (!product) return null;

  const isOutOfStock = product.primaryStockStatus === "out_of_stock";
  const allImages = [
    ...(product.variants?.[0]?.images || []),
    ...(product.images || [])
  ].filter((url, idx, self) => url && self.indexOf(url) === idx);

  if (allImages.length === 0) {
    allImages.push("https://via.placeholder.com/400");
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-extrabold text-sm transition"
      >
        <ArrowLeft size={16} /> Back to Catalog
      </button>

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
                {product.name}
              </h1>
              <p className="text-sm text-slate-500 font-bold mt-1">
                Pack Size: {product.primaryUnit || "1 Unit"}
              </p>
            </div>

            {/* Seller info */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center text-xs font-semibold text-slate-600">
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold mb-0.5">Fulfillment Partner</span>
                <span className="font-extrabold text-slate-800 flex items-center gap-1">
                  🏪 {product.primaryVendorName}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl font-bold">
                <CheckCircle size={14} /> Servicing Area
              </div>
            </div>

            {/* Pricing block */}
            <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-2xl space-y-1.5">
              <span className="text-[10px] text-purple-600 uppercase tracking-wider block font-bold">Special Price</span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-purple-700">₹{product.primaryPrice}</span>
                {product.primaryMrp > product.primaryPrice && (
                  <>
                    <span className="text-slate-400 text-sm line-through">M.R.P. ₹{product.primaryMrp}</span>
                    <span className="text-emerald-600 text-xs font-black">
                      Save ₹{(product.primaryMrp - product.primaryPrice).toFixed(0)} ({product.primaryDiscount}% OFF)
                    </span>
                  </>
                )}
              </div>
            </div>

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
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 py-4 rounded-2xl font-black text-sm transition flex items-center justify-center gap-2 shadow ${
                  isOutOfStock
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                <ShoppingBag size={18} /> {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </button>
              <button className="p-4 border rounded-2xl hover:bg-slate-50 text-slate-400 hover:text-rose-500 transition shadow-sm">
                <Heart size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Additional attributes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* About details */}
        <div className="md:col-span-2 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-lg border-b pb-2 flex items-center gap-2">
            <Info size={18} className="text-purple-650" /> Product Details
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed font-semibold">
            {product.description || "No description provided for this product."}
          </p>
          {family?.shortDescription && (
            <p className="text-slate-500 text-xs italic font-semibold">
              Note: {family.shortDescription}
            </p>
          )}
        </div>

        {/* Specifications */}
        <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-800 text-lg border-b pb-2">Specifications</h3>
          
          <div className="divide-y divide-slate-100 text-xs font-semibold">
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
            {!family?.shelfLife && !family?.storageInstructions && !family?.countryOfOrigin && !family?.fssaiLicenseNumber && (!product.attributes || product.attributes.length === 0) && (
              <p className="text-slate-400 text-xs font-bold text-center py-6">No attributes specified.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
