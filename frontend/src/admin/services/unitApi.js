import axios from "axios";

const getHeaders = () => {
  const token = localStorage.getItem("adminToken");
  return { Authorization: `Bearer ${token}` };
};

const API = `${import.meta.env.VITE_API_URL}/admin/units`;

export const createUnit = async (data) => {
  const res = await axios.post(`${API}/create`, data, { headers: getHeaders() });
  return res.data;
};

export const getUnits = async (params = {}) => {
  const res = await axios.get(`${API}/all`, { headers: getHeaders(), params });
  return res.data;
};

export const getUnitById = async (id) => {
  const res = await axios.get(`${API}/${id}`, { headers: getHeaders() });
  return res.data;
};

export const updateUnit = async (id, data) => {
  const res = await axios.put(`${API}/update/${id}`, data, { headers: getHeaders() });
  return res.data;
};

export const deleteUnit = async (id) => {
  const res = await axios.delete(`${API}/delete/${id}`, { headers: getHeaders() });
  return res.data;
};