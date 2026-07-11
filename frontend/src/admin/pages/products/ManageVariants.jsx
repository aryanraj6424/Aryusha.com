import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Plus, Pencil, Trash2, ChevronLeft, Tag, Package, X, Check } from "lucide-react";
import {
  getProduct,
  getVariants,
  createVariant,
  updateVariant,
  deleteVariant,
} from "../../services/productApi";

/**
 * ManageVariants — dedicated page to add / edit / delete pack-size variants
 * for an existing product.
 *
 * Route: /admin/products/:id/variants
 */

const PACK_UNITS = ["g", "kg", "ml", "l", "pcs"];

const EMPTY_VARIANT = {
  variantLabel: "",    // e.g. "1 kg", "500 ml"
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
  const [editingId, setEditingId] = useState(null);   // null = creating new
  const [form, setForm] = useState(EMPTY_VARIANT);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [prod, vars] = await Promise.all([
          getProduct(productId),
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

  // ── Form helpers ─────────────────────────────────────────────────────────
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

  // Auto-generate variant label from pack size
  const autoLabel = () => {
    if (form.packSize.value && form.packSize.unit) {
      setForm((prev) => ({
        ...prev,
        variantLabel: `${prev.packSize.value} ${prev.packSize.unit}`,
      }));
    }
  };

  // Auto-generate SKU from product name + pack size
  const autoSku = () => {
    if (product && form.packSize.value && form.packSize.unit) {
      const prefix = product.name
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
        .slice(0, 5);
      const suffix = `${form.packSize.value}${form.packSize.unit.toUpperCase()}`;
      setForm((prev) => ({ ...prev, sku: `${prefix}-${suffix}-${Date.now().toString().slice(-4)}` }));
    }
  };

  // ── Validate ─────────────────────────────────────────────────────────────
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

  // ── Save ─────────────────────────────────────────────────────────────────
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

  // ── Delete ───────────────────────────────────────────────────────────────
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

  // ── Helpers ──────────────────────────────────────────────────────────────
  const discountPercent = (mrp, price) => {
    if (!mrp || mrp <= price) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <div className="text-gray-400">Loading…</div>
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

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <button onClick={() => navigate("/admin/products")} className="hover:text-indigo-600 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Products
        </button>
        <span>/</span>
        <span className="text-gray-800 font-medium">{product.name}</span>
        <span>/</span>
        <span className="text-indigo-600 font-medium">Manage Variants</span>
      </div>

      {/* ── Product summary card ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
        {product.images?.[0] && (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-16 h-16 rounded-xl object-cover border border-gray-100"
          />
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{product.name}</h1>
          <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
            <span>{product.categoryId?.name}</span>
            <span>›</span>
            <span>{product.subCategoryId?.name}</span>
            <span>›</span>
            <span>{product.familyId?.name}</span>
          </div>
          <div className="flex gap-2 mt-2">
            <span className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
              <Package className="w-3 h-3" /> {product.unitType}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              product.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
            }`}>
              {product.status}
            </span>
          </div>
        </div>
        <Link
          to={`/admin/products/edit/${productId}`}
          className="text-xs text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition shrink-0"
        >
          Edit Product
        </Link>
      </div>

      {/* ── Section header ── */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Pack-Size Variants</h2>
          <p className="text-sm text-gray-500">
            {variants.length} variant{variants.length !== 1 ? "s" : ""} — each variant is a sellable SKU with its own price and pack size.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
        >
          <Plus className="w-4 h-4" /> Add Variant
        </button>
      </div>

      {/* ── Variants table ── */}
      {variants.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <Tag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No variants yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Add at least one pack-size variant (e.g. 500g, 1 kg) to make this product sellable.
          </p>
          <button
            onClick={openCreate}
            className="mt-4 bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
          >
            + Add First Variant
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Variant</th>
                <th className="text-left px-4 py-3 font-medium">SKU</th>
                <th className="text-right px-4 py-3 font-medium">MRP</th>
                <th className="text-right px-4 py-3 font-medium">Price</th>
                <th className="text-right px-4 py-3 font-medium">Discount</th>
                <th className="text-center px-4 py-3 font-medium">Status</th>
                <th className="text-center px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {variants.map((v) => (
                <tr key={v._id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-900">{v.variantLabel}</p>
                    <p className="text-gray-400 text-xs">
                      {v.packSize.value} {v.packSize.unit}
                      {v.barcode ? ` · ${v.barcode}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs text-gray-600">{v.sku}</td>
                  <td className="px-4 py-4 text-right text-gray-600">₹{v.mrp}</td>
                  <td className="px-4 py-4 text-right font-semibold text-gray-900">₹{v.basePrice}</td>
                  <td className="px-4 py-4 text-right">
                    {discountPercent(v.mrp, v.basePrice) > 0 ? (
                      <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {discountPercent(v.mrp, v.basePrice)}% off
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      v.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openEdit(v)}
                        className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition"
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

      {/* ── Inline Add/Edit Form (slide-in panel) ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="flex-1 bg-black/30" onClick={closeForm} />

          {/* Panel */}
          <div className="w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingId ? "Edit Variant" : "Add Variant"}
                </h3>
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">

                {/* Pack Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pack Size <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="packSize.value"
                      value={form.packSize.value}
                      onChange={handleFieldChange}
                      onBlur={() => { autoLabel(); autoSku(); }}
                      placeholder="500"
                      min="0.001"
                      step="any"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <select
                      name="packSize.unit"
                      value={form.packSize.unit}
                      onChange={handleFieldChange}
                      onBlur={() => { autoLabel(); autoSku(); }}
                      className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {PACK_UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Variant Label */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Variant Label <span className="text-red-500">*</span>
                    <span className="text-gray-400 font-normal ml-1">(displayed to customer)</span>
                  </label>
                  <input
                    type="text"
                    name="variantLabel"
                    value={form.variantLabel}
                    onChange={handleFieldChange}
                    placeholder="e.g. 500 g, 1 kg, Pack of 6"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU <span className="text-red-500">*</span>
                    <span className="text-gray-400 font-normal ml-1">(unique, auto-generated on blur)</span>
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={form.sku}
                    onChange={handleFieldChange}
                    placeholder="e.g. ASHWWAT-1KG-3492"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Barcode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode (EAN/UPC)</label>
                  <input
                    type="text"
                    name="barcode"
                    value={form.barcode}
                    onChange={handleFieldChange}
                    placeholder="Optional"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* MRP + Base Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MRP (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="mrp"
                      value={form.mrp}
                      onChange={handleFieldChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selling Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="basePrice"
                      value={form.basePrice}
                      onChange={handleFieldChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Live discount preview */}
                {form.mrp && form.basePrice && Number(form.mrp) > Number(form.basePrice) && (
                  <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2">
                    ✓ Discount: {discountPercent(Number(form.mrp), Number(form.basePrice))}% off
                  </div>
                )}

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleFieldChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Form error */}
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2.5">
                    {formError}
                  </div>
                )}

                {/* Save / Cancel */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                  >
                    {saving ? "Saving…" : (
                      <><Check className="w-4 h-4" /> {editingId ? "Update" : "Add Variant"}</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ── */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Variant?</h3>
              <p className="text-gray-500 text-sm mb-6">
                This action cannot be undone. Any vendor listings for this variant will also be removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deletingId)}
                  disabled={deleting}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition"
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
