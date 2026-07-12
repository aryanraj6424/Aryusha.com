import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, User, ChevronDown, LogOut, Shield, Menu } from "lucide-react";
import { useVendor } from "../context/VendorContext";

export default function VendorHeader({ onMenuClick }) {
  const navigate = useNavigate();
  const { vendor, logout } = useVendor();
  const [showSearch, setShowSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/vendor/login");
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left - Menu Button (mobile only) and Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer text-gray-600"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg lg:text-xl font-bold text-gray-800 tracking-wide">
          Vendor Panel
        </h1>
      </div>

      {/* Right - Search, Notifications, Profile */}
      <div className="flex items-center gap-2 lg:gap-4 relative">
        {/* Search Bar - Mobile Toggle */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Search size={20} className="text-gray-600" />
        </button>

        {/* Search Bar - Desktop */}
        <div className="hidden lg:block relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products, orders..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64 text-sm font-medium"
          />
        </div>

        {/* Mobile Search Input */}
        {showSearch && (
          <div className="lg:hidden absolute top-16 right-0 z-50 w-72">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-lg text-sm"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Notifications */}
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Profile Dropdown Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            {vendor?.storeDetails?.storeLogo ? (
              <img
                src={vendor.storeDetails.storeLogo}
                alt="Store Logo"
                className="w-8 h-8 rounded-full object-cover border border-purple-100"
              />
            ) : vendor?.ownerDetails?.profilePhoto ? (
              <img
                src={vendor.ownerDetails.profilePhoto}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border border-purple-100"
              />
            ) : (
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
            )}
            <ChevronDown size={16} className="text-gray-600 hidden sm:block" />
          </button>

          {/* Profile Dropdown Menu */}
          {showDropdown && (
            <>
              {/* Overlay to close menu on click outside */}
              <div
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setShowDropdown(false)}
              />
              
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden transform origin-top-right transition-all">
                {/* User Info Header */}
                <div className="p-4 border-b border-gray-50 bg-purple-50/30">
                  <p className="font-extrabold text-gray-800 truncate text-sm">
                    {vendor?.shopName || "Vendor Partner"}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5 font-medium">
                    {vendor?.businessEmail || vendor?.ownerDetails?.email || ""}
                  </p>
                  {vendor?.accountStatus === "active" && (
                    <span className="inline-flex items-center gap-0.5 mt-2 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-100">
                      <Shield size={10} /> Verified Partner
                    </span>
                  )}
                </div>

                {/* Menu Items */}
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      navigate("/vendor/profile");
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition font-semibold flex items-center gap-2"
                  >
                    <User size={16} />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition font-semibold flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
