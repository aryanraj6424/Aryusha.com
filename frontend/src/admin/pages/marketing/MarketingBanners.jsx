import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Pencil, Trash2, X, Search, ToggleLeft, ToggleRight, ImageIcon, Package, Store } from "lucide-react";
import { uploadFile } from "../../../services/uploadService";
import { useToast } from "../../../components/Toast";
import ConfirmDialog from "../../../components/Toast/ConfirmDialog";

// ─── Banner Form Modal ──────────────────────────────────────────────────────────
function BannerFormModal({ banner, vendors, products, onSave, onClose }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    image: banner?.image || "",
    productId: banner?.productId?._id || banner?.productId || "",
    vendorId: banner?.vendorId?._id || banner?.vendorId || "",
    isActive: banner?.isActive !== undefined ? banner.isActive : true,
    startDate: banner?.startDate ? banner.startDate.slice(0, 10) : "",
    endDate: banner?.endDate ? banner.endDate.slice(0, 10) : "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState(
    banner?.productId?.name || ""
  );
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const selectedProduct = products.find((p) => p._id === form.productId);
  const selectedVendor = vendors.find((v) => v._id === form.vendorId);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const data = await uploadFile(file, "banners");
      setForm((prev) => ({ ...prev, image: data.url }));
    } catch (err) {
      showToast({ type: "error", message: "Failed to upload image" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.image) return showToast({ type: "warning", message: "Please upload a banner image" });
    if (!form.productId) return showToast({ type: "warning", message: "Please select a linked product" });
    if (!form.vendorId) return showToast({ type: "warning", message: "Please select a target vendor" });

    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      const payload = {
        image: form.image,
        productId: form.productId,
        vendorId: form.vendorId,
        isActive: form.isActive,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };

      if (banner?._id) {
        await axios.put(`${import.meta.env.VITE_API_URL}/admin/banners/${banner._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showToast({ type: "success", message: "Banner updated successfully" });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/admin/banners`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showToast({ type: "success", message: "Banner created successfully" });
      }
      onSave();
    } catch (err) {
      showToast({ type: "error", message: err.response?.data?.message || "Failed to save banner" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-slate-800">
            {banner ? "Edit Banner" : "Add New Banner"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Banner Image *</label>
            {form.image ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 mb-2">
                <img src={form.image} alt="Banner Preview" className="w-full h-40 object-cover" />
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, image: "" }))}
                  className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-lg hover:bg-black/70"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50">
                <ImageIcon size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs text-slate-500 mb-3">Upload a banner image (recommended: 16:4 ratio)</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                />
                {uploading && <p className="text-xs text-purple-600 font-semibold mt-2">Uploading...</p>}
              </div>
            )}
          </div>

          {/* Product Picker */}
          <div className="relative">
            <label className="block text-sm font-bold text-slate-700 mb-2">Linked Product *</label>
            {selectedProduct && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-purple-50 rounded-xl border border-purple-100">
                <Package size={14} className="text-purple-600 flex-shrink-0" />
                <span className="text-sm font-bold text-purple-800 flex-1 truncate">{selectedProduct.name}</span>
                <button
                  type="button"
                  onClick={() => { setForm((p) => ({ ...p, productId: "" })); setProductSearch(""); }}
                  className="text-purple-400 hover:text-purple-700"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            {!selectedProduct && (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => { setProductSearch(e.target.value); setShowProductDropdown(true); }}
                  onFocus={() => setShowProductDropdown(true)}
                  className="w-full pl-8 pr-3 py-2.5 border rounded-xl text-sm outline-none focus:border-purple-500 transition"
                />
                {showProductDropdown && filteredProducts.length > 0 && (
                  <div className="absolute z-20 top-full mt-1 w-full bg-white border border-slate-100 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                    {filteredProducts.slice(0, 30).map((p) => (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, productId: p._id }));
                          setProductSearch(p.name);
                          setShowProductDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-purple-50 transition border-b border-slate-50 last:border-0"
                      >
                        {p.images?.[0] && <img src={p.images[0]} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-700 truncate">{p.name}</p>
                          {p.brand && <p className="text-[11px] text-slate-400">{p.brand}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Vendor Picker */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Target Vendor / Service Area *</label>
            <select
              value={form.vendorId}
              onChange={(e) => setForm((p) => ({ ...p, vendorId: e.target.value }))}
              className="w-full border rounded-xl px-3 py-2.5 outline-none focus:border-purple-500 text-sm font-semibold bg-white"
            >
              <option value="">-- Select a Vendor --</option>
              {vendors.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.shopName} {v.address?.city ? `(${v.address.city})` : ""}
                </option>
              ))}
            </select>
            {selectedVendor && (
              <p className="text-xs text-slate-500 mt-1">
                Customers in <strong>{selectedVendor.shopName}</strong>'s service area will see this banner.
              </p>
            )}
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div>
              <p className="text-sm font-bold text-slate-700">Active Status</p>
              <p className="text-xs text-slate-500">Inactive banners are hidden from customers</p>
            </div>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
              className={`transition ${form.isActive ? "text-green-600" : "text-slate-400"}`}
            >
              {form.isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>

          {/* Optional Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Start Date (optional)</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">End Date (optional)</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </form>

        <div className="p-4 border-t flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || uploading}
            className="flex-1 py-2.5 bg-[#1a5d1a] text-white rounded-xl text-sm font-bold hover:bg-green-800 transition disabled:opacity-60"
          >
            {saving ? "Saving..." : banner ? "Save Changes" : "Create Banner"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main MarketingBanners Page ─────────────────────────────────────────────────
export default function MarketingBanners() {
  const { showToast } = useToast();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editBanner, setEditBanner] = useState(null);
  const [confirmState, setConfirmState] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const headers = { Authorization: `Bearer ${token}` };

      const [bannersRes, vendorsRes, productsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/admin/banners`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/admin/vendors/all`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/admin/product/all`, { headers }),
      ]);

      setBanners(bannersRes.data.banners || []);
      setVendors(vendorsRes.data.vendors || []);
      setProducts(productsRes.data.products || []);
    } catch (err) {
      console.error("Error loading banners:", err);
      showToast({ type: "error", message: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (bannerId) => {
    setConfirmState({
      message: "Are you sure you want to delete this banner? This cannot be undone.",
      type: "danger",
      onConfirm: async () => {
        setConfirmState(null);
        try {
          const token = localStorage.getItem("adminToken");
          await axios.delete(`${import.meta.env.VITE_API_URL}/admin/banners/${bannerId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showToast({ type: "success", message: "Banner deleted" });
          fetchAll();
        } catch {
          showToast({ type: "error", message: "Failed to delete banner" });
        }
      },
    });
  };

  const handleToggle = async (banner) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/banners/${banner._id}`,
        { isActive: !banner.isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast({ type: "success", message: `Banner ${!banner.isActive ? "activated" : "deactivated"}` });
      fetchAll();
    } catch {
      showToast({ type: "error", message: "Failed to update banner" });
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center py-20">
        <p className="text-slate-400 text-sm font-semibold">Loading banners...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Marketing & Banners</h1>
          <p className="text-slate-500 text-sm mt-0.5">Create and manage promotional banners targeted to specific vendor areas</p>
        </div>
        <button
          onClick={() => { setEditBanner(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1a5d1a] text-white rounded-xl font-bold text-sm hover:bg-green-800 transition shadow-sm"
        >
          <Plus size={16} /> Add Banner
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Banners</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{banners.length}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Active</p>
          <p className="text-2xl font-black text-green-600 mt-1">{banners.filter(b => b.isActive).length}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Inactive</p>
          <p className="text-2xl font-black text-slate-400 mt-1">{banners.filter(b => !b.isActive).length}</p>
        </div>
      </div>

      {/* Banners Grid */}
      {banners.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center text-slate-400 shadow-sm">
          <ImageIcon size={48} className="mx-auto mb-4 opacity-25" />
          <p className="font-bold text-slate-500">No banners yet</p>
          <p className="text-sm mt-1">Click "Add Banner" to create your first promotional banner</p>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner) => (
            <div key={banner._id} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition">
              <div className="flex gap-4 p-4">
                {/* Image Preview */}
                <div className="w-48 h-28 flex-shrink-0 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                  {banner.image ? (
                    <img src={banner.image} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ImageIcon size={24} />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${banner.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                          {banner.isActive ? "Active" : "Inactive"}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{banner._id?.slice(-8)}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-sm text-slate-700 mb-1">
                        <Package size={13} className="text-purple-500 flex-shrink-0" />
                        <span className="font-bold truncate">{banner.productId?.name || "—"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Store size={13} className="text-blue-500 flex-shrink-0" />
                        <span className="font-semibold truncate">{banner.vendorId?.shopName || "—"}</span>
                        {banner.vendorId?.address?.city && (
                          <span className="text-slate-400 text-xs">({banner.vendorId.address.city})</span>
                        )}
                      </div>

                      {(banner.startDate || banner.endDate) && (
                        <p className="text-xs text-slate-400 mt-1.5">
                          {banner.startDate ? new Date(banner.startDate).toLocaleDateString("en-IN") : "Open"} → {banner.endDate ? new Date(banner.endDate).toLocaleDateString("en-IN") : "Open"}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleToggle(banner)}
                        className={`transition ${banner.isActive ? "text-green-600 hover:text-green-700" : "text-slate-400 hover:text-slate-600"}`}
                        title={banner.isActive ? "Deactivate" : "Activate"}
                      >
                        {banner.isActive ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                      </button>
                      <button
                        onClick={() => { setEditBanner(banner); setShowForm(true); }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(banner._id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Banner Form Modal */}
      {showForm && (
        <BannerFormModal
          banner={editBanner}
          vendors={vendors}
          products={products}
          onSave={() => { setShowForm(false); setEditBanner(null); fetchAll(); }}
          onClose={() => { setShowForm(false); setEditBanner(null); }}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          message={confirmState.message}
          type={confirmState.type || "warning"}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}
