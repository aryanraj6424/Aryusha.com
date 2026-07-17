import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Phone, Lock, ArrowRight, Loader2 } from "lucide-react";
import { loginUser } from "../../services/authApi";
import { signInWithGoogle } from "../../services/googleAuth";
import { useToast } from "../../components/Toast";
import AuthLayout, { InputField, PasswordToggle, Divider, GoogleButton } from "./AuthLayout";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

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
      {/* Headline */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-[#1F2937] tracking-tight">Welcome Back 👋</h2>
        <p className="text-sm text-[#6B7280] mt-1 font-medium">Login to continue shopping</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <InputField
          id="login-phone"
          label="Phone Number / Email"
          type="text"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          placeholder="Enter phone number or email"
          icon={Phone}
          error={errors.phoneNumber}
        />

        <InputField
          id="login-password"
          label="Password"
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

        <div className="flex justify-end -mt-1">
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-xs font-bold text-[#6B21D9] hover:underline cursor-pointer"
          >
            Forgot Password?
          </button>
        </div>

        <button
          type="submit"
          id="login-submit-btn"
          disabled={loading}
          className="w-full py-3.5 rounded-[14px] bg-[#6B21D9] hover:bg-[#5B18C2] active:scale-[0.98] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-300/40 focus:outline-none focus:ring-4 focus:ring-[#6B21D9]/20 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Logging In...</>
          ) : (
            <>Login <ArrowRight size={16} /></>
          )}
        </button>
      </form>

      <Divider />
      <GoogleButton onClick={handleGoogleLogin} disabled={googleLoading || loading} />

      <p className="text-center mt-6 text-sm text-[#6B7280] font-medium">
        New to Aryusha.com?{" "}
        <span
          onClick={() => navigate("/signup")}
          className="text-[#6B21D9] font-bold cursor-pointer hover:underline"
        >
          Sign Up
        </span>
      </p>
    </AuthLayout>
  );
}
