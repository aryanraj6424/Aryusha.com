import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/admin/vendor`;

export const createVendor = async (data) => {
  const res = await axios.post(`${API}/create`, data);
  return res.data;
};

export const getVendors = async () => {
  const res = await axios.get(`${API}/all`);
  return res.data;
};

export const getVendor = async (id) => {
  const res = await axios.get(`${API}/${id}`);
  return res.data;
};

export const updateVendor = async (id, data) => {
  const res = await axios.put(`${API}/update/${id}`, data);
  return res.data;
};

export const deleteVendor = async (id) => {
  const res = await axios.delete(`${API}/delete/${id}`);
  return res.data;
};