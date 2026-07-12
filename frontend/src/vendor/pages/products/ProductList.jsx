import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useVendor } from "../../context/VendorContext";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  Eye,
  X,
  ChevronRight,
  Package,
  Calendar,
  Grid,
  CheckCircle,
  Check,
  Tag,
  DollarSign
} from "lucide-react";
import axios from "axios";
import { updateLinkedProduct, unlinkProduct } from "../../services/vendorApi";
import { useToast } from "../../../components/Toast";
import ConfirmDialog from "../../../components/Toast/ConfirmDialog";

export default function ProductList() {
  const navigate = useNavigate();
  const { hasPermission } = useVendor();
  const fileInputRef = useRef(null);
  const { showToast } = useToast();
  // Confirm dialog state — holds { message, onConfirm } when a destructive action is pending
  const [confirmState, setConfirmState] = useState(null);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [productFamilies, setProductFamilies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [familyFilter, setFamilyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Details Modal State
  const [viewingProduct, setViewingProduct] = useState(null);

  // Linked Listing Edit State
  const [editingLink, setEditingLink] = useState(null);
  const [showLinkEditModal, setShowLinkEditModal] = useState(false);
  const [linkEditForm, setLinkEditForm] = useState({
    price: "",
    stock: "",
    sku: "",
    condition: "New",
    vendorNotes: "",
    variants: []
  });

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const token = localStorage.getItem("vendorToken");
      const headers = { Authorization: `Bearer ${token}` };

      const [prodRes, catsRes, subCatsRes, famsRes, linkedRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/vendor/product/all`, { headers }),
        axios.get(`${import.meta.env.VITE_API_URL}/categories`),
        axios.get(`${import.meta.env.VITE_API_URL}/sub-categories`),
        axios.get(`${import.meta.env.VITE_API_URL}/product-families`),
        axios.get(`${import.meta.env.VITE_API_URL}/vendor/products/my-links`, { headers })
      ]);

      const customProducts = prodRes.data.products || [];
      const linkedProducts = (linkedRes.data.linked || []).map(link => {
        if (!link.masterProductId) return null;
        return {
          ...link.masterProductId,
          _id: link.masterProductId._id,
          linkId: link._id,
          isLinked: true,
          price: link.price,
          mrp: link.mrp,
          stock: link.stock,
          sku: link.sku,
          condition: link.condition,
          vendorNotes: link.vendorNotes,
          originalVariants: link.masterProductId.variants || [],
          variants: link.masterProductId.variants && link.masterProductId.variants.length > 0
            ? link.masterProductId.variants.map(v => {
                const vl = v.vendorListings?.[0];
                return {
                  variantLabel: v.variantLabel,
                  basePrice: vl?.sellingPrice || link.price,
                  mrp: v.mrp || link.mrp,
                  stock: vl?.stock?.quantity || link.stock || 0,
                  sku: link.sku
                };
              })
            : [{
                basePrice: link.price,
                mrp: link.mrp,
                stock: link.stock,
                sku: link.sku
              }],
          status: link.status === "active" ? "approved" : "inactive"
        };
      }).filter(Boolean);

      setProducts([...customProducts, ...linkedProducts]);
      setCategories(catsRes.data.categories || []);
      setSubCategories(subCatsRes.data.subCategories || []);
      setProductFamilies(famsRes.data.productFamilies || []);
    } catch (error) {
      console.error("Failed to load vendor products catalog:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleFocus = () => {
      fetchData(true);
    };
    window.addEventListener("focus", handleFocus);

    const interval = setInterval(() => {
      fetchData(true);
    }, 7000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, []);

  const handleOpenAdd = () => {
    navigate("/vendor/products/add");
  };

  const handleOpenEdit = (p, e) => {
    if (e) e.stopPropagation(); // Prevent modal open
    if (p.isLinked) {
      setEditingLink(p);
      setLinkEditForm({
        price: p.price,
        mrp: p.mrp || "",
        stock: p.stock,
        sku: p.sku,
        condition: p.condition || "New",
        vendorNotes: p.vendorNotes || "",
        variants: (p.originalVariants || []).map(v => {
          const vl = v.vendorListings?.[0];
          return {
            variantId: v._id,
            label: v.variantLabel,
            isAvailable: vl ? !!vl.isAvailable : true,
            sellingPrice: vl?.sellingPrice || "",
            mrp: vl?.mrp || "",
            stock: vl ? (vl.stock?.quantity || 0) : ""
          };
        })
      });
      setShowLinkEditModal(true);
    } else {
      navigate(`/vendor/products/edit/${p._id}`);
    }
  };

  const handleOpenDuplicate = async (p, e) => {
    if (e) e.stopPropagation();
    if (p.isLinked) return; // cannot duplicate linked master products
    setConfirmState({
      message: `Are you sure you want to duplicate "${p.name}"?`,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          const token = localStorage.getItem("vendorToken");
          const headers = { Authorization: `Bearer ${token}` };
          const payload = {
            familyId: p.familyId?._id || p.familyId || "",
            categoryId: p.categoryId?._id || p.categoryId || "",
            subCategoryId: p.subCategoryId?._id || p.subCategoryId || "",
            name: `${p.name} (Copy)`,
            brand: p.brand || "",
            description: p.description || "",
            unitType: p.unitType || "weight",
            mrp: p.variants?.[0]?.mrp || "",
            sellingPrice: p.variants?.[0]?.basePrice || "",
            sku: p.variants?.[0]?.sku ? `${p.variants[0].sku}-COPY` : "",
            stock: p.variants?.[0]?.stock || 0,
            images: p.images || [],
            attributes: p.attributes || [],
            status: "draft"
          };
          const res = await axios.post(`${import.meta.env.VITE_API_URL}/vendor/product/create`, payload, { headers });
          if (res.data.success) {
            showToast({ type: "success", message: "Product duplicated successfully as Draft!" });
            fetchData();
          }
        } catch (error) {
          console.error(error);
          showToast({ type: "error", message: "Failed to duplicate product." });
        }
      }
    });
  };

  const handleDelete = async (p, e) => {
    if (e) e.stopPropagation();
    if (p.isLinked) {
      setConfirmState({
        message: `Are you sure you want to unlink "${p.name}" from your store?`,
        type: "danger",
        onConfirm: async () => {
          setConfirmState(null);
          try {
            setLoading(true);
            await unlinkProduct(p.linkId);
            showToast({ type: "success", message: "Product unlinked successfully." });
            fetchData();
          } catch (err) {
            console.error(err);
            showToast({ type: "error", message: "Failed to unlink product." });
            setLoading(false);
          }
        }
      });
    } else {
      setConfirmState({
        message: `Are you sure you want to delete the draft "${p.name}"?`,
        type: "danger",
        onConfirm: async () => {
          setConfirmState(null);
          try {
            const token = localStorage.getItem("vendorToken");
            const headers = { Authorization: `Bearer ${token}` };
            const res = await axios.delete(`${import.meta.env.VITE_API_URL}/vendor/product/delete/${p._id}`, { headers });
            if (res.data.success) {
              showToast({ type: "success", message: "Product draft deleted successfully." });
              fetchData();
            }
          } catch (error) {
            console.error(error);
            showToast({ type: "error", message: "Failed to delete draft product." });
          }
        }
      });
    }
  };

  // Bulk status updates
  const handleBulkStatusChange = async (newStatus) => {
    if (selectedProducts.length === 0) return;
    setConfirmState({
      message: `Apply bulk update [Status: ${newStatus}] to ${selectedProducts.length} items?`,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          const token = localStorage.getItem("vendorToken");
          const headers = { Authorization: `Bearer ${token}` };
          const res = await axios.post(`${import.meta.env.VITE_API_URL}/vendor/product/bulk-update`, {
            productIds: selectedProducts,
            status: newStatus
          }, { headers });
          if (res.data.success) {
            showToast({ type: "success", message: "Bulk products updated successfully." });
            setSelectedProducts([]);
            fetchData();
          }
        } catch (error) {
          console.error(error);
          showToast({ type: "error", message: "Failed to perform bulk update." });
        }
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    setConfirmState({
      message: `Permanently delete ${selectedProducts.length} selected drafts?`,
      type: "danger",
      onConfirm: async () => {
        setConfirmState(null);
        try {
          const token = localStorage.getItem("vendorToken");
          const headers = { Authorization: `Bearer ${token}` };
          const res = await axios.post(`${import.meta.env.VITE_API_URL}/vendor/product/bulk-delete`, {
            productIds: selectedProducts
          }, { headers });
          if (res.data.success) {
            showToast({ type: "success", message: "Bulk drafts deleted successfully." });
            setSelectedProducts([]);
            fetchData();
          }
        } catch (error) {
          console.error(error);
          showToast({ type: "error", message: "Failed to execute bulk delete." });
        }
      }
    });
  };

  // Selection handlers
  const handleSelectProduct = (id, e) => {
    e.stopPropagation();
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(filteredProducts.map(p => p._id));
    } else {
      setSelectedProducts([]);
    }
  };

  // Import / Export catalog
  const handleExport = () => {
    const token = localStorage.getItem("vendorToken");
    window.open(`${import.meta.env.VITE_API_URL}/vendor/product/export?token=${token}`, "_blank");
  };

  const handleTriggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const token = localStorage.getItem("vendorToken");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data"
      };

      const res = await axios.post(`${import.meta.env.VITE_API_URL}/vendor/product/import`, formData, { headers });
      if (res.data.success) {
        showToast({ type: "success", message: "Products catalog imported successfully!" });
        fetchData();
      }
    } catch (err) {
      console.error(err);
      showToast({ type: "error", message: err.response?.data?.message || "Failed to import products catalog." });
    } finally {
      setLoading(false);
    }
  };

  // Permissions helper
  const canEdit = hasPermission("product", "edit");
  const canDelete = hasPermission("product", "delete");

  // Filtering products
  let filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    const matchesCategory = filterCategory === "all" || p.categoryId?._id === filterCategory || p.categoryId === filterCategory;
    const matchesFamily = familyFilter === "all" || p.familyId?._id === familyFilter || p.familyId === familyFilter;
    return matchesSearch && matchesStatus && matchesCategory && matchesFamily;
  });

  // Sorting products
  filteredProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "latest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sortBy === "oldest") {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    if (sortBy === "price_asc") {
      const priceA = a.variants?.[0]?.basePrice || 0;
      const priceB = b.variants?.[0]?.basePrice || 0;
      return priceA - priceB;
    }
    if (sortBy === "price_desc") {
      const priceA = a.variants?.[0]?.basePrice || 0;
      const priceB = b.variants?.[0]?.basePrice || 0;
      return priceB - priceA;
    }
    if (sortBy === "name_asc") {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2.5 py-1 rounded-xl font-bold border border-emerald-100 uppercase tracking-wide">Active</span>;
      case "pending":
        return <span className="bg-amber-50 text-amber-700 text-[10px] px-2.5 py-1 rounded-xl font-bold border border-amber-100 uppercase tracking-wide">Pending</span>;
      case "rejected":
        return <span className="bg-rose-50 text-rose-700 text-[10px] px-2.5 py-1 rounded-xl font-bold border border-rose-100 uppercase tracking-wide">Rejected</span>;
      case "draft":
        return <span className="bg-slate-50 text-slate-700 text-[10px] px-2.5 py-1 rounded-xl font-bold border border-slate-200 uppercase tracking-wide">Draft</span>;
      default:
        return <span className="bg-gray-50 text-gray-700 text-[10px] px-2.5 py-1 rounded-xl font-bold border border-gray-100 uppercase tracking-wide">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImport}
        className="hidden"
        accept=".csv,.xlsx,.xls,.json"
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Products grid</h1>
          <p className="text-slate-500 font-semibold mt-1">Manage, catalog, duplicate, and request approvals for your catalog.</p>
        </div>
        <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end">
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download size={14} /> Export
          </button>
          <button
            onClick={handleTriggerImport}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Upload size={14} /> Import
          </button>
          {hasPermission("product", "add") && (
            <button
              onClick={handleOpenAdd}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition text-xs cursor-pointer"
            >
              <Plus size={16} /> Create new
            </button>
          )}
        </div>
      </div>

      {/* Filters & Sorting */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between text-xs font-bold text-slate-500">
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search catalog by name, brand..."
            className="w-full pl-10 pr-4 py-3 border rounded-2xl outline-none focus:border-purple-600 font-medium"
          />
          <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center justify-end">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-3 border rounded-2xl outline-none focus:border-purple-600 bg-white cursor-pointer min-w-[130px]"
          >
            <option value="all">All Category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border rounded-2xl outline-none focus:border-purple-600 bg-white cursor-pointer min-w-[120px]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="draft">Draft</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 border rounded-2xl outline-none focus:border-purple-600 bg-white cursor-pointer min-w-[130px]"
          >
            <option value="latest">Latest added</option>
            <option value="oldest">Oldest added</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A-Z</option>
          </select>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedProducts.length > 0 && (
        <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl flex justify-between items-center shadow-sm text-xs font-bold text-purple-800">
          <span>{selectedProducts.length} items selected</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkStatusChange("pending")}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition shadow cursor-pointer"
            >
              Submit Selected
            </button>
            <button
              onClick={() => handleBulkStatusChange("draft")}
              className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-xl transition shadow cursor-pointer"
            >
              Save as Draft
            </button>
            <button
              onClick={handleBulkDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl transition shadow cursor-pointer"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Select All Checkbox for Grid */}
      {filteredProducts.length > 0 && (
        <div className="flex items-center gap-2 pl-2 text-xs font-bold text-slate-500">
          <input
            type="checkbox"
            checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
            onChange={handleSelectAll}
            className="rounded text-purple-600 focus:ring-purple-500 border-slate-200"
            id="selectAll"
          />
          <label htmlFor="selectAll" className="cursor-pointer select-none">Select All Items on Page</label>
        </div>
      )}

      {/* Grid of Product Cards */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-slate-100 p-12 text-center text-slate-400 font-bold rounded-3xl shadow-sm">
          No products listed matching criteria. Click "Create new" to add one.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const price = product.variants?.[0]?.basePrice ?? "N/A";
            const sku = product.variants?.[0]?.sku ?? "";
            const isEditable = product.isLinked || (canEdit && (product.status === "draft" || product.status === "rejected"));
            const isSelected = selectedProducts.includes(product._id);

            return (
              <div
                key={product._id}
                onClick={() => navigate(`/vendor/products/${product._id}`)}
                className={`bg-white border border-slate-100 rounded-3xl p-4 flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative group cursor-pointer ${
                  isSelected ? "ring-2 ring-purple-500 border-transparent bg-purple-50/10" : ""
                }`}
              >
                {/* Checkbox on hover or selected */}
                <div
                  className={`absolute top-4 left-4 z-10 transition-opacity ${
                    isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleSelectProduct(product._id, e)}
                    className="rounded text-purple-600 focus:ring-purple-500 border-slate-300 w-4 h-4 shadow-sm"
                  />
                </div>

                {/* Status Badge */}
                <div className="absolute top-4 right-4 z-10">
                  {getStatusBadge(product.status)}
                </div>

                {/* Product Image */}
                <div className="w-full aspect-square bg-slate-50 border rounded-2xl flex items-center justify-center overflow-hidden mb-4 relative shadow-inner">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <span className="text-slate-400 font-extrabold text-xs">NO IMAGE</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      {product.categoryId?.name || "N/A"} &bull; {product.brand || "Generic"}
                    </span>
                    <h3 className="font-extrabold text-slate-800 line-clamp-2 leading-snug mt-1 group-hover:text-purple-600 transition-colors" title={product.name}>
                      {product.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <p className="text-lg font-black text-slate-900 leading-none">
                          {price !== "N/A" ? `₹${price}` : "N/A"}
                        </p>
                        {product.variants?.[0]?.mrp && (
                          <span className="text-xs text-slate-400 line-through">
                            ₹{product.variants[0].mrp}
                          </span>
                        )}
                      </div>
                      {sku && (
                        <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-wider uppercase">SKU: {sku}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {isEditable ? (
                        <button
                          onClick={(e) => handleOpenEdit(product, e)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-2 px-4 flex items-center justify-center gap-1 font-bold transition text-xs cursor-pointer shadow-sm"
                        >
                          <Edit size={12} /> Edit
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/vendor/products/${product._id}`);
                          }}
                          className="bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl py-2 px-4 flex items-center justify-center gap-1 font-bold transition text-xs cursor-pointer"
                        >
                          <Eye size={12} /> View
                        </button>
                      )}

                      {/* Small operations */}
                      {!product.isLinked && (
                        <button
                          onClick={(e) => handleOpenDuplicate(product, e)}
                          className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
                          title="Duplicate"
                        >
                          <Copy size={13} />
                        </button>
                      )}

                      {(product.isLinked || (canDelete && product.status === "draft")) && (
                        <button
                          onClick={(e) => handleDelete(product, e)}
                          className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition"
                          title={product.isLinked ? "Unlink Product" : "Delete Draft"}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW PRODUCT DETAILS MODAL (SIDE DRAWER / OVERLAY) */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-end z-50 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white h-screen w-full max-w-xl shadow-2xl flex flex-col justify-between animate-slide-in relative border-l border-slate-100">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Product Details</span>
                <h3 className="text-lg font-black text-slate-800 mt-1 max-w-[400px] truncate">{viewingProduct.name}</h3>
              </div>
              <button
                onClick={() => setViewingProduct(null)}
                className="text-slate-400 hover:text-slate-600 bg-white p-2 border rounded-full cursor-pointer shadow-sm transition hover:scale-105"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm font-semibold text-slate-700">
              
              {/* Product Status & Dates */}
              <div className="flex items-center justify-between border-b pb-4 border-slate-100">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Catalog Status</p>
                  <div>{getStatusBadge(viewingProduct.status)}</div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Added On</p>
                  <p className="text-slate-800 font-extrabold text-xs">
                    {new Date(viewingProduct.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}
                  </p>
                </div>
              </div>

              {/* Rejection comments */}
              {viewingProduct.status === "rejected" && viewingProduct.approvalHistory?.[viewingProduct.approvalHistory.length - 1]?.remarks && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl space-y-1 text-red-800">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider">Rejection Remarks</h4>
                  <p className="text-xs font-semibold leading-relaxed">
                    {viewingProduct.approvalHistory[viewingProduct.approvalHistory.length - 1].remarks}
                  </p>
                </div>
              )}

              {/* Product Images View */}
              <div className="space-y-3">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gallery Images</p>
                {viewingProduct.images && viewingProduct.images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {viewingProduct.images.map((imgUrl, idx) => (
                      <a
                        key={idx}
                        href={imgUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="aspect-square bg-slate-50 border rounded-2xl overflow-hidden flex items-center justify-center hover:border-purple-600 transition"
                      >
                        <img src={imgUrl} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 border rounded-2xl text-slate-400 font-bold text-xs uppercase">
                    No Gallery Images Uploaded
                  </div>
                )}
              </div>

              {/* Classification Info */}
              <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-2 gap-4 border border-slate-100">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Brand Name</p>
                  <p className="text-slate-800 font-extrabold mt-0.5">{viewingProduct.brand || "Generic"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Product Family</p>
                  <p className="text-slate-800 font-extrabold mt-0.5">{viewingProduct.familyId?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Category</p>
                  <p className="text-slate-800 font-extrabold mt-0.5">{viewingProduct.categoryId?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Subcategory</p>
                  <p className="text-slate-800 font-extrabold mt-0.5">{viewingProduct.subCategoryId?.name || "N/A"}</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Description</p>
                <div className="p-4 bg-white border border-slate-150 rounded-2xl font-medium text-slate-650 leading-relaxed text-xs">
                  {viewingProduct.description || "No description provided for this product."}
                </div>
              </div>

              {/* Variants & Inventory */}
              <div className="space-y-3">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pricing, Inventory & Variant Options</p>
                <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-xs font-semibold text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-150 font-bold text-slate-400 uppercase tracking-wider text-left text-[10px]">
                      <tr>
                        <th className="px-4 py-2.5">SKU / Code</th>
                        <th className="px-4 py-2.5">MRP</th>
                        <th className="px-4 py-2.5">Base price</th>
                        <th className="px-4 py-2.5 text-center">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {viewingProduct.variants && viewingProduct.variants.length > 0 ? (
                        viewingProduct.variants.map((v, index) => (
                          <tr key={index} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2.5 font-bold uppercase tracking-wider">{v.sku || "N/A"}</td>
                            <td className="px-4 py-2.5 text-slate-400 line-through">₹{v.mrp}</td>
                            <td className="px-4 py-2.5 font-extrabold text-slate-900">₹{v.basePrice}</td>
                            <td className={`px-4 py-2.5 text-center font-extrabold ${v.stock <= 5 ? "text-red-500 font-black" : "text-slate-700"}`}>
                              {v.stock}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-slate-400 font-bold">
                            No variant options found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Specifications Attributes */}
              {viewingProduct.attributes && viewingProduct.attributes.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Attributes & Specifications</p>
                  <div className="grid grid-cols-2 gap-3">
                    {viewingProduct.attributes.map((attr, idx) => (
                      <div key={idx} className="p-3 border rounded-xl bg-slate-50 border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-bold capitalize">{attr.name}</span>
                        <span className="text-slate-800 font-extrabold">{attr.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 flex gap-3 justify-end bg-slate-50/30">
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="px-5 py-2.5 border rounded-xl hover:bg-slate-50 font-bold transition text-xs cursor-pointer bg-white"
              >
                Close View
              </button>
              {canEdit && (viewingProduct.status === "draft" || viewingProduct.status === "rejected") && (
                <button
                  type="button"
                  onClick={() => handleOpenEdit(viewingProduct)}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition shadow-sm text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Edit size={14} /> Open Edit Wizard
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── EDIT LINKED REFERENCE MODAL ── */}
      {showLinkEditModal && editingLink && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl border border-slate-100 font-semibold text-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Edit Listing Details</h3>
              <button
                onClick={() => { setShowLinkEditModal(false); setEditingLink(null); }}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-full hover:scale-105 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-100 flex gap-3">
              {editingLink.images?.[0] && (
                <img src={editingLink.images[0]} alt="" className="w-10 h-10 object-cover rounded-xl border border-slate-200" />
              )}
              <div className="min-w-0">
                <h4 className="font-bold text-slate-800 truncate text-sm">{editingLink.name}</h4>
                <p className="text-xs text-slate-450 font-medium">Brand: {editingLink.brand || "Generic"}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">MRP (Original Price) (optional)</label>
                <input
                  type="number"
                  value={linkEditForm.mrp}
                  onChange={(e) => setLinkEditForm({ ...linkEditForm, mrp: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-semibold text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Selling Price (₹) *</label>
                <input
                  type="number"
                  value={linkEditForm.price}
                  onChange={(e) => setLinkEditForm({ ...linkEditForm, price: e.target.value })}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-semibold text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Stock Quantity *</label>
                <input
                  type="number"
                  value={linkEditForm.stock}
                  onChange={(e) => setLinkEditForm({ ...linkEditForm, stock: e.target.value })}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-semibold text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Your Store SKU *</label>
                <input
                  type="text"
                  value={linkEditForm.sku}
                  onChange={(e) => setLinkEditForm({ ...linkEditForm, sku: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono text-slate-750 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Condition</label>
                <select
                  value={linkEditForm.condition}
                  onChange={(e) => setLinkEditForm({ ...linkEditForm, condition: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white font-semibold text-slate-750"
                >
                  <option value="New">New / Fresh</option>
                  <option value="Refurbished">Refurbished</option>
                  <option value="Used">Used</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Internal Notes</label>
                <textarea
                  value={linkEditForm.vendorNotes}
                  onChange={(e) => setLinkEditForm({ ...linkEditForm, vendorNotes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-semibold text-slate-700 resize-none"
                />
              </div>

              {linkEditForm.variants && linkEditForm.variants.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="font-bold text-slate-800 text-sm">Available Variants</h3>
                  <div className="max-h-60 overflow-y-auto space-y-3">
                    {linkEditForm.variants.map((v, idx) => (
                      <div key={v.variantId} className="flex flex-col gap-2 p-3 border rounded-xl bg-slate-50 items-start shadow-sm">
                        <div className="flex items-center gap-2 w-full">
                          <input 
                            type="checkbox" 
                            checked={v.isAvailable} 
                            onChange={(e) => {
                              const newV = [...linkEditForm.variants];
                              newV[idx].isAvailable = e.target.checked;
                              setLinkEditForm({ ...linkEditForm, variants: newV });
                            }}
                            className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                          />
                          <span className="font-bold text-slate-800 text-sm">{v.label}</span>
                        </div>
                        {v.isAvailable && (
                          <div className="grid grid-cols-3 gap-2 w-full pl-6">
                            <input 
                              type="number" 
                              placeholder="Price" 
                              value={v.sellingPrice} 
                              onChange={(e) => {
                                const newV = [...linkEditForm.variants];
                                newV[idx].sellingPrice = e.target.value;
                                setLinkEditForm({ ...linkEditForm, variants: newV });
                              }} 
                              className="px-2 py-1.5 border rounded-lg text-xs w-full focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            />
                            <input 
                              type="number" 
                              placeholder="MRP" 
                              value={v.mrp} 
                              onChange={(e) => {
                                const newV = [...linkEditForm.variants];
                                newV[idx].mrp = e.target.value;
                                setLinkEditForm({ ...linkEditForm, variants: newV });
                              }} 
                              className="px-2 py-1.5 border rounded-lg text-xs w-full focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            />
                            <input 
                              type="number" 
                              placeholder="Stock" 
                              value={v.stock} 
                              onChange={(e) => {
                                const newV = [...linkEditForm.variants];
                                newV[idx].stock = e.target.value;
                                setLinkEditForm({ ...linkEditForm, variants: newV });
                              }} 
                              className="px-2 py-1.5 border rounded-lg text-xs w-full focus:ring-2 focus:ring-purple-500 focus:outline-none"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100 font-bold">
                <button
                  type="button"
                  onClick={() => { setShowLinkEditModal(false); setEditingLink(null); }}
                  className="flex-1 py-2.5 border border-slate-350 text-slate-750 rounded-xl text-sm hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!linkEditForm.price || Number(linkEditForm.price) <= 0) {
                      showToast({ type: "warning", message: "Please enter a valid price." });
                      return;
                    }
                    if (linkEditForm.mrp && Number(linkEditForm.mrp) <= 0) {
                      showToast({ type: "warning", message: "MRP must be greater than 0 if specified." });
                      return;
                    }
                    if (linkEditForm.mrp && Number(linkEditForm.price) > Number(linkEditForm.mrp)) {
                      showToast({ type: "warning", message: "Selling price cannot exceed MRP." });
                      return;
                    }
                    try {
                      setLoading(true);
                      await updateLinkedProduct(editingLink.linkId, {
                        price: Number(linkEditForm.price),
                        mrp: linkEditForm.mrp ? Number(linkEditForm.mrp) : null,
                        stock: Number(linkEditForm.stock || 0),
                        sku: linkEditForm.sku.trim(),
                        condition: linkEditForm.condition,
                        vendorNotes: linkEditForm.vendorNotes.trim(),
                        variants: linkEditForm.variants.filter(v => v.isAvailable).map(v => ({
                          variantId: v.variantId,
                          sellingPrice: v.sellingPrice ? Number(v.sellingPrice) : Number(linkEditForm.price),
                          mrp: v.mrp ? Number(v.mrp) : (linkEditForm.mrp ? Number(linkEditForm.mrp) : null),
                          stock: v.stock ? Number(v.stock) : Number(linkEditForm.stock || 0),
                          isAvailable: true
                        }))
                      });
                      setShowLinkEditModal(false);
                      setEditingLink(null);
                      showToast({ type: "success", message: "Listing updated successfully!" });
                      fetchData();
                    } catch (err) {
                      console.error(err);
                      showToast({ type: "error", message: "Failed to update listing." });
                      setLoading(false);
                    }
                  }}
                  className="flex-1 bg-purple-650 hover:bg-purple-700 text-white py-2.5 rounded-xl transition flex items-center justify-center gap-1 shadow"
                >
                  <Check size={14} className="font-bold" /> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-UI confirmation dialog for destructive actions */}
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
