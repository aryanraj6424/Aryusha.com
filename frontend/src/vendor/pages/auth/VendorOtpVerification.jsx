import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../../components/Toast";

export default function VendorOtpVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);

  const resetPhone = location.state?.phone || localStorage.getItem("vendorResetPhone") || "";

  useEffect(() => {
    if (!resetPhone) {
      showToast({ type: "warning", message: "Please request OTP first" });
      navigate("/vendor/forgot-password");
    }
  }, [navigate, resetPhone, showToast]);

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!resetPhone) {
      showToast({ type: "warning", message: "Session expired. Please request OTP again." });
      navigate("/vendor/forgot-password");
      return;
    }

    if (otp.length !== 6) {
      showToast({ type: "warning", message: "Please enter a valid 6-digit OTP" });
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/vendor/auth/forgot-password/verify-otp`,
        { phone: resetPhone, otp }
      );

      if (response.data.success) {
        if (response.data.resetToken) {
          localStorage.setItem("vendorResetToken", response.data.resetToken);
        }
        showToast({ type: "success", message: "OTP verified successfully!" });
        navigate("/vendor/reset-password");
      }
    } catch (error) {
      console.error(error);
      showToast({
        type: "error",
        message: error.response?.data?.message || "OTP Verification Failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!resetPhone) {
      showToast({ type: "warning", message: "Phone number missing" });
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/vendor/auth/forgot-password/send-otp`,
        { phone: resetPhone }
      );
      if (response.data.success) {
        setTimer(30);
        showToast({ type: "success", message: "OTP resent successfully!" });
      }
    } catch (error) {
      console.error("Vendor OTP Resend error:", error);
      showToast({ type: "error", message: error.response?.data?.message || "Failed to resend OTP" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow w-full max-w-md">
        <h2 className="text-3xl font-bold mb-2 text-center">Verify OTP</h2>
        <p className="text-gray-500 text-center mb-6">
          Enter the 6-digit OTP sent to <span className="font-semibold text-purple-700">{resetPhone}</span>
        </p>

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            maxLength={6}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full border p-3 rounded-xl outline-none focus:border-purple-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white p-3 rounded-xl hover:bg-purple-700 transition cursor-pointer disabled:opacity-60 font-semibold"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <div className="text-center mt-6">
          {timer > 0 ? (
            <p className="text-gray-500 text-sm">
              Resend OTP in <span className="font-bold text-purple-700">{timer}s</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="text-purple-700 font-semibold hover:underline text-sm cursor-pointer"
            >
              Resend OTP
            </button>
          )}
        </div>
      </div>
    </div>
  );
}