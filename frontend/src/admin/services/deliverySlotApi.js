import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/admin/delivery-slots`;

const getHeaders = () => {
  const token = localStorage.getItem("adminToken");
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

export const getAdminDeliverySlots = async () => {
  const res = await axios.get(API, getHeaders());
  return res.data;
};

export const createAdminDeliverySlot = async (data) => {
  const res = await axios.post(API, data, getHeaders());
  return res.data;
};

export const updateAdminDeliverySlot = async (id, data) => {
  const res = await axios.put(`${API}/${id}`, data, getHeaders());
  return res.data;
};

export const deleteAdminDeliverySlot = async (id) => {
  const res = await axios.delete(`${API}/${id}`, getHeaders());
  return res.data;
};
