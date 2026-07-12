import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../../components/Toast";
import { auth } from "../../../services/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

export default function DeliveryBoyLogin() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState({ phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const recaptchaVerifierRef = useRef(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Password-based login (existing flow — unchanged)
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/delivery-boy/auth/login`, form);
      if (res.data.success) {
        localStorage.setItem("deliveryBoyToken", res.data.token);
        localStorage.setItem("deliveryBoy", JSON.stringify(res.data.deliveryBoy));

        if (res.data.requiresOtp) {
          localStorage.setItem("deliveryBoyLoginPhone", form.phone);
          showToast({ type: "info", message: "Login OTP has been sent to your registered number." });
          navigate("/delivery-boy/otp-verify");
        } else {
          navigate("/delivery-boy/dashboard");
        }
      }
    } catch (error) {
      console.error(error);
      showToast({ type: "error", message: error.response?.data?.message || "Login failed. Please check your credentials." });
    } finally {
      setLoading(false);
    }
  };

  // OTP-based login via Firebase
  const handleOtpLogin = async () => {
    const rawPhone = form.phone.trim();
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
        "recaptcha-container-delivery-login",
        { size: "invisible" }
      );

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        e164Phone,
        recaptchaVerifierRef.current
      );

      showToast({ type: "success", message: "OTP sent to " + e164Phone });

      navigate("/delivery-boy/otp-verify", {
        state: {
          phone: rawPhone,
          e164Phone,
          confirmationResult,
          isFirebaseFlow: true,
          role: "delivery-boy",
        },
      });
    } catch (error) {
      console.error("Firebase Delivery Boy OTP error:", error);
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
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-white flex items-center justify-center px-4">
      <div className="bg-white border border-violet-100 p-8 rounded-3xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-2 text-center text-slate-800">Delivery Login</h2>
        <p className="text-center text-gray-500 mb-6">Sign in to your rider account</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-violet-200 rounded-2xl outline-none focus:border-violet-500"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-violet-200 rounded-2xl outline-none focus:border-violet-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-700 text-white py-3 rounded-2xl font-semibold disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="border-t border-gray-200" />
          <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-3 text-gray-400 text-sm">OR</span>
        </div>

        {/* OTP Login via Firebase */}
        <button
          type="button"
          onClick={handleOtpLogin}
          disabled={otpLoading}
          className="w-full border-2 border-violet-600 text-violet-700 py-3 rounded-2xl font-semibold hover:bg-violet-50 disabled:opacity-60"
        >
          {otpLoading ? "Sending OTP..." : "Login with OTP"}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          <button onClick={() => navigate("/delivery-boy/forgot-password")} className="text-violet-600 font-semibold hover:underline">
            Forgot Password?
          </button>
        </p>
        <p className="text-center text-sm text-gray-500 mt-2">
          Don't have an account?{" "}
          <button onClick={() => navigate("/delivery-boy/register")} className="text-violet-600 font-semibold hover:underline">
            Register
          </button>
        </p>
      </div>

      {/* Invisible reCAPTCHA */}
      <div id="recaptcha-container-delivery-login" />
    </div>
  );
}
