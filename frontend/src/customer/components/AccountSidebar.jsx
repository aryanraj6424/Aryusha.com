import { NavLink, useNavigate } from "react-router-dom";

export default function AccountSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");

    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    `block px-4 py-3 rounded-xl transition ${
      isActive
        ? "bg-purple-600 text-white"
        : "text-gray-700 hover:bg-purple-100"
    }`;

  return (
    <div className="w-72 bg-white shadow-lg p-5">

      <h2 className="text-2xl font-bold text-purple-700 mb-8">
        My Account
      </h2>

      <div className="space-y-2">

        <NavLink
          to="/customer/dashboard"
          className={linkClass}
        >
          🏠 Dashboard
        </NavLink>

        <NavLink
          to="/customer/profile"
          className={linkClass}
        >
          👤 Profile
        </NavLink>

        <NavLink
          to="/customer/addresses"
          className={linkClass}
        >
          📍 Addresses
        </NavLink>

        <NavLink
          to="/customer/orders"
          className={linkClass}
        >
          📦 Orders
        </NavLink>

        <NavLink
          to="/customer/refunds"
          className={linkClass}
        >
          💰 Refunds
        </NavLink>

        <NavLink
          to="/customer/settings"
          className={linkClass}
        >
          ⚙️ Settings
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full mt-5 bg-red-500 text-white py-3 rounded-xl hover:bg-red-600"
        >
          Logout
        </button>

      </div>
    </div>
  );
}