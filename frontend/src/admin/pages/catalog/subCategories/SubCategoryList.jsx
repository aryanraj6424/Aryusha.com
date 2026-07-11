import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Plus, Pencil, Trash2, Search, Filter } from "lucide-react";

export default function SubCategoryList() {
  const navigate = useNavigate();
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

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
      const [subCatsRes, catsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/sub-categories`),
        axios.get(`${import.meta.env.VITE_API_URL}/categories`)
      ]);
      setSubCategories(subCatsRes.data.subCategories || []);
      setCategories(catsRes.data.categories || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this sub-category?")) {
      try {
        const token = localStorage.getItem("adminToken");
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/sub-categories/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchData();
      } catch (error) {
        console.error("Error deleting sub-category:", error);
        alert("Failed to delete sub-category");
      }
    }
  };

  const filteredSubCategories = subCategories.filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase());
    const subCategoryIdStr = sub.categoryId?._id || sub.categoryId;
    const matchesCategory = categoryFilter === "all" || subCategoryIdStr === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-gray-500">Loading sub-categories...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Sub Categories</h1>
        <Link
          to="/admin/sub-categories/add"
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={16} />
          Add Sub Category
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
              tab.id === "subcategory"
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
            placeholder="Search sub-categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border rounded-lg py-2 pl-10 pr-4"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border rounded-lg py-2 px-4"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Category</th>
              <th className="text-left p-4">Description</th>
              <th className="text-center p-4 hidden md:table-cell">Product Families</th>
              <th className="text-center p-4 hidden md:table-cell">Products</th>
              <th className="text-left p-4">Status</th>
              <th className="text-center p-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredSubCategories.map((item) => {
              const itemCategoryIdStr = item.categoryId?._id || item.categoryId;
              const category = categories.find(c => c._id === itemCategoryIdStr);
              return (
                <tr key={item._id} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-medium">{item.name}</td>
                  <td className="p-4">{item.categoryId?.name || category?.name || "N/A"}</td>
                  <td className="p-4 text-gray-600 truncate max-w-xs">{item.description || "-"}</td>
                  <td className="p-4 text-center hidden md:table-cell">{item.productFamilies?.length || 0}</td>
                  <td className="p-4 text-center hidden md:table-cell">{item.products?.length || 0}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      item.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {item.status || 'inactive'}
                    </span>
                  </td>
                  <td className="p-4 flex justify-center gap-3">
                    <Link
                      to={`/admin/sub-categories/edit/${item._id}`}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Pencil size={16} />
                      Edit
                    </Link>
                    <button 
                      onClick={() => handleDelete(item._id)}
                      className="text-red-600 hover:text-red-800 flex items-center gap-1"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredSubCategories.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No sub-categories found
          </div>
        )}
      </div>
    </div>
  );
}
