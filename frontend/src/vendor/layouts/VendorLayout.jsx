import { useState } from "react";
import { Outlet } from "react-router-dom";
import VendorSidebar from "../components/VendorSidebar";
import VendorHeader from "../components/VendorHeader";

export default function VendorLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <VendorSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-100">
        {/* Header */}
        <VendorHeader onMenuClick={() => setSidebarOpen(true)} />

        {/* Page Content */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}