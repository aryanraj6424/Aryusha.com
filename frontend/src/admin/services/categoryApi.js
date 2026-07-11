// import axios from "axios";

// const API = `${import.meta.env.VITE_API_URL}/admin/category`;

// // Create Category
// export const createCategory = async (data) => {
//   const res = await axios.post(`${API}/create`, data);
//   return res.data;
// };

// // Get All Categories
// export const getCategories = async () => {
//   const res = await axios.get(`${API}/all`);
//   return res.data;
// };

// // Get Single Category
// export const getCategory = async (id) => {
//   const res = await axios.get(`${API}/${id}`);
//   return res.data;
// };

// // Update Category
// export const updateCategory = async (id, data) => {
//   const res = await axios.put(`${API}/update/${id}`, data);
//   return res.data;
// };

// // Delete Category
// export const deleteCategory = async (id) => {
//   const res = await axios.delete(`${API}/delete/${id}`);
//   return res.data;
// };



import axios from "axios";

// Base API URL configuration
const API = `${import.meta.env.VITE_API_URL}/admin/categories`;

// Helper function to dynamically retrieve token headers
const getHeaders = () => {
  const token = localStorage.getItem("adminToken");
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

/* ============================================================
   CATEGORY MANAGEMENT API
============================================================ */

// Create Category
export const createCategory = async (data) => {
  const res = await axios.post(`${API}/create`, data, getHeaders());
  return res.data;
};

// Get All Categories
export const getCategories = async () => {
  const res = await axios.get(`${API}/all`, getHeaders());
  return res.data;
};

// Get Single Category
export const getCategory = async (id) => {
  const res = await axios.get(`${API}/${id}`, getHeaders());
  return res.data;
};

// Update Category
export const updateCategory = async (id, data) => {
  const res = await axios.put(`${API}/update/${id}`, data, getHeaders());
  return res.data;
};

// Delete Category
export const deleteCategory = async (id) => {
  const res = await axios.delete(`${API}/delete/${id}`, getHeaders());
  return res.data;
};