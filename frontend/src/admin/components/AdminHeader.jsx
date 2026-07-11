import { useState } from "react";
import { Search, Bell, User, ChevronDown } from "lucide-react";

export default function AdminHeader() {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4 flex items-center justify-between">
      {/* Left - Logo and Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg lg:text-xl font-semibold text-gray-800">Super Admin Panel</h1>
      </div>

      {/* Right - Search, Notifications, Profile */}
      <div className="flex items-center gap-2 lg:gap-4">
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
            placeholder="Search..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-64"
          />
        </div>

        {/* Mobile Search Input */}
        {showSearch && (
          <div className="lg:hidden absolute top-16 left-4 right-4 z-50">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white shadow-lg"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Notifications */}
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Profile Dropdown */}
        <button className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <ChevronDown size={16} className="text-gray-600 hidden sm:block" />
        </button>
      </div>
    </header>
  );
}
