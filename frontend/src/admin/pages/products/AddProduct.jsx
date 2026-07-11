import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProduct } from "../../services/productApi";
import BasicInformation from "./BasicInformation";
import Description from "./Description";
import Images from "./Images";

/**
 * AddProduct — 3-step wizard
 *
 * Step 1: Basic Information  (category cascade, name, brand, unit, status)
 * Step 2: Description        (long description text)
 * Step 3: Images             (Cloudinary-backed multi-image upload)
 *
 * On save: product is created; admin is redirected to
 * /admin/products/:id/variants to add pack-size variants.
 */

const STEPS = ["Basic Information", "Description", "Images"];

const INITIAL_FORM = {
  // Catalog hierarchy
  categoryId: "",
  subCategoryId: "",
  familyId: "",
  // Product details
  name: "",
  brand: "",
  unitType: "",
  status: "draft",
  isReturnable: false,
  // Description
  description: "",
  // Images (array of URL strings)
  images: [],
};

export default function AddProduct() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Validation per step ─────────────────────────────────────────────────
  const validateStep = () => {
    if (step === 1) {
      if (!form.categoryId) return "Please select a Category.";
      if (!form.subCategoryId) return "Please select a Sub Category.";
      if (!form.familyId) return "Please select a Product Family.";
      if (!form.name.trim()) return "Product name is required.";
      if (!form.unitType) return "Please select a Unit Type.";
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(null);
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => s - 1);
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        categoryId:    form.categoryId,
        subCategoryId: form.subCategoryId,
        familyId:      form.familyId,
        name:          form.name.trim(),
        brand:         form.brand.trim(),
        unitType:      form.unitType,
        status:        form.status,
        isReturnable:  form.isReturnable,
        description:   form.description.trim(),
        images:        form.images,
      };

      const res = await createProduct(payload);
      // Navigate to the variants management page for this new product
      navigate(`/admin/products/${res.product._id}/variants`);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create product. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Progress bar ─────────────────────────────────────────────────────────
  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow border border-gray-100 p-8">

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
            <p className="text-gray-500 text-sm mt-1">
              Fill in the product details. You can add pack-size variants after saving.
            </p>
          </div>
          <span className="bg-indigo-50 text-indigo-700 text-sm font-semibold px-4 py-1.5 rounded-full">
            Step {step} of {STEPS.length}
          </span>
        </div>

        {/* Step tabs */}
        <div className={`grid gap-3 mb-6`} style={{ gridTemplateColumns: `repeat(${STEPS.length}, 1fr)` }}>
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium text-center ${
                i + 1 === step
                  ? "border-indigo-600 bg-indigo-50 text-indigo-800"
                  : i + 1 < step
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 text-gray-400"
              }`}
            >
              {i + 1 < step ? "✓ " : `${i + 1}. `}{label}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-8">
          <div
            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step content */}
        <div className="min-h-48">
          {step === 1 && (
            <BasicInformation formData={form} setFormData={setForm} />
          )}
          {step === 2 && (
            <Description formData={form} setFormData={setForm} />
          )}
          {step === 3 && (
            <Images formData={form} setFormData={setForm} />
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ← Back
          </button>

          {step < STEPS.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-8 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Saving…" : "Save & Add Variants →"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}