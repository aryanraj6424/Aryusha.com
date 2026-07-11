import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Pencil, Tag, Package, ChevronLeft, ExternalLink } from "lucide-react";
import { getProduct, getVariants } from "../../services/productApi";

/**
 * ProductDetails — read-only, production-quality view of a Product and its variants.
 *
 * Route: /admin/products/:id
 */
export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [prod, vars] = await Promise.all([
          getProduct(id),
          getVariants(id),
        ]);
        setProduct(prod);
        setVariants(vars || []);
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
      <div className="p-8 flex items-center justify-center min-h-64 text-gray-400">
        Loading…
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center text-red-600">
        Product not found.{" "}
        <Link to="/admin/products" className="text-indigo-600 underline">Go back</Link>
      </div>
    );
  }

  const discountPct = (mrp, price) =>
    mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <button onClick={() => navigate("/admin/products")} className="hover:text-indigo-600 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Products
        </button>
        <span>/</span>
        <span className="text-gray-800 font-medium">{product.name}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left column: images ── */}
        <div className="space-y-3">
          {product.images && product.images.length > 0 ? (
            <>
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full aspect-square object-cover rounded-2xl border border-gray-200"
              />
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.slice(1).map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt=""
                      className="w-full aspect-square object-cover rounded-lg border border-gray-100"
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full aspect-square bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
              No image
            </div>
          )}
        </div>

        {/* ── Right column: details ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Name + actions */}
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              {product.brand && (
                <p className="text-gray-500 text-sm mt-0.5">by {product.brand}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Link
                to={`/admin/products/edit/${id}`}
                className="flex items-center gap-1.5 border border-gray-300 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Link>
              <Link
                to={`/admin/products/${id}/variants`}
                className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition"
              >
                <Tag className="w-3.5 h-3.5" /> Manage Variants
              </Link>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
              product.status === "active" ? "bg-green-50 text-green-700" :
              product.status === "draft" ? "bg-amber-50 text-amber-700" :
              "bg-gray-100 text-gray-500"
            }`}>
              {product.status}
            </span>
            <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-semibold">
              <Package className="w-3 h-3" /> {product.unitType}
            </span>
            {product.isReturnable && (
              <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-semibold">
                Returnable
              </span>
            )}
          </div>

          {/* Catalog hierarchy */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-2">Catalog Hierarchy</p>
            <div className="flex items-center gap-2 text-gray-700">
              <span>{product.categoryId?.name}</span>
              <span className="text-gray-400">›</span>
              <span>{product.subCategoryId?.name}</span>
              <span className="text-gray-400">›</span>
              <span className="font-medium">{product.familyId?.name}</span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
              <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Variants */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-semibold text-gray-900">
                Pack-Size Variants ({variants.length})
              </p>
              <Link
                to={`/admin/products/${id}/variants`}
                className="text-xs text-indigo-600 flex items-center gap-1 hover:underline"
              >
                <ExternalLink className="w-3 h-3" /> Manage
              </Link>
            </div>

            {variants.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                <p className="text-gray-400 text-sm">No variants added yet.</p>
                <Link
                  to={`/admin/products/${id}/variants`}
                  className="mt-2 inline-block text-indigo-600 text-sm font-medium hover:underline"
                >
                  + Add Variants
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {variants.map((v) => (
                  <div
                    key={v._id}
                    className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{v.variantLabel}</p>
                      <p className="text-gray-400 text-xs font-mono mt-0.5">{v.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₹{v.basePrice}</p>
                      {v.mrp > v.basePrice && (
                        <p className="text-xs text-gray-400">
                          <span className="line-through">₹{v.mrp}</span>
                          {" "}
                          <span className="text-green-600 font-semibold">
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