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
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

export default function Description({ formData, setFormData }) {
  const handleEditorChange = (val) => {
    setFormData({ ...formData, description: val });
  };

  const rawText = (formData.description || "").replace(/<[^>]*>/g, '');
  const charCount = rawText.length;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Product Description
          <span className="text-gray-400 font-normal ml-1">(optional but recommended)</span>
        </label>
        <div className="quill-editor-container bg-white rounded-lg border border-gray-300 overflow-hidden">
          <ReactQuill
            theme="snow"
            value={formData.description || ""}
            onChange={handleEditorChange}
            placeholder="Describe the product — ingredients, highlights, usage instructions, etc."
            modules={{
              toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['clean']
              ]
            }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1 text-right">{charCount} / 2000 characters</p>
      </div>

      <div className="bg-blue-50 border border-blue-100 text-blue-700 text-sm rounded-xl px-4 py-3">
        💡 A good description helps customers make informed decisions and improves SEO rankings.
        Include key ingredients, highlights, and how to use the product.
      </div>
    </div>
  );
}
