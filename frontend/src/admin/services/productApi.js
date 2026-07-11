import axios from "axios";

const BASE = import.meta.env.VITE_API_URL;
const ADMIN_API = `${BASE}/admin`;

// Helper: attach Bearer token
const authHeaders = () => {
  const token = localStorage.getItem("adminToken");
  return { headers: { Authorization: `Bearer ${token}` } };
};

/* ============================================================
   PRODUCT API
============================================================ */

export const createProduct = async (data) => {
  const res = await axios.post(`${ADMIN_API}/product/create`, data, authHeaders());
  return res.data;
};

export const getProducts = async () => {
  const res = await axios.get(`${ADMIN_API}/product/all`, authHeaders());
  return res.data.products;
};

export const getProduct = async (id) => {
  const res = await axios.get(`${ADMIN_API}/product/${id}`, authHeaders());
  return res.data.product;
};

export const updateProduct = async (id, data) => {
  const res = await axios.put(`${ADMIN_API}/product/update/${id}`, data, authHeaders());
  return res.data;
};

export const deleteProduct = async (id) => {
  const res = await axios.delete(`${ADMIN_API}/product/delete/${id}`, authHeaders());
  return res.data;
};

/* ============================================================
   VARIANT API
============================================================ */

export const getVariants = async (productId) => {
  const res = await axios.get(`${ADMIN_API}/product/${productId}/variants`, authHeaders());
  return res.data.variants;
};

export const createVariant = async (productId, data) => {
  const res = await axios.post(`${ADMIN_API}/product/${productId}/variants`, data, authHeaders());
  return res.data.variant;
};

export const updateVariant = async (variantId, data) => {
  const res = await axios.put(`${ADMIN_API}/variant/${variantId}`, data, authHeaders());
  return res.data.variant;
};

export const deleteVariant = async (variantId) => {
  const res = await axios.delete(`${ADMIN_API}/variant/${variantId}`, authHeaders());
  return res.data;
};

/* ============================================================
   CATEGORY API  (used in AddProduct cascade selector)
============================================================ */

export const getCategories = async () => {
  const res = await axios.get(`${BASE}/categories`);
  return res.data.categories;
};

/* ============================================================
   SUB CATEGORY API  (cascade selector)
============================================================ */

export const getSubCategories = async (categoryId) => {
  const res = await axios.get(`${BASE}/sub-categories/category/${categoryId}`);
  return res.data.subCategories;
};

/* ============================================================
   PRODUCT FAMILY API  (cascade selector)
============================================================ */

export const getProductFamilies = async (subCategoryId) => {
  const res = await axios.get(`${BASE}/product-families/sub-category/${subCategoryId}`);
  return res.data.productFamilies;
};