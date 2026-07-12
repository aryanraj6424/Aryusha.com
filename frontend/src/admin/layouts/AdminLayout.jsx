// import { Outlet, useNavigate } from "react-router-dom";

// export default function AdminLayout() {
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     localStorage.removeItem("adminToken");
//     localStorage.removeItem("admin");

//     navigate("/admin/login");
//   };

//   return (
//     <div className="flex min-h-screen">

//       {/* Sidebar */}
//       <div className="w-64 bg-black text-white p-5 flex flex-col">

//         <h2 className="text-2xl font-bold mb-8">
//           QuickCart Admin
//         </h2>

//         <nav className="flex flex-col gap-4">

//           <button
//             onClick={() =>
//               navigate("/admin/dashboard")
//             }
//             className="text-left hover:text-purple-400"
//           >
//             Dashboard
//           </button>

//           <button
//             onClick={() =>
//               navigate("/admin/vendors")
//             }
//             className="text-left hover:text-purple-400"
//           >
//             Vendors
//           </button>

//         </nav>

//         {/* Logout Button */}
//         <div className="mt-auto">

//           <button
//             onClick={handleLogout}
//             className="w-full bg-red-500 hover:bg-red-600 py-3 rounded-xl font-semibold"
//           >
//             Logout
//           </button>

//         </div>

//       </div>

//       {/* Main Content */}
//       <div className="flex-1 p-6 bg-gray-100">
//         <Outlet />
//       </div>

//     </div>
//   );
// }


import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

        {/* Page Content */}
        <div className="flex-1 bg-gray-100 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}