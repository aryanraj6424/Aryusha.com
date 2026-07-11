import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/admin/product-family`;

export const createProductFamily = async (data) => {
  const res = await axios.post(`${API}/create`, data);
  return res.data;
};

export const getProductFamilies = async () => {
  const res = await axios.get(`${API}/all`);
  return res.data;
};

export const getProductFamily = async (id) => {
  const res = await axios.get(`${API}/${id}`);
  return res.data;
};

export const updateProductFamily = async (id, data) => {
  const res = await axios.put(`${API}/update/${id}`, data);
  return res.data;
};

export const deleteProductFamily = async (id) => {
  const res = await axios.delete(`${API}/delete/${id}`);
  return res.data;
};