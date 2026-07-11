import React from "react";

export default function Inventory({ formData, setFormData }) {
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow space-y-4">
      <h2 className="text-lg font-semibold">Inventory</h2>

      <input
        name="stock"
        value={formData.stock || ""}
        onChange={handleChange}
        placeholder="Stock Quantity"
        type="number"
        className="w-full border p-2 rounded"
      />

      <input
        name="lowStock"
        value={formData.lowStock || ""}
        onChange={handleChange}
        placeholder="Low Stock Alert"
        type="number"
        className="w-full border p-2 rounded"
      />
    </div>
  );
}