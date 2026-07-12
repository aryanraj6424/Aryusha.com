import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useVendor } from "../context/VendorContext";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Wallet,
  Warehouse,
  Tag,
  Star,
  Bell,
  MessageSquare,
  Shield,
  FileText,
  Map
} from "lucide-react";

export default function VendorSidebar({ isOpen, setIsOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission, logout } = useVendor();

  const handleLogout = () => {
    logout();
  };

  const isActive = (path) => location.pathname === path;

  // Define sidebar menu options
  const menuItems = [
    {
      section: "MAIN",
      items: [
        { path: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "/vendor/products", label: "Product Management", icon: Package, permission: { module: "product", action: "view" } },
        { path: "/vendor/orders", label: "Order Management", icon: ShoppingBag },
        { path: "/vendor/assigned-area", label: "Assigned Area", icon: Map }
      ]
    }
  ];

  // Filter items in each section (all are public for logged-in vendor now)
  const filteredMenuItems = menuItems.map(section => {
    const items = section.items.filter(item => {
      if (!item.permission) return true;
      return hasPermission(item.permission.module, item.permission.action);
    });
    return { ...section, items };
  }).filter(section => section.items.length > 0);

  return (
    <>
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40 lg:z-auto
        w-64 bg-[#6d28d9] text-white p-5 flex flex-col h-screen overflow-y-auto
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo and close button on mobile */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-purple-100 font-sans tracking-wide">Aryusha.com</h1>
            <p className="text-xs text-purple-200 mt-1">Vendor Panel</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 hover:bg-purple-800 rounded-lg text-purple-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-4 flex-1">
          {/* Menu Sections */}
          {filteredMenuItems.map((section) => (
            <div key={section.section}>
              <h3 className="text-xs uppercase text-purple-200 mb-2 px-3 font-bold tracking-wider">
                {section.section}
              </h3>
              <div className="flex flex-col gap-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left py-2 px-3 rounded-lg transition-colors flex items-center gap-3 ${
                        isActive(item.path)
                          ? "bg-purple-800 text-white font-semibold"
                          : "hover:bg-purple-800 text-purple-100"
                      }`}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}