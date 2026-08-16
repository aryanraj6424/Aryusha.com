import API from "./authApi";

const getAuthHeaders = () => {
  const token = localStorage.getItem("userToken") || localStorage.getItem("token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const createAddress = async (addressData) => {
  const response = await API.post("/address/create", addressData, getAuthHeaders());
  return response.data;
};

export const getUserAddresses = async (userId) => {
  const response = await API.get(`/address/user/${userId}`, getAuthHeaders());
  return response.data;
};

export const deleteAddress = async (id) => {
  const response = await API.delete(`/address/${id}`, getAuthHeaders());
  return response.data;
};