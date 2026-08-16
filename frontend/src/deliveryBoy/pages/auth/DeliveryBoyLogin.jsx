import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../../components/Toast";

export default function DeliveryBoyLogin() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState({ phone: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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
            className="w-full bg-gradient-to-r from-violet-600 to-purple-700 text-white py-3 rounded-2xl font-semibold disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          <button onClick={() => navigate("/delivery-boy/forgot-password")} className="text-violet-600 font-semibold hover:underline cursor-pointer">
            Forgot Password?
          </button>
        </p>
        <p className="text-center text-sm text-gray-500 mt-2">
          Don't have an account?{" "}
          <button onClick={() => navigate("/delivery-boy/register")} className="text-violet-600 font-semibold hover:underline cursor-pointer">
            Register
          </button>
        </p>
      </div>
    </div>
  );
}
