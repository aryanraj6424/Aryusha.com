import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Phone, Lock, ArrowRight, Loader2 } from "lucide-react";
import { signupUser } from "../../services/authApi";
import { signInWithGoogle } from "../../services/googleAuth";
import { useToast } from "../../components/Toast";
import AuthLayout, { InputField, PasswordToggle, Divider, GoogleButton } from "./AuthLayout";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

/* ─── validation ──────────────────────────────────────────── */
function validate(formData) {
  const errors = {};
  if (!formData.fullName.trim()) errors.fullName = "Full name is required.";
  if (!formData.phoneNumber.trim()) errors.phoneNumber = "Phone number or email is required.";
  if (!formData.password) {
    errors.password = "Password is required.";
  } else if (formData.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  if (!formData.confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }
  return errors;
}

/* ─── component ───────────────────────────────────────────── */
export default function SignupPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  /* ── Email/Phone signup ───────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = validate(formData);
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return; }
    try {
      setLoading(true);
      const response = await signupUser({
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
      });
      showToast({ type: "success", message: response?.message || "Account created successfully" });
      navigate("/login");
    } catch (error) {
      showToast({ type: "error", message: error?.response?.data?.message || error?.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  /* ── Google signup (GIS → backend verify) ─────────────── */
  const handleGoogleSignup = async () => {
    try {
      setGoogleLoading(true);
      const idToken = await signInWithGoogle();
      const { data } = await axios.post(`${API_BASE}/auth/google`, { idToken });
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userToken", data.token);
      window.dispatchEvent(new Event("auth-updated"));
      window.dispatchEvent(new Event("cart-updated"));
      showToast({ type: "success", message: `Welcome, ${data.user.fullName}!` });
      navigate("/customer/dashboard");
    } catch (error) {
      const msg =
        error.message === "Google sign-in was cancelled or failed."
          ? null
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
        <h2 className="text-2xl font-black text-[#1F2937] tracking-tight">Create Account 👋</h2>
        <p className="text-sm text-[#6B7280] mt-1 font-medium">Sign up to start shopping</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <InputField
          id="signup-name"
          label="Full Name"
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Enter your name"
          icon={User}
          error={errors.fullName}
        />

        <InputField
          id="signup-phone"
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
          id="signup-password"
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

        <InputField
          id="signup-confirm-password"
          label="Confirm Password"
          type={showConfirm ? "text" : "password"}
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm your password"
          icon={Lock}
          error={errors.confirmPassword}
          rightElement={
            <PasswordToggle
              show={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
              label="confirm password"
            />
          }
        />

        <button
          type="submit"
          id="signup-submit-btn"
          disabled={loading}
          className="w-full py-3.5 rounded-[14px] bg-[#6B21D9] hover:bg-[#5B18C2] active:scale-[0.98] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-300/40 focus:outline-none focus:ring-4 focus:ring-[#6B21D9]/20 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Creating Account...</>
          ) : (
            <>Sign Up <ArrowRight size={16} /></>
          )}
        </button>
      </form>

      <Divider />
      <GoogleButton onClick={handleGoogleSignup} disabled={googleLoading || loading} />

      <p className="text-center mt-6 text-sm text-[#6B7280] font-medium">
        Already have an account?{" "}
        <span
          onClick={() => navigate("/login")}
          className="text-[#6B21D9] font-bold cursor-pointer hover:underline"
        >
          Login
        </span>
      </p>
    </AuthLayout>
  );
}