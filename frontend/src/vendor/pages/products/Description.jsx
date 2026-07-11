import React from "react";

export default function Description({ formData, setFormData }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 text-sm font-semibold text-slate-700">
      <h3 className="text-lg font-extrabold text-slate-800 border-b pb-2">Product Description</h3>
      
      <div>
        <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">About this Product</label>
        <textarea
          rows="5"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Provide detail specifications, ingredients, storage instructions or details..."
          className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none font-semibold text-slate-650"
        />
      </div>
    </div>
  );
}
