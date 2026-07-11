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
    <div className="bg-white p-5 rounded-xl shadow space-y-4">
      <h2 className="text-lg font-semibold">Images</h2>

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleImage}
        className="w-full border p-2 rounded block text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
      />

      {uploading && (
        <p className="text-xs text-green-600 font-semibold animate-pulse">
          Uploading images to Cloudinary... Please wait.
        </p>
      )}

      <div className="flex gap-3 flex-wrap mt-4">
        {(formData.images || []).map((imgUrl, index) => (
          <div key={index} className="relative group w-20 h-20">
            <img
              src={imgUrl}
              alt={`preview-${index}`}
              className="w-full h-full object-cover rounded border"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-650 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] leading-none"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}