import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/admin/brand`;

export const createBrand = async (data) => {
  const res = await axios.post(`${API}/create`, data);
  return res.data;
};

export const getBrands = async () => {
  const res = await axios.get(`${API}/all`);
  return res.data;
};

export const getBrand = async (id) => {
  const res = await axios.get(`${API}/${id}`);
  return res.data;
};

export const updateBrand = async (id, data) => {
  const res = await axios.put(`${API}/update/${id}`, data);
  return res.data;
};

export const deleteBrand = async (id) => {
  const res = await axios.delete(`${API}/delete/${id}`);
  return res.data;
};