import React from "react";

export default function Pricing({ formData, setFormData }) {
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow space-y-4">
      <h2 className="text-lg font-semibold">Pricing</h2>

      <input
        name="mrp"
        value={formData.mrp || ""}
        onChange={handleChange}
        placeholder="MRP"
        type="number"
        className="w-full border p-2 rounded"
      />

      <input
        name="sellingPrice"
        value={formData.sellingPrice || ""}
        onChange={handleChange}
        placeholder="Selling Price"
        type="number"
        className="w-full border p-2 rounded"
      />

      <input
        name="costPrice"
        value={formData.costPrice || ""}
        onChange={handleChange}
        placeholder="Cost Price"
        type="number"
        className="w-full border p-2 rounded"
      />

      <input
        name="gst"
        value={formData.gst || ""}
        onChange={handleChange}
        placeholder="GST %"
        type="number"
        className="w-full border p-2 rounded"
      />
    </div>
  );
}