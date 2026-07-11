import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AdminOtpVerification() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const phone =
      localStorage.getItem(
        "adminResetPhone"
      );

    if (!phone) {
      navigate(
        "/admin/forgot-password"
      );
    }
  }, [navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();

    const phone =
      localStorage.getItem(
        "adminResetPhone"
      );

    try {
      setLoading(true);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/auth/verify-otp`,
        {
          phone,
          otp,
        }
      );

      if (response.data.success) {
        alert(
          "OTP Verified Successfully"
        );

        navigate(
          "/admin/reset-password"
        );
      }
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "OTP Verification Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">

      <div className="bg-white p-8 rounded-2xl shadow w-full max-w-md">

        <h2 className="text-3xl font-bold mb-2 text-center">
          Verify OTP
        </h2>

        <p className="text-gray-500 text-center mb-6">
          Enter the 6-digit OTP
        </p>

        <form
          onSubmit={handleVerify}
          className="space-y-4"
        >

          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            maxLength={6}
            onChange={(e) =>
              setOtp(e.target.value)
            }
            className="w-full border p-3 rounded-xl"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-xl"
          >
            {loading
              ? "Verifying..."
              : "Verify OTP"}
          </button>

        </form>

      </div>

    </div>
  );
}