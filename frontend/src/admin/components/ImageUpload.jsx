import { useRef } from "react";
import { ImagePlus, Trash2 } from "lucide-react";

export default function ImageUpload({
  images = [],
  setImages,
  multiple = true,
  maxFiles = 10,
}) {
  const inputRef = useRef(null);

  const handleSelect = (e) => {
    const files = Array.from(e.target.files);

    if (!files.length) return;

    let selected = multiple ? files : [files[0]];

    selected = selected.slice(0, maxFiles);

    const newImages = selected.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    if (multiple) {
      setImages((prev) => [...prev, ...newImages]);
    } else {
      setImages(newImages);
    }

    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-5">

      {/* Upload Box */}

      <div
        onClick={() => inputRef.current.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-10 transition hover:border-green-500 hover:bg-green-50"
      >
        <ImagePlus
          size={45}
          className="text-green-600"
        />

        <h3 className="mt-4 text-lg font-semibold text-gray-700">
          Upload Images
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          Click here to choose image
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          hidden
          onChange={handleSelect}
        />
      </div>

      {/* Preview */}

      {images.length > 0 && (

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">

          {images.map((image, index) => (

            <div
              key={index}
              className="relative overflow-hidden rounded-xl border bg-white shadow-sm"
            >
              <img
                src={image.preview}
                alt="preview"
                className="h-40 w-full object-cover"
              />

              <button
                onClick={() => removeImage(index)}
                className="absolute right-2 top-2 rounded-full bg-red-600 p-2 text-white hover:bg-red-700"
              >
                <Trash2 size={16} />
              </button>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}