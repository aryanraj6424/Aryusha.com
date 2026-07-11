// import { useNavigate } from "react-router-dom";
// import { useEffect, useState } from "react";
// import axios from "axios";

// export default function AdminDashboard() {
//   const navigate = useNavigate();

//   const [vendors, setVendors] = useState([]);
//   const [stats, setStats] = useState({
//     totalVendors: 0,
//     pendingVendors: 0,
//     approvedVendors: 0,
//     rejectedVendors: 0,
//   });

//   const [loading, setLoading] = useState(true);

//   const handleLogout = () => {
//     localStorage.removeItem("adminToken");
//     localStorage.removeItem("admin");

//     navigate("/admin/login");
//   };

//   const fetchPendingVendors = async () => {
//     try {
//       const response = await axios.get(
//         `${import.meta.env.VITE_API_URL}/admin/vendors/pending`
//       );

//       setVendors(response.data.vendors || []);
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   const fetchStats = async () => {
//     try {
//       const response = await axios.get(
//         `${import.meta.env.VITE_API_URL}/admin/vendors/stats`
//       );

//       setStats(response.data);
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   const handleApprove = async (id) => {
//     try {
//       await axios.put(
//         `${import.meta.env.VITE_API_URL}/admin/vendors/approve/${id}`
//       );

//       alert("Vendor Approved");

//       fetchPendingVendors();
//       fetchStats();
//     } catch (error) {
//       console.log(error);
//       alert("Failed to approve vendor");
//     }
//   };

//   const handleReject = async (id) => {
//     try {
//       await axios.put(
//         `${import.meta.env.VITE_API_URL}/admin/vendors/reject/${id}`
//       );

//       alert("Vendor Rejected");

//       fetchPendingVendors();
//       fetchStats();
//     } catch (error) {
//       console.log(error);
//       alert("Failed to reject vendor");
//     }
//   };

//   useEffect(() => {
//     const loadData = async () => {
//       await fetchPendingVendors();
//       await fetchStats();
//       setLoading(false);
//     };

//     loadData();
//   }, []);

//   return (
//     <div className="p-6">

//       {/* Header */}
//       <div className="flex justify-between items-center mb-8">

//         <div>
//           <h1 className="text-3xl font-bold">
//             Admin Dashboard
//           </h1>

//           <p className="text-gray-500">
//             Welcome Super Admin
//           </p>
//         </div>

//         <button
//           onClick={handleLogout}
//           className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl font-semibold"
//         >
//           Logout
//         </button>

//       </div>

//       {/* Stats */}

//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">

//         <div className="bg-white shadow rounded-2xl p-6">
//           <h2 className="text-lg font-semibold">
//             Total Vendors
//           </h2>

//           <p className="text-3xl font-bold mt-2">
//             {stats.totalVendors}
//           </p>
//         </div>

//         <div className="bg-white shadow rounded-2xl p-6">
//           <h2 className="text-lg font-semibold">
//             Pending Vendors
//           </h2>

//           <p className="text-3xl font-bold mt-2">
//             {stats.pendingVendors}
//           </p>
//         </div>

//         <div className="bg-white shadow rounded-2xl p-6">
//           <h2 className="text-lg font-semibold">
//             Approved Vendors
//           </h2>

//           <p className="text-3xl font-bold mt-2">
//             {stats.approvedVendors}
//           </p>
//         </div>

//         <div className="bg-white shadow rounded-2xl p-6">
//           <h2 className="text-lg font-semibold">
//             Rejected Vendors
//           </h2>

//           <p className="text-3xl font-bold mt-2">
//             {stats.rejectedVendors}
//           </p>
//         </div>

//       </div>

//       {/* Pending Vendor Table */}

//       <div className="bg-white shadow rounded-2xl p-6">

//         <h2 className="text-2xl font-bold mb-5">
//           Pending Vendor Requests
//         </h2>

//         {loading ? (
//           <p>Loading...</p>
//         ) : vendors.length === 0 ? (
//           <p>No Pending Vendors</p>
//         ) : (
//           <div className="overflow-x-auto">

//             <table className="w-full border">

//               <thead>
//                 <tr className="bg-gray-100">

//                   <th className="p-3 border">
//                     Shop Name
//                   </th>

//                   <th className="p-3 border">
//                     Phone
//                   </th>

//                   <th className="p-3 border">
//                     Status
//                   </th>

//                   <th className="p-3 border">
//                     Account Status
//                   </th>

//                   <th className="p-3 border">
//                     Action
//                   </th>

//                 </tr>
//               </thead>

//               <tbody>

//                 {vendors.map((vendor) => (
//                   <tr key={vendor._id}>

//                     <td className="p-3 border">
//                       {vendor.shopName}
//                     </td>

//                     <td className="p-3 border">
//                       {vendor.phone}
//                     </td>

//                     <td className="p-3 border">
//                       {vendor.status}
//                     </td>

//                     <td className="p-3 border">
//                       {vendor.accountStatus}
//                     </td>

//                     <td className="p-3 border">

//                       <div className="flex gap-2">

//                         <button
//                           onClick={() =>
//                             handleApprove(vendor._id)
//                           }
//                           className="bg-green-500 text-white px-4 py-2 rounded-lg"
//                         >
//                           Approve
//                         </button>

//                         <button
//                           onClick={() =>
//                             handleReject(vendor._id)
//                           }
//                           className="bg-red-500 text-white px-4 py-2 rounded-lg"
//                         >
//                           Reject
//                         </button>

//                       </div>

//                     </td>

//                   </tr>
//                 ))}

//               </tbody>

//             </table>

//           </div>
//         )}

//       </div>

//     </div>
//   );
// }




import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import DashboardAnalytics from "./DashboardAnalytics";
import axios from "axios";

export default function AdminDashboard() {
  const navigate = useNavigate();

  // =====================================
  // VENDOR DASHBOARD STATS START
  // Replace this section in future
  // =====================================

  const [stats, setStats] = useState({
    totalVendors: 0,
    pendingVendors: 0,
    approvedVendors: 0,
    rejectedVendors: 0,
  });

  // =====================================
  // VENDOR DASHBOARD STATS END
  // =====================================

  const [loading, setLoading] =
    useState(true);

  const handleLogout = () => {
    localStorage.removeItem(
      "adminToken"
    );

    localStorage.removeItem(
      "admin"
    );

    navigate("/admin/login");
  };

  // =====================================
  // VENDOR API START
  // Replace this section in future
  // =====================================

  const fetchStats = async () => {
    try {
      const response =
        await axios.get(
          `${import.meta.env.VITE_API_URL}/admin/vendors/stats`
        );

      setStats(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  // =====================================
  // VENDOR API END
  // =====================================

  useEffect(() => {
    const loadData =
      async () => {
        await fetchStats();

        setLoading(false);
      };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="p-6">

      {/* Header */}

      <div className="flex justify-between items-center mb-8">

        <div>

          <h1 className="text-4xl font-bold">
            Admin Dashboard
          </h1>

          <p className="text-gray-500 mt-1">
            Welcome Super Admin
          </p>

        </div>

        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold"
        >
          Logout
        </button>

      </div>

      {/* =====================================
          VENDOR OVERVIEW CARD START
          Replace this section in future
         ===================================== */}

      <div className="bg-white shadow-lg rounded-3xl p-8">

        <div className="flex justify-between items-center mb-8">

          <div>

            <h2 className="text-3xl font-bold">
              Vendor Overview
            </h2>

            <p className="text-gray-500">
              Complete Vendor Statistics
            </p>

          </div>

        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

          {/* Total Vendors */}

          <div className="bg-gray-50 rounded-2xl p-8 text-center border">

            <h3 className="text-gray-500 font-medium">
              Total Vendors
            </h3>

            <p className="text-5xl font-bold mt-4">
              {stats.totalVendors}
            </p>

          </div>

          {/* Pending Vendors */}

          <div className="bg-yellow-50 rounded-2xl p-8 text-center border">

            <h3 className="text-gray-500 font-medium">
              Pending
            </h3>

            <p className="text-5xl font-bold mt-4">
              {stats.pendingVendors}
            </p>

          </div>

          {/* Approved Vendors */}

          <div className="bg-green-50 rounded-2xl p-8 text-center border">

            <h3 className="text-gray-500 font-medium">
              Approved
            </h3>

            <p className="text-5xl font-bold mt-4">
              {stats.approvedVendors}
            </p>

          </div>

          {/* Rejected Vendors */}

          <div className="bg-red-50 rounded-2xl p-8 text-center border">

            <h3 className="text-gray-500 font-medium">
              Rejected
            </h3>

            <p className="text-5xl font-bold mt-4">
              {stats.rejectedVendors}
            </p>

          </div>

        </div>

      </div>

      <DashboardAnalytics />

      {/* =====================================
          VENDOR OVERVIEW CARD END
         ===================================== */}

    </div>
  );
}