import { useState } from "react";

export default function Variants({ variants = [], setVariants }) {
  const [variant, setVariant] = useState({
    name: "",
    sku: "",
    price: "",
    stock: "",
  });

  const handleChange = (e) => {
    setVariant({ ...variant, [e.target.name]: e.target.value });
  };

  const addVariant = () => {
    if (!variant.name) return;

    setVariants([...variants, variant]);

    setVariant({
      name: "",
      sku: "",
      price: "",
      stock: "",
    });
  };

  const removeVariant = (index) => {
    const updated = variants.filter((_, i) => i !== index);
    setVariants(updated);
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow">
      <h2 className="text-lg font-semibold mb-3">Variants</h2>

      <div className="grid grid-cols-4 gap-2">
        <input
          name="name"
          placeholder="Variant Name (250ml)"
          value={variant.name}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          name="sku"
          placeholder="SKU"
          value={variant.sku}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          name="price"
          placeholder="Price"
          value={variant.price}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <input
          name="stock"
          placeholder="Stock"
          value={variant.stock}
          onChange={handleChange}
          className="border p-2 rounded"
        />
      </div>

      <button
        onClick={addVariant}
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Add Variant
      </button>

      <div className="mt-4 space-y-2">
        {variants.map((v, i) => (
          <div
            key={i}
            className="flex justify-between p-2 border rounded"
          >
            <span>
              {v.name} | ₹{v.price}
            </span>

            <button
              onClick={() => removeVariant(i)}
              className="text-red-500"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}