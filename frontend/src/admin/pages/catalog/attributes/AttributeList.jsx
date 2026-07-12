import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useToast } from "../../../../components/Toast";
import ConfirmDialog from "../../../../components/Toast/ConfirmDialog";

export default function AttributeList() {
  const { showToast } = useToast();
  const [confirmState, setConfirmState] = useState(null);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAttributes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/attribute`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAttributes(res.data.attributes || []);
    } catch (error) {
      console.error("Error fetching attributes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  const deleteAttribute = async (id) => {
    setConfirmState({
      message: "Are you sure you want to delete this attribute?",
      type: "danger",
      onConfirm: async () => {
        setConfirmState(null);
        try {
          const token = localStorage.getItem("adminToken");
          await axios.delete(
            `${import.meta.env.VITE_API_URL}/admin/attribute/${id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          showToast({ type: "success", message: "Attribute deleted successfully." });
          fetchAttributes();
        } catch (error) {
          console.error("Delete error:", error);
          showToast({ type: "error", message: "Failed to delete attribute" });
        }
      }
    });
  };

  const filteredAttributes = attributes.filter(attr =>
    attr.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p className="p-6 text-gray-500">Loading attributes...</p>;

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Attribute Management</h1>
        <Link
          to="/admin/attributes/add"
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={16} />
          Add Attribute
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search attributes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border rounded-lg py-2 pl-10 pr-4"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Options</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredAttributes.map((attr) => (
              <tr key={attr._id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{attr.name}</td>
                <td className="p-3">{attr.type}</td>
                <td className="p-3 text-gray-600 truncate max-w-xs">
                  {attr.options?.join(", ") || "-"}
                </td>
                <td className="p-3 flex gap-2 justify-center">
                  <Link
                    to={`/admin/attributes/edit/${attr._id}`}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Pencil size={16} />
                    Edit
                  </Link>

                  <button
                    onClick={() => deleteAttribute(attr._id)}
                    className="text-red-600 hover:text-red-800 flex items-center gap-1"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAttributes.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No attributes found
          </div>
        )}
      </div>
      {confirmState && (
        <ConfirmDialog
          message={confirmState.message}
          type={confirmState.type || "warning"}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}