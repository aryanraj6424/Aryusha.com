// import { useNavigate } from "react-router-dom";
// import {
//   ShoppingCart,
//   User,
//   MapPin,
//   LogOut,
// } from "lucide-react";

// import SearchBar from "./SearchBar";

// function DesktopNavbar() {
//   const navigate = useNavigate();

//   const user = JSON.parse(
//     localStorage.getItem("user") || "null"
//   );

//   const selectedAddress =
//   JSON.parse(
//     localStorage.getItem(
//       "selectedAddress"
//     )
//   ) || null;

//   const handleLogout = () => {
//     localStorage.removeItem("user");

//     navigate("/");

//     window.location.reload();
//   };

//   console.log("USER =>", user);
//   console.log("LOCATION =>", savedLocation);

//   return (
//     <nav className="sticky top-0 z-50 bg-white border-b border-purple-100 shadow-sm">

//       <div className="max-w-[1400px] mx-auto px-6">

//         <div className="h-20 flex items-center gap-6">

//           {/* Logo */}
//           <div
//             onClick={() => navigate("/")}
//             className="cursor-pointer flex items-center gap-3"
//           >
//             <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
//               Q
//             </div>

//             <div>
//               <h1 className="text-2xl font-bold text-purple-700">
//                 QuickCart
//               </h1>

//               <p className="text-xs text-gray-500">
//                 Delivery in 10 mins ⚡
//               </p>
//             </div>
//           </div>

//           {/* Location */}
//           <button
//             onClick={() => navigate("/customer/location")}
//             className="min-w-[220px] bg-purple-50 hover:bg-purple-100 transition rounded-2xl px-4 py-3 flex items-center gap-3"
//           >
//             <MapPin
//               size={20}
//               className="text-purple-600"
//             />

//             <div className="text-left">
//               <p className="text-xs text-gray-500">
//                 Delivering To
//               </p>

//               <p className="font-semibold text-gray-800 truncate max-w-[150px]">
//                 {
//   selectedAddress
//     ? `${selectedAddress.houseNo}, ${selectedAddress.area}`
//     : "Select Address"
// }
//               </p>
//             </div>
//           </button>

//           {/* Search */}
//           <div className="flex-1">
//             <SearchBar />
//           </div>

//           {/* Right Side */}
//           <div className="flex items-center gap-3">

//             {user ? (
//               <>
//                 {/* Profile */}
//                 <button
//                   onClick={() =>
//                     navigate("/customer/profile")
//                   }
//                   className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-purple-50 transition"
//                 >
//                   <User size={18} />

//                   <span className="font-medium">
//                     {user?.name ||
//                       user?.fullName ||
//                       user?.userName ||
//                       "Customer"}
//                   </span>
//                 </button>

//                 {/* Cart */}
//                 <button
//                   onClick={() =>
//                     navigate("/customer/cart")
//                   }
//                   className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl font-medium transition"
//                 >
//                   <ShoppingCart size={18} />

//                   <span>Cart</span>

//                   <span className="bg-white text-purple-700 text-xs font-bold px-2 py-1 rounded-full">
//                     0
//                   </span>
//                 </button>

//                 {/* Logout */}
//                 <button
//                   onClick={handleLogout}
//                   className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl"
//                 >
//                   <LogOut size={18} />
//                   Logout
//                 </button>
//               </>
//             ) : (
//               <>
//                 <button
//                   onClick={() =>
//                     navigate("/login")
//                   }
//                   className="px-5 py-2 border border-purple-600 text-purple-600 rounded-xl hover:bg-purple-50"
//                 >
//                   Login
//                 </button>

//                 <button
//                   onClick={() =>
//                     navigate("/signup")
//                   }
//                   className="px-5 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
//                 >
//                   Sign Up
//                 </button>
//               </>
//             )}

//           </div>

//         </div>

//       </div>

//     </nav>
//   );
// }

// export default DesktopNavbar;



import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  User,
  MapPin,
  LogOut,
} from "lucide-react";

import SearchBar from "./SearchBar";

function DesktopNavbar() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const selectedAddress = JSON.parse(
    localStorage.getItem("selectedAddress") || "null"
  );

  const [cartCount, setCartCount] = useState(0);

  const updateCartCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const count = Array.isArray(cart) ? cart.reduce((total, item) => total + item.qty, 0) : 0;
      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  };

  useEffect(() => {
    updateCartCount();
    window.addEventListener("cart-updated", updateCartCount);
    return () => window.removeEventListener("cart-updated", updateCartCount);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem(
      "selectedAddress"
    );

    navigate("/");

    window.location.reload();
  };

  const locationText =
    selectedAddress
      ? selectedAddress.fullAddress ||
        `${selectedAddress.houseNo || ""}
         ${selectedAddress.area || ""}`
      : "Select Address";

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-purple-100 shadow-sm">

      <div className="max-w-[1400px] mx-auto px-6">

        <div className="h-20 flex items-center gap-6">

          {/* Logo */}

          <div
            onClick={() => navigate("/")}
            className="cursor-pointer flex items-center gap-3"
          >
            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
              Q
            </div>

            <div>
              <h1 className="text-2xl font-bold text-purple-700">
                QuickCart
              </h1>

              <p className="text-xs text-gray-500">
                Delivery in 10 mins ⚡
              </p>
            </div>
          </div>

          {/* Location */}

          <button
            onClick={() =>
              navigate("/customer/location")
            }
            className="min-w-[260px] bg-purple-50 hover:bg-purple-100 transition rounded-2xl px-4 py-3 flex items-center gap-3"
          >
            <MapPin
              size={20}
              className="text-purple-600"
            />

            <div className="text-left">
              <p className="text-xs text-gray-500">
                Delivering To
              </p>

              <p className="font-semibold text-gray-800 truncate max-w-[220px]">
                {locationText}
              </p>
            </div>
          </button>

          {/* Search */}

          <div className="flex-1">
            <SearchBar />
          </div>

          {/* Right Side */}

          <div className="flex items-center gap-3">

            {user ? (
              <>
                {/* Profile */}

                <button
                  onClick={() =>
                    navigate("/customer/profile")
                  }
                  className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-purple-50 transition"
                >
                  <User size={18} />

                  <span className="font-medium">
                    {user?.fullName ||
                      user?.name ||
                      "Customer"}
                  </span>
                </button>

                {/* Cart */}

                <button
                  onClick={() =>
                    navigate("/customer/cart")
                  }
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl font-medium transition"
                >
                  <ShoppingCart size={18} />

                  <span>Cart</span>

                  <span className="bg-white text-purple-700 text-xs font-bold px-2 py-1 rounded-full">
                    {cartCount}
                  </span>
                </button>

                {/* Logout */}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() =>
                    navigate("/login")
                  }
                  className="px-5 py-2 border border-purple-600 text-purple-600 rounded-xl hover:bg-purple-50"
                >
                  Login
                </button>

                <button
                  onClick={() =>
                    navigate("/signup")
                  }
                  className="px-5 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
                >
                  Sign Up
                </button>
              </>
            )}

          </div>

        </div>

      </div>

    </nav>
  );
}

export default DesktopNavbar;