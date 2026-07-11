// import { useState } from "react";

// import { useNavigate } from "react-router-dom";

// import { resetPassword } from "../../services/authApi";

// export default function ForgotPasswordPage() {

//   const navigate = useNavigate();

//   const [phoneNumber, setPhoneNumber] = useState("");

//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e) => {

//     e.preventDefault();

//     if (!phoneNumber) {

//       return alert(
//         "Please enter phone number"
//       );

//     }

//     try {

//       setLoading(true);

//       const response =
//         await forgotPassword({
//           phoneNumber,
//         });

//       console.log(response);

//       alert(
//         response.message ||
//         "OTP sent successfully"
//       );

//       navigate(
//         "/verify-otp",
//         {
//           state: {
//             phoneNumber,
//           },
//         }
//       );

//     } catch (error) {

//       alert(
//         error.response?.data?.message ||
//         "Something went wrong"
//       );

//     } finally {

//       setLoading(false);

//     }

//   };

//   return (

//     <div className="min-h-screen bg-gradient-to-br from-[#F5EEFF] to-[#EDE2FF] flex items-center justify-center px-4 py-8">

//       <div className="w-full max-w-6xl bg-white rounded-[40px] overflow-hidden shadow-2xl grid lg:grid-cols-2">

//         {/* Left Side */}

//         <div className="flex items-center justify-center p-6 sm:p-10">

//           <div className="w-full max-w-md">

//             <h1 className="text-4xl sm:text-5xl font-bold text-purple-700">
//               QuickCart
//             </h1>

//             <p className="mt-3 text-gray-500">
//               Recover your account securely.
//             </p>

//             <div className="mt-8 bg-white border border-purple-100 rounded-3xl p-6 shadow-xl">

//               <h2 className="text-3xl font-bold text-gray-800">
//                 Forgot Password?
//               </h2>

//               <p className="text-gray-500 mt-2">
//                 Enter your registered phone number.
//               </p>

//               <form
//                 onSubmit={handleSubmit}
//                 className="mt-8 space-y-6"
//               >

//                 <div>

//                   <label className="font-medium text-gray-700">
//                     Phone Number
//                   </label>

//                   <input
//                     type="text"
//                     value={phoneNumber}
//                     onChange={(e) =>
//                       setPhoneNumber(
//                         e.target.value
//                       )
//                     }
//                     placeholder="Enter phone number"
//                     className="w-full mt-2 p-4 rounded-2xl border border-purple-200 outline-none focus:border-purple-600"
//                   />

//                 </div>

//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-700 text-white font-semibold text-lg"
//                 >

//                   {
//                     loading
//                       ? "Sending OTP..."
//                       : "Send OTP"
//                   }

//                 </button>

//               </form>

//               <button
//                 onClick={() =>
//                   navigate("/login")
//                 }
//                 className="mt-6 text-purple-700 font-medium"
//               >
//                 ← Back to Login
//               </button>

//             </div>

//           </div>

//         </div>

//         {/* Right Side */}

//         <div className="hidden lg:flex bg-gradient-to-br from-purple-700 to-violet-500 items-center justify-center">

//           <div className="text-center text-white p-10">

//             <img
//               src="/basket.png"
//               alt="forgot-password"
//               className="w-[320px] mx-auto"
//             />

//             <h2 className="text-5xl font-bold mt-8">
//               Account Recovery 🔐
//             </h2>

//             <p className="text-xl mt-4 text-purple-100">
//               Verify your identity and reset your password securely.
//             </p>

//           </div>

//         </div>

//       </div>

//     </div>

//   );

// }



import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../../services/authApi";

export default function ForgotPasswordPage() {

  const navigate = useNavigate();

  const [phoneNumber, setPhoneNumber] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!phoneNumber) {
      return alert("Please enter phone number");
    }

    try {

      setLoading(true);

      const response = await forgotPassword({
        phoneNumber,
      });

      console.log(response);

      alert(
        response.message ||
        "OTP sent successfully"
      );

      navigate("/verify-otp", {
        state: {
          phoneNumber,
        },
      });

    } catch (error) {

      console.error(error);

      alert(
        error.response?.data?.message ||
        error.message ||
        "Network Error"
      );

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="min-h-screen bg-gradient-to-br from-[#F5EEFF] to-[#EDE2FF] flex items-center justify-center px-4 py-8">

      <div className="w-full max-w-6xl bg-white rounded-[40px] overflow-hidden shadow-2xl grid lg:grid-cols-2">

        {/* Left Side */}

        <div className="flex items-center justify-center p-6 sm:p-10">

          <div className="w-full max-w-md">

            <h1 className="text-4xl sm:text-5xl font-bold text-purple-700">
              QuickCart
            </h1>

            <p className="mt-3 text-gray-500">
              Recover your account securely.
            </p>

            <div className="mt-8 bg-white border border-purple-100 rounded-3xl p-6 shadow-xl">

              <h2 className="text-3xl font-bold text-gray-800">
                Forgot Password?
              </h2>

              <p className="text-gray-500 mt-2">
                Enter your registered phone number.
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-6"
              >

                <div>

                  <label className="font-medium text-gray-700">
                    Phone Number
                  </label>

                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) =>
                      setPhoneNumber(e.target.value)
                    }
                    placeholder="Enter phone number"
                    className="w-full mt-2 p-4 rounded-2xl border border-purple-200 outline-none focus:border-purple-600"
                  />

                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-700 text-white font-semibold text-lg"
                >

                  {
                    loading
                      ? "Sending OTP..."
                      : "Send OTP"
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

        </div>

        {/* Right Side */}

        <div className="hidden lg:flex bg-gradient-to-br from-purple-700 to-violet-500 items-center justify-center">

          <div className="text-center text-white p-10">

            <img
              src="/basket.png"
              alt="forgot-password"
              className="w-[320px] mx-auto"
            />

            <h2 className="text-5xl font-bold mt-8">
              Account Recovery 🔐
            </h2>

            <p className="text-xl mt-4 text-purple-100">
              Verify your identity and reset your password securely.
            </p>

          </div>

        </div>

      </div>

    </div>

  );

}