// import { useState, useRef, useEffect } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { resetPassword } from "../../services/authApi";
// import {
//   verifyOtp,
//   resendOtp,
// } from "../../services/authApi";

// export default function OTPVerificationPage() {

//   const navigate = useNavigate();
//   const location = useLocation();

//   const phoneNumber =
//     location.state?.phoneNumber || "";

//   const [otp, setOtp] = useState([
//     "",
//     "",
//     "",
//     "",
//     "",
//     "",
//   ]);

//   const [loading, setLoading] =
//     useState(false);

//   const [timer, setTimer] =
//     useState(30);

//   const inputsRef = useRef([]);

//   useEffect(() => {

//     if (timer === 0) return;

//     const interval = setInterval(() => {

//       setTimer((prev) => prev - 1);

//     }, 1000);

//     return () => clearInterval(interval);

//   }, [timer]);

//   const handleChange = (
//     value,
//     index
//   ) => {

//     if (!/^\d?$/.test(value))
//       return;

//     const newOtp = [...otp];

//     newOtp[index] = value;

//     setOtp(newOtp);

//     if (
//       value &&
//       index < 5
//     ) {
//       inputsRef.current[
//         index + 1
//       ]?.focus();
//     }

//   };

//   const handleKeyDown = (
//     e,
//     index
//   ) => {

//     if (
//       e.key === "Backspace" &&
//       !otp[index] &&
//       index > 0
//     ) {
//       inputsRef.current[
//         index - 1
//       ]?.focus();
//     }

//   };

//   const handleVerify =
//     async (e) => {

//       e.preventDefault();

//       const otpValue =
//         otp.join("");

//       if (
//         otpValue.length !== 6
//       ) {
//         return alert(
//           "Please enter OTP"
//         );
//       }

//       try {

//         setLoading(true);

//         const response =
//           await verifyOtp({
//             phoneNumber,
//             otp: otpValue,
//           });

//         console.log(response);

//         alert(
//           "OTP Verified"
//         );

//         navigate(
//           "/reset-password",
//           {
//             state: {
//               phoneNumber,
//             },
//           }
//         );

//       } catch (error) {

//         alert(
//           error.response?.data
//             ?.message
//         );

//       } finally {

//         setLoading(false);

//       }

//     };

//   const handleResend =
//     async () => {

//       try {

//         await resendOtp({
//           phoneNumber,
//         });

//         setTimer(30);

//         alert(
//           "OTP Resent"
//         );

//       } catch (error) {

//         alert(
//           error.response?.data
//             ?.message
//         );

//       }

//     };

//   return (

//     <div className="min-h-screen bg-gradient-to-br from-[#F5EEFF] to-[#EDE2FF] flex items-center justify-center px-4">

//       <div className="w-full max-w-lg bg-white rounded-[35px] shadow-2xl p-8">

//         <h1 className="text-4xl font-bold text-purple-700 text-center">
//           QuickCart
//         </h1>

//         <h2 className="text-3xl font-bold text-center mt-8">
//           Verify OTP
//         </h2>

//         <p className="text-center text-gray-500 mt-3">

//           Enter the 6 digit OTP sent to

//           <span className="font-semibold text-purple-700 ml-1">
//             {phoneNumber}
//           </span>

//         </p>

//         <form
//           onSubmit={
//             handleVerify
//           }
//           className="mt-10"
//         >

//           <div className="flex justify-center gap-2 sm:gap-3">

//             {otp.map(
//               (
//                 digit,
//                 index
//               ) => (

//                 <input
//                   key={index}
//                   ref={(el) =>
//                     (
//                       inputsRef.current[
//                         index
//                       ] = el
//                     )
//                   }
//                   type="text"
//                   maxLength={1}
//                   value={digit}
//                   onChange={(e) =>
//                     handleChange(
//                       e.target
//                         .value,
//                       index
//                     )
//                   }
//                   onKeyDown={(e) =>
//                     handleKeyDown(
//                       e,
//                       index
//                     )
//                   }
//                   className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold border border-purple-300 rounded-xl focus:border-purple-600 outline-none"
//                 />

//               )
//             )}

//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full mt-10 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-700 text-white font-semibold text-lg"
//           >
//             {
//               loading
//                 ? "Verifying..."
//                 : "Verify OTP"
//             }
//           </button>

//         </form>

//         <div className="text-center mt-8">

//           {timer > 0 ? (

//             <p className="text-gray-500">

//               Resend OTP in

//               <span className="font-bold text-purple-700 ml-1">
//                 {timer}s
//               </span>

//             </p>

//           ) : (

//             <button
//               onClick={
//                 handleResend
//               }
//               className="text-purple-700 font-semibold hover:text-purple-900"
//             >
//               Resend OTP
//             </button>

//           )}

//         </div>

//         <button
//           onClick={() =>
//             navigate(
//               "/forgot-password"
//             )
//           }
//           className="mt-6 text-purple-700"
//         >
//           ← Change Number
//         </button>

//       </div>

//     </div>

//   );

// }




// import { useState, useRef, useEffect } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import {
//   verifyOtp,
//   resendOtp,
//   loginUser,
// } from "../../services/authApi";

// export default function OTPVerificationPage() {

//   const navigate = useNavigate();
//   const location = useLocation();

//   const phoneNumber =
//     location.state?.phoneNumber || "";

//     const isLogin =
//   location.state?.isLogin || false;

//   const [otp, setOtp] = useState([
//     "",
//     "",
//     "",
//     "",
//     "",
//     "",
//   ]);
  

//   const [loading, setLoading] =
//     useState(false);

//   const [timer, setTimer] =
//     useState(30);

//   const inputsRef = useRef([]);

//   useEffect(() => {

//     if (!phoneNumber) {
//       navigate("/forgot-password");
//     }

//   }, [phoneNumber, navigate]);

//   useEffect(() => {

//     if (timer === 0) return;

//     const interval = setInterval(() => {

//       setTimer((prev) => prev - 1);

//     }, 1000);

//     return () => clearInterval(interval);

//   }, [timer]);

//   const handleChange = (
//     value,
//     index
//   ) => {

//     if (!/^\d?$/.test(value))
//       return;

//     const newOtp = [...otp];

//     newOtp[index] = value;

//     setOtp(newOtp);

//     if (
//       value &&
//       index < 5
//     ) {
//       inputsRef.current[
//         index + 1
//       ]?.focus();
//     }

//   };

//   const handleKeyDown = (
//     e,
//     index
//   ) => {

//     if (
//       e.key === "Backspace" &&
//       !otp[index] &&
//       index > 0
//     ) {
//       inputsRef.current[
//         index - 1
//       ]?.focus();
//     }

//   };

//   const handleVerify =
//     async (e) => {

//       e.preventDefault();

//       const otpValue =
//         otp.join("");

//       if (
//         otpValue.length !== 6
//       ) {
//         return alert(
//           "Please enter OTP"
//         );
//       }

//       if (!phoneNumber) {
//         return alert(
//           "Phone number missing"
//         );
//       }

//       try {

//         setLoading(true);

//         const response =
//           await verifyOtp({
//             phoneNumber,
//             otp: otpValue,
//           });

//         console.log(response);

//        alert(
//   response.message ||
//   "OTP Verified"
// );

// // User Save
// localStorage.setItem(
//   "user",
//   JSON.stringify(response.user)
// );

// // Home Page
// navigate("/");

//       } catch (error) {

//         console.error(error);

//         alert(
//           error.response?.data?.message ||
//           error.message ||
//           "Network Error"
//         );

//       } finally {

//         setLoading(false);

//       }

//     };

//   const handleResend =
//     async () => {

//       if (!phoneNumber) {
//         return alert(
//           "Phone number missing"
//         );
//       }

//       try {

//         const response =
//           await resendOtp({
//             phoneNumber,
//           });

//         console.log(response);

//         setTimer(30);

//         alert(
//           response.message ||
//           "OTP Resent"
//         );

//       } catch (error) {

//         console.error(error);

//         alert(
//           error.response?.data?.message ||
//           error.message ||
//           "Network Error"
//         );

//       }

//     };

//   return (

//     <div className="min-h-screen bg-gradient-to-br from-[#F5EEFF] to-[#EDE2FF] flex items-center justify-center px-4">

//       <div className="w-full max-w-lg bg-white rounded-[35px] shadow-2xl p-8">

//         <h1 className="text-4xl font-bold text-purple-700 text-center">
//           QuickCart
//         </h1>

//         <h2 className="text-3xl font-bold text-center mt-8">
//           Verify OTP
//         </h2>

//         <p className="text-center text-gray-500 mt-3">

//           Enter the 6 digit OTP sent to

//           <span className="font-semibold text-purple-700 ml-1">
//             {phoneNumber}
//           </span>

//         </p>

//         <form
//           onSubmit={handleVerify}
//           className="mt-10"
//         >

//           <div className="flex justify-center gap-2 sm:gap-3">

//             {otp.map(
//               (
//                 digit,
//                 index
//               ) => (

//                 <input
//                   key={index}
//                   ref={(el) =>
//                     (
//                       inputsRef.current[
//                         index
//                       ] = el
//                     )
//                   }
//                   type="text"
//                   maxLength={1}
//                   value={digit}
//                   onChange={(e) =>
//                     handleChange(
//                       e.target.value,
//                       index
//                     )
//                   }
//                   onKeyDown={(e) =>
//                     handleKeyDown(
//                       e,
//                       index
//                     )
//                   }
//                   className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold border border-purple-300 rounded-xl focus:border-purple-600 outline-none"
//                 />

//               )
//             )}

//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full mt-10 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-700 text-white font-semibold text-lg"
//           >
//             {
//               loading
//                 ? "Verifying..."
//                 : "Verify OTP"
//             }
//           </button>

//         </form>

//         <div className="text-center mt-8">

//           {timer > 0 ? (

//             <p className="text-gray-500">

//               Resend OTP in

//               <span className="font-bold text-purple-700 ml-1">
//                 {timer}s
//               </span>

//             </p>

//           ) : (

//             <button
//               onClick={handleResend}
//               className="text-purple-700 font-semibold hover:text-purple-900"
//             >
//               Resend OTP
//             </button>

//           )}

//         </div>

//         <button
//           onClick={() =>
//             navigate(
//               "/forgot-password"
//             )
//           }
//           className="mt-6 text-purple-700"
//         >
//           ← Change Number
//         </button>

//       </div>

//     </div>

//   );

// }






import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../components/Toast";
import { auth } from "../../services/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

export default function OTPVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const phoneNumber = location.state?.phoneNumber || "";
  const e164Phone = location.state?.e164Phone || "";
  const isLogin = location.state?.isLogin || false;
  const role = location.state?.role || "customer";

  // confirmationResult is passed via location.state from LoginPage
  const confirmationResultRef = useRef(location.state?.confirmationResult || null);

  // For resend — we need a fresh RecaptchaVerifier
  const resendRecaptchaRef = useRef(null);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (!phoneNumber) {
      navigate("/forgot-password");
    }
  }, [phoneNumber, navigate]);

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      showToast({ type: "warning", message: "Please enter the 6-digit OTP" });
      return;
    }
    if (!confirmationResultRef.current) {
      showToast({ type: "error", message: "Session expired. Please request a new OTP." });
      return;
    }

    try {
      setLoading(true);

      // Step 1: Confirm OTP with Firebase
      const userCredential = await confirmationResultRef.current.confirm(otpValue);
      const idToken = await userCredential.user.getIdToken();

      // Step 2: Verify token on YOUR backend and obtain YOUR app's JWT
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/firebase-login`,
        { idToken, role }
      );

      showToast({ type: "success", message: response.data.message || "Login successful!" });

      if (isLogin) {
        if (role === "customer") {
          localStorage.setItem("user", JSON.stringify(response.data.user));
          if (response.data.token) localStorage.setItem("userToken", response.data.token);
          window.dispatchEvent(new Event("auth-updated"));
          navigate("/customer/dashboard");
        } else {
          // Fallback — navigate back to login
          navigate("/login");
        }
      } else {
        // Forgot-password flow — still use server-verified phone for reset
        navigate("/reset-password", { state: { phoneNumber } });
      }
    } catch (error) {
      console.error("OTP Verify error:", error);
      const msg =
        error.code === "auth/invalid-verification-code"
          ? "Invalid OTP. Please check and try again."
          : error.code === "auth/code-expired"
          ? "OTP expired. Please request a new one."
          : error.response?.data?.message || error.message || "Verification failed";
      showToast({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!phoneNumber && !e164Phone) {
      showToast({ type: "warning", message: "Phone number missing" });
      return;
    }

    const target = e164Phone || `+91${phoneNumber.replace(/\D/g, "").slice(-10)}`;

    try {
      if (resendRecaptchaRef.current) {
        resendRecaptchaRef.current.clear();
        resendRecaptchaRef.current = null;
      }
      resendRecaptchaRef.current = new RecaptchaVerifier(
        auth,
        "recaptcha-container-otp",
        { size: "invisible" }
      );

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        target,
        resendRecaptchaRef.current
      );

      confirmationResultRef.current = confirmationResult;
      setTimer(30);
      showToast({ type: "success", message: "OTP resent to " + target });
    } catch (error) {
      console.error("Resend OTP error:", error);
      showToast({ type: "error", message: error.message || "Failed to resend OTP" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EEFF] to-[#EDE2FF] flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white rounded-[35px] shadow-2xl p-8">

        <h1 className="text-4xl font-bold text-purple-700 text-center">
          QuickCart
        </h1>

        <h2 className="text-3xl font-bold text-center mt-8">
          Verify OTP
        </h2>

        <p className="text-center text-gray-500 mt-3">
          Enter the 6 digit OTP sent to
          <span className="font-semibold text-purple-700 ml-1">
            {phoneNumber}
          </span>
        </p>

        <form onSubmit={handleVerify} className="mt-10">
          <div className="flex justify-center gap-2 sm:gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold border border-purple-300 rounded-xl focus:border-purple-600 outline-none"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-10 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-700 text-white font-semibold text-lg disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <div className="text-center mt-8">
          {timer > 0 ? (
            <p className="text-gray-500">
              Resend OTP in
              <span className="font-bold text-purple-700 ml-1">{timer}s</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="text-purple-700 font-semibold hover:text-purple-900"
            >
              Resend OTP
            </button>
          )}
        </div>

        <button
          onClick={() => navigate("/login")}
          className="mt-6 text-purple-700"
        >
          ← Change Number
        </button>

      </div>

      {/* Invisible reCAPTCHA for resend */}
      <div id="recaptcha-container-otp" />

    </div>
  );
}