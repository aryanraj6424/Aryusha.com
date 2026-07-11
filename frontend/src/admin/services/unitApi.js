import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/admin/unit`;

export const createUnit = async (data) => {
  const res = await axios.post(`${API}/create`, data);
  return res.data;
};

export const getUnits = async () => {
  const res = await axios.get(`${API}/all`);
  return res.data;
};

export const updateUnit = async (id, data) => {
  const res = await axios.put(`${API}/update/${id}`, data);
  return res.data;
};

export const deleteUnit = async (id) => {
  const res = await axios.delete(`${API}/delete/${id}`);
  return res.data;
};