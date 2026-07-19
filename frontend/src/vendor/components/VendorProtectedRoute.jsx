import { Navigate } from "react-router-dom";
import { useVendor } from "../context/VendorContext";

export default function VendorProtectedRoute({ children }) {
  const { vendor, loading } = useVendor();
  const token = localStorage.getItem("vendorToken");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!vendor || !token) {
    return (
      <Navigate
        to="/vendor/login"
        replace
      />
    );
  }

  return children;
}