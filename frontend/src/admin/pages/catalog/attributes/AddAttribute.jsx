import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AddAttribute() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    type: "text",
    options: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...form,
        options: form.options
          ? form.options.split(",").map((o) => o.trim())
          : [],
      };

      await axios.post("/api/admin/attributes", payload);

      navigate("/admin/catalog/attributes");
    } catch (error) {
      console.log("Add attribute error:", error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Add Attribute</h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          type="text"
          name="name"
          placeholder="Attribute Name (e.g. Color, Size)"
          className="w-full border p-2"
          onChange={handleChange}
          required
        />

        <select
          name="type"
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
          placeholder="Options (comma separated) e.g. Red, Blue, Green"
          className="w-full border p-2"
          onChange={handleChange}
        />

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2"
        >
          Save Attribute
        </button>
      </form>
    </div>
  );
}