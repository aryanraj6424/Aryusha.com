// import { Link, useNavigate } from "react-router-dom";
// import { useState } from "react";
// import { loginVendor } from "../../services/vendorApi";

// export default function VendorLogin() {
//   const navigate = useNavigate();

//   const [phone, setPhone] = useState("");
//   const [password, setPassword] = useState("");

//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       setLoading(true);

//       const response =
//         await loginVendor({
//           phone,
//           password,
//         });

//       alert(response.message);

//       localStorage.setItem(
//         "vendorToken",
//         response.token
//       );

//       localStorage.setItem(
//         "vendor",
//         JSON.stringify(
//           response.vendor
//         )
//       );

//       navigate(
//         "/vendor/dashboard"
//       );

//     } catch (error) {
//       console.log(error);

//       alert(
//         error?.response?.data
//           ?.message ||
//           "Login Failed"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center px-4">

//       <div className="w-full max-w-lg bg-white border border-purple-100 rounded-3xl shadow-lg p-8">

//         <h1 className="text-5xl font-bold text-gray-800">
//           Welcome Back 👋
//         </h1>

//         <p className="text-gray-500 mt-3 text-lg">
//           Login to continue selling on QuickCart
//         </p>

//         <form
//           onSubmit={handleSubmit}
//           className="mt-10"
//         >

//           <div className="mb-6">

//             <label className="block text-lg font-semibold text-gray-700 mb-2">
//               Phone Number
//             </label>

//             <input
//               type="tel"
//               placeholder="Enter your phone number"
//               value={phone}
//               onChange={(e) =>
//                 setPhone(
//                   e.target.value
//                 )
//               }
//               className="w-full px-5 py-4 border border-purple-200 rounded-2xl"
//               required
//             />

//           </div>

//           <div className="mb-6">

//             <div className="flex justify-between items-center mb-2">

//               <label className="text-lg font-semibold text-gray-700">
//                 Password
//               </label>

//               <Link
//                 to="/vendor/forgot-password"
//                 className="text-purple-600 hover:underline text-sm"
//               >
//                 Forgot Password?
//               </Link>

//             </div>

//             <input
//               type="password"
//               placeholder="Enter your password"
//               value={password}
//               onChange={(e) =>
//                 setPassword(
//                   e.target.value
//                 )
//               }
//               className="w-full px-5 py-4 border border-purple-200 rounded-2xl"
//               required
//             />

//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full py-4 bg-gradient-to-r from-purple-600 to-violet-700 text-white text-xl font-semibold rounded-2xl"
//           >
//             {loading
//               ? "Logging In..."
//               : "Login"}
//           </button>

//         </form>

//         <div className="flex items-center my-8">

//           <div className="flex-1 h-px bg-gray-300"></div>

//           <span className="px-5 text-gray-400">
//             OR
//           </span>

//           <div className="flex-1 h-px bg-gray-300"></div>

//         </div>

//         <Link
//           to="/vendor/verify-otp"
//           className="block"
//         >
//           <button
//             className="w-full py-4 border-2 border-purple-600 text-purple-600 text-xl font-semibold rounded-2xl"
//           >
//             Login with OTP
//           </button>
//         </Link>

//         <p className="text-center text-gray-500 mt-8 text-lg">

//           New Vendor?

//           <Link
//             to="/vendor/register"
//             className="text-purple-600 font-semibold ml-2"
//           >
//             Sign Up
//           </Link>

//         </p>

//       </div>

//     </div>
//   );
// }

import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { loginVendor } from "../../services/vendorApi";

export default function VendorLogin() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await loginVendor({
        phone,
        password,
      });

      localStorage.setItem("vendorToken", response.token);

      localStorage.setItem("vendor", JSON.stringify(response.vendor));

      navigate("/vendor/dashboard");
    } catch (error) {
      console.log(error);

      const message = error?.response?.data?.message;

      if (
        error?.response?.status === 403 &&
        message?.includes("verification")
      ) {
        navigate("/vendor/pending-approval");
        return;
      }

      alert(message || "Login Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white border border-purple-100 rounded-3xl shadow-lg p-8">
        <h1 className="text-5xl font-bold text-gray-800">Welcome Back 👋</h1>

        <p className="text-gray-500 mt-3 text-lg">
          Login to continue selling on QuickCart
        </p>

        <form onSubmit={handleSubmit} className="mt-10">
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Phone Number
            </label>

            <input
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-5 py-4 border border-purple-200 rounded-2xl"
              required
            />
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-lg font-semibold text-gray-700">
                Password
              </label>

              <Link
                to="/vendor/forgot-password"
                className="text-purple-600 hover:underline text-sm"
              >
                Forgot Password?
              </Link>
            </div>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 border border-purple-200 rounded-2xl"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-violet-700 text-white text-xl font-semibold rounded-2xl"
          >
            {loading ? "Logging In..." : "Login"}
          </button>
        </form>

        <div className="flex items-center my-8">
          <div className="flex-1 h-px bg-gray-300"></div>

          <span className="px-5 text-gray-400">OR</span>

          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* OTP LOGIN BUTTON */}
        <Link to="/vendor/login-otp" className="block">
          <button className="w-full py-4 border-2 border-purple-600 text-purple-600 text-xl font-semibold rounded-2xl">
            Login with OTP
          </button>
        </Link>

        <p className="text-center text-gray-500 mt-8 text-lg">
          New Vendor?
          <Link
            to="/vendor/register"
            className="text-purple-600 font-semibold ml-2"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
