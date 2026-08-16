import axios from "axios";

const getHeaders = () => {
  const token = localStorage.getItem("vendorToken");
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const fetchVendorNotifications = async (page = 1, limit = 20) => {
  const res = await axios.get(
    `${import.meta.env.VITE_API_URL}/vendor/notifications?page=${page}&limit=${limit}`,
    getHeaders()
  );
  return res.data;
};

export const fetchUnreadNotificationCount = async () => {
  const res = await axios.get(
    `${import.meta.env.VITE_API_URL}/vendor/notifications/unread-count`,
    getHeaders()
  );
  return res.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const res = await axios.patch(
    `${import.meta.env.VITE_API_URL}/vendor/notifications/${notificationId}/read`,
    {},
    getHeaders()
  );
  return res.data;
};

export const markAllNotificationsAsRead = async () => {
  const res = await axios.patch(
    `${import.meta.env.VITE_API_URL}/vendor/notifications/read-all`,
    {},
    getHeaders()
  );
  return res.data;
};
