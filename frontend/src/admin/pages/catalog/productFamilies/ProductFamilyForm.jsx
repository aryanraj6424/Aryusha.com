import { useMemo, useState } from "react";
import { categories, subCategories } from "../../../data/adminSeedData";

export default function ProductFamilyForm({
  mode = "add",
  initialData = {},
  onSubmit,
}) {
  const [formData, setFormData] = useState({
    category: initialData.category || "",
    subCategory: initialData.subCategory || "",
    familyName: initialData.familyName || "",
    description: initialData.description || "",
    status: initialData.status || "Active",
  });

  const subCategoryMap = useMemo(() => {
    return categories.reduce((map, category) => {
      map[category.name] = subCategories
        .filter((sub) => sub.category === category.name)
        .map((sub) => sub.name);
      return map;
    }, {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "category") {
      setFormData({
        ...formData,
        category: value,
        subCategory: "",
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (onSubmit) {
      onSubmit(formData);
    } else {
      console.log(formData);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow p-6 space-y-5"
    >
      {/* Category */}

      <div>
        <label className="block mb-2 font-medium">Category</label>

        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full border rounded-lg p-3"
          required
        >
          <option value="">Select Category</option>

          {categories.map((item) => (
            <option key={item.id} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sub Category */}

      <div>
        <label className="block mb-2 font-medium">Sub Category</label>

        <select
          name="subCategory"
          value={formData.subCategory}
          onChange={handleChange}
          className="w-full border rounded-lg p-3"
          required
        >
          <option value="">Select Sub Category</option>

          {formData.category &&
            subCategoryMap[formData.category]?.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
        </select>
      </div>

      {/* Product Family */}

      <div>
        <label className="block mb-2 font-medium">Product Family</label>

        <input
          type="text"
          name="familyName"
          value={formData.familyName}
          onChange={handleChange}
          placeholder="Enter Product Family"
          className="w-full border rounded-lg p-3"
          required
        />
      </div>

      {/* Description */}

      <div>
        <label className="block mb-2 font-medium">Description</label>

        <textarea
          rows="4"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Write description..."
          className="w-full border rounded-lg p-3"
        />
      </div>

      {/* Status */}

      <div>
        <label className="block mb-2 font-medium">Status</label>

        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="w-full border rounded-lg p-3"
        >
          <option value="Active">Active</option>

          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Submit */}

      <div className="pt-4">
        <button
          type="submit"
          className={`px-6 py-3 rounded-lg text-white font-medium ${
            mode === "add"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {mode === "add" ? "Save Product Family" : "Update Product Family"}
        </button>
      </div>
    </form>
  );
}
