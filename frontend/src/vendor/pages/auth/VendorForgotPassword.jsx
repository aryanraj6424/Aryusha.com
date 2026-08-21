import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../../components/Toast";

export default function VendorForgotPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const API = `${import.meta.env.VITE_API_URL}/vendor/auth`;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const rawPhone = phone.trim();
    if (!rawPhone) {
      showToast({ type: "warning", message: "Please enter phone number" });
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API}/forgot-password/send-otp`,
        {
          phone: rawPhone,
        }
      );

      if (response.data.success) {
        localStorage.setItem("vendorResetPhone", rawPhone);

        showToast({
          type: "success",
          message: response.data.message || "WhatsApp OTP Sent Successfully.",
        });

        navigate("/vendor/verify-otp", {
          state: {
            phone: rawPhone,
          },
        });
      }
    } catch (error) {
      console.error(error);

      showToast({
        type: "error",
        message: error?.response?.data?.message || "Failed to send OTP",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white border border-purple-100 p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-center text-gray-800">
          Forgot Password
        </h2>

        <p className="text-center text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
          Enter your registered phone number
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="tel"
            placeholder="Phone Number (e.g. 9876543210)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-purple-200 rounded-xl sm:rounded-2xl outline-none focus:border-purple-500 transition"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-violet-700 text-white py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base cursor-pointer disabled:opacity-60 hover:opacity-95 transition shadow-md"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}