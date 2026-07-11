import { useEffect, useState } from "react";
// Fixed the relative import path below from "../../" to "../../../"
// Ensure it matches:
import { getAttributeGroups, deleteAttributeGroup } from "../../../services/attributeGroupApi";
//  CORRECT

import { useNavigate } from "react-router-dom";

export default function AttributeGroupList() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await getAttributeGroups();
      setGroups(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this group?")) return;
    await deleteAttributeGroup(id);
    fetchGroups();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-bold">Attribute Groups</h1>

        <button
          onClick={() => navigate("/admin/catalog/attribute-groups/add")}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Add Group
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="bg-white shadow rounded">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Attributes</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>

            <tbody>
              {groups.map((g) => (
                <tr key={g._id} className="border-t">
                  <td className="p-2">{g.name}</td>

                  <td className="p-2">
                    {g.attributes?.map((a) => a.name).join(", ")}
                  </td>

                  <td className="p-2 flex gap-2 justify-center">
                    <button
                      onClick={() =>
                        navigate(`/admin/catalog/attribute-groups/edit/${g._id}`)
                      }
                      className="px-3 py-1 bg-yellow-500 text-white rounded"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(g._id)}
                      className="px-3 py-1 bg-red-500 text-white rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}