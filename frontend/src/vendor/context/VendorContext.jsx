import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const VendorContext = createContext(null);

export const useVendor = () => useContext(VendorContext);

export const VendorProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [vendor, setVendor] = useState(() => {
    const saved = localStorage.getItem("vendor");
    return saved ? JSON.parse(saved) : null;
  });
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allowLocationEdit, setAllowLocationEdit] = useState(false);

  const fetchProfileAndPermissions = useCallback(async () => {
    const token = localStorage.getItem("vendorToken");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const apiBase = import.meta.env.VITE_API_URL;

      // Fetch Profile
      const profileRes = await axios.get(`${apiBase}/vendor/profile`, { headers });
      const currentVendor = profileRes.data.vendor;
      setVendor(currentVendor);
      localStorage.setItem("vendor", JSON.stringify(currentVendor));
      setAllowLocationEdit(profileRes.data.allowLocationEdit ?? false);

      // Handle Redirection based on Approval Status or Account Status
      if (currentVendor.status === "pending") {
        if (location.pathname !== "/vendor/pending-approval") {
          navigate("/vendor/pending-approval");
        }
      } else if (currentVendor.status === "rejected") {
        alert("Your account verification was rejected.");
        handleLogout();
        return;
      } else if (currentVendor.accountStatus !== "active") {
        alert(`Your account has been ${currentVendor.accountStatus} by admin.`);
        handleLogout();
        return;
      } else {
        // Approved and Active
        if (location.pathname === "/vendor/pending-approval") {
          navigate("/vendor/dashboard");
        }
      }

      // Fetch Permissions
      const permRes = await axios.get(`${apiBase}/vendor/permissions`, { headers });
      setPermissions(permRes.data.permissions?.permissions || null);

    } catch (error) {
      console.error("Failed to sync vendor data:", error);
      if (error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 404) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, location.pathname]);

  useEffect(() => {
    const token = localStorage.getItem("vendorToken");
    if (token) {
      fetchProfileAndPermissions();
    } else {
      setLoading(false);
    }
  }, [location.pathname]); // Refetch on route changes to ensure real-time status/permission synchronization

  // Background polling to sync vendor status/permissions in real-time (every 10s)
  useEffect(() => {
    const token = localStorage.getItem("vendorToken");
    if (!token) return;

    const interval = setInterval(() => {
      fetchProfileAndPermissions();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchProfileAndPermissions]);

  const handleLogout = () => {
    localStorage.removeItem("vendorToken");
    localStorage.removeItem("vendor");
    setVendor(null);
    setPermissions(null);
    setAllowLocationEdit(false);
    navigate("/vendor/login");
  };

  const hasPermission = useCallback((module, action) => {
    if (!permissions) return false;
    // If permissions object does not contain this module, default to true (safe fallback for new features)
    if (!permissions[module]) return true;
    // If it's a simple boolean permission (e.g. areaAccess.view)
    if (typeof permissions[module] === "boolean") {
      return permissions[module];
    }
    // If it's a nested action (e.g. category.add)
    if (permissions[module][action] !== undefined) {
      return permissions[module][action];
    }
    return false;
  }, [permissions]);

  const value = {
    vendor,
    permissions,
    loading,
    hasPermission,
    allowLocationEdit,
    logout: handleLogout,
    refresh: fetchProfileAndPermissions,
  };

  return <VendorContext.Provider value={value}>{children}</VendorContext.Provider>;
};
