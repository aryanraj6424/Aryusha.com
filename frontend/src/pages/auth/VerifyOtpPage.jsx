import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  verifyOtp,
  resendOtp,
} from "../../services/authApi";
import { useToast } from "../../components/Toast";

export default function OTPVerificationPage() {

  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const phoneNumber =
    location.state?.phoneNumber || "";

  const [otp, setOtp] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const [loading, setLoading] =
    useState(false);

  const [timer, setTimer] =
    useState(30);

  const inputsRef = useRef([]);

  useEffect(() => {

    if (!phoneNumber) {
      navigate("/forgot-password");
    }

  }, [phoneNumber, navigate]);

  useEffect(() => {

    if (timer === 0) return;

    const interval = setInterval(() => {

      setTimer((prev) => prev - 1);

    }, 1000);

    return () => clearInterval(interval);

  }, [timer]);

  const handleChange = (
    value,
    index
  ) => {

    if (!/^\d?$/.test(value))
      return;

    const newOtp = [...otp];

    newOtp[index] = value;

    setOtp(newOtp);

    if (
      value &&
      index < 5
    ) {
      inputsRef.current[index + 1]?.focus();
    }

  };

  const handleKeyDown = (
    e,
    index
  ) => {

    if (
      e.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      inputsRef.current[index - 1]?.focus();
    }

  };

  const handleVerify =
    async (e) => {

      e.preventDefault();

      const otpValue =
        otp.join("");

      if (
        otpValue.length !== 6
      ) {
        showToast({ type: "warning", message: "Please enter 6 digit OTP" });
        return;
      }

      try {

        setLoading(true);

        const response =
          await verifyOtp({
            phoneNumber,
            otp: otpValue,
          });

        console.log(response);

        showToast({
          type: "success",
          message: response.message || "OTP Verified Successfully"
        });

        navigate(
          "/reset-password",
          {
            state: {
              phoneNumber,
              resetToken: response.resetToken,
            },
          }
        );

      } catch (error) {

        console.error(error);

        showToast({
          type: "error",
          message: error.response?.data?.message || error.message || "Network Error"
        });

      } finally {

        setLoading(false);

      }

    };

  const handleResend =
    async () => {

      try {

        const response =
          await resendOtp({
            phoneNumber,
          });

        console.log(response);

        setTimer(30);

        showToast({
          type: "success",
          message: response.message || "OTP Resent Successfully"
        });

      } catch (error) {

        console.error(error);

        showToast({
          type: "error",
          message: error.response?.data?.message || error.message || "Network Error"
        });

      }

    };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EEFF] to-[#EDE2FF] flex items-center justify-center p-3 sm:p-6 md:p-8">
      <div className="w-full max-w-lg bg-white rounded-2xl sm:rounded-[35px] shadow-2xl p-4 sm:p-8 border border-purple-100">
        <h1 className="text-3xl sm:text-4xl font-bold text-purple-700 text-center">
          Aryusha
        </h1>

        <h2 className="text-2xl sm:text-3xl font-bold text-center mt-4 sm:mt-8 text-gray-800">
          Verify OTP
        </h2>

        <p className="text-center text-gray-500 text-xs sm:text-sm mt-2 sm:mt-3 px-1">
          Enter the 6 digit OTP sent to
          <span className="font-semibold text-purple-700 ml-1">
            {phoneNumber}
          </span>
        </p>

        <form onSubmit={handleVerify} className="mt-6 sm:mt-10">
          <div className="flex justify-center gap-1.5 sm:gap-3 my-4 sm:my-8 px-1">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-9 h-11 sm:w-12 sm:h-14 text-center text-base sm:text-xl font-bold border border-purple-300 rounded-lg sm:rounded-xl focus:border-purple-600 outline-none transition shrink-0"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 sm:mt-10 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-600 to-violet-700 text-white text-base sm:text-lg font-semibold cursor-pointer hover:opacity-95 transition shadow-md disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <div className="text-center mt-6 sm:mt-8 text-xs sm:text-sm">
          {timer > 0 ? (
            <p className="text-gray-500">
              Resend OTP in
              <span className="font-bold text-purple-700 ml-1">
                {timer}s
              </span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="text-purple-700 font-semibold hover:text-purple-900 cursor-pointer"
            >
              Resend OTP
            </button>
          )}
        </div>

        <button
          onClick={() => navigate("/forgot-password")}
          className="mt-4 sm:mt-6 text-xs sm:text-sm text-purple-700 font-medium hover:underline flex items-center gap-1 cursor-pointer"
        >
          ← Change Number
        </button>
      </div>
    </div>
  );

}