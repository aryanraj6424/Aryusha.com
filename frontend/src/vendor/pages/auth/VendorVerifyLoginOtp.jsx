import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../../components/Toast";
import { auth } from "../../../services/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

export default function VendorVerifyLoginOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const phone = location.state?.phone || localStorage.getItem("vendorLoginPhone") || "";
  const e164Phone = location.state?.e164Phone || "";
  const confirmationResultRef = useRef(location.state?.confirmationResult || null);
  const resendRecaptchaRef = useRef(null);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    if (!phone) {
      showToast({ type: "warning", message: "Please enter phone number first" });
      navigate("/vendor/login-otp");
    }
  }, [navigate, phone]);

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      showToast({ type: "warning", message: "Please enter a valid 6-digit OTP" });
      return;
    }
    if (!confirmationResultRef.current) {
      showToast({ type: "error", message: "Session expired. Please request a new OTP." });
      navigate("/vendor/login-otp");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Confirm with Firebase
      const userCredential = await confirmationResultRef.current.confirm(otp);
      const idToken = await userCredential.user.getIdToken();

      // Step 2: Verify on backend
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/firebase-login`,
        { idToken, role: "vendor" }
      );

      if (response.data.success) {
        localStorage.setItem("vendorToken", response.data.token);
        localStorage.setItem("vendor", JSON.stringify(response.data.vendor));
        localStorage.removeItem("vendorLoginPhone");

        showToast({ type: "success", message: "Login successful!" });
        navigate("/vendor/dashboard");
      }
    } catch (error) {
      console.error("Vendor OTP Verify error:", error);
      const msg =
        error.code === "auth/invalid-verification-code"
          ? "Invalid OTP. Please check and try again."
          : error.code === "auth/code-expired"
          ? "OTP expired. Please request a new one."
          : error.response?.data?.message || error.message || "OTP Verification Failed";
      showToast({ type: "error", message: msg });
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
        "recaptcha-container-vendor-verify",
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
      console.error("Vendor resend error:", error);
      showToast({ type: "error", message: error.message || "Failed to resend OTP" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center px-4">

      <div className="bg-white border border-purple-100 p-8 rounded-3xl shadow-lg w-full max-w-md">

        <h2 className="text-3xl font-bold mb-2 text-center">
          Verify Login OTP
        </h2>

        <p className="text-center text-gray-500 mb-6">
          Enter the 6-digit OTP sent to <span className="font-semibold text-purple-700">{phone}</span>
        </p>

        <form onSubmit={handleVerifyOtp} className="space-y-4">

          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            maxLength={6}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full px-4 py-3 border border-purple-200 rounded-2xl outline-none focus:border-purple-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-violet-700 text-white py-3 rounded-2xl font-semibold disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

        </form>

        <div className="text-center mt-6">
          {timer > 0 ? (
            <p className="text-gray-500">
              Resend OTP in <span className="font-bold text-purple-700">{timer}s</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="text-purple-700 font-semibold hover:text-purple-900"
            >
              Resend OTP
            </button>
          )}
        </div>

      </div>

      {/* Invisible reCAPTCHA for resend */}
      <div id="recaptcha-container-vendor-verify" />

    </div>
  );
}