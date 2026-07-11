import React from "react";

export default function UnitDetails({ formData, setFormData }) {
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow space-y-4">
      <h2 className="text-lg font-semibold">Unit Details</h2>

      <select
        name="unit"
        value={formData.unit || ""}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      >
        <option value="">Select Unit</option>
        <option value="kg">Kg</option>
        <option value="g">Gram</option>
        <option value="ltr">Litre</option>
        <option value="ml">ML</option>
        <option value="piece">Piece</option>
      </select>

      <input
        name="quantity"
        value={formData.quantity || ""}
        onChange={handleChange}
        placeholder="Quantity"
        type="number"
        className="w-full border p-2 rounded"
      />
    </div>
  );
}