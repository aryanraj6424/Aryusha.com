import React, { useState } from "react";
import { uploadFile } from "../../../services/uploadService";

export default function Images({ formData, setFormData }) {
  const [uploading, setUploading] = useState(false);

  const handleImage = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    try {
      setUploading(true);
      const uploadedUrls = [];
      for (const file of files) {
        const res = await uploadFile(file, "products");
        uploadedUrls.push(res.url);
      }
      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedUrls],
      }));
    } catch (error) {
      console.error("Image upload failed:", error);
      alert(error.response?.data?.message || "Failed to upload one or more images");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idxToRemove) => {
    setFormData((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, idx) => idx !== idxToRemove)
    }));
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 text-sm font-semibold text-slate-700">
      <h3 className="text-lg font-extrabold text-slate-800 border-b pb-2">Product Images</h3>

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleImage}
        className="w-full border p-2 rounded-xl block text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer font-medium"
      />

      {uploading && (
        <p className="text-xs text-purple-650 font-semibold animate-pulse">
          Uploading images to Cloudinary... Please wait.
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
        {(formData.images || []).map((imgUrl, index) => (
          <div key={index} className="relative group border rounded-xl overflow-hidden aspect-square bg-slate-50 flex items-center justify-center">
            <img
              src={imgUrl}
              alt={`preview-${index}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs leading-none shadow transition"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
