import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../../components/Toast";

export default function VendorResetPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    const phone = localStorage.getItem("vendorResetPhone");

    if (!phone) {
      showToast({ type: "warning", message: "Session expired. Please try again." });
      return navigate("/vendor/forgot-password");
    }

    if (password !== confirmPassword) {
      showToast({ type: "warning", message: "Passwords do not match" });
      return;
    }

    if (password.length < 6) {
      showToast({ type: "warning", message: "Password must be at least 6 characters" });
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/vendor/auth/reset-password`,
        { phone, newPassword: password }
      );

      if (response.data.success) {
        localStorage.removeItem("vendorResetPhone");
        showToast({ type: "success", message: "Password reset successfully!" });
        navigate("/vendor/login");
      }
    } catch (error) {
      console.error(error);
      showToast({
        type: "error",
        message: error.response?.data?.message || "Password reset failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">

      <div className="bg-white p-8 rounded-2xl shadow w-full max-w-md">

        <h2 className="text-3xl font-bold mb-2 text-center">
          Reset Password
        </h2>

        <p className="text-center text-gray-500 mb-6">
          Create a new password
        </p>

        <form onSubmit={handleReset} className="space-y-4">

          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-3 rounded-xl outline-none focus:border-purple-500"
            required
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border p-3 rounded-xl outline-none focus:border-purple-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white p-3 rounded-xl hover:bg-purple-700 transition"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>

        </form>

      </div>

    </div>
  );
}