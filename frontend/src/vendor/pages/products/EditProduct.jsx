import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Save } from "lucide-react";
import { getProductById, updateVendorProduct } from "../../services/vendorApi";
import { getCategories, getSubCategories, getProductFamilies } from "../../services/vendorApi";

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

  useEffect(() => {
    const load = async () => {
      try {
        const [prod, cats] = await Promise.all([
          getProductById(id),
          getCategories(),
        ]);
        setForm({
          name: prod.name || "",
          brand: prod.brand || "",
          categoryId: prod.categoryId?._id || prod.categoryId || "",
          subCategoryId: prod.subCategoryId?._id || prod.subCategoryId || "",
          familyId: prod.familyId?._id || prod.familyId || "",
          unitType: prod.unitType || "",
          description: prod.description || "",
          status: prod.status || "pending",
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

  useEffect(() => {
    if (!form?.categoryId) { setSubCategories([]); return; }
    getSubCategories(form.categoryId)
      .then((data) => setSubCategories(data || []))
      .catch(console.error);
  }, [form?.categoryId]);

  useEffect(() => {
    if (!form?.subCategoryId) { setFamilies([]); return; }
    getProductFamilies(form.subCategoryId)
      .then((data) => {
        // Only show approved product families for vendors to choose from
        const approved = (data || []).filter(f => f.approvalStatus === "approved");
        setFamilies(approved);
      })
      .catch(console.error);
  }, [form?.subCategoryId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "categoryId") {
      setForm((prev) => ({ ...prev, categoryId: value, subCategoryId: "", familyId: "" }));
      return;
    }
    if (name === "subCategoryId") {
      setForm((prev) => ({ ...prev, subCategoryId: value, familyId: "" }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Product name is required."); return; }
    if (!form.unitType) { setError("Unit type is required."); return; }

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      await updateVendorProduct(id, {
        name: form.name.trim(),
        brand: form.brand.trim(),
        categoryId: form.categoryId,
        subCategoryId: form.subCategoryId,
        familyId: form.familyId,
        unitType: form.unitType,
        description: form.description.trim(),
        status: form.status === "draft" ? "draft" : "pending", // send draft or pending
      });
      setSuccess(true);
      setTimeout(() => navigate(`/vendor/products`), 1200);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update product.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 font-semibold">Loading…</div>;
  }

  if (!form) {
    return <div className="p-8 text-center text-rose-600 font-semibold">Product not found.</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6 font-semibold">
        <button onClick={() => navigate("/vendor/products")} className="hover:text-purple-650 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Products
        </button>
        <span>/</span>
        <span className="text-slate-800 font-medium">Edit Product</span>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm font-semibold text-slate-700">
        <h1 className="text-xl font-extrabold text-slate-800 mb-6">Edit Product</h1>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Category cascade */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Category</label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white font-medium"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Sub Category</label>
              <select
                name="subCategoryId"
                value={form.subCategoryId}
                onChange={handleChange}
                disabled={!form.categoryId}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 bg-white font-medium"
              >
                <option value="">Select Sub Category</option>
                {subCategories.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Product Family</label>
              <select
                name="familyId"
                value={form.familyId}
                onChange={handleChange}
                disabled={!form.subCategoryId}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 bg-white font-medium"
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
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter product name"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
            />
          </div>

          {/* Brand + Unit Type */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Brand</label>
              <input
                type="text"
                name="brand"
                value={form.brand}
                onChange={handleChange}
                placeholder="Brand name"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">
                Unit Type <span className="text-red-500">*</span>
              </label>
              <select
                name="unitType"
                value={form.unitType}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white font-medium"
              >
                <option value="">Select Unit Type</option>
                <option value="weight">Weight (g / kg)</option>
                <option value="volume">Volume (ml / l)</option>
                <option value="count">Count (pcs)</option>
              </select>
            </div>
          </div>

          {/* Status info */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium bg-slate-50 disabled:opacity-80"
              disabled
            >
              <option value="draft">Draft</option>
              <option value="pending">Pending Admin Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Product description…"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none font-medium text-slate-650"
            />
          </div>

          {/* Feedback */}
          {error && (
            <div className="bg-rose-50 border border-rose-250 text-rose-700 text-sm rounded-xl px-4 py-3 font-semibold">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-250 text-emerald-700 text-sm rounded-xl px-4 py-3 font-semibold">
              ✓ Product request updated! Redirecting…
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2 font-semibold">
            <button
              type="button"
              onClick={() => navigate(`/vendor/products`)}
              className="flex-1 border border-slate-350 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
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
