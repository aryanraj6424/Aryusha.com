import React, { useState, useEffect } from "react";
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from "../../services/couponApi";
import { getCategories, getSubCategories, getProductFamilies } from "../../services/productApi";
import axios from "axios";
import { 
  Tag, Plus, Edit, Trash2, Calendar, AlertCircle, CheckCircle, 
  Search, X, Loader2, RefreshCw, Layers, CheckSquare, Square
} from "lucide-react";
import ConfirmDialog from "../../../components/Toast/ConfirmDialog";

export default function OffersCoupons() {
  const [confirmState, setConfirmState] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Scope lists for multi-select pickers
  const [categoriesList, setCategoriesList] = useState([]);
  const [subCategoriesList, setSubCategoriesList] = useState([]);
  const [familiesList, setFamiliesList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    discountType: "flat",
    discountValue: "",
    minCartValue: "",
    maxDiscountCap: "",
    startDate: "",
    expiryDate: "",
    usageLimit: "",
    perCustomerLimit: "1",
    status: "active",
    scopeType: "All", // "All" or "Custom"
    selectedCategories: [],
    selectedSubCategories: [],
    selectedFamilies: [],
    selectedProducts: []
  });

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCoupons();
    loadCatalogOptions();
  }, []);

  const loadCatalogOptions = async () => {
    try {
      setLoadingLists(true);
      const token = localStorage.getItem("adminToken");
      const headers = { Authorization: `Bearer ${token}` };
      const apiBase = import.meta.env.VITE_API_URL;

      const [catsRes, subRes, prodsRes] = await Promise.all([
        axios.get(`${apiBase}/categories`, { headers }).catch(() => ({ data: {} })),
        axios.get(`${apiBase}/sub-categories`, { headers }).catch(() => ({ data: {} })),
        axios.get(`${apiBase}/admin/products/all`, { headers })
          .catch(() => axios.get(`${apiBase}/admin/product/all`, { headers }))
          .catch(() => ({ data: {} }))
      ]);

      setCategoriesList(catsRes.data?.categories || catsRes.data?.data || []);
      setSubCategoriesList(subRes.data?.subCategories || subRes.data?.data || []);
      setProductsList(prodsRes.data?.products || prodsRes.data?.data || []);
    } catch (err) {
      console.error("Failed to load catalog options for coupon scopes", err);
    } finally {
      setLoadingLists(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await getCoupons();
      if (res.success) {
        setCoupons(res.data || []);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load coupon list.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormError("");
    setFormData({
      code: "",
      discountType: "flat",
      discountValue: "",
      minCartValue: "0",
      maxDiscountCap: "",
      startDate: new Date().toISOString().split("T")[0],
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      usageLimit: "",
      perCustomerLimit: "1",
      status: "active",
      scopeType: "All",
      selectedCategories: [],
      selectedSubCategories: [],
      selectedFamilies: [],
      selectedProducts: []
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon) => {
    setIsEditing(true);
    setCurrentId(coupon._id);
    setFormError("");
    
    const startFormatted = coupon.startDate || coupon.valid_from ? new Date(coupon.startDate || coupon.valid_from).toISOString().split("T")[0] : "";
    const expiryFormatted = coupon.expiryDate || coupon.valid_to ? new Date(coupon.expiryDate || coupon.valid_to).toISOString().split("T")[0] : "";

    const appList = coupon.applicability || [];
    const isAll = appList.length === 0 || appList.some((a) => a.scope_type === "All");

    const selCats = appList.filter((a) => a.scope_type === "Category").map((a) => a.scope_id?.toString() || a.scope_id);
    const selSub = appList.filter((a) => a.scope_type === "Subcategory").map((a) => a.scope_id?.toString() || a.scope_id);
    const selFam = appList.filter((a) => a.scope_type === "ProductFamily").map((a) => a.scope_id?.toString() || a.scope_id);
    const selProd = appList.filter((a) => a.scope_type === "Product").map((a) => a.scope_id?.toString() || a.scope_id);

    setFormData({
      code: coupon.code || "",
      discountType: coupon.discount_type || coupon.discountType || "flat",
      discountValue: coupon.discount_value !== undefined ? coupon.discount_value : (coupon.discountValue || ""),
      minCartValue: coupon.min_order_value !== undefined ? coupon.min_order_value : (coupon.minCartValue || "0"),
      maxDiscountCap: coupon.max_discount_cap !== undefined && coupon.max_discount_cap !== null ? coupon.max_discount_cap : (coupon.maxDiscountCap || ""),
      startDate: startFormatted,
      expiryDate: expiryFormatted,
      usageLimit: coupon.total_usage_limit !== undefined && coupon.total_usage_limit !== null ? coupon.total_usage_limit : (coupon.usageLimit || ""),
      perCustomerLimit: coupon.usage_limit_per_user !== undefined ? coupon.usage_limit_per_user : (coupon.perCustomerLimit || "1"),
      status: coupon.status || "active",
      scopeType: isAll ? "All" : "Custom",
      selectedCategories: selCats,
      selectedSubCategories: selSub,
      selectedFamilies: selFam,
      selectedProducts: selProd
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSelection = (field, id) => {
    setFormData((prev) => {
      const currentArr = prev[field] || [];
      const exists = currentArr.includes(id);
      const updated = exists ? currentArr.filter((item) => item !== id) : [...currentArr, id];
      return { ...prev, [field]: updated };
    });
  };

  const validateForm = () => {
    if (!formData.code.trim()) return "Coupon code is required.";
    if (!formData.discountValue || Number(formData.discountValue) <= 0) {
      return "Discount value must be a positive number.";
    }
    if (formData.discountType === "percentage" && Number(formData.discountValue) > 100) {
      return "Percentage discount rate cannot exceed 100%.";
    }
    if (Number(formData.minCartValue) < 0) {
      return "Minimum cart value cannot be negative.";
    }
    if (formData.maxDiscountCap && Number(formData.maxDiscountCap) < 0) {
      return "Maximum discount cap cannot be negative.";
    }
    if (!formData.startDate || !formData.expiryDate) {
      return "Start date and Expiry date are required.";
    }
    
    const start = new Date(formData.startDate);
    const expiry = new Date(formData.expiryDate);
    if (start >= expiry) {
      return "Expiry date must be later than the start date.";
    }

    if (formData.usageLimit && Number(formData.usageLimit) < 0) {
      return "Usage limit cannot be negative.";
    }
    if (formData.perCustomerLimit && Number(formData.perCustomerLimit) <= 0) {
      return "Per-customer usage limit must be at least 1.";
    }

    if (formData.scopeType === "Custom") {
      const totalSel =
        formData.selectedCategories.length +
        formData.selectedSubCategories.length +
        formData.selectedFamilies.length +
        formData.selectedProducts.length;
      if (totalSel === 0) {
        return "Please select at least one Category, Subcategory, Product Family, or Product when Custom Scope is selected.";
      }
    }

    return null;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    // Build applicability payload
    let applicability = [];
    if (formData.scopeType === "All") {
      applicability = [{ scope_type: "All", scope_id: null }];
    } else {
      formData.selectedCategories.forEach((id) => applicability.push({ scope_type: "Category", scope_id: id }));
      formData.selectedSubCategories.forEach((id) => applicability.push({ scope_type: "Subcategory", scope_id: id }));
      formData.selectedFamilies.forEach((id) => applicability.push({ scope_type: "ProductFamily", scope_id: id }));
      formData.selectedProducts.forEach((id) => applicability.push({ scope_type: "Product", scope_id: id }));
    }

    const payload = {
      code: formData.code.trim().toUpperCase(),
      discount_type: formData.discountType,
      discount_value: parseFloat(formData.discountValue),
      min_order_value: parseFloat(formData.minCartValue) || 0,
      max_discount_cap: formData.maxDiscountCap ? parseFloat(formData.maxDiscountCap) : null,
      valid_from: formData.startDate,
      valid_to: formData.expiryDate,
      total_usage_limit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
      usage_limit_per_user: parseInt(formData.perCustomerLimit) || 1,
      status: formData.status,
      applicability
    };

    try {
      setSubmitting(true);
      let res;
      if (isEditing) {
        res = await updateCoupon(currentId, payload);
      } else {
        res = await createCoupon(payload);
      }

      if (res.success) {
        setSuccessMsg(isEditing ? "Coupon updated successfully!" : "Coupon created successfully!");
        setIsModalOpen(false);
        fetchCoupons();
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || "Failed to save coupon.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, code) => {
    setConfirmState({
      message: `Are you sure you want to deactivate coupon code "${code}"?`,
      type: "danger",
      onConfirm: async () => {
        setConfirmState(null);
        try {
          const res = await deleteCoupon(id);
          if (res.success) {
            setSuccessMsg(`Coupon "${code}" deactivated successfully.`);
            fetchCoupons();
            setTimeout(() => setSuccessMsg(""), 3000);
          }
        } catch (err) {
          console.error(err);
          setErrorMsg("Failed to delete coupon.");
        }
      }
    });
  };

  const filteredCoupons = coupons.filter(
    (c) => c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCount = coupons.length;
  const activeCount = coupons.filter(
    (c) => c.status === "active" && new Date(c.valid_to || c.expiryDate) >= new Date()
  ).length;
  const inactiveCount = coupons.filter((c) => c.status === "inactive").length;
  const expiredCount = coupons.filter(
    (c) => c.status === "active" && new Date(c.valid_to || c.expiryDate) < new Date()
  ).length;

  const getStatusBadge = (coupon) => {
    const isExpired = new Date(coupon.valid_to || coupon.expiryDate) < new Date();
    if (coupon.status === "inactive") {
      return (
        <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider">
          Inactive
        </span>
      );
    }
    if (isExpired) {
      return (
        <span className="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider">
          Expired
        </span>
      );
    }
    return (
      <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider">
        Active
      </span>
    );
  };

  const formatApplicability = (coupon) => {
    const app = coupon.applicability || [];
    if (app.length === 0 || app.some((a) => a.scope_type === "All")) {
      return <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-bold text-xs">All Products</span>;
    }
    const counts = { Category: 0, Subcategory: 0, ProductFamily: 0, Product: 0 };
    app.forEach((a) => {
      if (counts[a.scope_type] !== undefined) counts[a.scope_type]++;
    });

    const badges = [];
    if (counts.Category > 0) badges.push(`${counts.Category} Cat`);
    if (counts.Subcategory > 0) badges.push(`${counts.Subcategory} SubCat`);
    if (counts.ProductFamily > 0) badges.push(`${counts.ProductFamily} Family`);
    if (counts.Product > 0) badges.push(`${counts.Product} Prod`);

    return (
      <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-semibold text-xs border border-amber-200">
        {badges.join(", ")}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-green-600 mb-2" size={32} />
        <p className="text-gray-500 font-semibold">Loading Coupons...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-800 flex items-center gap-2">
            <Tag className="text-green-600" size={28} /> Offers & Coupons
          </h1>
          <p className="text-sm text-gray-500">Create and manage coupon discounts with multi-scope applicability</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition flex items-center gap-2 shadow font-bold text-sm"
        >
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <span className="text-xs uppercase font-extrabold tracking-wider text-gray-400">Total Coupons</span>
          <p className="text-2xl font-black text-gray-800 mt-1">{totalCount}</p>
        </div>
        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <span className="text-xs uppercase font-extrabold tracking-wider text-gray-400">Active</span>
          <p className="text-2xl font-black text-green-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <span className="text-xs uppercase font-extrabold tracking-wider text-gray-400">Inactive</span>
          <p className="text-2xl font-black text-gray-600 mt-1">{inactiveCount}</p>
        </div>
        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <span className="text-xs uppercase font-extrabold tracking-wider text-gray-400">Expired</span>
          <p className="text-2xl font-black text-red-600 mt-1">{expiredCount}</p>
        </div>
      </div>

      {/* Banners */}
      {successMsg && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-750 font-semibold rounded flex gap-2 items-center">
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-750 font-semibold rounded flex gap-2 items-center">
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {/* Search and Table */}
      <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              placeholder="Search by code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          </div>
          <button
            onClick={fetchCoupons}
            className="text-gray-500 hover:text-gray-800 text-xs font-bold flex items-center gap-1 self-end md:self-auto"
          >
            <RefreshCw size={12} /> Reload
          </button>
        </div>

        {filteredCoupons.length === 0 ? (
          <div className="p-8 text-center text-gray-400 font-semibold text-sm">
            No coupon records found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-150">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-black text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Discount</th>
                  <th className="px-6 py-3">Scope / Applicability</th>
                  <th className="px-6 py-3">Min Order</th>
                  <th className="px-6 py-3">Validity</th>
                  <th className="px-6 py-3">Usage</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-sm">
                {filteredCoupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-mono font-black text-slate-800">{coupon.code}</td>
                    <td className="px-6 py-4">
                      {(coupon.discount_type || coupon.discountType) === "percentage" ? (
                        <div>
                          <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded">
                            {coupon.discount_value ?? coupon.discountValue}% Off
                          </span>
                          {(coupon.max_discount_cap || coupon.maxDiscountCap) && (
                            <span className="text-[10px] text-gray-500 block mt-1">
                              Cap: ₹{coupon.max_discount_cap || coupon.maxDiscountCap}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="font-bold text-blue-750 bg-blue-50 px-2 py-0.5 rounded">
                          ₹{coupon.discount_value ?? coupon.discountValue} Flat Off
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">{formatApplicability(coupon)}</td>
                    <td className="px-6 py-4 font-medium text-slate-650">₹{coupon.min_order_value ?? coupon.minCartValue ?? 0}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-500 space-y-1">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-gray-400" /> Start:{" "}
                        {new Date(coupon.valid_from || coupon.startDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1 font-bold text-amber-700">
                        <Calendar size={12} /> Expiry: {new Date(coupon.valid_to || coupon.expiryDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                      <div>Uses: {coupon.usedCount || 0} / {coupon.total_usage_limit || coupon.usageLimit || "∞"}</div>
                      <div className="text-[10px] text-gray-400 mt-1">Per User: {coupon.usage_limit_per_user || coupon.perCustomerLimit || 1}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(coupon)}</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEditModal(coupon)}
                        className="text-green-600 hover:text-green-800 p-1.5 hover:bg-green-50 rounded-lg transition mr-2"
                        title="Edit Coupon"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(coupon._id, coupon.code)}
                        className="text-red-500 hover:text-red-750 p-1.5 hover:bg-red-50 rounded-lg transition"
                        title="Deactivate Coupon"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-extrabold text-slate-800 text-lg">
                {isEditing ? `Edit Coupon: ${formData.code}` : "Create New Coupon"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded flex items-center gap-2">
                    <AlertCircle size={16} /> {formError}
                  </div>
                )}

                {/* Coupon Code */}
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-1.5">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleFormChange}
                    placeholder="e.g. SAVE50"
                    disabled={isEditing}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 uppercase font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                {/* Discount Type and Value */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-1.5">
                      Discount Type
                    </label>
                    <select
                      name="discountType"
                      value={formData.discountType}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="flat">Flat Amount (₹)</option>
                      <option value="percentage">Percentage (%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-1.5">
                      Discount Value
                    </label>
                    <input
                      type="number"
                      name="discountValue"
                      value={formData.discountValue}
                      onChange={handleFormChange}
                      min="0.01"
                      step="any"
                      placeholder="e.g. 50"
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>

                {/* Applicability Scope Pickers */}
                <div className="p-4 border rounded-xl bg-slate-50/70 space-y-3">
                  <label className="block text-xs font-black text-gray-700 uppercase tracking-wider">
                    Applicability Scope
                  </label>

                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-sm">
                      <input
                        type="radio"
                        name="scopeType"
                        value="All"
                        checked={formData.scopeType === "All"}
                        onChange={() => setFormData((prev) => ({ ...prev, scopeType: "All" }))}
                        className="accent-green-600"
                      />
                      Default (All Products)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-sm">
                      <input
                        type="radio"
                        name="scopeType"
                        value="Custom"
                        checked={formData.scopeType === "Custom"}
                        onChange={() => setFormData((prev) => ({ ...prev, scopeType: "Custom" }))}
                        className="accent-green-600"
                      />
                      Custom Selection (Category / Subcategory / Product)
                    </label>
                  </div>

                  {formData.scopeType === "Custom" && (
                    <div className="space-y-4 pt-2">
                      {/* Select Categories */}
                      <div>
                        <span className="text-xs font-extrabold text-gray-500 block mb-1">Categories (Multi-select)</span>
                        <div className="max-h-28 overflow-y-auto border rounded-xl p-2 bg-white space-y-1">
                          {categoriesList.map((cat) => {
                            const isSelected = formData.selectedCategories.includes(cat._id);
                            return (
                              <div
                                key={cat._id}
                                onClick={() => toggleSelection("selectedCategories", cat._id)}
                                className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer ${
                                  isSelected ? "bg-green-50 text-green-800 font-bold" : "hover:bg-gray-50"
                                }`}
                              >
                                {isSelected ? <CheckSquare size={14} className="text-green-600" /> : <Square size={14} className="text-gray-400" />}
                                <span>{cat.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Select Subcategories */}
                      <div>
                        <span className="text-xs font-extrabold text-gray-500 block mb-1">Subcategories (Multi-select)</span>
                        <div className="max-h-28 overflow-y-auto border rounded-xl p-2 bg-white space-y-1">
                          {subCategoriesList.map((sub) => {
                            const isSelected = formData.selectedSubCategories.includes(sub._id);
                            return (
                              <div
                                key={sub._id}
                                onClick={() => toggleSelection("selectedSubCategories", sub._id)}
                                className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer ${
                                  isSelected ? "bg-green-50 text-green-800 font-bold" : "hover:bg-gray-50"
                                }`}
                              >
                                {isSelected ? <CheckSquare size={14} className="text-green-600" /> : <Square size={14} className="text-gray-400" />}
                                <span>{sub.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Select Products */}
                      <div>
                        <span className="text-xs font-extrabold text-gray-500 block mb-1">Specific Products (Multi-select)</span>
                        <div className="max-h-32 overflow-y-auto border rounded-xl p-2 bg-white space-y-1">
                          {productsList.map((prod) => {
                            const isSelected = formData.selectedProducts.includes(prod._id);
                            return (
                              <div
                                key={prod._id}
                                onClick={() => toggleSelection("selectedProducts", prod._id)}
                                className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer ${
                                  isSelected ? "bg-green-50 text-green-800 font-bold" : "hover:bg-gray-50"
                                }`}
                              >
                                {isSelected ? <CheckSquare size={14} className="text-green-600" /> : <Square size={14} className="text-gray-400" />}
                                <span>{prod.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Min Order Subtotal and Max Discount Cap */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-1.5">
                      Min Order Value (₹)
                    </label>
                    <input
                      type="number"
                      name="minCartValue"
                      value={formData.minCartValue}
                      onChange={handleFormChange}
                      min="0"
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-1.5">
                      Max Discount Cap (₹)
                    </label>
                    <input
                      type="number"
                      name="maxDiscountCap"
                      value={formData.maxDiscountCap}
                      onChange={handleFormChange}
                      min="0"
                      placeholder="Global cap"
                      disabled={formData.discountType !== "percentage"}
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Validity Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-1.5">
                      Valid From Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-1.5">
                      Valid To Date
                    </label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>

                {/* Usage Limits */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-1.5">
                      Total Usage Limit
                    </label>
                    <input
                      type="number"
                      name="usageLimit"
                      value={formData.usageLimit}
                      onChange={handleFormChange}
                      min="1"
                      placeholder="Unlimited if empty"
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-1.5">
                      Per User Limit
                    </label>
                    <input
                      type="number"
                      name="perCustomerLimit"
                      value={formData.perCustomerLimit}
                      onChange={handleFormChange}
                      min="1"
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>

                {/* Status selection */}
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-sm">
                      <input
                        type="radio"
                        name="status"
                        value="active"
                        checked={formData.status === "active"}
                        onChange={handleFormChange}
                        className="accent-green-600"
                      />
                      Active
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-sm">
                      <input
                        type="radio"
                        name="status"
                        value="inactive"
                        checked={formData.status === "inactive"}
                        onChange={handleFormChange}
                        className="accent-green-600"
                      />
                      Inactive
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl bg-white hover:bg-gray-55 transition text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition flex items-center gap-1.5 font-bold text-sm disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> Submitting...
                    </>
                  ) : (
                    "Save Coupon"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
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
