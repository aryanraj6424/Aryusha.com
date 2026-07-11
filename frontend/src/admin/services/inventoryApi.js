import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/admin/inventory`;

// Get Stock
export const getInventory = async () => {
  const res = await axios.get(`${API}/all`);
  return res.data;
};

// Update Stock
export const updateStock = async (id, data) => {
  const res = await axios.put(`${API}/update/${id}`, data);
  return res.data;
};

// Low Stock Products
export const getLowStock = async () => {
  const res = await axios.get(`${API}/low-stock`);
  return res.data;
};

// Stock History
export const getStockHistory = async () => {
  const res = await axios.get(`${API}/history`);
  return res.data;
};