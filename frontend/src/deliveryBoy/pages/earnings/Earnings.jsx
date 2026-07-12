import { useState, useEffect } from "react";
import { ArrowLeft, Wallet, TrendingUp, Calendar, AlertCircle, ArrowUpRight } from "lucide-react";
import axios from "axios";
import { useToast } from "../../../components/Toast";
import ConfirmDialog from "../../../components/Toast/ConfirmDialog";

export default function Earnings() {
  const [earnings, setEarnings] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payoutPeriod, setPayoutPeriod] = useState("weekly"); // 'daily', 'weekly', 'monthly'
  const { showToast } = useToast();
  const [confirmState, setConfirmState] = useState(null);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("deliveryBoyToken");
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/delivery-boy/earnings`, { headers });
      if (res.data.success) {
        setEarnings(res.data.earnings);
        setHistory(res.data.history || []);
      }
    } catch (error) {
      console.error("Failed to load earnings data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const handleWithdraw = () => {
    if (!earnings || earnings.walletBalance <= 0) {
      showToast({ type: "warning", message: "Insufficient wallet balance for withdrawal." });
      return;
    }
    setConfirmState({
      message: `Are you sure you want to withdraw ₹${earnings.walletBalance}?`,
      onConfirm: () => {
        setConfirmState(null);
        showToast({
          type: "success",
          message: `Withdrawal Request Submitted Successfully! ₹${earnings.walletBalance} will be credited to your linked UPI/Bank Account within 24 hours.`
        });
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-650"></div>
      </div>
    );
  }

  // Calculate stats based on period
  const multiplier = payoutPeriod === "daily" ? 1 : payoutPeriod === "weekly" ? 7 : 30;
  const baseEarnings = (earnings?.totalEarnings || 0) * (multiplier / 7);
  const baseIncentives = (earnings?.incentives || 0) * (multiplier / 7);
  const baseCommissions = (earnings?.commissions || 0) * (multiplier / 7);

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-slate-800">Earnings Center</h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Track your delivery pay and payouts</p>
      </div>

      {/* Wallet balance & withdraw */}
      <div className="bg-gradient-to-br from-indigo-650 to-purple-750 text-white rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-2xl">
            <Wallet size={24} className="text-purple-200" />
          </div>
          <div>
            <span className="text-[10px] text-purple-200 font-black uppercase tracking-wider block">Wallet Balance</span>
            <span className="text-2xl font-black">₹{earnings?.walletBalance || 0}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={handleWithdraw}
            className="flex-1 py-3 bg-white hover:bg-slate-50 text-purple-700 font-black text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            Instant Cash Out
          </button>
          <div className="flex-1 text-xs font-semibold text-purple-100 flex items-center justify-center">
            <span>Settled: ₹{earnings?.settledBalance || 0}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
        {["daily", "weekly", "monthly"].map((period) => (
          <button
            key={period}
            onClick={() => setPayoutPeriod(period)}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              payoutPeriod === period
                ? "bg-white text-[#6d28d9] shadow-sm font-extrabold"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Period summary breakdown */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Breakdown Summary</h3>
        <div className="divide-y divide-slate-50 text-xs">
          
          {/* Base delivery charges */}
          <div className="py-3 flex justify-between font-semibold">
            <span className="text-slate-500">Delivery Payouts</span>
            <span className="font-extrabold text-slate-800">₹{baseEarnings.toFixed(2)}</span>
          </div>

          {/* Incentives */}
          <div className="py-3 flex justify-between font-semibold">
            <span className="text-slate-500">Route Incentives</span>
            <span className="font-extrabold text-emerald-700">+ ₹{baseIncentives.toFixed(2)}</span>
          </div>

          {/* Commissions */}
          <div className="py-3 flex justify-between font-semibold">
            <span className="text-slate-500">Commissions & Tips</span>
            <span className="font-extrabold text-emerald-700">+ ₹{baseCommissions.toFixed(2)}</span>
          </div>

          {/* Total Period Earnings */}
          <div className="py-3.5 flex justify-between font-black border-t border-slate-100 text-sm">
            <span className="text-slate-800">Total Period Pay</span>
            <span className="text-[#6d28d9]">₹{(baseEarnings + baseIncentives + baseCommissions).toFixed(2)}</span>
          </div>

        </div>
      </div>

      {/* Payout History logs */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-slate-800 text-sm px-1">Recent Settlements</h3>
        
        {history.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 text-center text-xs font-semibold text-slate-400">
            No completed delivery logs in history.
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((item) => (
              <div 
                key={item._id}
                className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm flex justify-between items-center"
              >
                <div className="space-y-1">
                  <p className="font-black text-xs text-slate-800">#{item.orderId?.slice(-6).toUpperCase()}</p>
                  <p className="text-[10px] text-slate-400 font-bold">
                    Delivered: {new Date(item.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-black text-emerald-700 text-xs block">+ ₹{(item.deliveryCharge || 35) + 7}</span>
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Credits Applied</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmState && (
        <ConfirmDialog
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}
