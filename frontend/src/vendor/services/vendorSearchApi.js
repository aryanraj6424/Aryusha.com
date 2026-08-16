import axios from "axios";

export const searchVendorEntities = async (query, signal = null) => {
  const token = localStorage.getItem("vendorToken");
  const res = await axios.get(
    `${import.meta.env.VITE_API_URL}/vendor/search?query=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      signal
    }
  );
  return res.data;
};
