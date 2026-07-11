import { useNavigate } from "react-router-dom";
import {
  User,
  Package,
  MapPin,
  Heart,
  HelpCircle,
  LogOut,
} from "lucide-react";

import ProfileHeader from "./components/ProfileHeader";
import ProfileMenuCard from "./components/ProfileMenuCard";

export default function CustomerProfilePage() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const menus = [
    {
      title: "My Account",
      icon: User,
      path: "/customer/account",
    },
    {
      title: "My Orders",
      icon: Package,
      path: "/customer/orders",
    },
    {
      title: "Addresses",
      icon: MapPin,
      path: "/customer/addresses",
    },
    {
      title: "Wishlist",
      icon: Heart,
      path: "/customer/wishlist",
    },
    {
      title: "Help & Support",
      icon: HelpCircle,
      path: "/customer/support",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto p-5">

      <ProfileHeader
        name={
          user?.fullName ||
          user?.name ||
          "Customer"
        }
        email={
          user?.email ||
          "No Email"
        }
      />

      <div className="bg-white rounded-2xl shadow overflow-hidden">

        {menus.map((item) => (
          <ProfileMenuCard
            key={item.title}
            title={item.title}
            icon={item.icon}
            onClick={() =>
              navigate(item.path)
            }
          />
        ))}

        <ProfileMenuCard
          title="Logout"
          icon={LogOut}
          danger={true}
          onClick={handleLogout}
        />

      </div>

    </div>
  );
}