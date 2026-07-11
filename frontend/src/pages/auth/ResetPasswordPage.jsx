import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { resetPassword } from "../../services/authApi";

export default function ResetPasswordPage() {

  const navigate = useNavigate();
  const location = useLocation();

  const phoneNumber =
    location.state?.phoneNumber || "";

  const [loading, setLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [formData, setFormData] =
    useState({
      password: "",
      confirmPassword: "",
    });

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });

  };

  const getPasswordStrength = () => {

    const password =
      formData.password;

    if (password.length < 6)
      return {
        label: "Weak",
        color: "bg-red-500",
      };

    if (password.length < 10)
      return {
        label: "Medium",
        color: "bg-yellow-500",
      };

    return {
      label: "Strong",
      color: "bg-green-500",
    };

  };

  const strength =
    getPasswordStrength();

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      if (
        formData.password !==
        formData.confirmPassword
      ) {
        return alert(
          "Passwords do not match"
        );
      }

      try {

        setLoading(true);

        const response =
          await resetPassword({
            phoneNumber,
            password:
              formData.password,
          });

        console.log(response);

        alert(
          "Password Updated Successfully"
        );

        navigate("/login");

      } catch (error) {

        alert(
          error.response?.data
            ?.message ||
            "Something went wrong"
        );

      } finally {

        setLoading(false);

      }

    };

  return (

    <div className="min-h-screen bg-gradient-to-br from-[#F5EEFF] to-[#EDE2FF] flex items-center justify-center px-4 py-8">

      <div className="w-full max-w-md bg-white rounded-[35px] shadow-2xl p-8">

        <h1 className="text-4xl font-bold text-purple-700 text-center">
          QuickCart
        </h1>

        <h2 className="text-3xl font-bold text-center mt-8">
          Reset Password
        </h2>

        <p className="text-center text-gray-500 mt-3">
          Create a new password for your account.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6"
        >

          {/* Password */}

          <div>

            <label className="font-medium">
              New Password
            </label>

            <div className="relative mt-2">

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                value={
                  formData.password
                }
                onChange={
                  handleChange
                }
                placeholder="Enter new password"
                className="w-full p-4 border border-purple-200 rounded-2xl outline-none focus:border-purple-600"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                className="absolute right-4 top-4 text-gray-500"
              >
                {
                  showPassword
                    ? <EyeOff size={20} />
                    : <Eye size={20} />
                }
              </button>

            </div>

            {/* Strength */}

            {formData.password && (

              <div className="mt-3">

                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">

                  <div
                    className={`h-full ${strength.color}`}
                    style={{
                      width:
                        strength.label ===
                        "Weak"
                          ? "30%"
                          : strength.label ===
                            "Medium"
                          ? "65%"
                          : "100%",
                    }}
                  />

                </div>

                <p className="text-sm mt-2 text-gray-500">
                  Strength:
                  <span className="font-semibold ml-1">
                    {strength.label}
                  </span>
                </p>

              </div>

            )}

          </div>

          {/* Confirm Password */}

          <div>

            <label className="font-medium">
              Confirm Password
            </label>

            <div className="relative mt-2">

              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                name="confirmPassword"
                value={
                  formData.confirmPassword
                }
                onChange={
                  handleChange
                }
                placeholder="Confirm password"
                className="w-full p-4 border border-purple-200 rounded-2xl outline-none focus:border-purple-600"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                className="absolute right-4 top-4 text-gray-500"
              >
                {
                  showConfirmPassword
                    ? <EyeOff size={20} />
                    : <Eye size={20} />
                }
              </button>

            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-700 text-white font-semibold text-lg"
          >
            {
              loading
                ? "Updating..."
                : "Reset Password"
            }
          </button>

        </form>

        <button
          onClick={() =>
            navigate("/login")
          }
          className="mt-6 text-purple-700 font-medium"
        >
          ← Back to Login
        </button>

      </div>

    </div>

  );

}


