import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Phone, ArrowLeft, ArrowRight, Shield } from "lucide-react";
import axios from "axios";
import { useToast } from "../../../components/Toast";

export default function DeliveryBoyForgotPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone) {
      setError("Please enter your phone number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/delivery-boy/auth/forgot-password`, { phone });
      if (res.data.success) {
        showToast({ type: "success", message: "OTP sent successfully! Check your registered number." });
        navigate("/delivery-boy/otp-verify", { state: { phone } });
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Phone number not registered.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center p-3 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden p-4 sm:p-8 border border-slate-100 space-y-4 sm:space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1.5 sm:space-y-2">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 text-[#0B2214] rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Shield size={26} className="sm:w-8 sm:h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Forgot Password</h2>
          <p className="text-xs text-slate-500 font-semibold">Enter phone number to receive recovery OTP</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-wider">Mobile Number</label>
            <div className="relative">
              <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                placeholder="Enter 10-digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold text-xs sm:text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 sm:py-4 bg-[#0B2214] hover:bg-[#153e25] text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Reset OTP"} <ArrowRight size={16} />
          </button>
        </form>

        <div className="flex justify-between items-center pt-1 text-xs font-bold">
          <Link to="/delivery-boy/login" className="text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer">
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
}
