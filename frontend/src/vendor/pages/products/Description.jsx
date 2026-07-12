import React from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

export default function Description({ formData, setFormData }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 text-sm font-semibold text-slate-700">
      <h3 className="text-lg font-extrabold text-slate-800 border-b pb-2">Product Description</h3>
      
      <div className="space-y-2">
        <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">About this Product</label>
        <div className="quill-editor-container">
          <ReactQuill
            theme="snow"
            value={formData.description || ""}
            onChange={(val) => setFormData({ ...formData, description: val })}
            placeholder="Provide detailed specifications, ingredients, storage instructions or details..."
            modules={{
              toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['clean']
              ]
            }}
          />
        </div>
      </div>
    </div>
  );
}
