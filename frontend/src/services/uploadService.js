import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token =
    localStorage.getItem("adminToken") ||
    localStorage.getItem("vendorToken") ||
    localStorage.getItem("userToken") ||
    localStorage.getItem("deliveryBoyToken") ||
    localStorage.getItem("token");

  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Uploads a single file to Cloudinary via the backend proxy.
 * @param {File} file - The raw file object.
 * @param {string} folder - The folder to save in Cloudinary (e.g., products, categories, vendors).
 * @returns {Promise<{ url: string, public_id: string }>}
 */
export const uploadFile = async (file, folder = "general") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const response = await axios.post(`${API_URL}/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      ...getAuthHeaders(),
    },
  });

  return response.data;
};

/**
 * Deletes a file from Cloudinary using its public_id.
 * @param {string} publicId
 * @returns {Promise<any>}
 */
export const deleteFile = async (publicId) => {
  const response = await axios.post(
    `${API_URL}/upload/delete`,
    { public_id: publicId },
    { headers: getAuthHeaders() }
  );

  return response.data;
};
