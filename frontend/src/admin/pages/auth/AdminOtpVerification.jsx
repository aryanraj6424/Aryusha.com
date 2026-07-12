import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../../components/Toast";
import { auth } from "../../../services/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

export default function AdminOtpVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const phone = location.state?.phone || localStorage.getItem("adminResetPhone") || "";
  const e164Phone = location.state?.e164Phone || "";
  const isFirebaseFlow = location.state?.isFirebaseFlow || false;
  const role = location.state?.role || "admin";

  const confirmationResultRef = useRef(location.state?.confirmationResult || null);
  const resendRecaptchaRef = useRef(null);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    if (!phone) {
      showToast({ type: "warning", message: "Invalid session. Please login again." });
      navigate("/admin/login");
    }
  }, [phone, navigate, showToast]);

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      showToast({ type: "warning", message: "Please enter a valid 6-digit OTP" });
      return;
    }

    try {
      setLoading(true);

      if (isFirebaseFlow) {
        if (!confirmationResultRef.current) {
          showToast({ type: "error", message: "Session expired. Please request a new OTP." });
          setLoading(false);
          return;
        }

        // Step 1: Confirm OTP with Firebase
        const userCredential = await confirmationResultRef.current.confirm(otp);
        const idToken = await userCredential.user.getIdToken();

        // Step 2: Verify ID token server-side
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/firebase-login`,
          { idToken, role }
        );

        if (response.data.success) {
          localStorage.setItem("adminToken", response.data.token);
          localStorage.setItem("admin", JSON.stringify(response.data.admin));
          showToast({ type: "success", message: "Login successful!" });
          navigate("/admin/dashboard");
        }
      } else {
        // Legacy flow (forgot password)
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/admin/auth/verify-otp`,
          {
            phone,
            otp,
          }
        );

        if (response.data.success) {
          showToast({ type: "success", message: "OTP Verified Successfully" });
          navigate("/admin/reset-password");
        }
      }
    } catch (error) {
      console.error("Admin OTP Verification error:", error);
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
    if (!phone && !e164Phone) {
      showToast({ type: "warning", message: "Phone number missing" });
      return;
    }

    const target = e164Phone || `+91${phone.replace(/\D/g, "").slice(-10)}`;

    try {
      if (resendRecaptchaRef.current) {
        resendRecaptchaRef.current.clear();
        resendRecaptchaRef.current = null;
      }

      resendRecaptchaRef.current = new RecaptchaVerifier(
        auth,
        "recaptcha-container-admin-verify",
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
      console.error("Admin OTP Resend error:", error);
      showToast({ type: "error", message: error.message || "Failed to resend OTP" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow w-full max-w-md">
        <h2 className="text-3xl font-bold mb-2 text-center">Verify OTP</h2>
        <p className="text-gray-500 text-center mb-6">
          Enter the 6-digit OTP sent to <span className="font-semibold">{phone}</span>
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            maxLength={6}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-xl font-semibold disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        {isFirebaseFlow && (
          <div className="text-center mt-6">
            {timer > 0 ? (
              <p className="text-gray-500 text-sm">
                Resend OTP in <span className="font-bold text-blue-600">{timer}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="text-blue-600 font-semibold hover:underline text-sm"
              >
                Resend OTP
              </button>
            )}
          </div>
        )}
      </div>

      {/* Invisible reCAPTCHA */}
      <div id="recaptcha-container-admin-verify" />
    </div>
  );
}