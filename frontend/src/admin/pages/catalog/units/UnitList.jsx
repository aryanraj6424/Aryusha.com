import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

export default function UnitList() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/units`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnits(response.data.units || []);
    } catch (error) {
      console.error("Error fetching units:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this unit?")) {
      try {
        const token = localStorage.getItem("adminToken");
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/admin/units/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchUnits();
      } catch (error) {
        console.error("Error deleting unit:", error);
        alert("Failed to delete unit");
      }
    }
  };

  const filteredUnits = units.filter(unit =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.shortName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-gray-500">Loading units...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Units</h1>
        <Link
          to="/admin/units/add"
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={16} />
          Add Unit
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search units..."
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
              <th className="p-3 text-left">Short Name</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredUnits.map((unit) => (
              <tr key={unit._id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{unit.name}</td>
                <td className="p-3">{unit.shortName}</td>
                <td className="p-3">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    unit.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {unit.status || 'inactive'}
                  </span>
                </td>
                <td className="p-3 text-center flex justify-center gap-2">
                  <Link
                    to={`/admin/units/edit/${unit._id}`}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Pencil size={16} />
                    Edit
                  </Link>
                  <button 
                    onClick={() => handleDelete(unit._id)}
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

        {filteredUnits.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No units found
          </div>
        )}
      </div>
    </div>
  );
}