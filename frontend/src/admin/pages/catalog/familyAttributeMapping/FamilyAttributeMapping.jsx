import React, { useEffect, useState } from "react";
import axios from "axios";
import { useToast } from "../../../../components/Toast";

export default function FamilyAttributeMapping() {
  const { showToast } = useToast();
  const [families, setFamilies] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [selectedFamily, setSelectedFamily] = useState("");
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch Families
  const fetchFamilies = async () => {
    try {
      const res = await axios.get("/api/admin/product-families");
      setFamilies(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // Fetch Attributes
  const fetchAttributes = async () => {
    try {
      const res = await axios.get("/api/admin/attributes");
      setAttributes(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchFamilies();
    fetchAttributes();
  }, []);

  // Toggle attribute selection
  const handleAttributeToggle = (attrId) => {
    if (selectedAttributes.includes(attrId)) {
      setSelectedAttributes(selectedAttributes.filter((id) => id !== attrId));
    } else {
      setSelectedAttributes([...selectedAttributes, attrId]);
    }
  };

  // Save Mapping
  const handleSave = async () => {
    if (!selectedFamily) {
      showToast({ type: "warning", message: "Select a Product Family" });
      return;
    }

    setLoading(true);

    try {
      await axios.post("/api/admin/family-attribute-mapping", {
        familyId: selectedFamily,
        attributes: selectedAttributes,
      });

      showToast({ type: "success", message: "Mapping Saved Successfully" });
    } catch (err) {
      console.log(err);
      showToast({ type: "error", message: "Error saving mapping" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Family Attribute Mapping
      </h1>

      {/* Select Product Family */}
      <div className="mb-4">
        <label className="block mb-2 font-medium">
          Select Product Family
        </label>

        <select
          className="w-full border p-2 rounded"
          value={selectedFamily}
          onChange={(e) => setSelectedFamily(e.target.value)}
        >
          <option value="">-- Select Family --</option>
          {families.map((fam) => (
            <option key={fam._id} value={fam._id}>
              {fam.name}
            </option>
          ))}
        </select>
      </div>

      {/* Attributes List */}
      <div className="mb-6">
        <label className="block mb-2 font-medium">
          Select Attributes
        </label>

        <div className="grid grid-cols-2 gap-3">
          {attributes.map((attr) => (
            <label
              key={attr._id}
              className="flex items-center gap-2 border p-2 rounded"
            >
              <input
                type="checkbox"
                checked={selectedAttributes.includes(attr._id)}
                onChange={() => handleAttributeToggle(attr._id)}
              />
              {attr.name}
            </label>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Saving..." : "Save Mapping"}
      </button>
    </div>
  );
}