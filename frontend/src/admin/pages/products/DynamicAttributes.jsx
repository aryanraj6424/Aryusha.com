import { useState, useEffect } from "react";
import { getAttributes } from "../../services/attributeApi";

export default function DynamicAttributes({ formData, setFormData }) {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        setLoading(true);
        const response = await getAttributes();

        // Normalize response - backend returns { success: true, data: [...], attributes: [...] }
        let attributesList = [];
        if (Array.isArray(response)) {
          attributesList = response;
        } else if (response?.data && Array.isArray(response.data)) {
          attributesList = response.data;
        } else if (response?.attributes && Array.isArray(response.attributes)) {
          attributesList = response.attributes;
        }

        // If no attributes exist in formData, initialize with fetched attributes
        if (
          formData.attributes &&
          formData.attributes.length === 0 &&
          attributesList.length > 0
        ) {
          const initialAttributes = attributesList.map((attr) => ({
            id: attr._id || attr.id,
            name: attr.name,
            value: "",
          }));
          setFormData({ ...formData, attributes: initialAttributes });
        }

        setAttributes(attributesList);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch attributes:", err.message);
        setError(
          "Unable to load attributes. Make sure the backend is running.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAttributes();
  }, []);

  const currentAttributes = formData.attributes || [];

  const handleChange = (id, value) => {
    const updated = currentAttributes.map((attr) =>
      attr.id === id ? { ...attr, value } : attr,
    );

    setFormData({ ...formData, attributes: updated });
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-2">Attributes</h2>
      <p className="text-gray-600 mb-6">
        Add product attributes and specifications
      </p>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading attributes...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {!loading && !error && currentAttributes.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-lg">
          <p className="font-medium">No attributes available</p>
          <p className="text-sm mt-1">
            Create attributes in the Attribute Management section first.
          </p>
        </div>
      )}

      {!loading && !error && currentAttributes.length > 0 && (
        <div className="space-y-4">
          {currentAttributes.map((attr) => (
            <div key={attr.id} className="border-b pb-4 last:border-b-0">
              <label className="block font-semibold text-slate-700 mb-2">
                {attr.name}
              </label>

              <input
                type="text"
                value={attr.value || ""}
                onChange={(e) => handleChange(attr.id, e.target.value)}
                placeholder={`Enter ${attr.name}`}
                className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
