import React, { useState, useEffect } from "react";
import { getFeeSettings, updateFeeSettings } from "../../services/feeSettingsApi";
import { Settings, Save, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export default function FeeSettings() {
  const [formData, setFormData] = useState({
    handlingFee: 0,
    smallCartFee: 0,
    smallCartThreshold: 0,
    deliveryPartnerFee: 0,
    gstPercent: 5,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await getFeeSettings();
      if (res.success && res.data) {
        setFormData({
          handlingFee: res.data.handlingFee || 0,
          smallCartFee: res.data.smallCartFee || 0,
          smallCartThreshold: res.data.smallCartThreshold || 0,
          deliveryPartnerFee: res.data.deliveryPartnerFee || 0,
          gstPercent: res.data.gstPercent || 0,
        });
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("Failed to load fee settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const validate = () => {
    if (
      formData.handlingFee < 0 ||
      formData.smallCartFee < 0 ||
      formData.smallCartThreshold < 0 ||
      formData.deliveryPartnerFee < 0
    ) {
      return "Fees and thresholds cannot be negative numbers.";
    }
    if (formData.gstPercent < 0 || formData.gstPercent > 100) {
      return "GST / Tax percentage must be between 0 and 100.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    try {
      setSaving(true);
      const res = await updateFeeSettings(formData);
      if (res.success) {
        setSuccessMsg("Platform fee settings saved successfully!");
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg(error.response?.data?.message || "Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-green-600 mb-2" size={32} />
        <p className="text-gray-500 font-medium">Loading Fee Settings...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 text-green-700 rounded-lg">
          <Settings size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Platform Fee Settings</h1>
          <p className="text-sm text-gray-500">Configure default order surcharges, taxes, and service fees</p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-3 rounded">
          <AlertCircle size={20} className="flex-shrink-0" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 flex items-center gap-3 rounded">
          <CheckCircle size={20} className="flex-shrink-0" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          
          {/* Handling Fee */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start border-b pb-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Handling Fee (₹)</label>
              <p className="text-xs text-gray-500">
                Fixed flat packaging or processing surcharge applied to every placed order.
              </p>
            </div>
            <div className="md:col-span-2">
              <input
                type="number"
                name="handlingFee"
                value={formData.handlingFee}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          {/* Small Cart Fee */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start border-b pb-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Small Cart Fee (₹)</label>
              <p className="text-xs text-gray-500">
                Extra charge added to encourage larger order values when order subtotal is below the threshold.
              </p>
            </div>
            <div className="md:col-span-2">
              <input
                type="number"
                name="smallCartFee"
                value={formData.smallCartFee}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          {/* Small Cart Threshold */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start border-b pb-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Small Cart Threshold (₹)</label>
              <p className="text-xs text-gray-500">
                The minimum order subtotal. Orders below this value trigger the Small Cart Fee surcharge.
              </p>
            </div>
            <div className="md:col-span-2">
              <input
                type="number"
                name="smallCartThreshold"
                value={formData.smallCartThreshold}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          {/* Delivery Partner Fee */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start border-b pb-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Partner Fee (₹)</label>
              <p className="text-xs text-gray-500">
                Standard shipping/delivery fee applied to orders to compensate the delivery partner.
              </p>
            </div>
            <div className="md:col-span-2">
              <input
                type="number"
                name="deliveryPartnerFee"
                value={formData.deliveryPartnerFee}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

          {/* GST % */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start pb-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">GST / Tax Rate (%)</label>
              <p className="text-xs text-gray-500">
                Percentage-based tax applied to order items subtotal (usually between 0% and 28%).
              </p>
            </div>
            <div className="md:col-span-2">
              <input
                type="number"
                name="gstPercent"
                value={formData.gstPercent}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
          </div>

        </div>

        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
          <button
            type="button"
            onClick={fetchSettings}
            disabled={saving}
            className="px-4 py-2 border rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Saving...
              </>
            ) : (
              <>
                <Save size={16} /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
