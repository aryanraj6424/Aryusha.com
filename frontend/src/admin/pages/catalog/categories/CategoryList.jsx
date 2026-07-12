import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Pencil, Eye, Trash2, Search, Package, LayoutGrid, Users, BarChart3, Layers } from "lucide-react";
import axios from "axios";
import StatCard from "../../../components/common/StatCard";
import StatusBadge from "../../../components/common/StatusBadge";
import Button from "../../../components/common/Button";
import Dropdown from "../../../components/common/Dropdown";
import Pagination from "../../../components/common/Pagination";
import { useToast } from "../../../../components/Toast";
import ConfirmDialog from "../../../../components/Toast/ConfirmDialog";

export default function CategoryList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [confirmState, setConfirmState] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { title: "Total Categories", value: "0", icon: LayoutGrid, color: "blue" },
    { title: "Active Categories", value: "0", icon: Package, color: "green" },
    { title: "Inactive Categories", value: "0", icon: Layers, color: "red" },
    { title: "Total Sub-Categories", value: "0", icon: BarChart3, color: "purple" },
    { title: "Total Product Families", value: "0", icon: Users, color: "orange" },
    { title: "Total Products", value: "0", icon: Package, color: "teal" },
  ]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const [catsRes, subCatsRes, familiesRes, productsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/categories`),
        axios.get(`${import.meta.env.VITE_API_URL}/sub-categories`),
        axios.get(`${import.meta.env.VITE_API_URL}/product-families`),
        axios.get(`${import.meta.env.VITE_API_URL}/admin/product/all`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` }
        })
      ]);

      const categoriesData = catsRes.data.categories || [];
      const subCatsData = subCatsRes.data.subCategories || [];
      const familiesData = familiesRes.data.productFamilies || [];
      const productsData = productsRes.data.products || [];

      setCategories(categoriesData);
      
      setStats([
        { title: "Total Categories", value: categoriesData.length.toString(), icon: LayoutGrid, color: "blue" },
        { title: "Active Categories", value: categoriesData.filter(c => c.status === 'active').length.toString(), icon: Package, color: "green" },
        { title: "Inactive Categories", value: categoriesData.filter(c => c.status !== 'active').length.toString(), icon: Layers, color: "red" },
        { title: "Total Sub-Categories", value: subCatsData.length.toString(), icon: BarChart3, color: "purple" },
        { title: "Total Product Families", value: familiesData.length.toString(), icon: Users, color: "orange" },
        { title: "Total Products", value: productsData.length.toString(), icon: Package, color: "teal" },
      ]);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId) => {
    setConfirmState({
      message: "Are you sure you want to delete this category?",
      type: "danger",
      onConfirm: async () => {
        setConfirmState(null);
        try {
          const token = localStorage.getItem("adminToken");
          await axios.delete(
            `${import.meta.env.VITE_API_URL}/categories/${categoryId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          showToast({ type: "success", message: "Category deleted successfully." });
          fetchCategories();
        } catch (error) {
          console.error("Error deleting category:", error);
          showToast({ type: "error", message: error.response?.data?.message || "Failed to delete category. Please try again." });
        }
      }
    });
  };

  const tabs = [
    { id: "category", label: "Category" },
    { id: "subcategory", label: "Sub Category" },
    { id: "productfamily", label: "Product Family" },
    { id: "products", label: "Products" },
  ];

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const sortOptions = [
    { value: "newest", label: "Sort By: Newest" },
    { value: "oldest", label: "Sort By: Oldest" },
    { value: "name", label: "Sort By: Name" },
  ];

  const filteredCategories = categories.filter((category) => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || category.status?.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-4 lg:p-6 text-center text-gray-500">
        Loading categories dashboard...
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      {confirmState && (
        <ConfirmDialog
          message={confirmState.message}
          type={confirmState.type || "warning"}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-4 lg:mb-6">
        <span className="hover:text-green-600 cursor-pointer" onClick={() => navigate("/admin/dashboard")}>Home</span>
        <span>/</span>
        <span className="hover:text-green-600 cursor-pointer" onClick={() => navigate("/admin/categories")}>Catalog</span>
        <span>/</span>
        <span className="text-gray-900 font-medium">Category Management</span>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4 mb-4 lg:mb-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
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
              tab.id === "category"
                ? "bg-green-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>



      {/* Table Controls */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 lg:p-4 mb-4">

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-4">

          {/* Search */}

          <div className="relative flex-1 max-w-md">

            <Search size={16} lg:size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

            <input

              type="text"

              placeholder="Search categories..."

              value={searchTerm}

              onChange={(e) => setSearchTerm(e.target.value)}

              className="w-full border border-gray-300 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"

            />

          </div>



          {/* Filters and Actions */}

          <div className="flex items-center gap-2 lg:gap-3 flex-wrap">

            <Dropdown

              label="All Status"

              options={statusOptions}

              value={statusFilter === "all" ? "All Status" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}

              onChange={setStatusFilter}

            />

            <Dropdown

              label="Sort By: Newest"

              options={sortOptions}

              value={sortBy === "newest" ? "Sort By: Newest" : sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}

              onChange={setSortBy}

            />

            <Link to="/admin/categories/add">

              <Button icon={Plus} className="text-sm">

                <span className="hidden sm:inline">Add New Category</span>

                <span className="sm:hidden">Add</span>

              </Button>

            </Link>

          </div>

        </div>

      </div>



      {/* Table */}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">

        <table className="w-full min-w-[600px]">

          <thead className="bg-gray-50 border-b border-gray-200">

            <tr>

              <th className="text-left p-2 lg:p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Category Name</th>

              <th className="text-left p-2 lg:p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Description</th>

              <th className="text-left p-2 lg:p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Status</th>

              <th className="text-center p-2 lg:p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">Sub-Categories</th>

              <th className="text-center p-2 lg:p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider hidden xl:table-cell">Product Families</th>

              <th className="text-center p-2 lg:p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider hidden xl:table-cell">Products</th>

              <th className="text-center p-2 lg:p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider hidden xl:table-cell">Sort Order</th>

              <th className="text-center p-2 lg:p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>

            </tr>

          </thead>

          <tbody>

            {filteredCategories.map((category) => (

              <tr key={category._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">

                <td className="p-2 lg:p-4">

                  <span className="font-medium text-gray-900 text-sm lg:text-base">{category.name}</span>

                </td>

                <td className="p-2 lg:p-4 hidden sm:table-cell">

                  <span className="text-sm text-gray-600 truncate max-w-xs block">{category.description || "No description"}</span>

                </td>

                <td className="p-2 lg:p-4 hidden md:table-cell">

                  <StatusBadge status={category.status || "active"} />

                </td>

                <td className="p-2 lg:p-4 text-center hidden lg:table-cell">

                  <span className="text-sm text-gray-700">{category.subCategories?.length || 0}</span>

                </td>

                <td className="p-2 lg:p-4 text-center hidden xl:table-cell">

                  <span className="text-sm text-gray-700">{category.productFamilies?.length || 0}</span>

                </td>

                <td className="p-2 lg:p-4 text-center hidden xl:table-cell">

                  <span className="text-sm text-gray-700">{category.products?.length || 0}</span>

                </td>

                <td className="p-2 lg:p-4 text-center hidden xl:table-cell">

                  <span className="text-sm text-gray-700">{category.sortOrder || 0}</span>

                </td>

                <td className="p-2 lg:p-4">

                  <div className="flex items-center justify-center gap-1 lg:gap-2">

                    <Link to={`/admin/categories/edit/${category._id}`} className="p-1.5 lg:p-2 hover:bg-gray-100 rounded-lg transition-colors">

                      <Pencil size={14} lg:size={16} className="text-blue-600" />

                    </Link>

                    <button className="p-1.5 lg:p-2 hover:bg-gray-100 rounded-lg transition-colors">

                      <Eye size={14} lg:size={16} className="text-gray-600" />

                    </button>

                    <button 

                      onClick={() => handleDelete(category._id)}

                      className="p-1.5 lg:p-2 hover:bg-gray-100 rounded-lg transition-colors"

                    >

                      <Trash2 size={14} lg:size={16} className="text-red-600" />

                    </button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>



        {/* Pagination */}

        <div className="p-3 lg:p-4 border-t border-gray-200">

          <Pagination

            currentPage={currentPage}

            totalPages={37}

            onPageChange={setCurrentPage}

          />

        </div>

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
