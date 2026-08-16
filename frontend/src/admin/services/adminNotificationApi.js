import axios from "axios";

const getHeaders = () => {
  const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`
  };
};

export const fetchAdminNotifications = async (page = 1, limit = 20) => {
  const res = await axios.get(
    `${import.meta.env.VITE_API_URL}/admin/notifications?page=${page}&limit=${limit}`,
    { headers: getHeaders() }
  );
  return res.data;
};

export const fetchAdminUnreadCount = async () => {
  const res = await axios.get(
    `${import.meta.env.VITE_API_URL}/admin/notifications/unread-count`,
    { headers: getHeaders() }
  );
  return res.data;
};

export const markAdminNotificationAsRead = async (id) => {
  const res = await axios.patch(
    `${import.meta.env.VITE_API_URL}/admin/notifications/${id}/read`,
    {},
    { headers: getHeaders() }
  );
  return res.data;
};

export const markAllAdminNotificationsAsRead = async () => {
  const res = await axios.patch(
    `${import.meta.env.VITE_API_URL}/admin/notifications/read-all`,
    {},
    { headers: getHeaders() }
  );
  return res.data;
};
