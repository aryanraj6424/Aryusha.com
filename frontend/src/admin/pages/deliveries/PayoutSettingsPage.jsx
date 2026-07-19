import { useState, useEffect } from "react";
import axios from "axios";
import { CheckCircle, RefreshCw, X, Coins, Settings, User } from "lucide-react";

export default function PayoutSettingsPage() {
  const [globalSettings, setGlobalSettings] = useState({
    payoutType: "per_order",
    payoutAmount: 35,
    incentiveAmount: 5,
    commissionAmount: 2,
    onTimeThresholdMinutes: 45
  });
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState("");
  const [riderOverride, setRiderOverride] = useState({
    payoutType: "none",
    payoutAmount: 0,
    incentiveAmount: 0,
    commissionAmount: 0,
    onTimeThresholdMinutes: 45
  });
  const [savingOverride, setSavingOverride] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchPayoutSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/payout-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setGlobalSettings(res.data.settings);
      }

      // Fetch delivery boys to manage overrides
      const ridersRes = await axios.get(`${import.meta.env.VITE_API_URL}/admin/delivery-boys`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (ridersRes.data.success) {
        setRiders(ridersRes.data.riders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayoutSettings();
  }, []);

  const handleGlobalSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingGlobal(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/payout-settings`,
        globalSettings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMessage({ type: "success", text: "Global payout settings updated successfully!" });
        setGlobalSettings(res.data.settings);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to save global settings." });
    } finally {
      setSavingGlobal(false);
    }
  };

  const handleRiderChange = async (e) => {
    const riderId = e.target.value;
    setSelectedRiderId(riderId);
    if (!riderId) {
      setRiderOverride({ payoutType: "none", payoutAmount: 0, incentiveAmount: 0, commissionAmount: 0, onTimeThresholdMinutes: 45 });
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/delivery-boys/${riderId}/onboarding`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const override = res.data.rider.payoutOverride || {
          payoutType: "none",
          payoutAmount: 0,
          incentiveAmount: 0,
          commissionAmount: 0,
          onTimeThresholdMinutes: 45
        };
        setRiderOverride(override);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRiderId) return;

    try {
      setSavingOverride(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/delivery-boys/${selectedRiderId}/payout-override`,
        riderOverride,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMessage({ type: "success", text: "Rider payout settings override saved successfully!" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to save rider override settings." });
    } finally {
      setSavingOverride(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payout & Commissions Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Configure global payout schedules, base order rates, incentives, and customized overrides.</p>
        </div>
        <button 
          onClick={fetchPayoutSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-slate-650 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs font-bold border ${
          message.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-100" 
            : "bg-red-50 text-red-800 border-red-100"
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="hover:opacity-70"><X size={14} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Global Payout Setup */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Settings className="text-[#1a5d1a]" size={18} />
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Global Default Configurations</h2>
          </div>

          <form onSubmit={handleGlobalSubmit} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Payout Model</label>
                <select
                  value={globalSettings.payoutType}
                  onChange={(e) => setGlobalSettings({ ...globalSettings, payoutType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-green-650 bg-white"
                >
                  <option value="per_order">Per-Order Commission (Credit Instant)</option>
                  <option value="daily">Daily fixed rate salary schedule</option>
                  <option value="monthly">Monthly fixed salary schedule</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Base Amount (₹)</label>
                <input
                  type="number"
                  value={globalSettings.payoutAmount}
                  onChange={(e) => setGlobalSettings({ ...globalSettings, payoutAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-green-650 bg-slate-50/50"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">On-Time Incentive (₹)</label>
                <input
                  type="number"
                  value={globalSettings.incentiveAmount}
                  onChange={(e) => setGlobalSettings({ ...globalSettings, incentiveAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-green-650 bg-slate-50/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Extra Commission (₹)</label>
                <input
                  type="number"
                  value={globalSettings.commissionAmount}
                  onChange={(e) => setGlobalSettings({ ...globalSettings, commissionAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-green-650 bg-slate-50/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Time Threshold (Min)</label>
                <input
                  type="number"
                  value={globalSettings.onTimeThresholdMinutes}
                  onChange={(e) => setGlobalSettings({ ...globalSettings, onTimeThresholdMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-green-650 bg-slate-50/50"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingGlobal}
              className="w-full py-2 bg-[#1a5d1a] hover:bg-[#154b15] text-white font-black text-xs rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer text-center"
            >
              {savingGlobal ? "Saving Default Settings..." : "Save Default Settings"}
            </button>
          </form>
        </div>

        {/* Rider Overrides Setup */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Coins className="text-amber-600" size={18} />
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Per-Rider Custom Overrides</h2>
          </div>

          <div className="space-y-4 pt-1">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Select Delivery Boy</label>
              <select
                value={selectedRiderId}
                onChange={handleRiderChange}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-green-650 bg-white"
              >
                <option value="">-- Choose Delivery Boy --</option>
                {riders.map((r) => (
                  <option key={r._id} value={r._id}>{r.fullName} ({r.phone})</option>
                ))}
              </select>
            </div>

            {selectedRiderId && (
              <form onSubmit={handleOverrideSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Override Model</label>
                    <select
                      value={riderOverride.payoutType}
                      onChange={(e) => setRiderOverride({ ...riderOverride, payoutType: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-green-650 bg-white"
                    >
                      <option value="none">No Override (Inherit Global Default)</option>
                      <option value="per_order">Per-Order rate override</option>
                      <option value="daily">Daily fixed rate salary override</option>
                      <option value="monthly">Monthly fixed salary override</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Custom Base Rate (₹)</label>
                    <input
                      type="number"
                      disabled={riderOverride.payoutType === "none"}
                      value={riderOverride.payoutAmount}
                      onChange={(e) => setRiderOverride({ ...riderOverride, payoutAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-green-650 bg-slate-50/50 disabled:opacity-50"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Incentive Override (₹)</label>
                    <input
                      type="number"
                      disabled={riderOverride.payoutType === "none"}
                      value={riderOverride.incentiveAmount}
                      onChange={(e) => setRiderOverride({ ...riderOverride, incentiveAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-green-650 bg-slate-50/50 disabled:opacity-50"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Commission Override (₹)</label>
                    <input
                      type="number"
                      disabled={riderOverride.payoutType === "none"}
                      value={riderOverride.commissionAmount}
                      onChange={(e) => setRiderOverride({ ...riderOverride, commissionAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-green-650 bg-slate-50/50 disabled:opacity-50"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Threshold Override (Min)</label>
                    <input
                      type="number"
                      disabled={riderOverride.payoutType === "none"}
                      value={riderOverride.onTimeThresholdMinutes}
                      onChange={(e) => setRiderOverride({ ...riderOverride, onTimeThresholdMinutes: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-green-650 bg-slate-50/50 disabled:opacity-50"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingOverride}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer text-center"
                >
                  {savingOverride ? "Saving Override Rate..." : "Save Payout Rate Override"}
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
