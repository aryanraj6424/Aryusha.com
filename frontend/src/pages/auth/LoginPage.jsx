import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../services/authApi";
import { useToast } from "../../components/Toast";
import { auth } from "../../services/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";


export default function LoginPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const recaptchaVerifierRef = useRef(null);
  const [otpLoading, setOtpLoading] = useState(false);

  const [formData, setFormData] = useState({
    phoneNumber: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    setLoading(true);

    const response = await loginUser(formData);

    console.log("Login Response:", response);

    // Save User Data
    localStorage.setItem(
      "user",
      JSON.stringify(response.user)
    );
    if (response.token) {
      localStorage.setItem("userToken", response.token);
    }
    // Notify header components to re-read auth state
    window.dispatchEvent(new Event("auth-updated"));
    navigate("/");

    showToast({ type: "success", message: response.message || "Login Successful" });

    console.log("Before Navigate");

    navigate("/customer/dashboard");

    console.log("After Navigate");


  } catch (error) {

    console.error("Login Error:", error);

    showToast({
      type: "error",
      message: error.response?.data?.message || error.message || "Network Error"
    });

  } finally {
    setLoading(false);
  }
};


const handleOtpLogin = async () => {
  const rawPhone = formData.phoneNumber.trim();
  if (!rawPhone) {
    showToast({ type: "warning", message: "Enter your phone number first" });
    return;
  }

  // Build E.164 format — prefix +91 when 10 digits given
  const e164Phone = rawPhone.startsWith("+")
    ? rawPhone
    : `+91${rawPhone.replace(/\D/g, "").slice(-10)}`;

  try {
    setOtpLoading(true);

    // Re-create reCAPTCHA verifier on each attempt (needed after errors)
    if (recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current.clear();
      recaptchaVerifierRef.current = null;
    }
    recaptchaVerifierRef.current = new RecaptchaVerifier(
      auth,
      "recaptcha-container-customer",
      { size: "invisible" }
    );

    const confirmationResult = await signInWithPhoneNumber(
      auth,
      e164Phone,
      recaptchaVerifierRef.current
    );

    showToast({ type: "success", message: "OTP sent to " + e164Phone });

    navigate("/verify-otp", {
      state: {
        phoneNumber: rawPhone,
        e164Phone,
        confirmationResult,
        isLogin: true,
        role: "customer",
      },
    });
  } catch (error) {
    console.error("Firebase OTP error:", error);
    const msg =
      error.code === "auth/too-many-requests"
        ? "Too many requests. Please try again later."
        : error.code === "auth/invalid-phone-number"
        ? "Invalid phone number format."
        : error.message || "Failed to send OTP";
    showToast({ type: "error", message: msg });
  } finally {
    setOtpLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EEFF] to-[#EDE2FF] flex items-center justify-center px-4 py-8">

      <div className="w-full max-w-7xl grid lg:grid-cols-2 overflow-hidden rounded-[40px] bg-white shadow-2xl">

        {/* LEFT SIDE */}

        <div className="flex items-center justify-center p-6 sm:p-10">

          <div className="w-full max-w-md">

            <h1 className="text-4xl sm:text-5xl font-bold text-purple-700">
              QuickCart
            </h1>

            <p className="text-gray-500 mt-3">
              Your everyday needs, delivered in a click.
            </p>

            <div className="mt-8 bg-white/70 backdrop-blur-xl border border-purple-100 rounded-3xl p-6 shadow-xl">

              <h2 className="text-3xl font-bold text-gray-800">
                Welcome Back 👋
              </h2>

              <p className="mt-2 text-gray-500">
                Login to continue shopping
              </p>

              <form
                className="mt-8 space-y-5"
                onSubmit={handleSubmit}
              >

                {/* Phone Number */}

                <div>

                  <label className="font-medium text-gray-700">
                    Phone Number
                  </label>

                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    className="w-full mt-2 p-4 rounded-2xl border border-purple-200 outline-none focus:border-purple-600"
                  />

                </div>

                {/* Password */}

                <div>

                  <div className="flex justify-between mb-2">

                    <label className="font-medium text-gray-700">
                      Password
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        navigate("/forgot-password")
                      }
                      className="text-sm text-purple-700 hover:text-purple-900"
                    >
                      Forgot Password?
                    </button>

                  </div>

                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full p-4 rounded-2xl border border-purple-200 outline-none focus:border-purple-600"
                  />

                </div>

                {/* Login Button */}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-700 text-white text-lg font-semibold hover:scale-[1.02] duration-300"
                >
                  {loading
                    ? "Logging In..."
                    : "Login"}
                </button>

                {/* Divider */}

                <div className="relative">

                  <div className="border-t"></div>

                  <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-4 text-gray-400 text-sm">
                    OR
                  </span>

                </div>

                {/* OTP Login */}

               <button
  type="button"
  onClick={handleOtpLogin}
  disabled={otpLoading}
  className="w-full py-4 border-2 border-purple-600 rounded-2xl text-purple-700 font-semibold hover:bg-purple-50 duration-300 disabled:opacity-60"
>
  {otpLoading ? "Sending OTP..." : "Login with OTP"}
</button>

              </form>

              {/* Signup Link */}

              <p className="text-center mt-8 text-gray-500">

                New to QuickCart?

                <span
                  onClick={() =>
                    navigate("/signup")
                  }
                  className="ml-2 text-purple-700 font-semibold cursor-pointer"
                >
                  Sign Up
                </span>

              </p>

            </div>

          </div>

        </div>

        {/* RIGHT SIDE */}

        <div className="hidden lg:flex bg-gradient-to-br from-purple-700 to-violet-500 items-center justify-center relative overflow-hidden">

          <div className="absolute inset-0 opacity-10">

            <div className="w-[500px] h-[500px] rounded-full bg-white blur-3xl absolute -top-20 -right-20"></div>

            <div className="w-[400px] h-[400px] rounded-full bg-pink-300 blur-3xl absolute bottom-0 left-0"></div>

          </div>

          <div className="relative z-10 text-center text-white p-10">

            <img
              src="/basket.png"
              alt=""
              className="w-[350px] mx-auto"
            />

            <h2 className="text-5xl font-bold mt-8">
              Fast Delivery ⚡
            </h2>

            <p className="text-xl mt-5 text-purple-100">
              Groceries, vegetables, fruits and more delivered to your doorstep.
            </p>

            <div className="flex justify-center gap-6 mt-10">

              <div className="bg-white/20 backdrop-blur-md rounded-2xl px-6 py-4">
                🚀 Fast
              </div>

              <div className="bg-white/20 backdrop-blur-md rounded-2xl px-6 py-4">
                🛒 Wide Range
              </div>

              <div className="bg-white/20 backdrop-blur-md rounded-2xl px-6 py-4">
                🔒 Secure
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Invisible reCAPTCHA mount point for Firebase Phone Auth */}
      <div id="recaptcha-container-customer" />

    </div>
  );
}
