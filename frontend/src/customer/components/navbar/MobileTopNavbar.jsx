

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


import { useNavigate } from "react-router-dom";
import { User, MapPin } from "lucide-react";

import SearchBar from "./SearchBar";

function MobileTopNavbar() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const selectedAddress = JSON.parse(
    localStorage.getItem("selectedAddress") || "null"
  );

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-purple-100 shadow-sm">

      {/* Top Row */}
      <div className="px-4 py-3 flex items-center justify-between gap-3">

        {/* Location */}
        <button
          onClick={() =>
            navigate("/customer/location")
          }
          className="flex items-center gap-2 flex-1 text-left"
        >
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <MapPin
              size={18}
              className="text-purple-700"
            />
          </div>

          <div className="overflow-hidden">
            <p className="text-xs text-gray-500">
              Delivering To
            </p>

            <p className="font-semibold text-sm truncate max-w-[180px]">
              {selectedAddress?.fullAddress
                ? selectedAddress.fullAddress
                : "Select Location"}
            </p>
          </div>
        </button>

        {/* Profile/Login */}
        {user?._id ? (
          <button
            onClick={() =>
              navigate("/customer/profile")
            }
          >
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <User
                size={18}
                className="text-purple-700"
              />
            </div>
          </button>
        ) : (
          <button
            onClick={() =>
              navigate("/login")
            }
            className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
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