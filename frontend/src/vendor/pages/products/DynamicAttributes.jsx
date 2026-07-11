import { useState } from "react";

export default function DynamicAttributes({ formData, setFormData }) {
  const [attrKey, setAttrKey] = useState("");
  const [attrVal, setAttrVal] = useState("");

  const addAttr = () => {
    if (!attrKey.trim() || !attrVal.trim()) return;
    setFormData({
      ...formData,
      attributes: [...(formData.attributes || []), { key: attrKey.trim(), value: attrVal.trim() }]
    });
    setAttrKey("");
    setAttrVal("");
  };

  const removeAttr = (idx) => {
    setFormData({
      ...formData,
      attributes: (formData.attributes || []).filter((_, i) => i !== idx)
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 text-sm font-semibold text-slate-700">
      <h3 className="text-lg font-extrabold text-slate-800 border-b pb-2">Additional Specifications</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          value={attrKey}
          onChange={(e) => setAttrKey(e.target.value)}
          placeholder="Attribute Label (e.g. Shelf Life)"
          className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={attrVal}
            onChange={(e) => setAttrVal(e.target.value)}
            placeholder="Attribute Value (e.g. 6 Months)"
            className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
          />
          <button
            type="button"
            onClick={addAttr}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 rounded-xl transition"
          >
            Add
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {(formData.attributes || []).map((attr, idx) => (
          <div key={idx} className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
            <div>
              <span className="font-extrabold text-slate-800">{attr.key}:</span>
              <span className="ml-2 text-slate-600">{attr.value}</span>
            </div>
            <button
              type="button"
              onClick={() => removeAttr(idx)}
              className="text-red-600 hover:text-red-800 font-bold"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
