import { useState } from "react";
// Change this line at the top to have 3 sets of dots:
import { createAttributeGroup } from "../../../services/attributeGroupApi";
import { useNavigate } from "react-router-dom";

export default function AddAttributeGroup() {
  const [name, setName] = useState("");
  const [attributes, setAttributes] = useState([]);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createAttributeGroup({
        name,
        attributes,
      });

      navigate("/admin/catalog/attribute-groups");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Add Attribute Group</h1>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow space-y-4">

        <div>
          <label className="block mb-1">Group Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border p-2 rounded"
            placeholder="e.g. Nutrition, Storage, General"
          />
        </div>

        <div>
          <label className="block mb-1">Attributes (comma separated IDs)</label>
          <input
            value={attributes}
            onChange={(e) => setAttributes(e.target.value.split(","))}
            className="w-full border p-2 rounded"
            placeholder="attrId1, attrId2"
          />
        </div>

        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          Save Group
        </button>
      </form>
    </div>
  );
}