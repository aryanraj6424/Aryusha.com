import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function VendorVerifyLoginOtp() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const phone = localStorage.getItem(
      "vendorLoginPhone"
    );

    if (!phone) {
      alert(
        "Please enter phone number first"
      );

      navigate(
        "/vendor/login-otp"
      );
    }
  }, [navigate]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    const phone = localStorage.getItem(
      "vendorLoginPhone"
    );

    if (!phone) {
      alert(
        "Session expired. Please try again."
      );

      navigate(
        "/vendor/login-otp"
      );

      return;
    }

    if (otp.length !== 6) {
      return alert(
        "Please enter valid OTP"
      );
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/vendor/auth/verify-login-otp`,
        {
          phone,
          otp,
        }
      );

      if (response.data.success) {
        localStorage.setItem(
          "vendorToken",
          response.data.token
        );

        localStorage.setItem(
          "vendor",
          JSON.stringify(
            response.data.vendor
          )
        );

        localStorage.removeItem(
          "vendorLoginPhone"
        );

        alert(
          "Login Successful"
        );

        navigate(
          "/vendor/dashboard"
        );
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center px-4">

      <div className="bg-white border border-purple-100 p-8 rounded-3xl shadow-lg w-full max-w-md">

        <h2 className="text-3xl font-bold mb-2 text-center">
          Verify Login OTP
        </h2>

        <p className="text-center text-gray-500 mb-6">
          Enter the 6-digit OTP
        </p>

        <form
          onSubmit={handleVerifyOtp}
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
            className="w-full px-4 py-3 border border-purple-200 rounded-2xl outline-none focus:border-purple-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-violet-700 text-white py-3 rounded-2xl font-semibold"
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