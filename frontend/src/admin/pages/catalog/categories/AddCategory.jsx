import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { uploadFile } from "../../../../services/uploadService";
import { useToast } from "../../../../components/Toast";

export default function AddCategory() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "Active",
    icon: "",
    isFeatured: false,
    parentId: "",
    slug: "",
    metaTitle: "",
    metaDescription: "",
    canonicalUrl: "",
    ogImage: ""
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);

  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingOgImage, setUploadingOgImage] = useState(false);

  const handleIconUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingIcon(true);
      const data = await uploadFile(file, "categories");
      setForm((prev) => ({ ...prev, icon: data.url }));
    } catch (err) {
      console.error(err);
      showToast({ type: "error", message: err.response?.data?.message || "Failed to upload image" });
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleOgImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingOgImage(true);
      const data = await uploadFile(file, "categories");
      setForm((prev) => ({ ...prev, ogImage: data.url }));
    } catch (err) {
      console.error(err);
      showToast({ type: "error", message: err.response?.data?.message || "Failed to upload image" });
    } finally {
      setUploadingOgImage(false);
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/categories`);
        setCategories(res.data.categories || []);
      } catch (error) {
        console.error("Failed to fetch parent categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      showToast({ type: "warning", message: "Category name is required" });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      await axios.post(
        `${import.meta.env.VITE_API_URL}/categories`,
        {
          name: form.name,
          description: form.description,
          status: form.status.toLowerCase(),
          icon: form.icon,
          isFeatured: form.isFeatured,
          parentId: form.parentId || null,
          slug: form.slug,
          metaTitle: form.metaTitle,
          metaDescription: form.metaDescription,
          canonicalUrl: form.canonicalUrl,
          ogImage: form.ogImage
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      navigate("/admin/categories");
    } catch (error) {
      console.error(error);
      showToast({ type: "error", message: error.response?.data?.message || "Failed to create category" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add Category</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block mb-2 font-semibold text-gray-700">Category Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Beverages"
              className="w-full border rounded-lg p-3 outline-none focus:border-green-500"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700">Parent Category (Optional)</label>
            <select
              name="parentId"
              value={form.parentId}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 outline-none focus:border-green-500 bg-white"
            >
              <option value="">None (Top Level)</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block mb-2 font-semibold text-gray-700">Description</label>
          <textarea
            rows="3"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the category..."
            className="w-full border rounded-lg p-3 outline-none focus:border-green-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block mb-2 font-semibold text-gray-700">Category Icon</label>
            <div className="flex items-center gap-3 mt-1">
              {form.icon && (
                <img src={form.icon} alt="Icon Preview" className="w-12 h-12 object-contain border rounded-lg p-1 bg-slate-50" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleIconUpload}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
              />
            </div>
            {uploadingIcon && <span className="text-xs text-green-600 font-semibold block mt-1">Uploading to Cloudinary...</span>}
          </div>

          <div>
            <label className="block mb-2 font-semibold text-gray-700">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 outline-none focus:border-green-500 bg-white"
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-150">
          <input
            type="checkbox"
            id="isFeatured"
            name="isFeatured"
            checked={form.isFeatured}
            onChange={handleChange}
            className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label htmlFor="isFeatured" className="font-semibold text-gray-700 cursor-pointer select-none">
            Featured Category (Show on Homepage highlights)
          </label>
        </div>

        {/* SEO Settings Accordion */}
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => setSeoOpen(!seoOpen)}
            className="w-full flex justify-between items-center bg-gray-50 p-4 font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <span>SEO Settings (Optional)</span>
            <span className="text-xl font-bold">{seoOpen ? "−" : "+"}</span>
          </button>
          {seoOpen && (
            <div className="p-4 space-y-4 bg-white border-t border-gray-200">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">URL Slug</label>
                <input
                  type="text"
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  placeholder="e.g. beverages (auto-generated if left empty)"
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-green-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-gray-700">Meta Title</label>
                    <span className={`text-xs ${form.metaTitle.length > 60 ? "text-red-500 font-bold" : "text-gray-400"}`}>
                      {form.metaTitle.length}/60
                    </span>
                  </div>
                  <input
                    type="text"
                    name="metaTitle"
                    value={form.metaTitle}
                    onChange={handleChange}
                    maxLength={60}
                    placeholder="Enter Meta Title"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-gray-700">Meta Description</label>
                    <span className={`text-xs ${form.metaDescription.length > 160 ? "text-red-500 font-bold" : "text-gray-400"}`}>
                      {form.metaDescription.length}/160
                    </span>
                  </div>
                  <textarea
                    rows="2"
                    name="metaDescription"
                    value={form.metaDescription}
                    onChange={handleChange}
                    maxLength={160}
                    placeholder="Enter Meta Description"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-green-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Canonical URL</label>
                  <input
                    type="url"
                    name="canonicalUrl"
                    value={form.canonicalUrl}
                    onChange={handleChange}
                    placeholder="e.g. https://aryusha.com/categories/beverages"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Open Graph Image (og:image)</label>
                  <div className="flex items-center gap-3 mt-1">
                    {form.ogImage && (
                      <img src={form.ogImage} alt="OG Preview" className="w-12 h-12 object-contain border rounded-lg p-1 bg-slate-50" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleOgImageUpload}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
                    />
                  </div>
                  {uploadingOgImage && <span className="text-xs text-green-600 font-semibold block mt-1">Uploading to Cloudinary...</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold disabled:bg-gray-300 transition-colors"
        >
          {loading ? "Saving..." : "Save Category"}
        </button>
      </form>
    </div>
  );
}