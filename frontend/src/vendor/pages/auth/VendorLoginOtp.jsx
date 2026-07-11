import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function VendorLoginOtp() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/vendor/auth/send-login-otp`,
        {
          phone,
        }
      );

      if (response.data.success) {
        localStorage.setItem(
          "vendorLoginPhone",
          phone
        );

        alert("OTP Sent Successfully");

        navigate(
          "/vendor/verify-login-otp"
        );
      }
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to send OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center px-4">

      <div className="bg-white border border-purple-100 p-8 rounded-3xl shadow-lg w-full max-w-md">

        <h2 className="text-3xl font-bold mb-2 text-center">
          Login with OTP
        </h2>

        <p className="text-center text-gray-500 mb-6">
          Enter your registered phone number
        </p>

        <form
          onSubmit={handleSendOtp}
          className="space-y-4"
        >

          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
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
              ? "Sending OTP..."
              : "Send OTP"}
          </button>

        </form>

      </div>

    </div>
  );
}