import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/admin/vendors`;

const getHeaders = () => {
  const token = localStorage.getItem("adminToken");
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

export const createVendor = async (data) => {
  const res = await axios.post(API, data, getHeaders());
  return res.data;
};

export const getVendors = async () => {
  const res = await axios.get(`${API}/all`, getHeaders());
  return res.data;
};

export const getVendor = async (id) => {
  const res = await axios.get(`${API}/${id}`, getHeaders());
  return res.data;
};

export const updateVendor = async (id, data) => {
  const res = await axios.put(`${API}/${id}`, data, getHeaders());
  return res.data;
};

export const deleteVendor = async (id) => {
  const res = await axios.delete(`${API}/${id}`, getHeaders());
  return res.data;
};