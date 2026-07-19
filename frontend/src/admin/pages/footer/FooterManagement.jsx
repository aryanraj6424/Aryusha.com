import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { useToast } from "../../../components/Toast";
import {
  FileText,
  MapPin,
  ExternalLink,
  ChevronRight,
  Save,
  ArrowLeft,
  Settings,
  Grid,
  Code,
  Table,
  Sparkles,
  RefreshCw
} from "lucide-react";

export default function FooterManagement() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview"); // overview, static-pages, vendor-connect
  const [staticPages, setStaticPages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  
  // Loading states
  const [loadingPages, setLoadingPages] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingCities, setLoadingCities] = useState(true);

  // Edit Mode state
  const [editingPage, setEditingPage] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [showHtmlView, setShowHtmlView] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch all CMS data
  const fetchStaticPagesList = async () => {
    try {
      setLoadingPages(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/footer/pages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setStaticPages(res.data.pages);
      }
    } catch (err) {
      showToast({ type: "error", message: "Failed to load static pages" });
    } finally {
      setLoadingPages(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/categories`);
      if (res.data && res.data.categories) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchCities = async () => {
    try {
      setLoadingCities(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/footer/cities`);
      if (res.data && res.data.cities) {
        setCities(res.data.cities);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCities(false);
    }
  };

  useEffect(() => {
    fetchStaticPagesList();
    fetchCategories();
    fetchCities();
  }, []);

  const handleEditClick = (page) => {
    setEditingPage(page);
    setEditTitle(page.title);
    setEditContent(page.content || "");
    setShowHtmlView(false);
  };

  const handleSavePage = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/footer/pages/${editingPage.slug}`,
        {
          title: editTitle,
          content: editContent
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (res.data.success) {
        showToast({ type: "success", message: `${editTitle} updated successfully!` });
        setEditingPage(null);
        fetchStaticPagesList();
      }
    } catch (err) {
      showToast({
        type: "error",
        message: err.response?.data?.message || "Failed to save page contents"
      });
    } finally {
      setSaving(false);
    }
  };

  const insertTableTemplate = () => {
    const tableTemplate = `
<table border="1" style="width: 100%; border-collapse: collapse; border-color: #cbd5e1; margin: 15px 0;">
  <thead>
    <tr style="background-color: #f1f5f9;">
      <th style="padding: 12px; text-align: left; font-weight: bold; border: 1px solid #cbd5e1;">Header Column 1</th>
      <th style="padding: 12px; text-align: left; font-weight: bold; border: 1px solid #cbd5e1;">Header Column 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 10px; border: 1px solid #cbd5e1;">Data cell 1</td>
      <td style="padding: 10px; border: 1px solid #cbd5e1;">Data cell 2</td>
    </tr>
    <tr>
      <td style="padding: 10px; border: 1px solid #cbd5e1;">Data cell 3</td>
      <td style="padding: 10px; border: 1px solid #cbd5e1;">Data cell 4</td>
    </tr>
  </tbody>
</table>
    `;
    setEditContent((prev) => prev + tableTemplate);
    showToast({ type: "info", message: "Table template inserted at the end of the text." });
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image'],
      ['clean']
    ]
  };

  if (editingPage) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditingPage(null)}
              className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500 hover:text-slate-800"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                Footer Pages CMS <ChevronRight size={12} /> Editing
              </div>
              <h2 className="text-xl font-black text-slate-800 mt-0.5">{editingPage.title}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditingPage(null)}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl transition text-sm"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSavePage}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md shadow-green-150 transition flex items-center gap-2 text-sm disabled:opacity-60"
              disabled={saving}
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Editor Settings Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
              <Sparkles size={16} className="text-green-600" />
              Advanced HTML Page Editor
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={insertTableTemplate}
                className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-black text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition"
              >
                <Table size={14} />
                Insert Table Template
              </button>
              <button
                type="button"
                onClick={() => setShowHtmlView(!showHtmlView)}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-black rounded-lg border transition ${
                  showHtmlView
                    ? "bg-slate-800 border-slate-800 text-white hover:bg-slate-900"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Code size={14} />
                {showHtmlView ? "Show Visual Editor" : "View HTML/Code"}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-600 uppercase tracking-wider">
              Page Content
            </label>
            
            {showHtmlView ? (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <textarea
                  className="w-full min-h-[450px] font-mono text-sm p-4 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Paste or write custom HTML here..."
                />
              </div>
            ) : (
              <div className="quill-editor-container bg-white rounded-xl border border-slate-200 overflow-hidden">
                <ReactQuill
                  theme="snow"
                  value={editContent}
                  onChange={setEditContent}
                  modules={modules}
                  placeholder="Write page content..."
                  style={{ height: '400px', marginBottom: '45px' }}
                />
              </div>
            )}
            <p className="text-xs text-slate-400 font-medium">
              💡 Supports bolding, text scaling, colors, link structures, highlight overlays, lists, custom tables, and raw code edits.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Footer Management</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Manage the content, links, categories, and serviceable cities displayed in your store footer.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchStaticPagesList();
              fetchCategories();
              fetchCities();
              showToast({ type: "info", message: "Refreshed Footer data." });
            }}
            className="p-2.5 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800 rounded-xl border border-slate-200 transition active:scale-95"
            title="Refresh list"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
        {[
          { id: "overview", label: "Dynamic Sections Overview", icon: Settings },
          { id: "static-pages", label: "Static Pages (CMS)", icon: FileText },
          { id: "vendor-connect", label: "Vendor Connect", icon: ExternalLink }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-6 py-3.5 border-b-2 font-bold text-sm whitespace-nowrap transition cursor-pointer ${
                isSelected
                  ? "border-green-600 text-green-700 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Areas */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Categories card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                  <Grid size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Popular Categories</h3>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Dynamic Sync</p>
                </div>
              </div>
              
              <Link
                to="/admin/categories"
                className="text-xs font-black text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition"
              >
                Category Manager
              </Link>
            </div>
            
            <p className="text-xs text-slate-500 font-medium leading-relaxed bg-slate-50 border border-slate-100 p-4 rounded-xl">
              📢 Popular Categories are synchronized automatically from the active categories module. The footer displays the first five sorted categories.
            </p>

            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">Currently Displaying</h4>
              {loadingCategories ? (
                <div className="flex items-center justify-center py-6 text-slate-400 text-sm font-semibold animate-pulse">
                  Loading categories...
                </div>
              ) : categories.length === 0 ? (
                <div className="text-xs font-bold text-amber-600 bg-amber-50 p-3 rounded-lg">
                  No custom categories found. The footer will display built-in fallback categories.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categories.slice(0, 5).map((category) => (
                    <div key={category._id} className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border shadow-sm overflow-hidden flex-shrink-0">
                        {category.icon || category.image ? (
                          <img src={category.icon || category.image} alt={category.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs">🛒</span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-700 truncate">{category.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cities card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Cities We Serve</h3>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Dynamic Sync</p>
                </div>
              </div>
              
              <Link
                to="/admin/vendors"
                className="text-xs font-black text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition"
              >
                Vendor Manager
              </Link>
            </div>
            
            <p className="text-xs text-slate-500 font-medium leading-relaxed bg-slate-50 border border-slate-100 p-4 rounded-xl">
              📢 Serviceable cities are compiled on-the-fly. When a vendor is registered and assigned a serviceable area with a city name, that city appears automatically in the footer serving list.
            </p>

            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">Active Cities List</h4>
              {loadingCities ? (
                <div className="flex items-center justify-center py-6 text-slate-400 text-sm font-semibold animate-pulse">
                  Loading cities list...
                </div>
              ) : cities.length === 0 ? (
                <div className="text-xs font-bold text-amber-600 bg-amber-50 p-3 rounded-lg">
                  No active serviceable cities registered yet. Default mock cities will be visible in the store footer.
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 p-3 border border-slate-100 bg-slate-50/50 rounded-xl">
                  {cities.map((city) => (
                    <span key={city} className="text-xs font-bold bg-white text-green-700 border border-green-100 px-2.5 py-1 rounded-full shadow-sm">
                      {city}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "static-pages" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Static CMS Pages</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Editable sections representing legal policies and support pages.</p>
          </div>
          
          {loadingPages ? (
            <div className="p-10 text-center text-slate-500 font-semibold animate-pulse">
              Retrieving static pages...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black tracking-wider bg-slate-50/30">
                    <th className="py-4 px-6">Page Name</th>
                    <th className="py-4 px-6">Slug</th>
                    <th className="py-4 px-6">Last Updated</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  {staticPages.map((page) => (
                    <tr key={page.slug} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-800">{page.title}</td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-400 bg-slate-50/50 rounded max-w-fit px-1.5 py-0.5 border border-slate-100">{page.slug}</td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {page.updatedAt ? new Date(page.updatedAt).toLocaleString() : "Never"}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleEditClick(page)}
                          className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition"
                        >
                          Edit Content
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "vendor-connect" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-2xl space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
              <ExternalLink size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Vendor Connect Integration</h3>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Redirect Link Only</p>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            The <strong>Vendor Connect</strong> footer hyperlink is designed to onboard or allow login for vendor partners directly. It is set up as a navigation element and redirect route rather than a content page, avoiding administrative CMS redundancy.
          </p>

          <div className="border border-green-100 bg-green-50/30 p-5 rounded-2xl space-y-3">
            <div className="text-xs font-black text-green-800 uppercase tracking-wider">Routing Details</div>
            <div className="space-y-1">
              <p className="text-xs text-slate-500 font-semibold">Store Target URL:</p>
              <code className="block bg-white border text-green-700 px-3 py-2 rounded-xl text-xs font-mono font-bold shadow-sm">
                /vendor/login
              </code>
            </div>
            <div className="pt-2">
              <Link
                to="/vendor/login"
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs font-black text-green-700 hover:text-green-950 underline"
              >
                Test Redirect Destination <ExternalLink size={12} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
