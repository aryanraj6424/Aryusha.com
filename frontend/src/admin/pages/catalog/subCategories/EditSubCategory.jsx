import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { uploadFile } from "../../../../services/uploadService";
import { useToast } from "../../../../components/Toast";

export default function EditSubCategory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    categoryId: "",
    name: "",
    description: "",
    status: true,
    slug: "",
    metaTitle: "",
    metaDescription: "",
    canonicalUrl: "",
    ogImage: ""
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);

  const [uploadingOgImage, setUploadingOgImage] = useState(false);

  const handleOgImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingOgImage(true);
      const data = await uploadFile(file, "subcategories");
      setFormData((prev) => ({ ...prev, ogImage: data.url }));
    } catch (err) {
      console.error(err);
      showToast({ type: "error", message: err.response?.data?.message || "Failed to upload image" });
    } finally {
      setUploadingOgImage(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const [subRes, catsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/sub-categories/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/categories`)
        ]);

        const sub = subRes.data;
        setCategories(catsRes.data.categories || []);
        setFormData({
          categoryId: sub.categoryId?._id || sub.categoryId || "",
          name: sub.name,
          description: sub.description || "",
          status: sub.status === "active",
          slug: sub.slug || "",
          metaTitle: sub.metaTitle || "",
          metaDescription: sub.metaDescription || "",
          canonicalUrl: sub.canonicalUrl || "",
          ogImage: sub.ogImage || ""
        });
      } catch (error) {
        console.error("Failed to load subcategory edit data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.categoryId || !formData.name) {
      showToast({ type: "warning", message: "Category and Subcategory Name are required" });
      return;
    }

    try {
      setUpdating(true);
      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/sub-categories/${id}`,
        {
          categoryId: formData.categoryId,
          name: formData.name,
          description: formData.description,
          status: formData.status ? "active" : "inactive",
          slug: formData.slug,
          metaTitle: formData.metaTitle,
          metaDescription: formData.metaDescription,
          canonicalUrl: formData.canonicalUrl,
          ogImage: formData.ogImage
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate("/admin/sub-categories");
    } catch (error) {
      console.error(error);
      showToast({ type: "error", message: error.response?.data?.message || "Failed to update subcategory" });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading subcategory details...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Sub Category</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="font-semibold block mb-1 text-gray-700">Parent Category</label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 mt-1 bg-white outline-none focus:border-blue-500"
              required
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold block mb-1 text-gray-700">Sub Category Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 mt-1 outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="font-semibold block mb-1 text-gray-700">Description</label>
          <textarea
            rows="3"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 mt-1 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="flex gap-3 items-center font-semibold text-gray-700 cursor-pointer select-none">
            <input
              type="checkbox"
              name="status"
              checked={formData.status}
              onChange={handleChange}
              className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            Active
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
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="e.g. fresh-apples (auto-generated if left empty)"
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-gray-700">Meta Title</label>
                    <span className={`text-xs ${formData.metaTitle.length > 60 ? "text-red-500 font-bold" : "text-gray-400"}`}>
                      {formData.metaTitle.length}/60
                    </span>
                  </div>
                  <input
                    type="text"
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleChange}
                    maxLength={60}
                    placeholder="Enter Meta Title"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-gray-700">Meta Description</label>
                    <span className={`text-xs ${formData.metaDescription.length > 160 ? "text-red-500 font-bold" : "text-gray-400"}`}>
                      {formData.metaDescription.length}/160
                    </span>
                  </div>
                  <textarea
                    rows="2"
                    name="metaDescription"
                    value={formData.metaDescription}
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
                    value={formData.canonicalUrl}
                    onChange={handleChange}
                    placeholder="e.g. https://aryusha.com/categories/sub/apples"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Open Graph Image (og:image)</label>
                  <div className="flex items-center gap-3 mt-1">
                    {formData.ogImage && (
                      <img src={formData.ogImage} alt="OG Preview" className="w-12 h-12 object-contain border rounded-lg p-1 bg-slate-50" />
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
          disabled={updating}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold disabled:bg-gray-300 transition-colors"
        >
          {updating ? "Updating..." : "Update Sub Category"}
        </button>
      </form>
    </div>
  );
}
