import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../components/Toast";
import { auth } from "../../../services/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

export default function VendorLoginOtp() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const recaptchaVerifierRef = useRef(null);

  const handleSendOtp = async (e) => {
    e.preventDefault();

    const rawPhone = phone.trim();
    if (!rawPhone) {
      showToast({ type: "warning", message: "Enter your phone number" });
      return;
    }

    // Build E.164 format
    const e164Phone = rawPhone.startsWith("+")
      ? rawPhone
      : `+91${rawPhone.replace(/\D/g, "").slice(-10)}`;

    try {
      setLoading(true);

      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }

      recaptchaVerifierRef.current = new RecaptchaVerifier(
        auth,
        "recaptcha-container-vendor-otp",
        { size: "invisible" }
      );

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        e164Phone,
        recaptchaVerifierRef.current
      );

      showToast({ type: "success", message: "OTP sent successfully!" });

      navigate("/vendor/verify-login-otp", {
        state: {
          phone: rawPhone,
          e164Phone,
          confirmationResult,
          role: "vendor",
        },
      });
    } catch (error) {
      console.error("Firebase Vendor OTP error:", error);
      const msg =
        error.code === "auth/too-many-requests"
          ? "Too many requests. Please try again later."
          : error.code === "auth/invalid-phone-number"
          ? "Invalid phone number format."
          : error.message || "Failed to send OTP";
      showToast({ type: "error", message: msg });
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

        <form onSubmit={handleSendOtp} className="space-y-4">

          <input
            type="tel"
            placeholder="Phone Number (e.g. 9876543210)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 border border-purple-200 rounded-2xl outline-none focus:border-purple-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-violet-700 text-white py-3 rounded-2xl font-semibold disabled:opacity-60"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>

        </form>

      </div>

      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container-vendor-otp" />

    </div>
  );
}