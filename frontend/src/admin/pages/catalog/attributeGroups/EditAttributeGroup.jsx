import { useEffect, useState } from "react";
import { getAttributeGroupById, updateAttributeGroup } from "../../../services/attributeGroupApi";

import { useNavigate, useParams } from "react-router-dom";

export default function EditAttributeGroup() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [attributes, setAttributes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getAttributeGroupById(id);
        setName(res.data.name);
        setAttributes(res.data.attributes || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateAttributeGroup(id, {
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
      <h1 className="text-xl font-bold mb-4">Edit Attribute Group</h1>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow space-y-4">

        <div>
          <label className="block mb-1">Group Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Attributes</label>
          <input
            value={attributes.join(",")}
            onChange={(e) => setAttributes(e.target.value.split(","))}
            className="w-full border p-2 rounded"
          />
        </div>

        <button className="bg-green-600 text-white px-4 py-2 rounded">
          Update Group
        </button>
      </form>
    </div>
  );
}