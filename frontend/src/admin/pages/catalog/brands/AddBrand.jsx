import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../../../components/Toast";

export default function AddBrand() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    status: "Active",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      showToast({ type: "warning", message: "Brand name is required" });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      await axios.post(
        `${import.meta.env.VITE_API_URL}/brands`,
        {
          name: formData.name,
          status: formData.status,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      navigate("/admin/brands");
    } catch (error) {
      console.error(error);
      showToast({ type: "error", message: error.response?.data?.message || "Failed to create brand" });
    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow mt-6">

      <h1 className="text-2xl font-bold mb-6">
        Add Brand
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">

        <div>

          <label className="block mb-2 font-medium">
            Brand Name
          </label>

          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter Brand Name"
            className="w-full border rounded-lg p-3 outline-none"
            required
          />

        </div>

        <div>

          <label className="block mb-2 font-medium">
            Status
          </label>

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
          >

            <option>Active</option>
            <option>Inactive</option>

          </select>

        </div>

        <button
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
        >
          Save Brand
        </button>

      </form>

    </div>

  );

}