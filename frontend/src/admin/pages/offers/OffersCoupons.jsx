import React, { useState, useEffect } from "react";
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from "../../services/couponApi";
import { 
  Tag, Plus, Edit, Trash2, Calendar, AlertCircle, CheckCircle, 
  Search, X, Loader2, RefreshCw, Layers 
} from "lucide-react";

export default function OffersCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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
    status: "active"
  });

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

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
      status: "active"
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon) => {
    setIsEditing(true);
    setCurrentId(coupon._id);
    setFormError("");
    
    // Format dates to YYYY-MM-DD
    const startFormatted = coupon.startDate ? new Date(coupon.startDate).toISOString().split("T")[0] : "";
    const expiryFormatted = coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split("T")[0] : "";

    setFormData({
      code: coupon.code || "",
      discountType: coupon.discountType || "flat",
      discountValue: coupon.discountValue || "",
      minCartValue: coupon.minCartValue !== undefined ? coupon.minCartValue : "0",
      maxDiscountCap: coupon.maxDiscountCap !== undefined && coupon.maxDiscountCap !== null ? coupon.maxDiscountCap : "",
      startDate: startFormatted,
      expiryDate: expiryFormatted,
      usageLimit: coupon.usageLimit !== undefined && coupon.usageLimit !== null ? coupon.usageLimit : "",
      perCustomerLimit: coupon.perCustomerLimit !== undefined ? coupon.perCustomerLimit : "1",
      status: coupon.status || "active"
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    // Format fields
    const payload = {
      ...formData,
      code: formData.code.trim().toUpperCase(),
      discountValue: parseFloat(formData.discountValue),
      minCartValue: parseFloat(formData.minCartValue) || 0,
      maxDiscountCap: formData.maxDiscountCap ? parseFloat(formData.maxDiscountCap) : null,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
      perCustomerLimit: parseInt(formData.perCustomerLimit) || 1
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
    if (!window.confirm(`Are you sure you want to delete coupon code "${code}"?`)) {
      return;
    }

    try {
      const res = await deleteCoupon(id);
      if (res.success) {
        setSuccessMsg(`Coupon "${code}" deleted successfully.`);
        fetchCoupons();
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to delete coupon.");
    }
  };

  // Filtered List
  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics calculation
  const totalCount = coupons.length;
  const activeCount = coupons.filter(
    (c) => c.status === "active" && new Date(c.expiryDate) >= new Date()
  ).length;
  const inactiveCount = coupons.filter((c) => c.status === "inactive").length;
  const expiredCount = coupons.filter(
    (c) => c.status === "active" && new Date(c.expiryDate) < new Date()
  ).length;

  const getStatusBadge = (coupon) => {
    const isExpired = new Date(coupon.expiryDate) < new Date();
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-green-600 mb-2 animate-pulse" size={32} />
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
          <p className="text-sm text-gray-500">Create and manage coupon discounts for checkout purchases</p>
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
          <p className="text-2xl font-black text-red-650 mt-1">{expiredCount}</p>
        </div>
      </div>

      {/* Notification banners */}
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

      {/* Search Filter and Table */}
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

        {/* Coupons List Table */}
        {filteredCoupons.length === 0 ? (
          <div className="p-8 text-center text-gray-400 font-semibold text-sm">
            No coupon records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-150">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-black text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Discount Details</th>
                  <th className="px-6 py-3">Min Order Subtotal</th>
                  <th className="px-6 py-3">Validity</th>
                  <th className="px-6 py-3">Usage Statistics</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-sm">
                {filteredCoupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-mono font-black text-slate-800">{coupon.code}</td>
                    <td className="px-6 py-4">
                      {coupon.discountType === "percentage" ? (
                        <div>
                          <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded">
                            {coupon.discountValue}% Off
                          </span>
                          {coupon.maxDiscountCap && (
                            <span className="text-[10px] text-gray-500 block mt-1">
                              Capped at ₹{coupon.maxDiscountCap}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="font-bold text-blue-750 bg-blue-50 px-2 py-0.5 rounded">
                          ₹{coupon.discountValue} Flat Off
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-650">₹{coupon.minCartValue || 0}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-500 space-y-1">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-gray-400" /> Start:{" "}
                        {new Date(coupon.startDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1 font-bold text-amber-700">
                        <Calendar size={12} /> Expiry: {new Date(coupon.expiryDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                      <div>Total Uses: {coupon.usedCount || 0} / {coupon.usageLimit || "∞"}</div>
                      <div className="text-[10px] text-gray-400 mt-1">Per User Limit: {coupon.perCustomerLimit}</div>
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
                        title="Delete Coupon"
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

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-extrabold text-slate-800 text-lg">
                {isEditing ? `Edit Coupon: ${formData.code}` : "Create New Coupon"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto pr-2">
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
                    placeholder="e.g. SUMMER50"
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

                {/* Min Order Subtotal and Max Discount Cap (conditional on percentage) */}
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
                      placeholder="Optional"
                      disabled={formData.discountType !== "percentage"}
                      className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Validity Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-1.5">
                      Start Date
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
                      Expiry Date
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

                {/* Limits */}
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
                      Per Customer Limit
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
    </div>
  );
}
