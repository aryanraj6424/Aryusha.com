import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Plus, Pencil, Trash2, ChevronLeft, Tag, Package, X, Check } from "lucide-react";
import {
  getProductById,
  getVariants,
  createVariant,
  updateVariant,
  deleteVariant,
} from "../../services/vendorApi";

const PACK_UNITS = ["g", "kg", "ml", "l", "pcs"];

const EMPTY_VARIANT = {
  variantLabel: "",
  packSize: { value: "", unit: "kg" },
  sku: "",
  barcode: "",
  mrp: "",
  basePrice: "",
  status: "active",
};

export default function ManageVariants() {
  const { id: productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_VARIANT);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [prod, vars] = await Promise.all([
          getProductById(productId),
          getVariants(productId),
        ]);
        setProduct(prod);
        setVariants(vars || []);
      } catch (err) {
        console.error("Failed to load product/variants:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId]);

  const openCreate = () => {
    setForm(EMPTY_VARIANT);
    setEditingId(null);
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (variant) => {
    setForm({
      variantLabel: variant.variantLabel,
      packSize: { value: variant.packSize.value, unit: variant.packSize.unit },
      sku: variant.sku,
      barcode: variant.barcode || "",
      mrp: variant.mrp,
      basePrice: variant.basePrice,
      status: variant.status,
    });
    setEditingId(variant._id);
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormError(null);
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    if (name === "packSize.value" || name === "packSize.unit") {
      const key = name.split(".")[1];
      setForm((prev) => ({ ...prev, packSize: { ...prev.packSize, [key]: value } }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const autoLabel = () => {
    if (form.packSize.value && form.packSize.unit) {
      setForm((prev) => ({
        ...prev,
        variantLabel: `${prev.packSize.value} ${prev.packSize.unit}`,
      }));
    }
  };

  const autoSku = () => {
    if (product && form.packSize.value && form.packSize.unit) {
      const prefix = product.name
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
        .slice(0, 5);
      const suffix = `${form.packSize.value}${form.packSize.unit.toUpperCase()}`;
      setForm((prev) => ({ ...prev, sku: `VND-${prefix}-${suffix}-${Date.now().toString().slice(-4)}` }));
    }
  };

  const validateForm = () => {
    if (!form.variantLabel.trim()) return "Variant label is required.";
    if (!form.packSize.value || Number(form.packSize.value) <= 0) return "Pack size value must be > 0.";
    if (!form.packSize.unit) return "Pack size unit is required.";
    if (!form.sku.trim()) return "SKU is required.";
    if (!form.mrp || Number(form.mrp) <= 0) return "MRP must be > 0.";
    if (!form.basePrice || Number(form.basePrice) <= 0) return "Base price must be > 0.";
    if (Number(form.basePrice) > Number(form.mrp)) return "Selling price cannot exceed MRP.";
    return null;
  };

  const handleSave = async () => {
    const err = validateForm();
    if (err) { setFormError(err); return; }

    const payload = {
      variantLabel: form.variantLabel.trim(),
      packSize: { value: Number(form.packSize.value), unit: form.packSize.unit },
      sku: form.sku.trim(),
      barcode: form.barcode.trim(),
      mrp: Number(form.mrp),
      basePrice: Number(form.basePrice),
      status: form.status,
    };

    try {
      setSaving(true);
      setFormError(null);

      if (editingId) {
        const updated = await updateVariant(editingId, payload);
        setVariants((prev) => prev.map((v) => (v._id === editingId ? updated : v)));
      } else {
        const created = await createVariant(productId, payload);
        setVariants((prev) => [...prev, created]);
      }
      closeForm();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to save variant.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (variantId) => {
    try {
      setDeleting(true);
      await deleteVariant(variantId);
      setVariants((prev) => prev.filter((v) => v._id !== variantId));
      setDeletingId(null);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleting(false);
    }
  };

  const discountPercent = (mrp, price) => {
    if (!mrp || mrp <= price) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  };

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
        Product not found.{" "}
        <Link to="/vendor/products" className="text-purple-600 underline">Go back</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto font-semibold text-slate-700">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <button onClick={() => navigate("/vendor/products")} className="hover:text-purple-650 flex items-center gap-1 font-semibold">
          <ChevronLeft className="w-4 h-4" /> Products
        </button>
        <span>/</span>
        <span className="text-slate-800 font-medium">{product.name}</span>
        <span>/</span>
        <span className="text-purple-600 font-medium">Manage Variants</span>
      </div>

      {/* Product summary card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 mb-6 flex items-start gap-4 shadow-sm">
        {product.images?.[0] && (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-16 h-16 rounded-xl object-cover border border-slate-100"
          />
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-800 truncate">{product.name}</h1>
          <div className="flex flex-wrap gap-3 mt-1 text-sm text-slate-400 font-medium">
            <span>{product.categoryId?.name}</span>
            <span>›</span>
            <span>{product.subCategoryId?.name}</span>
            <span>›</span>
            <span>{product.familyId?.name}</span>
          </div>
          <div className="flex gap-2 mt-2">
            <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-bold">
              <Package className="w-3 h-3" /> {product.unitType}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              product.status === "approved" ? "bg-emerald-50 text-emerald-700" :
              product.status === "pending" ? "bg-amber-50 text-amber-700" :
              "bg-slate-100 text-slate-500"
            }`}>
              {product.status}
            </span>
          </div>
        </div>
        <Link
          to={`/vendor/products/edit/${productId}`}
          className="text-xs text-purple-600 border border-purple-200 px-3 py-1.5 rounded-xl hover:bg-purple-50 transition shrink-0 font-bold"
        >
          Edit Product
        </Link>
      </div>

      {/* Section header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Pack-Size Variants</h2>
          <p className="text-sm text-slate-400 font-medium">
            {variants.length} variant{variants.length !== 1 ? "s" : ""} — list pack sizes with individual selling price.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-purple-700 transition shadow"
        >
          <Plus className="w-4 h-4" /> Add Variant
        </button>
      </div>

      {/* Variants table */}
      {variants.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-150 rounded-2xl p-12 text-center shadow-sm">
          <Tag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-bold">No variants yet</p>
          <p className="text-slate-400 text-sm mt-1 font-medium">
            Add at least one variant (e.g. 250g, 500g, 1 kg) to make this product sellable once approved.
          </p>
          <button
            onClick={openCreate}
            className="mt-4 bg-purple-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-purple-700 transition"
          >
            + Add First Variant
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-bold">Variant</th>
                <th className="text-left px-4 py-3 font-bold">SKU</th>
                <th className="text-right px-4 py-3 font-bold">MRP</th>
                <th className="text-right px-4 py-3 font-bold">Price</th>
                <th className="text-right px-4 py-3 font-bold">Discount</th>
                <th className="text-center px-4 py-3 font-bold">Status</th>
                <th className="text-center px-4 py-3 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {variants.map((v) => (
                <tr key={v._id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-800">{v.variantLabel}</p>
                    <p className="text-slate-400 text-xs font-semibold">
                      {v.packSize.value} {v.packSize.unit}
                      {v.barcode ? ` · ${v.barcode}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs text-slate-650">{v.sku}</td>
                  <td className="px-4 py-4 text-right text-slate-600">₹{v.mrp}</td>
                  <td className="px-4 py-4 text-right font-bold text-slate-800">₹{v.basePrice}</td>
                  <td className="px-4 py-4 text-right">
                    {discountPercent(v.mrp, v.basePrice) > 0 ? (
                      <span className="bg-emerald-50 text-emerald-700 text-xs font-extrabold px-2 py-0.5 rounded-full">
                        {discountPercent(v.mrp, v.basePrice)}% off
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs font-normal">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      v.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-450"
                    }`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEdit(v)}
                        className="p-1.5 rounded-lg text-purple-655 hover:bg-purple-50 transition"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(v._id)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-in side form panel */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex animate-fade-in">
          <div className="flex-1 bg-slate-900/30 backdrop-blur-xs" onClick={closeForm} />
          <div className="w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">
                  {editingId ? "Edit Variant" : "Add Variant"}
                </h3>
                <button onClick={closeForm} className="text-slate-400 hover:text-slate-650">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Pack Size */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">
                    Pack Size <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="packSize.value"
                      value={form.packSize.value}
                      onChange={handleFieldChange}
                      onBlur={() => { autoLabel(); autoSku(); }}
                      placeholder="e.g. 500"
                      min="0.001"
                      step="any"
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none font-semibold text-slate-700"
                    />
                    <select
                      name="packSize.unit"
                      value={form.packSize.unit}
                      onChange={handleFieldChange}
                      onBlur={() => { autoLabel(); autoSku(); }}
                      className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white font-semibold text-slate-700"
                    >
                      {PACK_UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Variant Label */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">
                    Variant Label * <span className="text-slate-400 font-normal normal-case">(e.g. 500 g, Pack of 4)</span>
                  </label>
                  <input
                    type="text"
                    name="variantLabel"
                    value={form.variantLabel}
                    onChange={handleFieldChange}
                    placeholder="e.g. 500 g, 1 kg, Pack of 6"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none font-semibold text-slate-700"
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">
                    SKU * <span className="text-slate-400 font-normal normal-case">(auto-generated on blur)</span>
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={form.sku}
                    onChange={handleFieldChange}
                    placeholder="e.g. FTSFOIL-1KG-VND"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-700"
                  />
                </div>

                {/* Barcode */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Barcode (EAN/UPC)</label>
                  <input
                    type="text"
                    name="barcode"
                    value={form.barcode}
                    onChange={handleFieldChange}
                    placeholder="Optional"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none text-slate-700"
                  />
                </div>

                {/* MRP + Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">
                      MRP (₹) *
                    </label>
                    <input
                      type="number"
                      name="mrp"
                      value={form.mrp}
                      onChange={handleFieldChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none font-semibold text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      name="basePrice"
                      value={form.basePrice}
                      onChange={handleFieldChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none font-semibold text-slate-700"
                    />
                  </div>
                </div>

                {/* Discount preview */}
                {form.mrp && form.basePrice && Number(form.mrp) > Number(form.basePrice) && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl px-3 py-2 font-bold text-center">
                    ✓ Discount applied: {discountPercent(Number(form.mrp), Number(form.basePrice))}% off
                  </div>
                )}

                {/* Status */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleFieldChange}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white font-semibold text-slate-700"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {formError && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl px-3 py-2.5 font-bold">
                    {formError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 border border-slate-350 text-slate-750 py-2.5 rounded-xl text-sm hover:bg-slate-50 transition font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-purple-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    {saving ? "Saving…" : (
                      <><Check className="w-4 h-4 font-bold" /> {editingId ? "Update" : "Add Variant"}</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-slate-100">
            <div className="text-center">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Delete Variant?</h3>
              <p className="text-slate-450 text-sm mb-6 font-medium">
                This action cannot be undone. This variant will be removed from your catalog.
              </p>
              <div className="flex gap-3 font-bold">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 border border-slate-350 text-slate-700 py-2.5 rounded-xl text-sm hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deletingId)}
                  disabled={deleting}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm hover:bg-red-700 disabled:opacity-50 transition"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
