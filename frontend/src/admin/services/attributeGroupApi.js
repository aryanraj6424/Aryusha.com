import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/admin/attribute-group`;

export const createAttributeGroup = async (data) => {
  const res = await axios.post(`${API}/create`, data);
  return res.data;
};

export const getAttributeGroups = async () => {
  const res = await axios.get(`${API}/all`);
  return res.data;
};

export const getAttributeGroupById = async (id) => {
  const res = await axios.get(`${API}/${id}`);
  return res.data;
};

export const updateAttributeGroup = async (id, data) => {
  const res = await axios.put(`${API}/update/${id}`, data);
  return res.data;
};

export const deleteAttributeGroup = async (id) => {
  const res = await axios.delete(`${API}/delete/${id}`);
  return res.data;
};
