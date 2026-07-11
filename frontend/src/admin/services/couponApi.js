import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/admin/coupons`;

const getHeaders = () => {
  const token = localStorage.getItem("adminToken");
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

export const getCoupons = async () => {
  const res = await axios.get(`${API}/all`, getHeaders());
  return res.data;
};

export const getCouponById = async (id) => {
  const res = await axios.get(`${API}/${id}`, getHeaders());
  return res.data;
};

export const createCoupon = async (data) => {
  const res = await axios.post(`${API}/create`, data, getHeaders());
  return res.data;
};

export const updateCoupon = async (id, data) => {
  const res = await axios.put(`${API}/update/${id}`, data, getHeaders());
  return res.data;
};

export const deleteCoupon = async (id) => {
  const res = await axios.delete(`${API}/delete/${id}`, getHeaders());
  return res.data;
};
