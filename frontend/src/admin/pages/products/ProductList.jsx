import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Upload, Plus, Eye, Pencil, Trash2, Check, X, EyeOff, RefreshCw } from "lucide-react";
import axios from "axios";
import Button from "../../components/common/Button";
import Dropdown from "../../components/common/Dropdown";
import StatusBadge from "../../components/common/StatusBadge";

export default function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [productFamilies, setProductFamilies] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState([]);
  
  // Search & filters state
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subCategoryFilter, setSubCategoryFilter] = useState("all");
  const [familyFilter, setFamilyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const tabs = [
    { id: "category", label: "Category" },
    { id: "subcategory", label: "Sub Category" },
    { id: "productfamily", label: "Product Family" },
    { id: "products", label: "Products" },
  ];

  const fetchFilters = async () => {
    try {
      const [catsRes, subCatsRes, familiesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/categories`),
        axios.get(`${import.meta.env.VITE_API_URL}/sub-categories`),
        axios.get(`${import.meta.env.VITE_API_URL}/product-families`)
      ]);
      setCategories(catsRes.data.categories || []);
      setSubCategories(subCatsRes.data.subCategories || []);
      setProductFamilies(familiesRes.data.productFamilies || []);
    } catch (error) {
      console.error("Error fetching filters:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      
      // Build query string
      let params = new URLSearchParams();
      if (search) params.append("search", search);
      if (categoryFilter !== "all") params.append("categoryId", categoryFilter);
      if (subCategoryFilter !== "all") params.append("subCategoryId", subCategoryFilter);
      if (familyFilter !== "all") params.append("familyId", familyFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (stockFilter !== "all") params.append("stockStatus", stockFilter);
      if (dateRange.start) params.append("startDate", dateRange.start);
      if (dateRange.end) params.append("endDate", dateRange.end);

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/product/all?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProducts(res.data.products || []);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, subCategoryFilter, familyFilter, statusFilter, stockFilter, dateRange]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(products.map((p) => p._id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleDelete = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const token = localStorage.getItem("adminToken");
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/admin/product/delete/${productId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        fetchProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const handleApprove = async (productId) => {
    try {
      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/product/approve/${productId}`,
        { remarks: "Approved by Admin" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchProducts();
    } catch (error) {
      console.error(error);
      alert("Failed to approve product");
    }
  };

  const handleReject = async (productId) => {
    const remarks = window.prompt("Enter rejection remarks:");
    if (remarks === null) return;
    try {
      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/product/reject/${productId}`,
        { remarks: remarks || "Rejected by Admin" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchProducts();
    } catch (error) {
      console.error(error);
      alert("Failed to reject product");
    }
  };

  const handleHideToggle = async (productId, currentStatus) => {
    try {
      const token = localStorage.getItem("adminToken");
      const url = currentStatus === "hidden" ? "restore" : "hide";
      await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/product/${url}/${productId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchProducts();
    } catch (error) {
      console.error(error);
    }
  };

  // Bulk Operations
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
      try {
        const token = localStorage.getItem("adminToken");
        await axios.post(
          `${import.meta.env.VITE_API_URL}/admin/product/bulk-delete`,
          { productIds: selectedProducts },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSelectedProducts([]);
        fetchProducts();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleBulkStatusChange = async (status) => {
    if (selectedProducts.length === 0) return;
    try {
      const token = localStorage.getItem("adminToken");
      await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/product/bulk-update`,
        { productIds: selectedProducts, updateData: { status } },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      console.error(error);
    }
  };

  // Import / Export JSON
  const handleExport = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/product/export`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data.products, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `catalog_export_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (error) {
      console.error(error);
      alert("Export failed");
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const productsArray = JSON.parse(event.target.result);
          const token = localStorage.getItem("adminToken");
          const res = await axios.post(
            `${import.meta.env.VITE_API_URL}/admin/product/import`,
            { products: productsArray },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          alert(res.data.message || "Import completed!");
          fetchProducts();
        } catch (err) {
          alert("Import failed. Make sure the JSON follows the catalog import format.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleView = (product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  return (
    <div className="bg-gray-900 min-h-screen p-4 lg:p-6 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products List</h1>
          <p className="text-gray-400 mt-1">Manage categories, sub-categories, and master products.</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" icon={Download} onClick={handleExport}>
            Export JSON
          </Button>
          <Button variant="secondary" icon={Upload} onClick={handleImport}>
            Import JSON
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => navigate("/admin/products/add")}>
            Create Master Product
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1 border border-gray-700 w-fit overflow-x-auto">
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
              tab.id === "products"
                ? "bg-green-600 text-white"
                : "text-gray-400 hover:bg-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-6">
        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">SEARCH PRODUCTS</label>
          <input
            type="text"
            placeholder="Search by name, SKU, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">CATEGORY</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">SUB-CATEGORY</label>
          <select
            value={subCategoryFilter}
            onChange={(e) => setSubCategoryFilter(e.target.value)}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Sub-Categories</option>
            {subCategories.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">PRODUCT FAMILY</label>
          <select
            value={familyFilter}
            onChange={(e) => setFamilyFilter(e.target.value)}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Families</option>
            {productFamilies.map((f) => (
              <option key={f._id} value={f._id}>{f.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">STATUS</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending Approval</option>
            <option value="rejected">Rejected</option>
            <option value="hidden">Hidden</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1">STOCK LEVEL</label>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Bulk Operations Toolbar */}
      {selectedProducts.length > 0 && (
        <div className="bg-purple-950 border border-purple-800 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm font-semibold">{selectedProducts.length} items selected</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkStatusChange("active")}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
            >
              Mark Active
            </button>
            <button
              onClick={() => handleBulkStatusChange("inactive")}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
            >
              Mark Inactive
            </button>
            <button
              onClick={handleBulkDelete}
              className="bg-red-650 hover:bg-red-750 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      {loading ? (
        <div className="bg-gray-800 rounded-xl p-10 text-center text-gray-400 border border-gray-700">
          Loading products catalog...
        </div>
      ) : products.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-12 text-center text-gray-400 border border-gray-700">
          <p className="text-lg font-semibold text-white">No products found</p>
          <p className="mt-2 text-sm">Create a new master product or modify your search criteria.</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl overflow-x-auto border border-gray-700 shadow-sm">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-850">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === products.length}
                    onChange={handleSelectAll}
                    className="rounded bg-gray-700 border-gray-600 text-green-600 focus:ring-green-500"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Brand</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Creator</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {products.map((product) => (
                <tr key={product._id} className="hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product._id)}
                      onChange={() => handleSelectProduct(product._id)}
                      className="rounded bg-gray-700 border-gray-600 text-green-600 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-6 py-4 font-semibold text-white">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 text-gray-300">{product.brand || "N/A"}</td>
                  <td className="px-6 py-4 text-gray-350">{product.categoryId?.name || "N/A"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      product.status === "active"
                        ? "bg-green-900 text-green-300"
                        : product.status === "pending"
                        ? "bg-yellow-900 text-yellow-300"
                        : product.status === "rejected"
                        ? "bg-red-900 text-red-300"
                        : product.status === "hidden"
                        ? "bg-purple-900 text-purple-300"
                        : "bg-gray-700 text-gray-300"
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-400">
                    {product.creatorModel.toUpperCase()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {product.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(product._id)}
                            className="p-1.5 bg-green-900/50 hover:bg-green-900 text-green-400 rounded transition-colors"
                            title="Approve Product"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => handleReject(product._id)}
                            className="p-1.5 bg-red-900/50 hover:bg-red-900 text-red-400 rounded transition-colors"
                            title="Reject Product"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => handleHideToggle(product._id, product.status)}
                        className="p-1.5 bg-purple-900/50 hover:bg-purple-900 text-purple-400 rounded transition-colors"
                        title={product.status === "hidden" ? "Restore visibility" : "Hide Product"}
                      >
                        {product.status === "hidden" ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>

                      <button
                        onClick={() => handleView(product)}
                        className="p-1.5 bg-gray-700 hover:bg-gray-650 text-blue-400 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        onClick={() => navigate(`/admin/products/edit/${product._id}`)}
                        className="p-1.5 bg-gray-700 hover:bg-gray-650 text-gray-300 rounded transition-colors"
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => handleDelete(product._id)}
                        className="p-1.5 bg-red-900/30 hover:bg-red-950 text-red-400 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-center border-b border-gray-700 pb-3">
              <h2 className="text-xl font-bold text-white">Product Overview</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-xs font-semibold block uppercase">Product Name</label>
                <p className="text-white font-semibold text-lg">{selectedProduct.name}</p>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-semibold block uppercase">Brand</label>
                <p className="text-white font-medium">{selectedProduct.brand || "N/A"}</p>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-semibold block uppercase">Unit Type</label>
                <p className="text-white font-medium uppercase">{selectedProduct.unitType}</p>
              </div>

              <div>
                <label className="text-gray-400 text-xs font-semibold block uppercase">Status</label>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-gray-700 text-gray-300">
                  {selectedProduct.status}
                </span>
              </div>
            </div>

            {selectedProduct.description && (
              <div>
                <label className="text-gray-400 text-xs font-semibold block uppercase">Description</label>
                <p className="text-gray-300 mt-1.5 text-sm leading-relaxed">{selectedProduct.description}</p>
              </div>
            )}

            {/* Approval History log */}
            {selectedProduct.approvalHistory && selectedProduct.approvalHistory.length > 0 && (
              <div className="bg-gray-750 p-4 rounded-xl space-y-2 border border-gray-700">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Approval Logs</h4>
                <div className="space-y-2 text-sm max-h-[150px] overflow-y-auto">
                  {selectedProduct.approvalHistory.map((h, i) => (
                    <div key={i} className="flex justify-between border-b border-gray-800 pb-1.5 text-xs text-gray-350">
                      <span>Status: <b className="uppercase text-white">{h.status}</b></span>
                      <span>{h.remarks}</span>
                      <span>{new Date(h.updatedAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
              <Button variant="secondary" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowViewModal(false);
                  navigate(`/admin/products/edit/${selectedProduct._id}`);
                }}
              >
                Edit Product
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
