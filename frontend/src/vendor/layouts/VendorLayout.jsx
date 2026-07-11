import { Outlet } from "react-router-dom";
import VendorSidebar from "../components/VendorSidebar";
import VendorHeader from "../components/VendorHeader";

export default function VendorLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <VendorSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-100">
        {/* Header */}
        <VendorHeader />

        {/* Page Content */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}