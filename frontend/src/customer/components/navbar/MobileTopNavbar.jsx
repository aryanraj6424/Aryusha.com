

// import { useNavigate } from "react-router-dom";
// import { User } from "lucide-react";

// import LocationSelector from "../location/LocationSelector";
// import SearchBar from "./SearchBar";

// function MobileTopNavbar() {
//   const navigate = useNavigate();

//   const user = JSON.parse(
//     localStorage.getItem("user")
//   );

//   return (
//     <div className="sticky top-0 z-50 bg-white border-b border-purple-100 shadow-sm">

//       {/* Top Row */}

//       <div className="px-4 py-3 flex items-center justify-between">

//         {/* Location */}

//         <LocationSelector />

//         {/* Profile/Login */}

//         {user ? (
//           <button
//             onClick={() =>
//               navigate("/customer/profile")
//             }
//             className="flex items-center gap-2"
//           >

//             <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">

//               <User
//                 size={18}
//                 className="text-purple-700"
//               />

//             </div>

//           </button>
//         ) : (
//           <button
//             onClick={() =>
//               navigate("/login")
//             }
//             className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
//           >
//             Login
//           </button>
//         )}

//       </div>

//       {/* Search Bar */}

//       <div className="px-4 pb-3">
//         <SearchBar />
//       </div>

//     </div>
//   );
// }

// export default MobileTopNavbar;


import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, MapPin, ChevronDown } from "lucide-react";

import SearchBar from "./SearchBar";

function MobileTopNavbar() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "null")
  );

  const [selectedAddress, setSelectedAddress] = useState(() =>
    JSON.parse(localStorage.getItem("selectedAddress") || "null")
  );

  const syncUser = () => {
    setUser(JSON.parse(localStorage.getItem("user") || "null"));
    setSelectedAddress(JSON.parse(localStorage.getItem("selectedAddress") || "null"));
  };

  useEffect(() => {
    syncUser();
    window.addEventListener("auth-updated", syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      window.removeEventListener("auth-updated", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-purple-100 shadow-sm">

      {/* Top Row */}
      <div className="px-4 py-3 flex items-center justify-between gap-3">

        {/* Location */}
        <button
          onClick={() =>
            navigate("/customer/location")
          }
          className="flex items-center gap-2 flex-1 text-left min-h-[44px] overflow-hidden"
        >
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <MapPin
              size={18}
              className="text-purple-700"
            />
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-gray-400 font-medium">Delivering to</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="font-extrabold text-xs text-slate-800 truncate block">
                {selectedAddress
                  ? selectedAddress.fullAddress ||
                    `${selectedAddress.houseNo || ""} ${selectedAddress.area || ""}`.trim() ||
                    "Location Selected"
                  : "Select Location"}
              </span>
              <ChevronDown size={14} className="text-slate-600 flex-shrink-0" />
            </div>
          </div>
        </button>

        {/* Profile/Login */}
        {user?._id ? (
          <button
            onClick={() =>
              navigate("/customer/profile")
            }
            className="w-11 h-11 flex items-center justify-center flex-shrink-0 relative"
            title="Profile"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center relative">
              <User
                size={18}
                className="text-purple-700"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#22C55E] border-2 border-white rounded-full"></span>
            </div>
          </button>
        ) : (
          <button
            onClick={() =>
              navigate("/login")
            }
            className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium min-h-[44px] flex items-center justify-center flex-shrink-0"
          >
            Login
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="px-4 pb-3">
        <SearchBar />
      </div>

    </div>
  );
}

export default MobileTopNavbar;