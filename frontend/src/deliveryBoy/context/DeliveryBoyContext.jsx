import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const DeliveryBoyContext = createContext(null);

export const useDeliveryBoy = () => useContext(DeliveryBoyContext);

export const DeliveryBoyProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [deliveryBoy, setDeliveryBoy] = useState(() => {
    const saved = localStorage.getItem("deliveryBoy");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  const syncProfile = useCallback(async () => {
    const token = localStorage.getItem("deliveryBoyToken");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const apiBase = import.meta.env.VITE_API_URL;
      
      const res = await axios.get(`${apiBase}/delivery-boy/onboarding-status`, { headers });
      if (res.data.success) {
        const currentSaved = JSON.parse(localStorage.getItem("deliveryBoy") || "{}");
        const updatedRider = {
          ...currentSaved,
          fullName: res.data.fullName || currentSaved.fullName,
          phone: res.data.phone || currentSaved.phone,
          email: res.data.email || currentSaved.email,
          city: res.data.city || currentSaved.city,
          onboardingStatus: res.data.onboardingStatus,
          vehicleTypeSelection: res.data.vehicleTypeSelection,
          assignedStoreId: res.data.assignedStore,
          isOnline: res.data.isOnline ?? currentSaved.isOnline
        };
        localStorage.setItem("deliveryBoy", JSON.stringify(updatedRider));
        setDeliveryBoy(updatedRider);
      }
    } catch (error) {
      console.error("Failed to sync delivery boy data:", error);
      if (error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 404) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("deliveryBoyToken");
    if (token) {
      syncProfile();
    } else {
      setLoading(false);
    }
  }, [location.pathname]);

  const handleLogin = (token, riderData) => {
    localStorage.setItem("deliveryBoyToken", token);
    localStorage.setItem("deliveryBoy", JSON.stringify(riderData));
    setDeliveryBoy(riderData);
    navigate("/delivery-boy/dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("deliveryBoyToken");
    localStorage.removeItem("deliveryBoy");
    setDeliveryBoy(null);
    navigate("/delivery-boy/login");
  };

  const value = {
    deliveryBoy,
    setDeliveryBoy,
    loading,
    login: handleLogin,
    logout: handleLogout,
    refresh: syncProfile,
  };

  return <DeliveryBoyContext.Provider value={value}>{children}</DeliveryBoyContext.Provider>;
};
