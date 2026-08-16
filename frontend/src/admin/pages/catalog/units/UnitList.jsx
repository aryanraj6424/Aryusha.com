import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Search, Scale } from "lucide-react";
import { getUnits, deleteUnit } from "../../../services/unitApi";
import { useToast } from "../../../../components/Toast";
import ConfirmDialog from "../../../../components/Toast/ConfirmDialog";

export default function UnitList() {
  const { showToast } = useToast();
  const [confirmState, setConfirmState] = useState(null);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const res = await getUnits();
      setUnits(res.units || res.data || []);
    } catch (error) {
      console.error("Error fetching units:", error);
      showToast({ type: "error", message: "Failed to load units." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setConfirmState({
      message: "Are you sure you want to delete this unit?",
      type: "danger",
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await deleteUnit(id);
          showToast({ type: "success", message: "Unit deleted successfully." });
          fetchUnits();
        } catch (error) {
          console.error("Error deleting unit:", error);
          showToast({ type: "error", message: "Failed to delete unit" });
        }
      }
    });
  };

  const filteredUnits = units.filter(unit =>
    (unit.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (unit.shortName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (unit.categoryType || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-slate-500 font-medium">Loading units...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Scale className="w-6 h-6 text-purple-600" />
            Unit Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">Configure pack size step options for weight, volume, and count items</p>
        </div>
        <Link
          to="/admin/units/add"
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition shadow-sm"
        >
          <Plus size={16} />
          Add Unit
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-150">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search units by name, short code, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-purple-500 outline-none font-medium text-slate-700"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-150 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold border-b border-slate-150">
              <tr>
                <th className="p-4">Unit Name</th>
                <th className="p-4">Short Code</th>
                <th className="p-4">Category Type</th>
                <th className="p-4">Preset Pack Steps</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredUnits.map((unit) => (
                <tr key={unit._id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-bold text-slate-800">{unit.name}</td>
                  <td className="p-4 font-semibold text-slate-600">
                    <span className="px-2.5 py-1 bg-slate-100 rounded-md text-xs font-mono">{unit.shortName}</span>
                  </td>
                  <td className="p-4 uppercase text-xs font-bold text-slate-500">
                    {unit.categoryType}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1.5 max-w-md">
                      {unit.stepOptions && unit.stepOptions.length > 0 ? (
                        unit.stepOptions.map((opt, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 text-xs rounded-md font-semibold">
                            {opt.label || `${opt.value} ${opt.unit || unit.shortName}`}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs italic">No preset steps</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      unit.isActive !== false 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-rose-100 text-rose-700'
                    }`}>
                      {unit.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-3 font-semibold">
                      <Link
                        to={`/admin/units/edit/${unit._id}`}
                        className="text-purple-600 hover:text-purple-800 flex items-center gap-1 text-xs"
                      >
                        <Pencil size={15} />
                        Edit
                      </Link>
                      <button 
                        onClick={() => handleDelete(unit._id)}
                        className="text-rose-600 hover:text-rose-800 flex items-center gap-1 text-xs"
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUnits.length === 0 && (
          <div className="p-12 text-center text-slate-400 font-medium text-sm">
            No units found. Click "Add Unit" to create a new measurement unit.
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