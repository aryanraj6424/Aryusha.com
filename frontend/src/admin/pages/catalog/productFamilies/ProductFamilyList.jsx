import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Plus, Pencil, Trash2, Search, Check, X } from "lucide-react";
import { useToast } from "../../../../components/Toast";
import ConfirmDialog from "../../../../components/Toast/ConfirmDialog";

export default function ProductFamilyList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [confirmState, setConfirmState] = useState(null);
  const [productFamilies, setProductFamilies] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [subCategoryFilter, setSubCategoryFilter] = useState("all");

  const tabs = [
    { id: "category", label: "Category" },
    { id: "subcategory", label: "Sub Category" },
    { id: "productfamily", label: "Product Family" },
    { id: "products", label: "Products" },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [familiesRes, subCatsRes, catsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/product-families`),
        axios.get(`${import.meta.env.VITE_API_URL}/sub-categories`),
        axios.get(`${import.meta.env.VITE_API_URL}/categories`)
      ]);
      setProductFamilies(familiesRes.data.productFamilies || []);
      setSubCategories(subCatsRes.data.subCategories || []);
      setCategories(catsRes.data.categories || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setConfirmState({
      message: "Are you sure you want to delete this product family?",
      type: "danger",
      onConfirm: async () => {
        setConfirmState(null);
        try {
          const token = localStorage.getItem("adminToken");
          await axios.delete(
            `${import.meta.env.VITE_API_URL}/product-families/${id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          showToast({ type: "success", message: "Product family deleted successfully." });
          fetchData();
        } catch (error) {
          console.error("Error deleting product family:", error);
          showToast({ type: "error", message: "Failed to delete product family" });
        }
      }
    });
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/product-families/approve/${id}`,
        { remarks: "Approved by Admin" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (error) {
      console.error(error);
      showToast({ type: "error", message: "Failed to approve product family" });
    }
  };

  const handleReject = async (id) => {
    const remarks = window.prompt("Enter rejection remarks:");
    if (remarks === null) return;
    try {
      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/product-families/reject/${id}`,
        { remarks: remarks || "Rejected by Admin" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (error) {
      console.error(error);
      showToast({ type: "error", message: "Failed to reject product family" });
    }
  };

  const filteredFamilies = productFamilies.filter(family => {
    const matchesSearch = family.name.toLowerCase().includes(searchTerm.toLowerCase());
    const familySubCategoryIdStr = family.subCategoryId?._id || family.subCategoryId;
    const matchesSubCategory = subCategoryFilter === "all" || familySubCategoryIdStr === subCategoryFilter;
    return matchesSearch && matchesSubCategory;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-gray-500">Loading product families...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Product Families</h1>
        <Link
          to="/admin/product-families/add"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Plus size={16} />
          Add Product Family
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 lg:mb-6 bg-white rounded-lg p-1 border border-gray-200 w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === "category") navigate("/admin/categories");
              if (tab.id === "subcategory") navigate("/admin/sub-categories");
              if (tab.id === "productfamily") navigate("/admin/product-families");
              if (tab.id === "products") navigate("/admin/products");
            }}
            className={`px-3 sm:px-6 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              tab.id === "productfamily"
                ? "bg-green-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search product families..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border rounded-lg py-2 pl-10 pr-4"
          />
        </div>
        <select
          value={subCategoryFilter}
          onChange={(e) => setSubCategoryFilter(e.target.value)}
          className="border rounded-lg py-2 px-4"
        >
          <option value="all">All Sub-Categories</option>
          {subCategories.map(sub => (
            <option key={sub._id} value={sub._id}>{sub.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Product Family</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Sub Category</th>
              <th className="p-3 text-center hidden md:table-cell">Products</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Approval</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredFamilies.map((family, index) => {
              const familySubCategoryIdStr = family.subCategoryId?._id || family.subCategoryId;
              const familyCategoryIdStr = family.categoryId?._id || family.categoryId;
              const subCategory = subCategories.find(s => s._id === familySubCategoryIdStr);
              const category = categories.find(c => c._id === familyCategoryIdStr);
              return (
                <tr key={family._id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3 font-medium">
                    {family.name}
                    {family.creatorModel === "Vendor" && (
                      <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">
                        VENDOR REQ
                      </span>
                    )}
                  </td>
                  <td className="p-3">{family.categoryId?.name || category?.name || "N/A"}</td>
                  <td className="p-3">{family.subCategoryId?.name || subCategory?.name || "N/A"}</td>
                  <td className="p-3 text-center hidden md:table-cell">{family.products?.length || 0}</td>
                  <td className="p-3">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      family.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {family.status || 'inactive'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      family.approvalStatus === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : family.approvalStatus === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {family.approvalStatus || 'PENDING'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center items-center gap-2">
                      {family.approvalStatus === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(family._id)}
                            className="p-1 hover:bg-green-100 rounded text-green-700"
                            title="Approve Family"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => handleReject(family._id)}
                            className="p-1 hover:bg-red-100 rounded text-red-700"
                            title="Reject Family"
                          >
                            <X size={18} />
                          </button>
                        </>
                      )}
                      <Link
                        to={`/admin/product-families/edit/${family._id}`}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(family._id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredFamilies.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No product families found
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
