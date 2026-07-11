import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Tag, Info, ChevronLeft, Check, Package } from "lucide-react";
import {
  createVendorProduct,
  searchMasterProducts,
  linkMasterProduct
} from "../../services/vendorApi";
import BasicInformation from "./BasicInformation";
import Description from "./Description";
import Images from "./Images";

const STEPS = ["Basic Information", "Description", "Images"];

const INITIAL_FORM = {
  categoryId: "",
  subCategoryId: "",
  familyId: "",
  name: "",
  brand: "",
  unitType: "",
  status: "pending",
  description: "",
  images: [],
};

const INITIAL_LINK_FORM = {
  price: "",
  mrp: "",
  stock: "",
  sku: "",
  condition: "New",
  vendorNotes: "",
};

export default function AddProduct() {
  const navigate = useNavigate();

  // Mode: "select" (options menu), "link" (search/link flow), "create" (wizard flow)
  const [mode, setMode] = useState("select");

  // Wizard state (for Create Custom Product)
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search & Link state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedMasterProduct, setSelectedMasterProduct] = useState(null);
  const [linkForm, setLinkForm] = useState(INITIAL_LINK_FORM);
  const [linking, setLinking] = useState(false);

  // ── Search Handlers ──────────────────────────────────────────────────────
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      setError(null);
      const results = await searchMasterProducts(searchQuery);
      setSearchResults(results || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to search catalog.");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectMaster = (product) => {
    setSelectedMasterProduct(product);
    // Auto-generate SKU prefix based on product name
    const prefix = product.name
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 5);
    setLinkForm({
      ...INITIAL_LINK_FORM,
      sku: `${prefix}-${Date.now().toString().slice(-4)}`
    });
  };

  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    if (!linkForm.price || Number(linkForm.price) <= 0) {
      setError("Please enter a valid price.");
      return;
    }
    if (linkForm.mrp && Number(linkForm.mrp) <= 0) {
      setError("MRP must be greater than 0 if specified.");
      return;
    }
    if (linkForm.mrp && Number(linkForm.price) > Number(linkForm.mrp)) {
      setError("Selling price cannot exceed MRP.");
      return;
    }
    if (!linkForm.sku.trim()) {
      setError("Please enter a unique SKU.");
      return;
    }

    try {
      setLinking(true);
      setError(null);
      const payload = {
        masterProductId: selectedMasterProduct._id,
        price: Number(linkForm.price),
        mrp: linkForm.mrp ? Number(linkForm.mrp) : null,
        stock: Number(linkForm.stock || 0),
        sku: linkForm.sku.trim(),
        condition: linkForm.condition,
        vendorNotes: linkForm.vendorNotes.trim()
      };
      await linkMasterProduct(payload);
      alert("Product linked to your store successfully!");
      navigate("/vendor/products");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to link product to your store.");
    } finally {
      setLinking(false);
    }
  };

  // ── Create Custom Catalog Handlers ────────────────────────────────────────
  const validateStep = () => {
    if (step === 1) {
      if (!form.categoryId) return "Please select a Category.";
      if (!form.subCategoryId) return "Please select a Sub Category.";
      if (!form.familyId) return "Please select a Product Family.";
      if (!form.name.trim()) return "Product name is required.";
      if (!form.unitType) return "Please select a Unit Type.";
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(null);
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => s - 1);
  };

  const handleCustomSubmit = async (submitStatus) => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        categoryId:    form.categoryId,
        subCategoryId: form.subCategoryId,
        familyId:      form.familyId,
        name:          form.name.trim(),
        brand:         form.brand.trim(),
        unitType:      form.unitType,
        status:        submitStatus,
        description:   form.description.trim(),
        images:        form.images,
      };

      const res = await createVendorProduct(payload);
      if (res.success) {
        alert(submitStatus === "draft" ? "Product draft created!" : "Product request submitted for admin approval!");
        navigate(`/vendor/products/${res.product._id}/variants`);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="p-6 font-semibold text-slate-700">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow border border-slate-100 p-8">

        {/* ── Mode Selection Screen ────────────────────────────────────────── */}
        {mode === "select" && (
          <div className="text-center py-6">
            <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Add New Product</h1>
            <p className="text-slate-500 max-w-lg mx-auto mb-8 font-medium">
              To keep the marketplace catalog clean, please search if the item already exists in GaonKart before creating a new entry.
            </p>

            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <button
                onClick={() => setMode("link")}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-purple-200 rounded-3xl hover:border-purple-500 hover:bg-purple-50/20 transition group text-center"
              >
                <div className="w-12 h-12 bg-purple-100 text-purple-650 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-base mb-1">Search & Link Catalog Product</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Sell a product that is already in the database (e.g. popular packaged foods, soft drinks, grains).
                </p>
              </button>

              <button
                onClick={() => setMode("create")}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-3xl hover:border-slate-400 hover:bg-slate-50/40 transition group text-center"
              >
                <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition">
                  <Plus className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-base mb-1">Create Custom Product</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Create a brand-new product details request (use only if the item doesn't exist in catalog).
                </p>
              </button>
            </div>
          </div>
        )}

        {/* ── Mode 1: Search & Link Product Flow ───────────────────────────── */}
        {mode === "link" && !selectedMasterProduct && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <button
                onClick={() => setMode("select")}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-semibold"
              >
                <ChevronLeft className="w-4 h-4" /> Back to options
              </button>
              <h2 className="text-xl font-extrabold text-slate-800">Search Existing Catalog</h2>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by brand name or product name (e.g. Coca Cola, Tata)..."
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="bg-purple-650 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl transition shadow"
              >
                {searching ? "Searching…" : "Search"}
              </button>
            </form>

            {searchResults.length === 0 ? (
              <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Info className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                <p className="text-slate-500 font-bold">No catalog matches found</p>
                <p className="text-slate-400 text-xs mt-1 font-medium">
                  Type a product keyword above, or go back and choose "Create Custom Product" if it's new.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {searchResults.map((prod) => (
                  <div
                    key={prod._id}
                    className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:shadow transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {prod.images?.[0] ? (
                        <img src={prod.images[0]} alt="" className="w-12 h-12 object-cover rounded-xl border border-slate-100" />
                      ) : (
                        <div className="w-12 h-12 bg-slate-50 border rounded-xl flex items-center justify-center text-slate-400 text-[10px]">NO IMG</div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 truncate">{prod.name}</h4>
                        <p className="text-xs text-slate-400 font-medium">
                          {prod.brand || "Generic"} &bull; {prod.categoryId?.name} &bull; {prod.familyId?.name}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelectMaster(prod)}
                      className="bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs px-4 py-2 rounded-xl transition shrink-0"
                    >
                      Sell this Item
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Link Form details entry ─────────────────────────────────────── */}
        {mode === "link" && selectedMasterProduct && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <button
                onClick={() => setSelectedMasterProduct(null)}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-semibold"
              >
                <ChevronLeft className="w-4 h-4" /> Back to results
              </button>
              <h2 className="text-xl font-extrabold text-slate-800">Set Listing Details</h2>
            </div>

            {/* Target product description */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-4">
              {selectedMasterProduct.images?.[0] && (
                <img src={selectedMasterProduct.images[0]} alt="" className="w-16 h-16 rounded-xl object-cover border border-slate-200" />
              )}
              <div>
                <h3 className="font-bold text-slate-800">{selectedMasterProduct.name}</h3>
                <p className="text-slate-400 text-xs mt-1">Brand: {selectedMasterProduct.brand || "Generic"}</p>
                <p className="text-slate-400 text-xs">Category: {selectedMasterProduct.categoryId?.name}</p>
              </div>
            </div>

            <form onSubmit={handleLinkSubmit} className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">MRP (Original Price) (optional)</label>
                  <input
                    type="number"
                    value={linkForm.mrp}
                    onChange={(e) => setLinkForm({ ...linkForm, mrp: e.target.value })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Selling Price (₹) *</label>
                  <input
                    type="number"
                    value={linkForm.price}
                    onChange={(e) => setLinkForm({ ...linkForm, price: e.target.value })}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Stock Quantity *</label>
                  <input
                    type="number"
                    value={linkForm.stock}
                    onChange={(e) => setLinkForm({ ...linkForm, stock: e.target.value })}
                    placeholder="0"
                    min="0"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Your Store SKU *</label>
                  <input
                    type="text"
                    value={linkForm.sku}
                    onChange={(e) => setLinkForm({ ...linkForm, sku: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Item Condition</label>
                  <select
                    value={linkForm.condition}
                    onChange={(e) => setLinkForm({ ...linkForm, condition: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="New">New / Fresh</option>
                    <option value="Refurbished">Refurbished</option>
                    <option value="Used">Used</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Internal Vendor Notes (optional)</label>
                <textarea
                  value={linkForm.vendorNotes}
                  onChange={(e) => setLinkForm({ ...linkForm, vendorNotes: e.target.value })}
                  rows={3}
                  placeholder="Low stock triggers, specific supplier details etc..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium resize-none"
                />
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-750 text-xs rounded-xl px-4 py-3 font-semibold">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedMasterProduct(null)}
                  className="flex-1 py-3 border border-slate-350 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linking}
                  className="flex-1 bg-purple-650 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow"
                >
                  <Check className="w-4 h-4" /> {linking ? "Linking…" : "Link to My Store"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Mode 2: Create Custom Catalog Product Flow ──────────────────── */}
        {mode === "create" && (
          <div>
            {/* Header */}
            <div className="flex justify-between items-start mb-8 pb-4 border-b border-slate-100">
              <div>
                <button
                  onClick={() => {
                    if (step === 1) setMode("select");
                    else handleBack();
                  }}
                  className="flex items-center gap-1 text-slate-550 hover:text-slate-800 font-semibold mb-2"
                >
                  <ChevronLeft className="w-4 h-4" /> {step === 1 ? "Back to options" : "Back"}
                </button>
                <h1 className="text-xl font-bold text-slate-800">Create Custom Product</h1>
              </div>
              <span className="bg-purple-50 text-purple-700 text-sm font-semibold px-4 py-1.5 rounded-full">
                Step {step} of {STEPS.length}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-8">
              <div
                className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Step content */}
            <div className="min-h-48">
              {step === 1 && (
                <BasicInformation formData={form} setFormData={setForm} />
              )}
              {step === 2 && (
                <Description formData={form} setFormData={setForm} />
              )}
              {step === 3 && (
                <Images formData={form} setFormData={setForm} />
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-6 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3 font-semibold">
                {error}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-slate-100 font-semibold">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 1}
                className="px-6 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ← Back
              </button>

              {step < STEPS.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-8 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-900 transition"
                >
                  Continue →
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCustomSubmit("draft")}
                    disabled={loading}
                    className="px-6 py-2.5 border border-slate-350 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 transition"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCustomSubmit("pending")}
                    disabled={loading}
                    className="px-8 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition"
                  >
                    {loading ? "Submitting…" : "Submit & Add Variants →"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
