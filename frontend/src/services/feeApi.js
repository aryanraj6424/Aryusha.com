import axios from "axios";

const getHeaders = () => {
  const token = localStorage.getItem("adminToken");
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

export const getAdminFees = async () => {
  const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/fees`, getHeaders());
  return res.data;
};

export const createAdminFee = async (data) => {
  const res = await axios.post(`${import.meta.env.VITE_API_URL}/admin/fees`, data, getHeaders());
  return res.data;
};

export const updateAdminFee = async (id, data) => {
  const res = await axios.put(`${import.meta.env.VITE_API_URL}/admin/fees/${id}`, data, getHeaders());
  return res.data;
};

export const deleteAdminFee = async (id) => {
  const res = await axios.delete(`${import.meta.env.VITE_API_URL}/admin/fees/${id}`, getHeaders());
  return res.data;
};

export const getResolvedFees = async (zoneId, cartTotal) => {
  const res = await axios.get(`${import.meta.env.VITE_API_URL}/fees?zoneId=${zoneId}&cartTotal=${cartTotal}`);
  return res.data;
};
