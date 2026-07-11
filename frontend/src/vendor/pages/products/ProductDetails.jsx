import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Pencil, Tag, Package, ChevronLeft, ExternalLink, Link2 } from "lucide-react";
import { getProductById, getVariants, getMyLinkedProducts } from "../../services/vendorApi";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [linkedInfo, setLinkedInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [prod, vars, linked] = await Promise.all([
          getProductById(id),
          getVariants(id),
          getMyLinkedProducts()
        ]);
        setProduct(prod);
        setVariants(vars || []);
        
        // Check if this master product is linked to this vendor's store
        const match = (linked || []).find(l => l.masterProductId?._id === id || l.masterProductId === id);
        if (match) {
          setLinkedInfo(match);
        }
      } catch (err) {
        console.error("Failed to load product details:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center text-rose-600 font-semibold">
        Product not found or access denied.{" "}
        <Link to="/vendor/products" className="text-purple-650 underline">Go back</Link>
      </div>
    );
  }

  const discountPct = (mrp, price) =>
    mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  const isEditable = product.status === "draft" || product.status === "rejected";

  return (
    <div className="p-6 max-w-5xl mx-auto font-semibold text-slate-750">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <button onClick={() => navigate("/vendor/products")} className="hover:text-purple-650 flex items-center gap-1 font-semibold">
          <ChevronLeft className="w-4 h-4" /> Products
        </button>
        <span>/</span>
        <span className="text-slate-800 font-medium">{product.name}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left column: images */}
        <div className="space-y-3">
          {product.images && product.images.length > 0 ? (
            <>
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full aspect-square object-cover rounded-2xl border border-slate-200 shadow-sm"
              />
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.slice(1).map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt=""
                      className="w-full aspect-square object-cover rounded-xl border border-slate-100 shadow-sm"
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full aspect-square bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 text-xs">
              No image uploaded
            </div>
          )}
        </div>

        {/* Right column: details */}
        <div className="lg:col-span-2 space-y-5">

          {/* Name + actions */}
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 leading-snug">{product.name}</h1>
              {product.brand && (
                <p className="text-slate-400 text-sm mt-0.5 font-medium">by {product.brand}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0 font-bold">
              {linkedInfo ? (
                <span className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-700 text-xs px-3 py-1.5 rounded-xl">
                  <Link2 className="w-3.5 h-3.5" /> Linked Product Reference
                </span>
              ) : (
                <>
                  {isEditable && (
                    <Link
                      to={`/vendor/products/edit/${id}`}
                      className="flex items-center gap-1.5 border border-slate-300 text-slate-700 text-sm px-3 py-1.5 rounded-xl hover:bg-slate-50 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit Product
                    </Link>
                  )}
                  <Link
                    to={`/vendor/products/${id}/variants`}
                    className="flex items-center gap-1.5 bg-purple-650 text-white text-sm px-3 py-1.5 rounded-xl hover:bg-purple-700 transition shadow"
                  >
                    <Tag className="w-3.5 h-3.5" /> Manage Variants
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs px-3 py-1 rounded-full ${
              product.status === "approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
              product.status === "pending" ? "bg-amber-50 text-amber-700 border border-amber-100 font-semibold" :
              product.status === "draft" ? "bg-slate-50 text-slate-700 border border-slate-200" :
              "bg-rose-50 text-rose-700 border border-rose-100 font-semibold"
            }`}>
              {product.status}
            </span>
            <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
              <Package className="w-3 h-3" /> {product.unitType}
            </span>
          </div>

          {/* Linked Product Banner */}
          {linkedInfo && (
            <div className="bg-purple-50/40 border border-purple-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] text-purple-700 font-extrabold uppercase tracking-widest">Your Linked Store Listing</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-slate-700 font-bold">
                  {linkedInfo.mrp && (
                    <span>MRP: <span className="text-slate-400 line-through">₹{linkedInfo.mrp}</span></span>
                  )}
                  <span>Selling Price: <span className="text-slate-900">₹{linkedInfo.price}</span></span>
                  {linkedInfo.mrp && linkedInfo.mrp > linkedInfo.price && (
                    <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-bold">
                      {discountPct(linkedInfo.mrp, linkedInfo.price)}% off
                    </span>
                  )}
                  <span>Stock: <span className="text-slate-900">{linkedInfo.stock} units</span></span>
                  <span>SKU: <span className="font-mono text-slate-900">{linkedInfo.sku}</span></span>
                  <span>Condition: <span className="text-slate-900">{linkedInfo.condition}</span></span>
                </div>
                {linkedInfo.vendorNotes && (
                  <p className="text-xs text-slate-500 mt-1 font-medium">Notes: {linkedInfo.vendorNotes}</p>
                )}
              </div>
              <button
                onClick={() => navigate("/vendor/products")}
                className="text-xs bg-white hover:bg-slate-50 border px-3 py-1.5 rounded-xl text-slate-700 font-bold transition shadow-sm self-start md:self-auto"
              >
                Edit listing from products list
              </button>
            </div>
          )}

          {/* Catalog hierarchy */}
          <div className="bg-slate-50 rounded-2xl p-4 text-sm border border-slate-100">
            <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-2 font-bold">Catalog Hierarchy</p>
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <span>{product.categoryId?.name}</span>
              <span className="text-slate-400">›</span>
              <span>{product.subCategoryId?.name}</span>
              <span className="text-slate-400">›</span>
              <span className="text-purple-600">{product.familyId?.name}</span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-bold">Description</p>
              <p className="text-slate-650 text-sm leading-relaxed font-medium bg-white border border-slate-150 p-4 rounded-2xl">
                {product.description}
              </p>
            </div>
          )}

          {/* Variants */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-bold text-slate-800">
                Pack-Size Variants ({variants.length})
              </p>
              <Link
                to={`/vendor/products/${id}/variants`}
                className="text-xs text-purple-650 flex items-center gap-1 hover:underline font-bold"
              >
                <ExternalLink className="w-3 h-3" /> Manage
              </Link>
            </div>

            {variants.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center shadow-inner">
                <p className="text-slate-400 text-sm font-medium">No variants added yet.</p>
                <Link
                  to={`/vendor/products/${id}/variants`}
                  className="mt-2 inline-block text-purple-600 text-sm hover:underline font-bold"
                >
                  + Add Variants
                </Link>
              </div>
            ) : (
              <div className="space-y-2 font-medium">
                {variants.map((v) => (
                  <div
                    key={v._id}
                    className="flex items-center justify-between bg-white border border-slate-150 rounded-2xl px-4 py-3 hover:shadow-xs transition"
                  >
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{v.variantLabel}</p>
                      <p className="text-slate-400 text-xs font-mono mt-0.5">{v.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800">₹{v.basePrice}</p>
                      {v.mrp > v.basePrice && (
                        <p className="text-xs text-slate-400 font-semibold">
                          <span className="line-through">₹{v.mrp}</span>
                          {" "}
                          <span className="text-emerald-600">
                            {discountPct(v.mrp, v.basePrice)}% off
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
