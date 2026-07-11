// customer/components/navbar/MobileBottomNavbar.jsx

import { useNavigate, useLocation } from "react-router-dom";

import {
  House,
  LayoutGrid,
  Flame,
  ShoppingCart,
} from "lucide-react";

function MobileBottomNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const cartCount = 0;

  const navItems = [
    {
      label: "Home",
      icon: House,
      path: "/customer/dashboard",
    },
    {
      label: "Categories",
      icon: LayoutGrid,
      path: "/customer/categories",
    },
    {
      label: "Trending",
      icon: Flame,
      path: "/customer/trending",
    },
    {
      label: "Cart",
      icon: ShoppingCart,
      path: "/customer/cart",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-purple-100 shadow-lg">

      <div className="grid grid-cols-4 h-16">

        {navItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() =>
                navigate(item.path)
              }
              className={`relative flex flex-col items-center justify-center gap-1 transition
                ${
                  isActive
                    ? "text-purple-700"
                    : "text-gray-500"
                }`}
            >

              <div className="relative">

                <Icon size={22} />

                {item.label === "Cart" &&
                  cartCount > 0 && (
                    <span
                      className="
                        absolute
                        -top-2
                        -right-2
                        bg-purple-600
                        text-white
                        text-[10px]
                        px-1.5
                        py-0.5
                        rounded-full
                      "
                    >
                      {cartCount}
                    </span>
                  )}

              </div>

              <span className="text-xs font-medium">
                {item.label}
              </span>

              {isActive && (
                <div className="absolute top-0 w-10 h-1 bg-purple-600 rounded-b-full" />
              )}

            </button>
          );
        })}

      </div>

    </div>
  );
}

export default MobileBottomNavbar;