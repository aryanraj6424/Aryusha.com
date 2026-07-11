import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/admin/fee-settings`;

const getHeaders = () => {
  const token = localStorage.getItem("adminToken");
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

export const getFeeSettings = async () => {
  const res = await axios.get(API, getHeaders());
  return res.data;
};

export const updateFeeSettings = async (data) => {
  const res = await axios.put(API, data, getHeaders());
  return res.data;
};
