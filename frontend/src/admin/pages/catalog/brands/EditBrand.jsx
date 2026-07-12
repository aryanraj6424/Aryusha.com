import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../../../components/Toast";

export default function EditBrand() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    status: "Active",
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/brands/${id}`);
        if (res.data.success && res.data.brand) {
          setFormData({
            name: res.data.brand.name,
            status: res.data.brand.status || "Active",
          });
        }
      } catch (err) {
        console.error("Failed to load brand:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBrand();
  }, [id]);

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
      setUpdating(true);
      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/brands/${id}`,
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
      showToast({ type: "error", message: error.response?.data?.message || "Failed to update brand" });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading brand details...</div>;
  }

  return (

    <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow mt-6">

      <h1 className="text-2xl font-bold mb-6">
        Edit Brand
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
            className="w-full border rounded-lg p-3"
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
        >
          Update Brand
        </button>

      </form>

    </div>

  );

}