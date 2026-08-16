import React, { useState, useEffect } from "react";
import { 
  getAdminDeliverySlots, 
  createAdminDeliverySlot, 
  updateAdminDeliverySlot, 
  deleteAdminDeliverySlot 
} from "../../services/deliverySlotApi";
import { getVendors } from "../../services/vendorApi";
import { 
  Clock, Plus, Edit2, Trash2, ShieldAlert, 
  X, Loader2, RefreshCw, MapPin, ToggleLeft, ToggleRight, Calendar, Store, Globe
} from "lucide-react";
import ConfirmDialog from "../../../components/Toast/ConfirmDialog";
import { useToast } from "../../../components/Toast";

export default function DeliveryTimeSlots() {
  const { showToast } = useToast();
  const [slots, setSlots] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [confirmState, setConfirmState] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    startTime: "",
    endTime: "",
    cutoffTime: "",
    city: "",
    isGlobal: true,
    vendorIds: [],
    isActive: true,
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSlots();
    fetchLiveVendors();
  }, []);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const res = await getAdminDeliverySlots();
      if (res.success) {
        setSlots(res.slots || []);
      }
    } catch (err) {
      console.error("Error fetching slots:", err);
      showToast({ type: "error", message: "Failed to load delivery slots." });
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveVendors = async () => {
    try {
      setLoadingVendors(true);
      const res = await getVendors();
      if (res && res.success) {
        setVendors(res.vendors || res.data || []);
      } else if (Array.isArray(res)) {
        setVendors(res);
      }
    } catch (err) {
      console.error("Error fetching live vendors:", err);
    } finally {
      setLoadingVendors(false);
    }
  };

  const handleToggleActive = async (slot) => {
    try {
      const nextStatus = !slot.isActive;
      const res = await updateAdminDeliverySlot(slot._id, { isActive: nextStatus });
      if (res.success) {
        showToast({
          type: "success",
          message: `"${slot.name}" is now ${nextStatus ? "Active 🟢" : "Disabled 🔴"}`
        });
        fetchSlots();
      }
    } catch (err) {
      console.error("Error toggling slot status:", err);
      showToast({ type: "error", message: "Failed to update slot status." });
    }
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormError("");
    setFormData({
      name: "",
      startTime: "09:00 AM",
      endTime: "12:00 PM",
      cutoffTime: "08:00",
      city: "",
      isGlobal: true,
      vendorIds: [],
      isActive: true,
    });
    fetchLiveVendors();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (slot) => {
    setIsEditing(true);
    setCurrentId(slot._id);
    setFormError("");
    const extractedVendorIds = Array.isArray(slot.vendorIds)
      ? slot.vendorIds.map(v => typeof v === "object" ? v._id : v)
      : [];

    setFormData({
      name: slot.name || "",
      startTime: slot.startTime || "",
      endTime: slot.endTime || "",
      cutoffTime: slot.cutoffTime || "",
      city: slot.city || "",
      isGlobal: slot.isGlobal !== undefined ? slot.isGlobal : true,
      vendorIds: extractedVendorIds,
      isActive: slot.isActive !== undefined ? slot.isActive : true,
    });
    fetchLiveVendors();
    setIsModalOpen(true);
  };

  const handleDeleteClick = (slot) => {
    setConfirmState({
      message: `Are you sure you want to delete the slot "${slot.name}"?`,
      onConfirm: async () => {
        try {
          const res = await deleteAdminDeliverySlot(slot._id);
          if (res.success) {
            showToast({ type: "success", message: "Delivery slot deleted successfully." });
            fetchSlots();
          }
        } catch (err) {
          console.error("Error deleting slot:", err);
          showToast({ type: "error", message: "Failed to delete slot." });
        } finally {
          setConfirmState(null);
        }
      }
    });
  };

  const handleVendorToggle = (vId) => {
    setFormData(prev => {
      const exists = prev.vendorIds.includes(vId);
      const updated = exists ? prev.vendorIds.filter(id => id !== vId) : [...prev.vendorIds, vId];
      return { ...prev, vendorIds: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name || !formData.startTime || !formData.endTime || !formData.cutoffTime) {
      setFormError("Slot Name, Start Time, End Time, and Cutoff Time are required.");
      return;
    }

    if (!formData.isGlobal && formData.vendorIds.length === 0) {
      setFormError("Please select at least one vendor for vendor-specific delivery slots.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        city: formData.city.trim() || null,
      };

      if (isEditing) {
        const res = await updateAdminDeliverySlot(currentId, payload);
        if (res.success) {
          showToast({ type: "success", message: "Delivery slot updated successfully!" });
          setIsModalOpen(false);
          fetchSlots();
        }
      } else {
        const res = await createAdminDeliverySlot(payload);
        if (res.success) {
          showToast({ type: "success", message: "New delivery slot created!" });
          setIsModalOpen(false);
          fetchSlots();
        }
      }
    } catch (err) {
      console.error("Error submitting slot:", err);
      setFormError(err.response?.data?.message || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-purple-650" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto select-none">
      {/* Title Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Clock className="text-purple-650" size={28} /> Delivery Time Slot Management
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Configure live customer delivery time windows, cutoff times, vendor assignments, and area coverage.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchSlots}
            className="p-2.5 hover:bg-slate-50 border rounded-xl transition text-slate-500 cursor-pointer"
            title="Reload time slots"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow cursor-pointer"
          >
            <Plus size={16} /> Add Delivery Slot
          </button>
        </div>
      </div>

      {/* Slots List Cards */}
      {slots.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 space-y-3">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
            <Calendar size={24} />
          </div>
          <h3 className="font-extrabold text-slate-800 text-base">No Delivery Slots Configured</h3>
          <p className="text-xs text-slate-400 font-medium max-w-md mx-auto">
            Click "Add Delivery Slot" above to create real time windows for your customers.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
          >
            Create First Slot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {slots.map((slot) => {
            const assignedVendorNames = Array.isArray(slot.vendorIds)
              ? slot.vendorIds.map(v => typeof v === "object" ? (v.shopName || v.ownerName) : v).filter(Boolean)
              : [];

            return (
              <div 
                key={slot._id} 
                className={`bg-white rounded-3xl p-6 shadow-sm border transition flex flex-col justify-between space-y-4 ${
                  slot.isActive ? "border-slate-150" : "border-slate-100 bg-slate-50/50 opacity-75"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start border-b pb-3 mb-3">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                        {slot.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mt-0.5">
                        Cutoff: {slot.cutoffTime} (24h)
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleActive(slot)}
                      className="text-slate-500 hover:text-slate-800 transition cursor-pointer"
                      title={slot.isActive ? "Disable slot" : "Enable slot"}
                    >
                      {slot.isActive ? (
                        <ToggleRight size={32} className="text-emerald-500" />
                      ) : (
                        <ToggleLeft size={32} className="text-slate-300" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 font-bold">
                      <Clock size={14} className="text-purple-600 flex-shrink-0" />
                      <span>{slot.startTime} - {slot.endTime}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600 font-semibold">
                      <Globe size={14} className="text-slate-400 flex-shrink-0" />
                      <span>Scope: <strong className="text-slate-800">{slot.isGlobal !== false ? "Global (All Vendors)" : "Vendor Specific"}</strong></span>
                    </div>

                    {!slot.isGlobal && assignedVendorNames.length > 0 && (
                      <div className="flex items-start gap-2 text-slate-600 font-semibold">
                        <Store size={14} className="text-purple-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Assigned Vendors ({assignedVendorNames.length}):</span>
                          <span className="text-slate-800 font-extrabold text-xs">{assignedVendorNames.join(", ")}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t flex justify-between items-center text-xs">
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                    slot.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-200 text-slate-600"
                  }`}>
                    {slot.isActive ? "Active" : "Disabled"}
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEditModal(slot)}
                      className="p-1.5 bg-white border hover:bg-slate-100 rounded-lg text-slate-600 transition cursor-pointer"
                      title="Edit slot"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(slot)}
                      className="p-1.5 bg-white border hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-600 transition cursor-pointer"
                      title="Delete slot"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg">
                  {isEditing ? "Edit Delivery Slot" : "Add New Delivery Slot"}
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Configure delivery window, vendor assignment, and same-day cutoff.
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-150 flex items-center justify-center text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="bg-red-50 border border-red-100 text-red-750 text-xs p-3 rounded-2xl flex items-center gap-2 font-bold">
                  <ShieldAlert size={16} className="flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Slot Name */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">Slot Display Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Early Morning Slot"
                  className="w-full border p-3 rounded-xl outline-none focus:border-purple-650 text-sm font-semibold"
                  required
                />
              </div>

              {/* Scope Selection */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <label className="text-xs font-black text-slate-700 block">Vendor Scope Assignment</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="isGlobal"
                      checked={formData.isGlobal === true}
                      onChange={() => setFormData({ ...formData, isGlobal: true, vendorIds: [] })}
                      className="accent-purple-600"
                    />
                    <span>Global (All Vendors)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="isGlobal"
                      checked={formData.isGlobal === false}
                      onChange={() => setFormData({ ...formData, isGlobal: false })}
                      className="accent-purple-600"
                    />
                    <span>Specific Vendors</span>
                  </label>
                </div>
              </div>

              {/* Live Vendor Picker List */}
              {!formData.isGlobal && (
                <div className="space-y-1 bg-purple-50/20 p-3.5 rounded-2xl border border-purple-100">
                  <label className="text-xs font-black text-slate-700 flex justify-between items-center">
                    <span>Select Vendors from Real Backend Catalog</span>
                    <span className="text-[10px] text-purple-700 font-bold">{formData.vendorIds.length} Selected</span>
                  </label>

                  {loadingVendors ? (
                    <div className="py-4 text-center text-xs text-slate-400 font-semibold animate-pulse">
                      Loading onboarded vendors...
                    </div>
                  ) : vendors.length === 0 ? (
                    <p className="text-xs text-amber-700 font-bold p-2 bg-amber-50 rounded-xl">
                      No onboarded vendors found in database.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 mt-2">
                      {vendors.map((v) => {
                        const vId = v._id;
                        const isChecked = formData.vendorIds.includes(vId);
                        const vendorTitle = v.shopName || v.ownerName || v.name || "Vendor Store";
                        const cityInfo = v.city ? ` (${v.city})` : "";

                        return (
                          <label
                            key={vId}
                            className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition ${
                              isChecked
                                ? "bg-purple-100/60 border-purple-300 text-purple-900 font-extrabold"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleVendorToggle(vId)}
                                className="accent-purple-600 rounded"
                              />
                              <span>{vendorTitle}{cityInfo}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{vId.slice(-6)}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Start & End Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">Start Time</label>
                  <input
                    type="text"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    placeholder="e.g. 07:00 AM"
                    className="w-full border p-3 rounded-xl outline-none focus:border-purple-650 text-xs font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700">End Time</label>
                  <input
                    type="text"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    placeholder="e.g. 10:00 AM"
                    className="w-full border p-3 rounded-xl outline-none focus:border-purple-650 text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Cutoff Time */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700">Same-Day Cutoff Time (24h Format HH:MM)</label>
                <input
                  type="text"
                  value={formData.cutoffTime}
                  onChange={(e) => setFormData({ ...formData, cutoffTime: e.target.value })}
                  placeholder="e.g. 06:00 or 14:00"
                  className="w-full border p-3 rounded-xl outline-none focus:border-purple-650 text-xs font-mono font-semibold"
                  required
                />
                <p className="text-[10px] text-slate-400 font-medium">Orders placed after this time cannot select this slot for same-day delivery.</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-3 rounded-xl text-sm transition flex items-center justify-center gap-1.5 shadow cursor-pointer"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Save Slot
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
