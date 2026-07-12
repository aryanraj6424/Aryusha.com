import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginAdmin } from "../../services/adminApi";
import { useToast } from "../../../components/Toast";
import { auth } from "../../../services/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const recaptchaVerifierRef = useRef(null);

  // Password-based admin login (existing flow — unchanged)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await loginAdmin({ phone, password });

      localStorage.setItem("adminToken", response.token);
      localStorage.setItem("admin", JSON.stringify(response.admin));

      showToast({ type: "success", message: response.message || "Login Successful" });
      navigate("/admin/dashboard");
    } catch (error) {
      console.log(error);
      showToast({ type: "error", message: error?.response?.data?.message || "Login Failed" });
    } finally {
      setLoading(false);
    }
  };

  // OTP-based admin login via Firebase
  const handleOtpLogin = async () => {
    const rawPhone = phone.trim();
    if (!rawPhone) {
      showToast({ type: "warning", message: "Enter your phone number first" });
      return;
    }

    const e164Phone = rawPhone.startsWith("+")
      ? rawPhone
      : `+91${rawPhone.replace(/\D/g, "").slice(-10)}`;

    try {
      setOtpLoading(true);

      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }

      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth,
        "recaptcha-container-admin-login",
        { size: "invisible" }
      );

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        e164Phone,
        recaptchaVerifierRef.current
      );

      showToast({ type: "success", message: "OTP sent to " + e164Phone });

      navigate("/admin/otp-verify", {
        state: {
          phone: rawPhone,
          e164Phone,
          confirmationResult,
          isFirebaseFlow: true,
          role: "admin",
        },
      });
    } catch (error) {
      console.error("Admin Firebase OTP error:", error);
      const msg =
        error.code === "auth/too-many-requests"
          ? "Too many requests. Please try again later."
          : error.code === "auth/invalid-phone-number"
          ? "Invalid phone number format."
          : error.message || "Failed to send OTP";
      showToast({ type: "error", message: msg });
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-10 rounded-3xl shadow-lg w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-2">Admin Login</h1>
        <p className="text-center text-gray-500 mb-8">Super Admin Panel</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border p-3 rounded-xl"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-3 rounded-xl"
          />
          <div className="flex justify-end">
            <Link to="/admin/forgot-password" className="text-sm text-blue-600 hover:underline">
              Forgot Password?
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white p-3 rounded-xl disabled:opacity-60"
          >
            {loading ? "Logging In..." : "Login"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="border-t border-gray-200" />
          <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-3 text-gray-400 text-sm">OR</span>
        </div>

        {/* OTP login */}
        <button
          type="button"
          onClick={handleOtpLogin}
          disabled={otpLoading}
          className="w-full border-2 border-black text-black p-3 rounded-xl font-semibold hover:bg-gray-50 disabled:opacity-60"
        >
          {otpLoading ? "Sending OTP..." : "Login with OTP"}
        </button>
      </div>

      {/* Invisible reCAPTCHA */}
      <div id="recaptcha-container-admin-login" />
    </div>
  );
}