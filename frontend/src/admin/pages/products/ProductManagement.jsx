import { useNavigate } from "react-router-dom";

export default function ProductManagement() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold">Product Management</h1>
          <p className="text-gray-500 mt-2 max-w-2xl">
            Premium product control for category, inventory and vendor-aligned
            product listings.
          </p>
        </div>

        <button
          onClick={() => navigate("/admin/products/add")}
          className="inline-flex items-center justify-center rounded-2xl bg-linear-to-r from-purple-600 to-indigo-600 px-6 py-3 text-white font-semibold shadow-lg shadow-purple-200/20 hover:opacity-95"
        >
          + Add New Product
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <button
          onClick={() => navigate("/admin/products")}
          className="group rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <p className="text-sm uppercase tracking-[0.2em] text-gray-400">
            Manage
          </p>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">Products</h2>
          <p className="mt-3 text-sm text-gray-500">
            Review, update and publish catalog products.
          </p>
        </button>

        <button
          onClick={() => navigate("/admin/categories")}
          className="group rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <p className="text-sm uppercase tracking-[0.2em] text-gray-400">
            Manage
          </p>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">Categories</h2>
          <p className="mt-3 text-sm text-gray-500">
            Organize products with category and subcategory structure.
          </p>
        </button>

        <button
          onClick={() => navigate("/admin/product-families")}
          className="group rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <p className="text-sm uppercase tracking-[0.2em] text-gray-400">
            Manage
          </p>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">
            Product Families
          </h2>
          <p className="mt-3 text-sm text-gray-500">
            Publish product families and map attribute groups faster.
          </p>
        </button>

        <button
          onClick={() => navigate("/admin/brands")}
          className="group rounded-3xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <p className="text-sm uppercase tracking-[0.2em] text-gray-400">
            Manage
          </p>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">Brands</h2>
          <p className="mt-3 text-sm text-gray-500">
            Control brand catalog and brand-specific product assignments.
          </p>
        </button>
      </div>

      <div className="mt-10 rounded-3xl bg-slate-950 p-8 text-white shadow-2xl shadow-slate-900/20">
        <h2 className="text-2xl font-semibold">Premium admin control</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          Use this section to keep product workflows aligned with vendor
          approvals and category hierarchies. Everything is built to support an
          admin-first, production-level management experience.
        </p>
      </div>
    </div>
  );
}
