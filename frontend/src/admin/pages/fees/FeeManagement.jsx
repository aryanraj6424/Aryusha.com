import React, { useState, useEffect } from "react";
import { 
  getAdminFees, 
  createAdminFee, 
  updateAdminFee, 
  deleteAdminFee 
} from "../../../services/feeApi";
import { 
  DollarSign, Plus, Edit2, Trash2, ShieldAlert, CheckCircle, 
  X, Loader2, RefreshCw, Globe, MapPin, ToggleLeft, ToggleRight 
} from "lucide-react";
import ConfirmDialog from "../../../components/Toast/ConfirmDialog";
import { useToast } from "../../../components/Toast";

export default function FeeManagement() {
  const { showToast } = useToast();
  const [confirmState, setConfirmState] = useState(null);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    feeType: "handling",
    label: "",
    valueType: "flat",
    value: 0,
    scope: "global",
    zoneId: "",
    isActive: true,
    condition: "",
  });

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const res = await getAdminFees();
      if (res.success) {
        setFees(res.data || []);
      }
    } catch (err) {
      console.error(err);
      showToast({ type: "error", message: "Failed to load fee configurations." });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (fee) => {
    try {
      const nextStatus = !fee.isActive;
      const res = await updateAdminFee(fee._id, { isActive: nextStatus });
      if (res.success) {
        showToast({ 
          type: "success", 
          message: `${fee.label} is now ${nextStatus ? "Active 🟢" : "Inactive 🔴"}` 
        });
        fetchFees();
      }
    } catch (err) {
      console.error(err);
      showToast({ type: "error", message: "Failed to toggle status." });
    }
  };

  const handleOpenCreateModal = (feeType = "handling") => {
    setIsEditing(false);
    setCurrentId(null);
    setFormError("");
    setFormData({
      feeType: feeType,
      label: getPrettyLabel(feeType),
      valueType: feeType === "gst" ? "percentage" : "flat",
      value: 0,
      scope: "zone",
      zoneId: "",
      isActive: true,
      condition: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (fee) => {
    setIsEditing(true);
    setCurrentId(fee._id);
    setFormError("");
    setFormData({
      feeType: fee.feeType,
      label: fee.label,
      valueType: fee.valueType,
      value: fee.value,
      scope: fee.scope,
      zoneId: fee.zoneId || "",
      isActive: fee.isActive,
      condition: fee.condition ? JSON.stringify(fee.condition) : "",
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (fee) => {
    setConfirmState({
      message: `Are you sure you want to delete the zone override for "${fee.zoneId}" under "${fee.label}"?`,
      onConfirm: async () => {
        try {
          const res = await deleteAdminFee(fee._id);
          if (res.success) {
            showToast({ type: "success", message: "Override deleted successfully." });
            fetchFees();
          }
        } catch (err) {
          console.error(err);
          showToast({ type: "error", message: "Failed to delete override." });
        } finally {
          setConfirmState(null);
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.label || formData.value < 0) {
      setFormError("Label and positive values are required.");
      return;
    }

    if (formData.scope === "zone" && !formData.zoneId) {
      setFormError("Zone name is required for zone overrides.");
      return;
    }

    let parsedCondition = null;
    if (formData.condition) {
      try {
        parsedCondition = JSON.parse(formData.condition);
      } catch (err) {
        setFormError("Condition must be valid JSON, e.g. {\"appliesBelowCartValue\":149}");
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        condition: parsedCondition,
      };

      if (isEditing) {
        const res = await updateAdminFee(currentId, payload);
        if (res.success) {
          showToast({ type: "success", message: "Fee configuration updated!" });
          setIsModalOpen(false);
          fetchFees();
        }
      } else {
        const res = await createAdminFee(payload);
        if (res.success) {
          showToast({ type: "success", message: "Fee override added!" });
          setIsModalOpen(false);
          fetchFees();
        }
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const getPrettyLabel = (type) => {
    switch (type) {
      case "handling": return "Handling Fee";
      case "delivery_partner": return "Delivery Partner Fee";
      case "gst": return "GST & Charges";
      case "small_cart": return "Small Cart Fee";
      case "rain": return "Rain Fee";
      default: return "Custom Fee";
    }
  };

  // Group fees by feeType
  const feeTypes = ["handling", "delivery_partner", "gst", "small_cart", "rain", "custom"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-purple-650" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Title Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <DollarSign className="text-purple-650" size={28} /> Dynamic Fee Management
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">Configure and override customer order fees globally or by zone/city.</p>
        </div>
        <button 
          onClick={fetchFees}
          className="p-2.5 hover:bg-slate-50 border rounded-xl transition text-slate-500"
          title="Reload configs"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Group Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {feeTypes.map((type) => {
          const typeFees = fees.filter(f => f.feeType === type);
          const globalFee = typeFees.find(f => f.scope === "global");
          const zoneOverrides = typeFees.filter(f => f.scope === "zone");

          return (
            <div key={type} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-150 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-start border-b pb-3 mb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-lg uppercase tracking-wide">
                      {getPrettyLabel(type)}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Type key: {type}</p>
                  </div>
                  <button
                    onClick={() => handleOpenCreateModal(type)}
                    className="bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-extrabold px-3 py-1.5 rounded-xl transition flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Override
                  </button>
                </div>

                {/* Global Entry */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Globe size={14} className="text-slate-400" />
                      <span className="text-xs font-black text-slate-700">Global Config</span>
                    </div>
                    {globalFee && (
                      <button 
                        onClick={() => handleToggleActive(globalFee)}
                        className="text-slate-500 hover:text-slate-800 transition"
                      >
                        {globalFee.isActive ? (
                          <ToggleRight size={32} className="text-emerald-500" />
                        ) : (
                          <ToggleLeft size={32} className="text-slate-300" />
                        )}
                      </button>
                    )}
                  </div>

                  {globalFee ? (
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-2xl font-black text-slate-800">
                          {globalFee.valueType === "flat" ? `₹${globalFee.value}` : `${globalFee.value}%`}
                        </span>
                        {globalFee.condition && (
                          <p className="text-[10px] text-slate-400 font-bold mt-1">
                            Cond: {JSON.stringify(globalFee.condition)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleOpenEditModal(globalFee)}
                        className="p-2 bg-white hover:bg-slate-100 rounded-xl border text-slate-500 hover:text-slate-800 transition"
                        title="Edit global setting"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600 font-bold bg-amber-50 border border-amber-100 p-2 rounded-xl">
                      No global configuration seeded. Click Add Override to create one.
                    </p>
                  )}
                </div>

                {/* Zone Overrides List */}
                {zoneOverrides.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-[10px] font-black text-slate-400 tracking-wider uppercase mb-1">
                      Zone-specific overrides ({zoneOverrides.length})
                    </h4>
                    {zoneOverrides.map((zoneFee) => (
                      <div 
                        key={zoneFee._id} 
                        className="border border-slate-100 rounded-2xl p-3 flex justify-between items-center text-xs hover:bg-slate-50/50 transition"
                      >
                        <div className="space-y-1 overflow-hidden pr-2">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={12} className="text-purple-600 flex-shrink-0" />
                            <span className="font-extrabold text-slate-700 truncate">{zoneFee.zoneId}</span>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                              zoneFee.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                            }`}>
                              {zoneFee.isActive ? "Active" : "Disabled"}
                            </span>
                          </div>
                          <span className="font-bold text-slate-650 text-sm">
                            {zoneFee.valueType === "flat" ? `₹${zoneFee.value}` : `${zoneFee.value}%`}
                          </span>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleOpenEditModal(zoneFee)}
                            className="p-1.5 bg-white border hover:bg-slate-100 rounded-lg text-slate-500 transition"
                            title="Edit"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(zoneFee)}
                            className="p-1.5 bg-white border hover:bg-red-50 hover:text-red-650 rounded-lg text-slate-500 transition"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg">
                  {isEditing ? "Edit Fee Config" : "Add Fee Config"}
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Type: {formData.feeType}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-150 flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-100 text-red-750 text-xs p-3 rounded-2xl flex items-center gap-2 font-bold animate-shake">
                  <ShieldAlert size={16} className="flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Label */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">Display Label</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g. Special Rain Surcharge"
                  className="w-full border p-3 rounded-xl outline-none focus:border-purple-650 text-sm font-semibold"
                  required
                />
              </div>

              {/* Scope (Non-editable on editing global settings) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">Scope</label>
                  <select
                    disabled={isEditing}
                    value={formData.scope}
                    onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                    className="w-full border p-3 rounded-xl outline-none text-sm font-semibold bg-white"
                  >
                    <option value="global">Global</option>
                    <option value="zone">Zone Override</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">Value Type</label>
                  <select
                    value={formData.valueType}
                    onChange={(e) => setFormData({ ...formData, valueType: e.target.value })}
                    className="w-full border p-3 rounded-xl outline-none text-sm font-semibold bg-white"
                  >
                    <option value="flat">Flat Cash (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
              </div>

              {/* Zone Id (only if scope is zone) */}
              {formData.scope === "zone" && (
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">Zone / City Name</label>
                  <input
                    type="text"
                    disabled={isEditing}
                    value={formData.zoneId}
                    onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
                    placeholder="e.g. Noida, Indirapuram"
                    className="w-full border p-3 rounded-xl outline-none focus:border-purple-650 text-sm font-semibold"
                    required
                  />
                </div>
              )}

              {/* Value */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">Value</label>
                <input
                  type="number"
                  step="any"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                  className="w-full border p-3 rounded-xl outline-none focus:border-purple-650 text-sm font-semibold"
                  required
                />
              </div>

              {/* Condition */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">
                  Condition JSON (Optional)
                </label>
                <textarea
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  placeholder='e.g. {"appliesBelowCartValue":149}'
                  className="w-full border p-3 rounded-xl outline-none focus:border-purple-650 text-xs font-mono h-16"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-purple-600 hover:bg-purple-750 text-white font-extrabold py-3 rounded-xl text-sm transition flex items-center justify-center gap-1.5"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Save Config
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm dialog box */}
      {confirmState && (
        <ConfirmDialog
          message={confirmState.message}
          type="warning"
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}
