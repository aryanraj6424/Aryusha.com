import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../../components/Toast";

export default function AdminOtpVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const phone = location.state?.phone || localStorage.getItem("adminResetPhone") || "";

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

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/auth/forgot-password/verify-otp`,
        {
          phone,
          otp,
        }
      );

      if (response.data.success) {
        if (response.data.resetToken) {
          localStorage.setItem("adminResetToken", response.data.resetToken);
        }
        showToast({ type: "success", message: "OTP Verified Successfully" });
        navigate("/admin/reset-password");
      }
    } catch (error) {
      console.error("Admin OTP Verification error:", error);
      showToast({
        type: "error",
        message: error.response?.data?.message || "OTP Verification Failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!phone) {
      showToast({ type: "warning", message: "Phone number missing" });
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/auth/forgot-password/send-otp`,
        { phone }
      );
      if (response.data.success) {
        setTimer(30);
        showToast({ type: "success", message: "OTP resent successfully!" });
      }
    } catch (error) {
      console.error("Admin OTP Resend error:", error);
      showToast({ type: "error", message: error.response?.data?.message || "Failed to resend OTP" });
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
            className="w-full bg-blue-600 text-white p-3 rounded-xl font-semibold disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <div className="text-center mt-6">
          {timer > 0 ? (
            <p className="text-gray-500 text-sm">
              Resend OTP in <span className="font-bold text-blue-600">{timer}s</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="text-blue-600 font-semibold hover:underline text-sm cursor-pointer"
            >
              Resend OTP
            </button>
          )}
        </div>
      </div>
    </div>
  );
}