// customer/components/navbar/MobileBottomNavbar.jsx

import { useNavigate, useLocation } from "react-router-dom";
import {
  House,
  LayoutGrid,
  Flame,
  ShoppingCart,
  User,
} from "lucide-react";
import { useState, useEffect } from "react";

function MobileBottomNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

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
    return () => {
      window.removeEventListener("cart-updated", updateCartCount);
    };
  }, []);

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
    {
      label: "Account",
      icon: User,
      path: "/customer/profile",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-purple-100 shadow-lg">

      <div className="grid grid-cols-5 h-16">

        {navItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            location.pathname === item.path ||
            (item.path === "/customer/dashboard" && location.pathname === "/");

          return (
            <button
              key={item.path}
              onClick={() =>
                navigate(item.path)
              }
              className={`relative flex flex-col items-center justify-center gap-1 transition
                ${
                  isActive
                    ? "text-[#6B21D9]"
                    : "text-gray-500 hover:text-[#6B21D9]"
                }`}
            >

              <div className="relative">

                <Icon size={22} className={isActive ? "stroke-[2.5]" : "stroke-[2]"} />

                {item.label === "Cart" &&
                  cartCount > 0 && (
                    <span
                      className="
                        absolute
                        -top-1.5
                        -right-2
                        bg-[#EF4444]
                        text-white
                        text-[9px]
                        font-black
                        w-4
                        h-4
                        rounded-full
                        flex
                        items-center
                        justify-center
                      "
                    >
                      {cartCount}
                    </span>
                  )}

              </div>

              <span className={`text-[10px] font-bold ${isActive ? "text-[#6B21D9]" : "text-gray-500"}`}>
                {item.label}
              </span>

              {isActive && (
                <div className="absolute top-0 w-10 h-1 bg-[#6B21D9] rounded-b-full" />
              )}

            </button>
          );
        })}

      </div>

    </div>
  );
}

export default MobileBottomNavbar;