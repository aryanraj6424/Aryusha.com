

import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  ShoppingCart,
  User,
} from "lucide-react";

function Navbar() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <>
      {/* Main Navbar */}
      <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-purple-100">

        <div className="max-w-[1400px] mx-auto px-6">

          <div className="h-20 flex items-center gap-4">

            {/* Logo */}
            <div
              onClick={() => navigate("/")}
              className="cursor-pointer flex items-center gap-3"
            >
              <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
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

            {/* Delivery Location */}
            <div className="hidden lg:flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-xl">
              <MapPin
                size={18}
                className="text-purple-600"
              />

              <div>
                <p className="text-xs text-gray-500">
                  Deliver To
                </p>

                <p className="text-sm font-semibold">
                  Ranchi, Jharkhand
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 hidden md:block">
              <div className="flex items-center bg-purple-50 border border-purple-200 rounded-2xl px-4 h-12">

                <Search
                  size={20}
                  className="text-purple-600"
                />

                <input
                  type="text"
                  placeholder="Search for fruits, vegetables, groceries..."
                  className="flex-1 px-3 bg-transparent outline-none"
                />

              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">

              {user ? (
                <>
                  {/* User */}
                  <button
                    onClick={() =>
                      navigate("/customer/profile")
                    }
                    className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-purple-50"
                  >
                    <User size={18} />

                    <span className="font-medium">
                      {user?.name || "Customer"}
                    </span>
                  </button>

                  {/* Cart */}
                  <button className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700">

                    <ShoppingCart size={18} />

                    <span>Cart</span>

                    <span className="bg-white text-purple-700 px-2 rounded-full text-xs font-bold">
                      0
                    </span>

                  </button>

                  {/* Dashboard */}
                  <button
                    onClick={() =>
                      navigate("/customer/dashboard")
                    }
                    className="px-4 py-2 rounded-xl bg-purple-100 text-purple-700 font-medium hover:bg-purple-200"
                  >
                    Dashboard
                  </button>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
                  >
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

      {/* Categories Bar */}
      {user && (
        <div className="bg-white border-b">
          <div className="max-w-[1400px] mx-auto px-6">

            <div className="flex gap-8 overflow-x-auto py-4 text-sm font-medium whitespace-nowrap">

              <button>🍎 Fruits</button>
              <button>🥬 Vegetables</button>
              <button>🥛 Dairy</button>
              <button>🍪 Snacks</button>
              <button>🥤 Beverages</button>
              <button>🍚 Grocery</button>
              <button>🧴 Personal Care</button>
              <button>🏠 Home Essentials</button>
              <button>🐶 Pet Care</button>

            </div>

          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;





