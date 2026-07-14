
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
import { useToast } from "../../components/Toast";
import { ShoppingBag, Sparkles, Percent, Truck, ShieldCheck, Mail, Lock, Phone, User, Check, ArrowRight } from "lucide-react";

export default function SignupPage() {

  const navigate = useNavigate();
  const { showToast } = useToast();

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
      showToast({ type: "warning", message: "Please fill all fields" });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showToast({ type: "warning", message: "Passwords do not match" });
      return;
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

      showToast({
        type: "success",
        message: response?.message || "Account created successfully"
      });

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

      showToast({
        type: "error",
        message: error?.response?.data?.message || error?.message || "Something went wrong"
      });

    } finally {

      setLoading(false);

    }

  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center px-4 py-8 relative overflow-hidden font-sans">
      
      {/* Background blobs & patterns */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-200/25 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-200/25 blur-3xl pointer-events-none" />

      {/* Subtle floating background line icons */}
      <div className="absolute top-12 left-12 opacity-[0.03] text-purple-700 rotate-12 pointer-events-none select-none"><ShoppingBag size={56} strokeWidth={1.5} /></div>
      <div className="absolute top-1/3 right-16 opacity-[0.03] text-purple-700 -rotate-12 pointer-events-none select-none"><Sparkles size={48} strokeWidth={1.5} /></div>
      <div className="absolute bottom-24 left-16 opacity-[0.03] text-purple-700 rotate-45 pointer-events-none select-none"><Percent size={50} strokeWidth={1.5} /></div>
      <div className="absolute bottom-1/3 right-1/4 opacity-[0.02] text-purple-700 pointer-events-none select-none"><Truck size={60} strokeWidth={1.5} /></div>
      <div className="absolute top-1/4 left-1/3 opacity-[0.02] text-purple-700 -rotate-45 pointer-events-none select-none"><ShieldCheck size={44} strokeWidth={1.5} /></div>

      <div className="w-full max-w-6xl grid lg:grid-cols-12 overflow-hidden rounded-[32px] bg-white/70 border border-purple-100/80 shadow-[0_20px_50px_rgba(107,33,168,0.07)] backdrop-blur-md z-10">

        {/* LEFT SIDE: Form */}
        <div className="lg:col-span-7 flex items-center justify-center p-6 sm:p-12 md:p-16">
          <div className="w-full max-w-md">
            
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer mb-8" onClick={() => navigate("/")}>
              <div className="w-11 h-11 bg-purple-600 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-md shadow-purple-200 hover:scale-105 transition-transform duration-200">
                A
              </div>
              <div>
                <h1 className="text-2xl font-black text-purple-900 tracking-tighter leading-none">
                  Aryusha.com
                </h1>
                <p className="text-[10px] text-purple-500 font-bold uppercase tracking-wider mt-0.5">
                  Delivery in 10 mins ⚡
                </p>
              </div>
            </div>

            {/* Mobile-only condensed promo banner */}
            <div className="block lg:hidden text-center mb-8 bg-purple-50/50 border border-purple-100 rounded-3xl p-5 shadow-sm">
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                <Check size={11} className="text-emerald-600" />
                Same day delivery in your area
              </div>
              <h3 className="text-sm font-black text-slate-800 mt-3">Fast Delivery ⚡</h3>
              <p className="text-xs text-slate-500 mt-1 font-semibold">
                Groceries, vegetables, fruits and more delivered to your doorstep.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                Create Account 🎉
              </h2>
              <p className="text-sm text-slate-400 font-semibold">
                Join Aryusha.com today
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div>
                <label className="font-bold text-xs text-slate-500 uppercase tracking-wider block">
                  Full Name
                </label>
                <div className="relative mt-2">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/20 text-slate-800 placeholder-slate-400 outline-none focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-100/50 transition-all duration-300 text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="font-bold text-xs text-slate-500 uppercase tracking-wider block">
                  Phone Number
                </label>
                <div className="relative mt-2">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <Phone size={16} />
                  </span>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/20 text-slate-800 placeholder-slate-400 outline-none focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-100/50 transition-all duration-300 text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="font-bold text-xs text-slate-500 uppercase tracking-wider block">
                  Email Address
                </label>
                <div className="relative mt-2">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/20 text-slate-800 placeholder-slate-400 outline-none focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-100/50 transition-all duration-300 text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="font-bold text-xs text-slate-500 uppercase tracking-wider block">
                  Password
                </label>
                <div className="relative mt-2">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/20 text-slate-800 placeholder-slate-400 outline-none focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-100/50 transition-all duration-300 text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="font-bold text-xs text-slate-500 uppercase tracking-wider block">
                  Confirm Password
                </label>
                <div className="relative mt-2">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/20 text-slate-800 placeholder-slate-400 outline-none focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-100/50 transition-all duration-300 text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-750 hover:to-purple-800 active:scale-[0.98] text-white text-sm font-bold shadow-lg shadow-purple-200/50 hover:shadow-xl hover:shadow-purple-300/50 focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? "Creating Account..." : <>Create Account <ArrowRight size={16} /></>}
              </button>
            </form>

            {/* Login Link */}
            <p className="text-center mt-8 text-sm text-slate-500 font-semibold">
              Already have an account?
              <span
                onClick={() => navigate("/login")}
                className="ml-2 text-purple-600 hover:text-purple-800 font-black cursor-pointer hover:underline transition-colors"
              >
                Login
              </span>
            </p>

          </div>
        </div>

        {/* RIGHT SIDE: Promo Panel */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-purple-700 to-purple-900 items-center justify-center relative overflow-hidden p-10">
          <div className="absolute inset-0 opacity-20">
            <div className="w-[500px] h-[500px] rounded-full bg-white blur-3xl absolute -top-20 -right-20"></div>
            <div className="w-[400px] h-[400px] rounded-full bg-purple-400 blur-3xl absolute bottom-0 left-0"></div>
          </div>

          <div className="relative z-10 text-center text-white max-w-md space-y-6">
            
            {/* Bag Icon Illustration with Glow */}
            <div className="relative flex items-center justify-center w-40 h-40 mx-auto">
              <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-2xl animate-pulse" />
              <div className="relative w-32 h-32 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                <ShoppingBag size={56} strokeWidth={1} className="drop-shadow-[0_4px_12px_rgba(168,85,247,0.4)]" />
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-extrabold tracking-tight">
                Fast Delivery ⚡
              </h2>
              <p className="text-sm text-purple-100 font-semibold leading-relaxed">
                Groceries, vegetables, fruits and more delivered to your doorstep.
              </p>
            </div>

            {/* Same day delivery badge */}
            <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/25 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <Check size={14} className="text-emerald-400" />
              Same day delivery in your area
            </div>

            {/* Feature Pills */}
            <div className="flex flex-col gap-3 pt-4 w-full">
              <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider text-white flex items-center gap-3">
                <Sparkles size={16} className="text-purple-300" />
                <span>🚀 Super Fast Checkout</span>
              </div>
              <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider text-white flex items-center gap-3">
                <ShoppingBag size={16} className="text-purple-300" />
                <span>🛒 Handpicked Freshness</span>
              </div>
              <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl px-5 py-3 text-xs font-black uppercase tracking-wider text-white flex items-center gap-3">
                <ShieldCheck size={16} className="text-purple-300" />
                <span>🔒 Secure Payment Vault</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>

  );

}