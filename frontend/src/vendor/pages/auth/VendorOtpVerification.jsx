import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function VendorOtpVerification() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const resetPhone =
      localStorage.getItem(
        "vendorResetPhone"
      );

    const loginPhone =
      localStorage.getItem(
        "vendorLoginPhone"
      );

    if (
      !resetPhone &&
      !loginPhone
    ) {
      alert(
        "Please request OTP first"
      );

      navigate(
        "/vendor/login"
      );
    }
  }, [navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();

    const resetPhone =
      localStorage.getItem(
        "vendorResetPhone"
      );

    const loginPhone =
      localStorage.getItem(
        "vendorLoginPhone"
      );

    const phone =
      resetPhone || loginPhone;

    if (!phone) {
      alert(
        "Session expired. Please request OTP again."
      );

      navigate(
        "/vendor/login"
      );

      return;
    }

    if (otp.length !== 6) {
      return alert(
        "Please Enter Valid OTP"
      );
    }

    try {
      setLoading(true);

      const response =
        await axios.post(
          `${import.meta.env.VITE_API_URL}/vendor/auth/verify-otp`,
          {
            phone,
            otp,
          }
        );

      if (
        response.data.success
      ) {
        alert(
          "OTP Verified Successfully"
        );

        // Forgot Password Flow
        if (resetPhone) {
          navigate(
            "/vendor/reset-password"
          );
        }

        // Login OTP Flow
        if (loginPhone) {
          navigate(
            "/vendor/dashboard"
          );
        }
      }
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data
          ?.message ||
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
              setOtp(
                e.target.value
              )
            }
            className="w-full border p-3 rounded-xl outline-none focus:border-purple-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white p-3 rounded-xl hover:bg-purple-700 transition"
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