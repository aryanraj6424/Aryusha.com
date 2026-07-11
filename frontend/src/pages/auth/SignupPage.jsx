
// import { useState } from "react";
// import { signupUser } from "../../services/authApi";

// export default function SignupPage() {

//   const [loading, setLoading] = useState(false);

//   const [formData, setFormData] = useState({
//     fullName: "",
//     phoneNumber: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//   });

//   const handleChange = (e) => {

//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });

//   };

//   const handleSubmit = async (e) => {

//     e.preventDefault();

//     if (formData.password !== formData.confirmPassword) {
//       return alert("Passwords do not match");
//     }

//     try {

//       setLoading(true);

//       const response = await signupUser(formData);

//       console.log(response);

//       alert("Account created successfully");

//     } catch (error) {

//       alert(
//         error.response?.data?.message
//       );

//     } finally {

//       setLoading(false);

//     }

//   };

//   return (

//     <div className="min-h-screen bg-gradient-to-br from-[#F5EEFF] to-[#EDE2FF] flex items-center justify-center px-4 py-8">

//       <div className="w-full max-w-7xl bg-white rounded-[40px] shadow-2xl overflow-hidden grid lg:grid-cols-2">

//         {/* LEFT SIDE */}

//         <div className="flex items-center justify-center p-6 sm:p-10">

//           <div className="w-full max-w-md">

//             <h1 className="text-4xl sm:text-5xl font-bold text-purple-700">
//               QuickCart
//             </h1>

//             <p className="mt-3 text-gray-500">
//               Create your account and start shopping.
//             </p>

//             <div className="mt-8 bg-white border border-purple-100 rounded-3xl shadow-xl p-6">

//               <h2 className="text-3xl font-bold text-gray-800">
//                 Create Account 🎉
//               </h2>

//               <p className="text-gray-500 mt-2">
//                 Join QuickCart today
//               </p>

//               <form
//                 onSubmit={handleSubmit}
//                 className="space-y-5 mt-8"
//               >

//                 <div>
//                   <label className="font-medium">
//                     Full Name
//                   </label>

//                   <input
//                     type="text"
//                     name="fullName"
//                     value={formData.fullName}
//                     onChange={handleChange}
//                     placeholder="Enter your name"
//                     className="w-full mt-2 p-4 rounded-2xl border border-purple-200 outline-none focus:border-purple-600"
//                   />
//                 </div>

//                 <div>
//                   <label className="font-medium">
//                     Phone Number
//                   </label>

//                   <input
//                     type="text"
//                     name="phoneNumber"
//                     value={formData.phoneNumber}
//                     onChange={handleChange}
//                     placeholder="Enter phone number"
//                     className="w-full mt-2 p-4 rounded-2xl border border-purple-200 outline-none focus:border-purple-600"
//                   />
//                 </div>

//                 <div>
//                   <label className="font-medium">
//                     Email Address
//                   </label>

//                   <input
//                     type="email"
//                     name="email"
//                     value={formData.email}
//                     onChange={handleChange}
//                     placeholder="Enter email"
//                     className="w-full mt-2 p-4 rounded-2xl border border-purple-200 outline-none focus:border-purple-600"
//                   />
//                 </div>

//                 <div>
//                   <label className="font-medium">
//                     Password
//                   </label>

//                   <input
//                     type="password"
//                     name="password"
//                     value={formData.password}
//                     onChange={handleChange}
//                     placeholder="Enter password"
//                     className="w-full mt-2 p-4 rounded-2xl border border-purple-200 outline-none focus:border-purple-600"
//                   />
//                 </div>

//                 <div>
//                   <label className="font-medium">
//                     Confirm Password
//                   </label>

//                   <input
//                     type="password"
//                     name="confirmPassword"
//                     value={formData.confirmPassword}
//                     onChange={handleChange}
//                     placeholder="Confirm password"
//                     className="w-full mt-2 p-4 rounded-2xl border border-purple-200 outline-none focus:border-purple-600"
//                   />
//                 </div>

//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-700 text-white text-lg font-semibold"
//                 >
//                   {
//                     loading
//                       ? "Creating Account..."
//                       : "Create Account"
//                   }
//                 </button>

//               </form>

//               <p className="text-center mt-8 text-gray-500">

//                 Already have an account?

//                 <span className="text-purple-700 font-semibold ml-2 cursor-pointer">
//                   Login
//                 </span>

//               </p>

//             </div>

//           </div>

//         </div>

//         {/* RIGHT SIDE */}

//         <div className="hidden lg:flex bg-gradient-to-br from-purple-700 to-violet-500 items-center justify-center">

//           <div className="text-center text-white p-10">

//             <img
//               src="/basket.png"
//               alt=""
//               className="w-[350px] mx-auto"
//             />

//             <h2 className="text-5xl font-bold mt-8">
//               Welcome to QuickCart
//             </h2>

//             <p className="text-xl mt-5 text-purple-100">

//               Groceries, fruits and daily essentials delivered quickly.

//             </p>

//           </div>

//         </div>

//       </div>

//     </div>

//   );

// }




import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signupUser } from "../../services/authApi";

export default function SignupPage() {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (
      !formData.fullName ||
      !formData.phoneNumber ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      return alert("Please fill all fields");
    }

    if (formData.password !== formData.confirmPassword) {
      return alert("Passwords do not match");
    }

    try {

      setLoading(true);

      const response = await signupUser({
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        password: formData.password,
      });

      console.log("Signup Success:", response);

      alert(
        response?.message ||
        "Account created successfully"
      );

      setFormData({
        fullName: "",
        phoneNumber: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      navigate("/login");

    } catch (error) {

      console.error(error);

      alert(
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong"
      );

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="min-h-screen bg-gradient-to-br from-[#F5EEFF] to-[#EDE2FF] flex items-center justify-center px-4 py-8">

      <div className="w-full max-w-7xl bg-white rounded-[40px] shadow-2xl overflow-hidden grid lg:grid-cols-2">

        {/* LEFT SIDE */}

        <div className="flex items-center justify-center p-6 sm:p-10">

          <div className="w-full max-w-md">

            <h1 className="text-4xl sm:text-5xl font-bold text-purple-700">
              QuickCart
            </h1>

            <p className="mt-3 text-gray-500">
              Create your account and start shopping.
            </p>

            <div className="mt-8 bg-white border border-purple-100 rounded-3xl shadow-xl p-6">

              <h2 className="text-3xl font-bold text-gray-800">
                Create Account 🎉
              </h2>

              <p className="text-gray-500 mt-2">
                Join QuickCart today
              </p>

              <form
                onSubmit={handleSubmit}
                className="space-y-5 mt-8"
              >

                <div>
                  <label className="font-medium">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className="w-full mt-2 p-4 rounded-2xl border border-purple-200 outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="font-medium">
                    Phone Number
                  </label>

                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className="w-full mt-2 p-4 rounded-2xl border border-purple-200 outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="font-medium">
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    className="w-full mt-2 p-4 rounded-2xl border border-purple-200 outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="font-medium">
                    Password
                  </label>

                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    className="w-full mt-2 p-4 rounded-2xl border border-purple-200 outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="font-medium">
                    Confirm Password
                  </label>

                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    className="w-full mt-2 p-4 rounded-2xl border border-purple-200 outline-none focus:border-purple-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-700 text-white text-lg font-semibold"
                >
                  {loading
                    ? "Creating Account..."
                    : "Create Account"}
                </button>

              </form>

              <p className="text-center mt-8 text-gray-500">

                Already have an account?

                <span
                  onClick={() => navigate("/login")}
                  className="text-purple-700 font-semibold ml-2 cursor-pointer hover:underline"
                >
                  Login
                </span>

              </p>

            </div>

          </div>

        </div>

        {/* RIGHT SIDE */}

        <div className="hidden lg:flex bg-gradient-to-br from-purple-700 to-violet-500 items-center justify-center">

          <div className="text-center text-white p-10">

            <img
              src="/basket.png"
              alt="QuickCart"
              className="w-[350px] mx-auto"
            />

            <h2 className="text-5xl font-bold mt-8">
              Welcome to QuickCart
            </h2>

            <p className="text-xl mt-5 text-purple-100">
              Groceries, fruits and daily essentials delivered quickly.
            </p>

          </div>

        </div>

      </div>

    </div>

  );

}