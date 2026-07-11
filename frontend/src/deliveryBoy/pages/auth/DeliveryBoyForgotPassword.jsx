import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Phone, ArrowLeft, ArrowRight, Shield } from "lucide-react";
import axios from "axios";

export default function DeliveryBoyForgotPassword() {
  const navigate = useNavigate();
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
        alert("OTP Sent successfully. Check server/backend console logs!");
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
    <div className="min-h-screen bg-slate-100 flex justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-8 border border-slate-100 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-purple-100 text-[#6d28d9] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Shield size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Forgot Password</h2>
          <p className="text-xs text-slate-500 font-semibold">Enter phone number to receive recovery OTP</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Mobile Number</label>
            <div className="relative">
              <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                placeholder="Enter 10-digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold text-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#6d28d9] hover:bg-[#5b21b6] text-white rounded-2xl font-bold transition shadow-lg shadow-purple-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? "Sending..." : "Send Reset OTP"} <ArrowRight size={18} />
          </button>
        </form>

        <div className="flex justify-between items-center pt-2 text-xs font-bold">
          <Link to="/delivery-boy/login" className="text-slate-400 hover:text-slate-600 flex items-center gap-1">
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
}
