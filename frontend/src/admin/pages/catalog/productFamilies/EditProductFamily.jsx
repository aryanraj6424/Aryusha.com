import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { uploadFile } from "../../../../services/uploadService";
import { useToast } from "../../../../components/Toast";

export default function EditProductFamily() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [formData, setFormData] = useState({
    categoryId: "",
    subCategoryId: "",
    brandId: "",
    familyName: "",
    description: "",
    shortDescription: "",
    status: "Active",
    tags: "",
    unitType: "weight",
    shelfLife: "",
    storageInstructions: "",
    countryOfOrigin: "India",
    fssaiLicenseNumber: "",
    searchKeywords: "",
    structuredDataType: "Product",
    images: [], // array of { url, altText }
    slug: "",
    metaTitle: "",
    metaDescription: "",
    canonicalUrl: "",
    ogImage: ""
  });

  const [newImage, setNewImage] = useState({ url: "", altText: "" });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingOgImage, setUploadingOgImage] = useState(false);

  const handleGalleryImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const data = await uploadFile(file, "product-families");
      setNewImage((prev) => ({ ...prev, url: data.url }));
    } catch (err) {
      console.error(err);
      showToast({ type: "error", message: err.response?.data?.message || "Failed to upload image" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOgImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingOgImage(true);
      const data = await uploadFile(file, "product-families");
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
        const token = localStorage.getItem("adminToken") || localStorage.getItem("vendorToken");
        const headers = { Authorization: `Bearer ${token}` };
        
        const [familyRes, catsRes, subCatsRes, brandsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/product-families/${id}`, { headers }),
          axios.get(`${import.meta.env.VITE_API_URL}/categories`),
          axios.get(`${import.meta.env.VITE_API_URL}/sub-categories`),
          axios.get(`${import.meta.env.VITE_API_URL}/brands`)
        ]);

        const fam = familyRes.data;
        setCategories(catsRes.data.categories || []);
        setSubCategories(subCatsRes.data.subCategories || []);
        setBrands(brandsRes.data.brands || []);

        setFormData({
          categoryId: fam.categoryId?._id || fam.categoryId || "",
          subCategoryId: fam.subCategoryId?._id || fam.subCategoryId || "",
          brandId: fam.brandId?._id || fam.brandId || "",
          familyName: fam.name,
          description: fam.description || "",
          shortDescription: fam.shortDescription || "",
          status: fam.status === "active" ? "Active" : "Inactive",
          tags: fam.tags ? fam.tags.join(", ") : "",
          unitType: fam.unitType || "weight",
          shelfLife: fam.shelfLife || "",
          storageInstructions: fam.storageInstructions || "",
          countryOfOrigin: fam.countryOfOrigin || "India",
          fssaiLicenseNumber: fam.fssaiLicenseNumber || "",
          searchKeywords: fam.searchKeywords ? fam.searchKeywords.join(", ") : "",
          structuredDataType: fam.structuredDataType || "Product",
          images: fam.images || [],
          slug: fam.slug || "",
          metaTitle: fam.metaTitle || "",
          metaDescription: fam.metaDescription || "",
          canonicalUrl: fam.canonicalUrl || "",
          ogImage: fam.ogImage || ""
        });
      } catch (error) {
        console.error("Failed to load product family details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "categoryId") {
        updated.subCategoryId = ""; // Reset subcategory when category changes
      }
      return updated;
    });
  };

  const handleAddImage = () => {
    if (!newImage.url || !newImage.altText) {
      showToast({ type: "warning", message: "Both Image URL and SEO Alt Text are required for accessibility." });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, newImage]
    }));
    setNewImage({ url: "", altText: "" });
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subCategoryId || !formData.familyName) {
      showToast({ type: "warning", message: "Subcategory and Product Family Name are required" });
      return;
    }

    try {
      setUpdating(true);
      const token = localStorage.getItem("adminToken") || localStorage.getItem("vendorToken");
      const headers = { Authorization: `Bearer ${token}` };
      
      const tagsArray = formData.tags
        ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
      const keywordsArray = formData.searchKeywords
        ? formData.searchKeywords.split(",").map((k) => k.trim()).filter(Boolean)
        : [];

      await axios.put(
        `${import.meta.env.VITE_API_URL}/product-families/${id}`,
        {
          subCategoryId: formData.subCategoryId,
          brandId: formData.brandId || null,
          name: formData.familyName,
          description: formData.description,
          shortDescription: formData.shortDescription,
          status: formData.status.toLowerCase(),
          images: formData.images,
          tags: tagsArray,
          unitType: formData.unitType,
          shelfLife: formData.shelfLife,
          storageInstructions: formData.storageInstructions,
          countryOfOrigin: formData.countryOfOrigin,
          fssaiLicenseNumber: formData.fssaiLicenseNumber,
          searchKeywords: keywordsArray,
          structuredDataType: formData.structuredDataType,
          slug: formData.slug,
          metaTitle: formData.metaTitle,
          metaDescription: formData.metaDescription,
          canonicalUrl: formData.canonicalUrl,
          ogImage: formData.ogImage
        },
        { headers }
      );
      
      if (localStorage.getItem("adminToken")) {
        navigate("/admin/product-families");
      } else {
        navigate("/vendor/product-families");
      }
    } catch (error) {
      console.error(error);
      showToast({ type: "error", message: error.response?.data?.message || "Failed to update product family" });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading catalog configurations...</div>;
  }

  const filteredSubCategories = subCategories.filter(
    (sub) => sub.categoryId?._id === formData.categoryId || sub.categoryId === formData.categoryId
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Product Family</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow rounded-xl p-6 space-y-6"
      >
        {/* Core Hierarchy */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="font-semibold block mb-1 text-gray-700">Category</label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="w-full mt-1 border rounded-lg p-3 bg-white outline-none focus:border-blue-500"
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
            <label className="font-semibold block mb-1 text-gray-700">Sub Category</label>
            <select
              name="subCategoryId"
              value={formData.subCategoryId}
              onChange={handleChange}
              className="w-full mt-1 border rounded-lg p-3 bg-white outline-none focus:border-blue-500"
              required
              disabled={!formData.categoryId}
            >
              <option value="">Select Subcategory</option>
              {filteredSubCategories.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold block mb-1 text-gray-700">Brand</label>
            <select
              name="brandId"
              value={formData.brandId}
              onChange={handleChange}
              className="w-full mt-1 border rounded-lg p-3 bg-white outline-none focus:border-blue-500"
            >
              <option value="">Select Brand (Optional)</option>
              {brands.map((brand) => (
                <option key={brand._id} value={brand._id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Basic Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="font-semibold block mb-1 text-gray-700">Product Family Name</label>
            <input
              type="text"
              name="familyName"
              value={formData.familyName}
              onChange={handleChange}
              className="w-full mt-1 border rounded-lg p-3 outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="font-semibold block mb-1 text-gray-700">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full mt-1 border rounded-lg p-3 bg-white outline-none focus:border-blue-500"
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <label className="font-semibold block mb-1 text-gray-700">Short Description (for Listing Cards)</label>
          <textarea
            rows="2"
            name="shortDescription"
            value={formData.shortDescription}
            onChange={handleChange}
            placeholder="Provide a quick tagline/short description..."
            className="w-full mt-1 border rounded-lg p-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="font-semibold block mb-1 text-gray-700">Long Description (Rich / Detail Specs)</label>
          <textarea
            rows="3"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide detail catalog specifications..."
            className="w-full mt-1 border rounded-lg p-3 outline-none focus:border-blue-500"
          />
        </div>

        {/* Image Gallery builder */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
          <label className="font-semibold block text-gray-700">Product Family Images Gallery (Required for SEO)</label>
          
          {formData.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              {formData.images.map((img, idx) => (
                <div key={idx} className="relative border rounded-lg p-2 bg-white flex flex-col items-center">
                  <img src={img.url} alt={img.altText} className="h-16 object-contain mb-1" />
                  <p className="text-[10px] text-gray-500 truncate w-full text-center">{img.altText}</p>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Upload Gallery Image</label>
              <div className="flex items-center gap-2">
                {newImage.url && (
                  <img src={newImage.url} alt="New Preview" className="w-10 h-10 object-contain border rounded bg-white p-1" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleGalleryImageUpload}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
                />
              </div>
              {uploadingImage && <span className="text-[10px] text-green-600 font-semibold block mt-1">Uploading...</span>}
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Image Alt Text (SEO)</label>
              <input
                type="text"
                placeholder="Organic Red Apples pack"
                value={newImage.altText}
                onChange={(e) => setNewImage(prev => ({ ...prev, altText: e.target.value }))}
                className="w-full border rounded-lg p-2 text-sm bg-white outline-none focus:border-green-500"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddImage}
            className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 px-4 rounded-lg mt-2 transition-colors"
          >
            + Add Image to Gallery
          </button>
        </div>

        {/* Specifications & License */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="font-semibold block mb-1 text-sm text-gray-700">Unit Type</label>
            <select
              name="unitType"
              value={formData.unitType}
              onChange={handleChange}
              className="w-full mt-1 border rounded-lg p-2.5 bg-white outline-none focus:border-blue-500"
            >
              <option value="weight">Weight (g, kg)</option>
              <option value="volume">Volume (ml, l)</option>
              <option value="count">Count (pcs, pack)</option>
            </select>
          </div>
          <div>
            <label className="font-semibold block mb-1 text-sm text-gray-700">Shelf Life</label>
            <input
              type="text"
              name="shelfLife"
              value={formData.shelfLife}
              onChange={handleChange}
              placeholder="e.g. 5 days, 12 months"
              className="w-full mt-1 border rounded-lg p-2.5 outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="font-semibold block mb-1 text-sm text-gray-700">Country of Origin</label>
            <input
              type="text"
              name="countryOfOrigin"
              value={formData.countryOfOrigin}
              onChange={handleChange}
              className="w-full mt-1 border rounded-lg p-2.5 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold block mb-1 text-sm text-gray-700">Storage Instructions</label>
            <input
              type="text"
              name="storageInstructions"
              value={formData.storageInstructions}
              onChange={handleChange}
              placeholder="e.g. Keep refrigerated below 4°C"
              className="w-full mt-1 border rounded-lg p-2.5 outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="font-semibold block mb-1 text-sm text-gray-700">FSSAI License Number (Food Items)</label>
            <input
              type="text"
              name="fssaiLicenseNumber"
              value={formData.fssaiLicenseNumber}
              onChange={handleChange}
              placeholder="e.g. 14-digit license"
              className="w-full mt-1 border rounded-lg p-2.5 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold block mb-1 text-sm text-gray-700">Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="organic, bestseller, vegan"
              className="w-full mt-1 border rounded-lg p-2.5 outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="font-semibold block mb-1 text-sm text-gray-700">Search Keywords (comma-separated)</label>
            <input
              type="text"
              name="searchKeywords"
              value={formData.searchKeywords}
              onChange={handleChange}
              placeholder="fresh apple, seb, red apples"
              className="w-full mt-1 border rounded-lg p-2.5 outline-none focus:border-green-500"
            />
          </div>
        </div>

        {/* Structured Data Selection */}
        <div>
          <label className="font-semibold block mb-1 text-sm text-gray-700">Schema.org Structured Data Type</label>
          <select
            name="structuredDataType"
            value={formData.structuredDataType}
            onChange={handleChange}
            className="w-full mt-1 border rounded-lg p-3 bg-white outline-none focus:border-green-500"
          >
            <option value="Product">Product (General Product)</option>
            <option value="FoodProduct">Food Product (Nutrition/FSSAI relevant)</option>
          </select>
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
                  placeholder="e.g. shimla-apples (auto-generated if left empty)"
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
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
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
                    placeholder="e.g. https://aryusha.com/products/shimla-apples"
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
          {updating ? "Updating..." : "Update Product Family"}
        </button>
      </form>
    </div>
  );
}
