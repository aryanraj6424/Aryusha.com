import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ShieldAlert, ArrowLeft, KeyRound, HelpCircle, PhoneCall } from "lucide-react";
import axios from "axios";
import { useToast } from "../../../components/Toast";

export default function EnterOtp() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 4) {
      setError("Please enter the 4-digit OTP code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("deliveryBoyToken");
      const headers = { Authorization: `Bearer ${token}` };
      
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/delivery-boy/orders/${id}/verify-otp`, {
        otp,
        latitude: 28.6289, // mock current rider location coords
        longitude: 77.3659
      }, { headers });

      if (res.data.success) {
        showToast({ type: "success", message: "Delivery Confirmed!" });
        navigate(`/delivery-boy/orders/${id}/success`);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Invalid OTP code. Delivery validation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setTimer(30);
    showToast({ type: "success", message: "New OTP SMS request simulation: SMS resent successfully! Check Customer Order Details in customer panel to find it." });
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button 
        onClick={() => navigate(`/delivery-boy/orders/${id}`)}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-extrabold text-xs transition"
      >
        <ArrowLeft size={16} /> Back to Details
      </button>

      {/* OTP verification box */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md space-y-6 text-center">
        
        {/* Shield Icon */}
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <KeyRound size={28} />
        </div>

        {/* Labels */}
        <div className="space-y-2">
          <h2 className="text-lg font-black text-slate-850">OTP Verification</h2>
          <p className="text-xs text-slate-500 font-semibold px-4 leading-relaxed">
            Please ask the customer for the 4-digit verification code sent to their registered device.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold leading-normal">
            {error}
          </div>
        )}

        {/* Input form */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="max-w-xs mx-auto">
            <input
              type="text"
              maxLength="4"
              placeholder="0 0 0 0"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-48 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-black tracking-widest text-center text-2xl text-slate-850"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold transition shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? "Verifying..." : "Verify & Complete Delivery"}
          </button>
        </form>

        {/* Resend OTP */}
        <div className="text-xs font-bold pt-2">
          {timer > 0 ? (
            <p className="text-slate-400">Resend code in <span className="text-slate-700 font-extrabold">{timer}s</span></p>
          ) : (
            <button 
              type="button" 
              onClick={handleResend}
              className="text-[#6d28d9] hover:underline uppercase tracking-wider"
            >
              Resend OTP SMS
            </button>
          )}
        </div>

      </div>

      {/* Fraud notice warning */}
      <div className="bg-amber-50 border border-amber-150 p-4 rounded-3xl flex items-start gap-3 shadow-sm text-amber-800 text-xs font-semibold leading-relaxed">
        <ShieldAlert size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-extrabold">Important security notice</p>
          <p className="text-amber-700/80 mt-0.5">
            Do not deliver packages without correct OTP verification. Standard penalties and suspension apply for bypassing validation guidelines.
          </p>
        </div>
      </div>

      {/* Support center link */}
      <div className="bg-slate-100 border border-slate-200 rounded-3xl p-4 flex items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-3">
          <HelpCircle size={20} className="text-slate-500" />
          <div>
            <h4 className="text-xs font-black text-slate-850">Customer refusing OTP?</h4>
            <p className="text-[9px] text-slate-400 font-bold mt-0.5">Get dispatcher assistance</p>
          </div>
        </div>
        <a 
          href="tel:1800123456"
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-black text-[10px] text-slate-700 flex items-center gap-1 shadow-sm"
        >
          <PhoneCall size={10} /> Call Support
        </a>
      </div>

    </div>
  );
}
