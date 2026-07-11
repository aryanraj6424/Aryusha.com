import { useEffect, useState } from "react";
import { getCategories, getSubCategories, getProductFamilies } from "../../services/productApi";

/**
 * BasicInformation — Step 1 of AddProduct wizard
 *
 * Handles the cascading Category → SubCategory → Product Family selectors
 * plus the product name, brand, unit type and status fields.
 *
 * Props
 *   formData    – shared form state object from AddProduct
 *   setFormData – setter for that state
 */
export default function BasicInformation({ formData, setFormData }) {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [families, setFamilies] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [loadingFamilies, setLoadingFamilies] = useState(false);

  // Load categories once on mount
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

  // Load sub-categories whenever category changes
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

  // Load product families whenever sub-category changes
  useEffect(() => {
    if (!formData.subCategoryId) {
      setFamilies([]);
      return;
    }
    const load = async () => {
      try {
        setLoadingFamilies(true);
        const data = await getProductFamilies(formData.subCategoryId);
        setFamilies(data || []);
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

    // Reset dependent fields when a parent changes
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
    <div className="space-y-6">
      {/* ── Catalog Hierarchy ── */}
      <div className="grid md:grid-cols-3 gap-4">

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">{loadingCats ? "Loading…" : "Select Category"}</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Sub Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sub Category <span className="text-red-500">*</span>
          </label>
          <select
            name="subCategoryId"
            value={formData.subCategoryId}
            onChange={handleChange}
            disabled={!formData.categoryId}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">
              {!formData.categoryId ? "Select Category first" : loadingSubs ? "Loading…" : "Select Sub Category"}
            </option>
            {subCategories.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Product Family */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Family <span className="text-red-500">*</span>
          </label>
          <select
            name="familyId"
            value={formData.familyId}
            onChange={handleChange}
            disabled={!formData.subCategoryId}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">
              {!formData.subCategoryId ? "Select Sub Category first" : loadingFamilies ? "Loading…" : "Select Product Family"}
            </option>
            {families.map((f) => (
              <option key={f._id} value={f._id}>{f.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Product Details ── */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Product Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Aashirvaad Whole Wheat Atta"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Brand */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
          <input
            type="text"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            placeholder="e.g. Aashirvaad"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Unit Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unit Type <span className="text-red-500">*</span>
          </label>
          <select
            name="unitType"
            value={formData.unitType}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Unit Type</option>
            <option value="weight">Weight (g / kg)</option>
            <option value="volume">Volume (ml / l)</option>
            <option value="count">Count (pcs)</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Returnable */}
        <div className="flex items-center gap-3 pt-6">
          <input
            type="checkbox"
            id="isReturnable"
            name="isReturnable"
            checked={formData.isReturnable || false}
            onChange={(e) => setFormData({ ...formData, isReturnable: e.target.checked })}
            className="w-4 h-4 accent-indigo-600"
          />
          <label htmlFor="isReturnable" className="text-sm font-medium text-gray-700">
            Returnable Product
          </label>
        </div>
      </div>
    </div>
  );
}