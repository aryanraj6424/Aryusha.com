import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Shield, CheckSquare, ArrowLeft } from "lucide-react";
import axios from "axios";
import { useToast } from "../../../components/Toast";
import { auth } from "../../../services/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

export default function DeliveryBoyOtpVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const phone = location.state?.phone || "";
  const e164Phone = location.state?.e164Phone || "";
  const isFirebaseFlow = location.state?.isFirebaseFlow || false;

  // Firebase confirmationResult passed via navigation state
  const confirmationResultRef = useRef(location.state?.confirmationResult || null);
  const resendRecaptchaRef = useRef(null);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    if (!phone) {
      showToast({ type: "warning", message: "Invalid session. Please try again." });
      navigate("/delivery-boy/login");
    }
  }, [phone, navigate]);

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter the verification OTP.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isFirebaseFlow) {
        // Firebase Phone Auth flow
        if (!confirmationResultRef.current) {
          setError("Session expired. Please request a new OTP.");
          setLoading(false);
          return;
        }

        const userCredential = await confirmationResultRef.current.confirm(otp);
        const idToken = await userCredential.user.getIdToken();

        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/firebase-login`,
          { idToken, role: "delivery-boy" }
        );

        if (res.data.success) {
          localStorage.setItem("deliveryBoyToken", res.data.token);
          localStorage.setItem("deliveryBoy", JSON.stringify(res.data.deliveryBoy));
          showToast({ type: "success", message: "Login successful!" });
          navigate("/delivery-boy/dashboard");
        }
      } else {
        // Legacy backend OTP verification (forgot-password flow)
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/delivery-boy/auth/verify-otp`, {
          phone,
          otp
        });

        if (res.data.success) {
          showToast({ type: "success", message: "OTP verified! Please set your new password." });
          navigate("/delivery-boy/reset-password", { state: { phone } });
        }
      }
    } catch (err) {
      console.error(err);
      const msg =
        err.code === "auth/invalid-verification-code"
          ? "Invalid OTP. Please check and try again."
          : err.code === "auth/code-expired"
          ? "OTP expired. Please request a new one."
          : err.response?.data?.message || "Invalid or expired OTP code.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const target = e164Phone || `+91${phone.replace(/\D/g, "").slice(-10)}`;

    try {
      if (resendRecaptchaRef.current) {
        resendRecaptchaRef.current.clear();
        resendRecaptchaRef.current = null;
      }
      resendRecaptchaRef.current = new RecaptchaVerifier(
        auth,
        "recaptcha-container-delivery-otp",
        { size: "invisible" }
      );

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        target,
        resendRecaptchaRef.current
      );

      confirmationResultRef.current = confirmationResult;
      setTimer(30);
      showToast({ type: "success", message: "OTP resent to " + target });
    } catch (error) {
      console.error("Delivery Boy resend error:", error);
      showToast({ type: "error", message: error.message || "Failed to resend OTP" });
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
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Verify OTP</h2>
          <p className="text-xs text-slate-500 font-semibold">We sent a verification code to your phone number</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="text-center space-y-1">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Mobile Number</p>
            <p className="font-extrabold text-slate-700">{phone}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Enter OTP Code</label>
            <input
              type="text"
              maxLength="6"
              placeholder="0 0 0 0 0 0"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-bold tracking-widest text-center text-lg text-slate-800"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#6d28d9] hover:bg-[#5b21b6] text-white rounded-2xl font-bold transition shadow-lg shadow-purple-200 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify OTP Code"} <CheckSquare size={18} />
          </button>
        </form>

        {/* Resend section */}
        {isFirebaseFlow && (
          <div className="text-center">
            {timer > 0 ? (
              <p className="text-slate-500 text-sm">
                Resend OTP in <span className="font-bold text-purple-700">{timer}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="text-purple-700 font-semibold hover:text-purple-900 text-sm"
              >
                Resend OTP
              </button>
            )}
          </div>
        )}

        <div className="flex justify-center pt-2 text-xs font-bold">
          <Link to="/delivery-boy/login" className="text-slate-400 hover:text-slate-600 flex items-center gap-1">
            <ArrowLeft size={14} /> Cancel
          </Link>
        </div>

      </div>

      {/* Invisible reCAPTCHA for resend */}
      <div id="recaptcha-container-delivery-otp" />
    </div>
  );
}
