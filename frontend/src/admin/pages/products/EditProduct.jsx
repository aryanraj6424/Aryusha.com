import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Save } from "lucide-react";
import { getProduct, updateProduct } from "../../services/productApi";
import { getCategories, getSubCategories, getProductFamilies } from "../../services/productApi";

/**
 * EditProduct — full edit form for an existing product.
 *
 * Route: /admin/products/edit/:id
 */
export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Load product + categories
  useEffect(() => {
    const load = async () => {
      try {
        const [prod, cats] = await Promise.all([
          getProduct(id),
          getCategories(),
        ]);
        setForm({
          name: prod.name || "",
          brand: prod.brand || "",
          categoryId: prod.categoryId?._id || "",
          subCategoryId: prod.subCategoryId?._id || "",
          familyId: prod.familyId?._id || "",
          unitType: prod.unitType || "",
          description: prod.description || "",
          status: prod.status || "draft",
          isReturnable: prod.isReturnable || false,
        });
        setCategories(cats || []);
      } catch (err) {
        console.error("Failed to load product:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Load sub-categories when category changes
  useEffect(() => {
    if (!form?.categoryId) { setSubCategories([]); return; }
    getSubCategories(form.categoryId)
      .then((data) => setSubCategories(data || []))
      .catch(console.error);
  }, [form?.categoryId]);

  // Load families when sub-category changes
  useEffect(() => {
    if (!form?.subCategoryId) { setFamilies([]); return; }
    getProductFamilies(form.subCategoryId)
      .then((data) => setFamilies(data || []))
      .catch(console.error);
  }, [form?.subCategoryId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    if (name === "categoryId") {
      setForm((prev) => ({ ...prev, categoryId: value, subCategoryId: "", familyId: "" }));
      return;
    }
    if (name === "subCategoryId") {
      setForm((prev) => ({ ...prev, subCategoryId: value, familyId: "" }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Product name is required."); return; }
    if (!form.unitType) { setError("Unit type is required."); return; }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      await updateProduct(id, {
        name: form.name.trim(),
        brand: form.brand.trim(),
        categoryId: form.categoryId,
        subCategoryId: form.subCategoryId,
        familyId: form.familyId,
        unitType: form.unitType,
        description: form.description.trim(),
        status: form.status,
        isReturnable: form.isReturnable,
      });
      setSuccess(true);
      setTimeout(() => navigate(`/admin/products/${id}`), 1200);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update product.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading…</div>;
  }

  if (!form) {
    return <div className="p-8 text-center text-red-600">Product not found.</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <button onClick={() => navigate("/admin/products")} className="hover:text-indigo-600 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Products
        </button>
        <span>/</span>
        <span className="text-gray-800 font-medium">Edit Product</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Edit Product</h1>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Category cascade */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label>
              <select
                name="subCategoryId"
                value={form.subCategoryId}
                onChange={handleChange}
                disabled={!form.categoryId}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">Select Sub Category</option>
                {subCategories.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Family</label>
              <select
                name="familyId"
                value={form.familyId}
                onChange={handleChange}
                disabled={!form.subCategoryId}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">Select Family</option>
                {families.map((f) => (
                  <option key={f._id} value={f._id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter product name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Brand + Unit Type */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input
                type="text"
                name="brand"
                value={form.brand}
                onChange={handleChange}
                placeholder="Brand name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Type <span className="text-red-500">*</span>
              </label>
              <select
                name="unitType"
                value={form.unitType}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Select Unit Type</option>
                <option value="weight">Weight (g / kg)</option>
                <option value="volume">Volume (ml / l)</option>
                <option value="count">Count (pcs)</option>
              </select>
            </div>
          </div>

          {/* Status + Returnable */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="isReturnable"
                name="isReturnable"
                checked={form.isReturnable}
                onChange={handleChange}
                className="w-4 h-4 accent-indigo-600"
              />
              <label htmlFor="isReturnable" className="text-sm font-medium text-gray-700">
                Returnable Product
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Product description…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
            />
          </div>

          {/* Feedback */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
              ✓ Product updated! Redirecting…
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(`/admin/products/${id}`)}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}