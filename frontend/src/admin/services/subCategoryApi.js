import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/admin/sub-category`;

export const createSubCategory = async (data) => {
  const res = await axios.post(`${API}/create`, data);
  return res.data;
};

export const getSubCategories = async () => {
  const res = await axios.get(`${API}/all`);
  return res.data;
};

export const getSubCategory = async (id) => {
  const res = await axios.get(`${API}/${id}`);
  return res.data;
};

export const updateSubCategory = async (id, data) => {
  const res = await axios.put(`${API}/update/${id}`, data);
  return res.data;
};

export const deleteSubCategory = async (id) => {
  const res = await axios.delete(`${API}/delete/${id}`);
  return res.data;
};