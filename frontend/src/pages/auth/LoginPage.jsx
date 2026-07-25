import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Phone, Lock, ArrowRight, Loader2 } from "lucide-react";
import { loginUser } from "../../services/authApi";
import { signInWithGoogle } from "../../services/googleAuth";
import { useToast } from "../../components/Toast";
import AuthLayout, { InputField, PasswordToggle, Divider, GoogleButton } from "./AuthLayout";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

import SEO from "../../components/SEO";

/* ─── validation ──────────────────────────────────────────── */
function validate(formData) {
  const errors = {};
  if (!formData.phoneNumber.trim()) errors.phoneNumber = "Phone number or email is required.";
  if (!formData.password) {
    errors.password = "Password is required.";
  } else if (formData.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  return errors;
}

/* ─── component ───────────────────────────────────────────── */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const redirectTo = location.state?.redirectTo || "/customer/dashboard";

  const [formData, setFormData] = useState({ phoneNumber: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  /* ── Email/Password login ─────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = validate(formData);
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return; }
    try {
      setLoading(true);
      const response = await loginUser(formData);
      localStorage.setItem("user", JSON.stringify(response.user));
      if (response.token) localStorage.setItem("userToken", response.token);
      window.dispatchEvent(new Event("auth-updated"));
      window.dispatchEvent(new Event("cart-updated"));
      showToast({ type: "success", message: response.message || "Login Successful" });
      navigate(redirectTo);
    } catch (error) {
      showToast({ type: "error", message: error.response?.data?.message || error.message || "Network Error" });
    } finally {
      setLoading(false);
    }
  };

  /* ── Google login (GIS → backend verify) ─────────────── */
  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const idToken = await signInWithGoogle();
      const { data } = await axios.post(`${API_BASE}/auth/google`, { idToken });
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userToken", data.token);
      window.dispatchEvent(new Event("auth-updated"));
      window.dispatchEvent(new Event("cart-updated"));
      showToast({ type: "success", message: `Welcome, ${data.user.fullName}!` });
      navigate(redirectTo);
    } catch (error) {
      const msg =
        error.message === "Google sign-in was cancelled or failed."
          ? null // silent — user closed the popup
          : error.response?.data?.message || error.message || "Google sign-in failed. Please try again.";
      if (msg) showToast({ type: "error", message: msg });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout>
      <SEO title="Login | Aryusha" noindex={true} />
      {/* Headline */}
      <div className="mb-5 sm:mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Welcome Back 👋</h2>
        <p className="text-sm text-slate-500 mt-1 font-medium">Login to continue shopping on Aryusha</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <InputField
          id="login-phone"
          label="PHONE NUMBER / EMAIL"
          type="text"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          placeholder="Enter phone number or email"
          icon={Phone}
          error={errors.phoneNumber}
        />

        <div>
          <InputField
            id="login-password"
            label="PASSWORD"
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            icon={Lock}
            error={errors.password}
            rightElement={
              <PasswordToggle
                show={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
              />
            }
          />
          <div className="flex justify-end mt-1.5">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-xs font-extrabold text-[#6B21D9] hover:text-purple-800 hover:underline cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>
        </div>

        <button
          type="submit"
          id="login-submit-btn"
          disabled={loading}
          className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-[#6B21D9] via-[#7C3AED] to-[#6B21D9] hover:from-[#5B18C2] hover:to-[#6D28D9] active:scale-[0.99] text-white text-sm sm:text-base font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 focus:outline-none focus:ring-4 focus:ring-[#6B21D9]/20 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-5"
        >
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> Logging In...</>
          ) : (
            <>Login <ArrowRight size={18} /></>
          )}
        </button>
      </form>

      <Divider />
      <GoogleButton onClick={handleGoogleLogin} disabled={googleLoading || loading} />

      <p className="text-center mt-5 sm:mt-6 text-sm text-slate-500 font-semibold">
        New to Aryusha?{" "}
        <span
          onClick={() => navigate("/signup")}
          className="text-[#6B21D9] font-extrabold cursor-pointer hover:underline ml-1"
        >
          Sign Up
        </span>
      </p>
    </AuthLayout>
  );
}
