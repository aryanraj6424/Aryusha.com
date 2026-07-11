import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AdminResetPassword() {
  const navigate = useNavigate();

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword,
    setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      newPassword !==
      confirmPassword
    ) {
      return alert(
        "Passwords do not match"
      );
    }

    const phone =
      localStorage.getItem(
        "adminResetPhone"
      );

    try {
      setLoading(true);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/auth/reset-password`,
        {
          phone,
          newPassword,
        }
      );

      if (response.data.success) {
        localStorage.removeItem(
          "adminResetPhone"
        );

        alert(
          "Password Reset Successfully"
        );

        navigate(
          "/admin/login"
        );
      }
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Reset Password Failed"
      );
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

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) =>
              setNewPassword(
                e.target.value
              )
            }
            className="w-full border p-3 rounded-xl"
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
            className="w-full border p-3 rounded-xl"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-xl"
          >
            {loading
              ? "Updating..."
              : "Reset Password"}
          </button>

        </form>

      </div>

    </div>
  );
}