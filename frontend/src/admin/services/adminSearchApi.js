import axios from "axios";

export const searchAdminEntities = async (query, signal = null) => {
  const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
  const res = await axios.get(
    `${import.meta.env.VITE_API_URL}/admin/search?query=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      },
      signal
    }
  );
  return res.data;
};
