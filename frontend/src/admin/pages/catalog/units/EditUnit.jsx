import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Scale } from "lucide-react";
import { getUnitById, updateUnit } from "../../../services/unitApi";
import { useToast } from "../../../../components/Toast";

export default function EditUnit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    shortName: "",
    categoryType: "weight",
    description: "",
    isActive: true,
  });

  const [steps, setSteps] = useState([]);

  useEffect(() => {
    fetchUnit();
  }, [id]);

  const fetchUnit = async () => {
    try {
      setLoading(true);
      const res = await getUnitById(id);
      const u = res.unit || res.data;
      if (u) {
        setForm({
          name: u.name || "",
          shortName: u.shortName || "",
          categoryType: u.categoryType || "weight",
          description: u.description || "",
          isActive: u.isActive !== false,
        });
        setSteps(
          Array.isArray(u.stepOptions)
            ? u.stepOptions.map((s) => ({
                value: s.value !== undefined ? String(s.value) : "",
                unit: s.unit || u.shortName || "",
                label: s.label || `${s.value} ${s.unit || u.shortName}`.trim(),
              }))
            : []
        );
      }
    } catch (error) {
      console.error("Error loading unit:", error);
      showToast({ type: "error", message: "Failed to load unit details." });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleStepChange = (index, field, val) => {
    const updated = [...steps];
    updated[index][field] = val;
    if (field === "value" || field === "unit") {
      const numVal = updated[index].value;
      const unitVal = updated[index].unit || form.shortName || "";
      updated[index].label = `${numVal} ${unitVal}`.trim();
    }
    setSteps(updated);
  };

  const addStep = () => {
    const defaultUnit = form.shortName || (form.categoryType === "weight" ? "g" : form.categoryType === "volume" ? "ml" : "pcs");
    setSteps([...steps, { value: "", unit: defaultUnit, label: "" }]);
  };

  const removeStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast({ type: "error", message: "Unit Name is required." });
      return;
    }
    if (!form.shortName.trim()) {
      showToast({ type: "error", message: "Short Code is required." });
      return;
    }

    const processedSteps = steps
      .filter((s) => s.value && Number(s.value) > 0)
      .map((s) => ({
        value: Number(s.value),
        unit: s.unit ? s.unit.trim() : form.shortName.trim(),
        label: s.label ? s.label.trim() : `${s.value} ${s.unit || form.shortName}`.trim(),
      }));

    try {
      setSubmitting(true);
      await updateUnit(id, {
        ...form,
        stepOptions: processedSteps,
      });
      showToast({ type: "success", message: "Unit updated successfully!" });
      navigate("/admin/units");
    } catch (error) {
      console.error("Error updating unit:", error);
      showToast({
        type: "error",
        message: error.response?.data?.message || "Failed to update unit.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-slate-500 font-medium">Loading unit details...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/admin/units"
          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition text-slate-600"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Scale className="w-6 h-6 text-purple-600" />
            Edit Measurement Unit
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Modify unit specifications and default pack size steps</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-150 space-y-5">
          <h2 className="text-sm uppercase tracking-wider font-bold text-slate-400">Basic Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Unit Name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Kilogram & Gram"
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Short Code / Primary Unit *
              </label>
              <input
                type="text"
                name="shortName"
                value={form.shortName}
                onChange={handleChange}
                placeholder="e.g. kg, g, L, ml, pcs"
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none font-semibold text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Category Type *
              </label>
              <select
                name="categoryType"
                value={form.categoryType}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none font-semibold text-slate-800 bg-white"
              >
                <option value="weight">Weight (Weight-based items, e.g. Daal, Sugar, Spices)</option>
                <option value="volume">Volume (Liquid items, e.g. Milk, Oil, Juice)</option>
                <option value="count">Count (Piece items, e.g. Eggs, Fruits per piece)</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {form.isActive ? "Unit Status: Active" : "Unit Status: Inactive"}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              rows="2"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="e.g. Standard weight pack sizes for grocery pulses and spices"
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none font-semibold text-slate-800 resize-none"
            />
          </div>
        </div>

        {/* Dynamic Pack Steps */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-150 space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm uppercase tracking-wider font-bold text-slate-400">Preset Pack Size Steps</h2>
              <p className="text-xs text-slate-500 mt-0.5">These pack sizes will appear as quick-pick buttons when creating variants under linked families</p>
            </div>
            <button
              type="button"
              onClick={addStep}
              className="bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              <Plus size={14} /> Add Step Option
            </button>
          </div>

          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50">
                <div className="flex-1 w-full">
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Value</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 500 or 1"
                    value={step.value}
                    onChange={(e) => handleStepChange(idx, "value", e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>
                <div className="w-full sm:w-32">
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Unit Code</label>
                  <input
                    type="text"
                    placeholder="e.g. g or kg"
                    value={step.unit}
                    onChange={(e) => handleStepChange(idx, "unit", e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Display Label</label>
                  <input
                    type="text"
                    placeholder="e.g. 500 g"
                    value={step.label}
                    onChange={(e) => handleStepChange(idx, "label", e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>
                <div className="pt-4 sm:pt-4">
                  <button
                    type="button"
                    onClick={() => removeStep(idx)}
                    className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
                    title="Remove step"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {steps.length === 0 && (
              <div className="p-4 border border-dashed rounded-xl text-center text-slate-400 text-xs font-semibold">
                No preset steps added yet. Click "Add Step Option" above to define pack options.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            to="/admin/units"
            className="px-5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow-md transition disabled:opacity-50"
          >
            {submitting ? "Updating Unit..." : "Update Unit"}
          </button>
        </div>
      </form>
    </div>
  );
}