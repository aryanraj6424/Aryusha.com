import axios from "axios";

export const fetchSearchSuggestions = async (query, address = null, signal = null) => {
  const params = {
    search: query,
    limit: 8
  };

  if (address) {
    if (address.pincode) params.pincode = address.pincode;
    if (address.latitude) params.latitude = address.latitude;
    if (address.longitude) params.longitude = address.longitude;
  }

  const res = await axios.get(`${import.meta.env.VITE_API_URL}/products`, {
    params,
    signal
  });

  return res.data;
};
