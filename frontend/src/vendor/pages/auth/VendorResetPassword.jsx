import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function VendorResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    const email =
      localStorage.getItem(
        "vendorResetEmail"
      );

    if (!email) {
      alert(
        "Session expired. Please try again."
      );

      return navigate(
        "/vendor/forgot-password"
      );
    }

    if (
      password !== confirmPassword
    ) {
      return alert(
        "Passwords do not match"
      );
    }

    if (password.length < 6) {
      return alert(
        "Password must be at least 6 characters"
      );
    }

    try {
      setLoading(true);

      const response =
        await axios.post(
          `${import.meta.env.VITE_API_URL}/vendor/auth/reset-password`,
          {
            businessEmail: email,
            newPassword:
              password,
          }
        );

      if (
        response.data.success
      ) {
        localStorage.removeItem(
          "vendorResetEmail"
        );

        alert(
          "Password Reset Successfully"
        );

        navigate(
          "/vendor/login"
        );
      }
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data
          ?.message ||
          "Password reset failed"
      );
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

        <form
          onSubmit={handleReset}
          className="space-y-4"
        >

          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            className="w-full border p-3 rounded-xl outline-none focus:border-purple-500"
            required
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(
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
              ? "Resetting..."
              : "Reset Password"}
          </button>

        </form>

      </div>

    </div>
  );
}