import { useVendor } from "../context/VendorContext";
import { ShieldX, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function VendorPermissionProtectedRoute({ module, action, children }) {
  const navigate = useNavigate();
  const { hasPermission, loading } = useVendor();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const allowed = hasPermission(module, action);

  if (!allowed) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl border border-red-100 shadow-xl p-8 max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-red-50 rounded-full flex items-center justify-center border border-red-100 text-red-500 animate-pulse">
            <ShieldX size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">Access Denied</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              You do not have the required permissions to access this page/feature. Please contact the administrator to request access.
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
}
