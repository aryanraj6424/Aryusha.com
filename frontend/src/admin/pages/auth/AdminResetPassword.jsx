import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../../components/Toast";

export default function AdminResetPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showToast({ type: "warning", message: "Passwords do not match" });
      return;
    }

    if (newPassword.length < 6) {
      showToast({ type: "warning", message: "Password must be at least 6 characters long." });
      return;
    }

    const phone = localStorage.getItem("adminResetPhone");
    const resetToken = localStorage.getItem("adminResetToken");

    if (!phone || !resetToken) {
      showToast({ type: "warning", message: "Session expired. Please request OTP again." });
      navigate("/admin/forgot-password");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/auth/forgot-password/reset`,
        {
          phone,
          resetToken,
          newPassword,
        }
      );

      if (response.data.success) {
        localStorage.removeItem("adminResetPhone");
        localStorage.removeItem("adminResetToken");

        showToast({ type: "success", message: "Password Reset Successfully!" });
        navigate("/admin/login");
      }
    } catch (error) {
      console.error(error);
      showToast({
        type: "error",
        message: error.response?.data?.message || "Reset Password Failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center">
          Reset Password
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-xl font-semibold cursor-pointer disabled:opacity-60"
          >
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}