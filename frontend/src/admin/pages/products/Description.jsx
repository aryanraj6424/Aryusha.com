/**
 * Description — Step 2 of AddProduct wizard
 *
 * Single description textarea that maps to the `description` field on Product.
 * Clean, no extra complexity needed here since Product has a single description.
 *
 * Props
 *   formData    – shared form state object
 *   setFormData – setter
 */
export default function Description({ formData, setFormData }) {
  const handleChange = (e) => {
    setFormData({ ...formData, description: e.target.value });
  };

  const charCount = (formData.description || "").length;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Product Description
          <span className="text-gray-400 font-normal ml-1">(optional but recommended)</span>
        </label>
        <textarea
          name="description"
          value={formData.description || ""}
          onChange={handleChange}
          rows={8}
          maxLength={2000}
          placeholder="Describe the product — ingredients, highlights, usage instructions, etc."
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{charCount} / 2000 characters</p>
      </div>

      <div className="bg-blue-50 border border-blue-100 text-blue-700 text-sm rounded-xl px-4 py-3">
        💡 A good description helps customers make informed decisions and improves SEO rankings.
        Include key ingredients, highlights, and how to use the product.
      </div>
    </div>
  );
}
