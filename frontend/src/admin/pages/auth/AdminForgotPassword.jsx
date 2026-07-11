import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AdminForgotPassword() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/auth/forgot-password`,
        {
          phone,
        }
      );

      if (response.data.success) {
        localStorage.setItem(
          "adminResetPhone",
          phone
        );

        alert("OTP Sent Successfully");

        navigate("/admin/verify-otp");
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4">

      <div className="bg-white border border-blue-100 p-8 rounded-3xl shadow-lg w-full max-w-md">

        <h2 className="text-3xl font-bold mb-2 text-center">
          Forgot Password
        </h2>

        <p className="text-center text-gray-500 mb-6">
          Enter your registered phone number
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
            className="w-full px-4 py-3 border border-blue-200 rounded-2xl outline-none focus:border-blue-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-2xl font-semibold"
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