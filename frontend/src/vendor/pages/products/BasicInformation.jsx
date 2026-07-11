import { useEffect, useState } from "react";
import { getCategories, getSubCategories, getProductFamilies } from "../../services/vendorApi";

export default function BasicInformation({ formData, setFormData }) {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [families, setFamilies] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [loadingFamilies, setLoadingFamilies] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingCats(true);
        const data = await getCategories();
        setCategories(data || []);
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setLoadingCats(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!formData.categoryId) {
      setSubCategories([]);
      setFamilies([]);
      return;
    }
    const load = async () => {
      try {
        setLoadingSubs(true);
        const data = await getSubCategories(formData.categoryId);
        setSubCategories(data || []);
        setFamilies([]);
      } catch (err) {
        console.error("Failed to load sub-categories:", err);
      } finally {
        setLoadingSubs(false);
      }
    };
    load();
  }, [formData.categoryId]);

  useEffect(() => {
    if (!formData.subCategoryId) {
      setFamilies([]);
      return;
    }
    const load = async () => {
      try {
        setLoadingFamilies(true);
        const data = await getProductFamilies(formData.subCategoryId);
        // Only show approved product families for vendors to choose from
        const approved = (data || []).filter(f => f.approvalStatus === "approved");
        setFamilies(approved);
      } catch (err) {
        console.error("Failed to load product families:", err);
      } finally {
        setLoadingFamilies(false);
      }
    };
    load();
  }, [formData.subCategoryId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "categoryId") {
      setFormData({ ...formData, categoryId: value, subCategoryId: "", familyId: "" });
      return;
    }
    if (name === "subCategoryId") {
      setFormData({ ...formData, subCategoryId: value, familyId: "" });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 text-sm font-semibold text-slate-700">
      <h3 className="text-lg font-extrabold text-slate-800 border-b pb-2">Basic Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Category */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Category *</label>
          <select
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-white font-medium"
            required
          >
            <option value="">{loadingCats ? "Loading…" : "Select Category"}</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Subcategory */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Subcategory *</label>
          <select
            name="subCategoryId"
            value={formData.subCategoryId}
            onChange={handleChange}
            disabled={!formData.categoryId}
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-white disabled:opacity-50 font-medium"
            required
          >
            <option value="">
              {!formData.categoryId ? "Select Category first" : loadingSubs ? "Loading…" : "Select Subcategory"}
            </option>
            {subCategories.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Product Family */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Product Family *</label>
          <select
            name="familyId"
            value={formData.familyId}
            onChange={handleChange}
            disabled={!formData.subCategoryId}
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none bg-white disabled:opacity-50 font-medium"
            required
          >
            <option value="">
              {!formData.subCategoryId ? "Select Subcategory first" : loadingFamilies ? "Loading…" : "Select Product Family"}
            </option>
            {families.map((f) => (
              <option key={f._id} value={f._id}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-semibold text-slate-700">
        {/* Product Name */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Product Name *</label>
          <input
            type="text"
            required
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Fortune Sunflower Oil"
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium"
          />
        </div>

        {/* Brand */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Brand</label>
          <input
            type="text"
            name="brand"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            placeholder="e.g. Fortune"
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-semibold text-slate-700">
        {/* Unit Type */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Unit Type *</label>
          <select
            name="unitType"
            value={formData.unitType}
            onChange={handleChange}
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium"
            required
          >
            <option value="">Select Unit Type</option>
            <option value="weight">Weight (g/kg)</option>
            <option value="volume">Volume (ml/L)</option>
            <option value="count">Count (pcs)</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-medium bg-slate-50 disabled:opacity-80"
            disabled
          >
            <option value="draft">Draft</option>
            <option value="pending">Pending Admin Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
    </div>
  );
}
