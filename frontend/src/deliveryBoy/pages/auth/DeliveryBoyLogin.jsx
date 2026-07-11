import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDeliveryBoy } from "../../context/DeliveryBoyContext";
import { Phone, Lock, Shield, ArrowRight, CheckSquare } from "lucide-react";
import axios from "axios";

export default function DeliveryBoyLogin() {
  const navigate = useNavigate();
  const { login } = useDeliveryBoy();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loginMode, setLoginMode] = useState("password"); // 'password' or 'otp'
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!phone || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/delivery-boy/auth/login`, {
        phone,
        password
      });

      if (res.data.success) {
        login(res.data.token, res.data.deliveryBoy);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Invalid phone number or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone) {
      setError("Please enter your phone number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/delivery-boy/auth/send-login-otp`, { phone });
      if (res.data.success) {
        setOtpSent(true);
        setError("");
        alert("Login OTP has been sent. Check server/backend console logs!");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Rider account not found or pending.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter the verification OTP.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/delivery-boy/auth/verify-login-otp`, {
        phone,
        otp
      });

      if (res.data.success) {
        login(res.data.token, res.data.deliveryBoy);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-8 border border-slate-100">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="w-16 h-16 bg-purple-100 text-[#6d28d9] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Shield size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Rider Portal</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Sign In to start earning</p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* Auth Forms */}
        {!otpSent ? (
          <form onSubmit={loginMode === "password" ? handlePasswordLogin : (e) => e.preventDefault()} className="space-y-5">
            {/* Phone */}
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

            {/* Password Field */}
            {loginMode === "password" && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Password</label>
                  <Link to="/delivery-boy/forgot-password" className="text-xs text-purple-600 hover:text-purple-800 font-extrabold">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-semibold text-sm"
                    required
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            {loginMode === "password" ? (
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#6d28d9] hover:bg-[#5b21b6] text-white rounded-2xl font-bold transition shadow-lg shadow-purple-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? "Signing In..." : "Sign In"} <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full py-4 bg-[#6d28d9] hover:bg-[#5b21b6] text-white rounded-2xl font-bold transition shadow-lg shadow-purple-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? "Sending..." : "Send Verification OTP"} <ArrowRight size={18} />
              </button>
            )}

            {/* Mode Switcher */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setLoginMode(loginMode === "password" ? "otp" : "password")}
                className="text-xs text-[#6d28d9] font-black uppercase tracking-wider hover:underline"
              >
                {loginMode === "password" ? "Login via Phone OTP" : "Login via Password"}
              </button>
            </div>
          </form>
        ) : (
          /* OTP verification form */
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div className="text-center space-y-1.5 mb-2">
              <p className="text-sm text-slate-500 font-semibold">We sent a 6-digit OTP code to</p>
              <p className="font-extrabold text-slate-700">{phone}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Enter OTP</label>
              <input
                type="text"
                maxLength="6"
                placeholder="0 0 0 0 0 0"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-bold tracking-widest text-center text-lg"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#6d28d9] hover:bg-[#5b21b6] text-white rounded-2xl font-bold transition shadow-lg shadow-purple-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? "Verifying..." : "Verify & Sign In"} <CheckSquare size={18} />
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-extrabold"
              >
                Change Phone Number
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs font-semibold text-slate-400">
          New Rider?{" "}
          <Link to="/delivery-boy/register" className="text-[#6d28d9] hover:text-[#5b21b6] font-black underline">
            Register Here
          </Link>
        </div>

      </div>
    </div>
  );
}
