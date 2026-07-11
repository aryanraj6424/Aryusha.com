import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

export default function EditAttribute() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    type: "",
    options: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/admin/attributes/${id}`);

        setForm({
          name: res.data.name,
          type: res.data.type,
          options: res.data.options?.join(", ") || "",
        });
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...form,
        options: form.options
          ? form.options.split(",").map((o) => o.trim())
          : [],
      };

      await axios.put(`/api/admin/attributes/${id}`, payload);

      navigate("/admin/catalog/attributes");
    } catch (error) {
      console.log("Update error:", error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Edit Attribute</h1>

      <form onSubmit={handleUpdate} className="space-y-4">

        <input
          type="text"
          name="name"
          value={form.name}
          className="w-full border p-2"
          onChange={handleChange}
        />

        <select
          name="type"
          value={form.type}
          className="w-full border p-2"
          onChange={handleChange}
        >
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="dropdown">Dropdown</option>
          <option value="boolean">Boolean</option>
        </select>

        <input
          type="text"
          name="options"
          value={form.options}
          className="w-full border p-2"
          onChange={handleChange}
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2"
        >
          Update Attribute
        </button>
      </form>
    </div>
  );
}