import axios from "axios";

const API =
  `${import.meta.env.VITE_API_URL}/admin/auth`;

export const loginAdmin =
  async (data) => {
    const response =
      await axios.post(
        `${API}/login`,
        data
      );

    return response.data;
  };