import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { ArrowLeft, Shield, FileText, CheckSquare, Settings, User, Building2, Check, X, ShieldAlert, MapPin, Plus, Trash2, Edit, Search } from "lucide-react";
import CoverageMap from "../../../vendor/components/CoverageMap";
import { useToast } from "../../../components/Toast";
import ConfirmDialog from "../../../components/Toast/ConfirmDialog";

export default function VendorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [confirmState, setConfirmState] = useState(null);

  const [vendor, setVendor] = useState(null);
  

  // Address search suggestions states
  const [addressSearch, setAddressSearch] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");



  // Location and Service Area States
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [radiusInput, setRadiusInput] = useState("");
  const [isEditingLocation, setIsEditingLocation] = useState(false);

  const [saPincode, setSaPincode] = useState("");
  const [saAreaName, setSaAreaName] = useState("");
  const [saCity, setSaCity] = useState("");
  const [saState, setSaState] = useState("");
  const [editingSaIndex, setEditingSaIndex] = useState(null); // null if adding, number if editing

  // Admin Vendor Edit Modal state
  const [showAdminEditModal, setShowAdminEditModal] = useState(false);
  const [adminEditSaving, setAdminEditSaving] = useState(false);
  const [adminEditData, setAdminEditData] = useState({
    shopName: "",
    shopType: "",
    phone: "",
    businessEmail: "",
    whatsapp: "",
    yearsInBusiness: "",
    address: { city: "", district: "", state: "", pincode: "", addressLine: "" },
    ownerDetails: { ownerName: "", mobileNumber: "", email: "" },
    documents: {
      gstNumber: "", businessRegNo: "", aadhaar: "", pan: "",
      bankDetails: { accountHolder: "", bankName: "", accountNumber: "", ifsc: "" }
    }
  });

  const handleOpenAdminEditModal = () => {
    if (!vendor) return;
    setAdminEditData({
      shopName: vendor.shopName || "",
      shopType: vendor.shopType || "",
      phone: vendor.phone || "",
      businessEmail: vendor.businessEmail || "",
      whatsapp: vendor.whatsapp || "",
      yearsInBusiness: vendor.yearsInBusiness || "",
      address: {
        city: vendor.address?.city || "",
        district: vendor.address?.district || "",
        state: vendor.address?.state || "",
        pincode: vendor.address?.pincode || "",
        addressLine: vendor.address?.addressLine || ""
      },
      ownerDetails: {
        ownerName: vendor.ownerDetails?.ownerName || "",
        mobileNumber: vendor.ownerDetails?.mobileNumber || "",
        email: vendor.ownerDetails?.email || ""
      },
      documents: {
        gstNumber: vendor.documents?.gstNumber || "",
        businessRegNo: vendor.documents?.businessRegNo || "",
        aadhaar: vendor.documents?.aadhaar || "",
        pan: vendor.documents?.pan || "",
        bankDetails: {
          accountHolder: vendor.documents?.bankDetails?.accountHolder || "",
          bankName: vendor.documents?.bankDetails?.bankName || "",
          accountNumber: vendor.documents?.bankDetails?.accountNumber || "",
          ifsc: vendor.documents?.bankDetails?.ifsc || ""
        }
      }
    });
    setShowAdminEditModal(true);
  };

  const handleSaveAdminEdit = async (e) => {
    e.preventDefault();
    setAdminEditSaving(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/admin/vendors/${id}`, adminEditData, getAuthHeaders());
      showToast({ type: "success", message: "Vendor details updated successfully by Admin!" });
      setShowAdminEditModal(false);
      fetchVendorDetails();
    } catch (error) {
      console.error(error);
      showToast({ type: "error", message: error.response?.data?.message || "Failed to update vendor details." });
    } finally {
      setAdminEditSaving(false);
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("adminToken");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const fetchVendorDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/vendors/${id}`, getAuthHeaders());
      setVendor(res.data.vendor);
      setLatInput(res.data.vendor.latitude ?? "");
      setLngInput(res.data.vendor.longitude ?? "");
      setRadiusInput(res.data.vendor.deliveryRadius ?? "");
      setPermissions(res.data.permissions?.permissions || {
        category: { view: true, add: true, edit: true, delete: true },
        subCategory: { view: true, add: true, edit: true, delete: true },
        productFamily: { view: true, add: true, edit: true, delete: true },
        areaAccess: { view: true },
        couponAccess: { view: true, create: true, edit: true, delete: true },
        product: { view: true, add: true, edit: true, delete: true },
      });

    } catch (error) {
      console.error(error);
      showToast({ type: "error", message: "Failed to fetch vendor details." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchVendorDetails();
    }
  }, [id]);


  // Autocomplete address search via Google Maps location search service
  const handleAddressSearch = async (val) => {
    setAddressSearch(val);
    if (val.trim().length < 3) {
      setSearchSuggestions([]);
      return;
    }
    setSearchLoading(true);
    try {
      // Replaced direct Nominatim API call with Google Maps location search endpoint
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/location/search`, {
        params: { text: val },
      });
      setSearchSuggestions(res.data.results || []);
    } catch (err) {
      console.error("Address Autocomplete Error:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectAddressSuggestion = (item) => {
    const lat = parseFloat(item.lat || item.properties?.lat);
    const lng = parseFloat(item.lon || item.lng || item.properties?.lon);
    setLatInput(lat.toFixed(6));
    setLngInput(lng.toFixed(6));
    setSearchSuggestions([]);
    setAddressSearch("");
    
    // Auto populate pincode/city/state if available
    const addr = item.address || item || {};
    const postcode = addr.postcode || "";
    const city = addr.city || addr.town || addr.village || addr.municipality || "";
    const state = addr.state || "";
    const area = addr.road || addr.suburb || addr.area || addr.neighbourhood || "";

    if (postcode) setSaPincode(postcode);
    if (area || city) setSaAreaName(area || city);
    if (city) setSaCity(city);
    if (state) setSaState(state);
  };

  const handleStatusAction = async (action) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/admin/vendors/${action}/${id}`, {}, getAuthHeaders());
      showToast({ type: "success", message: `Vendor account status changed to ${action} successfully.` });
      fetchVendorDetails();
    } catch (error) {
      console.error(error);
      showToast({ type: "error", message: `Failed to perform action: ${action}` });
    }
  };

  const handlePermissionToggle = (module, action) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module][action],
      },
    }));
  };

  const handleSavePermissions = async () => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/admin/vendors/permissions/${id}`, {
        permissions,
      }, getAuthHeaders());
      showToast({ type: "success", message: "Permissions updated successfully." });
      fetchVendorDetails();
    } catch (error) {
      console.error(error);
      showToast({ type: "error", message: "Failed to update permissions." });
    }
  };

  const handleSaveLocation = async () => {
    try {
      const latVal = latInput === "" ? null : Number(latInput);
      if (latVal !== null && (isNaN(latVal) || latVal < -90 || latVal > 90)) {
        showToast({ type: "warning", message: "Invalid Latitude. Must be between -90 and 90." });
        return;
      }
      const lngVal = lngInput === "" ? null : Number(lngInput);
      if (lngVal !== null && (isNaN(lngVal) || lngVal < -180 || lngVal > 180)) {
        showToast({ type: "warning", message: "Invalid Longitude. Must be between -180 and 180." });
        return;
      }
      const radiusVal = radiusInput === "" ? null : Number(radiusInput);
      if (radiusVal !== null && (isNaN(radiusVal) || radiusVal <= 0)) {
        showToast({ type: "warning", message: "Invalid Radius. Must be a positive number greater than 0." });
        return;
      }

      await axios.put(`${import.meta.env.VITE_API_URL}/admin/vendors/${id}/service-area`, {
        latitude: latVal,
        longitude: lngVal,
        radiusKm: radiusVal
      }, getAuthHeaders());

      showToast({ type: "success", message: "Vendor location settings updated successfully." });
      setIsEditingLocation(false);
      fetchVendorDetails();
    } catch (error) {
      console.error(error);
      showToast({ type: "error", message: error.response?.data?.message || "Failed to save location settings." });
    }
  };

  const handleAddOrUpdateServiceArea = async (e) => {
    e.preventDefault();
    if (!saPincode || !saAreaName || !saCity || !saState) {
      showToast({ type: "warning", message: "All service area fields are required." });
      return;
    }

    const currentAreas = [...(vendor.serviceAreas || [])];
    const duplicateIndex = currentAreas.findIndex(
      (sa, idx) => sa.pincode === saPincode.trim() && idx !== editingSaIndex
    );
    if (duplicateIndex !== -1) {
      showToast({ type: "warning", message: `Pincode ${saPincode} is already assigned to this vendor.` });
      return;
    }

    const newArea = {
      pincode: saPincode.trim(),
      areaName: saAreaName.trim(),
      city: saCity.trim(),
      state: saState.trim()
    };

    if (editingSaIndex !== null) {
      currentAreas[editingSaIndex] = newArea;
    } else {
      currentAreas.push(newArea);
    }

    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/admin/vendors/${id}`, {
        serviceAreas: currentAreas
      }, getAuthHeaders());
      
      showToast({ type: "success", message: editingSaIndex !== null ? "Service area updated successfully." : "Service area added successfully." });
      setSaPincode("");
      setSaAreaName("");
      setSaCity("");
      setSaState("");
      setEditingSaIndex(null);
      fetchVendorDetails();
    } catch (error) {
      console.error(error);
      showToast({ type: "error", message: error.response?.data?.message || "Failed to update service areas." });
    }
  };

  const handleDeleteServiceArea = async (indexToDelete) => {
    setConfirmState({
      message: "Are you sure you want to remove this service area?",
      type: "danger",
      onConfirm: async () => {
        setConfirmState(null);
        const currentAreas = (vendor.serviceAreas || []).filter((_, idx) => idx !== indexToDelete);
        try {
          await axios.put(`${import.meta.env.VITE_API_URL}/admin/vendors/${id}`, {
            serviceAreas: currentAreas
          }, getAuthHeaders());
          showToast({ type: "success", message: "Service area removed successfully." });
          fetchVendorDetails();
        } catch (error) {
          console.error(error);
          showToast({ type: "error", message: error.response?.data?.message || "Failed to remove service area." });
        }
      }
    });
  };

  const handleEditServiceAreaClick = (sa, index) => {
    setSaPincode(sa.pincode);
    setSaAreaName(sa.areaName);
    setSaCity(sa.city);
    setSaState(sa.state);
    setEditingSaIndex(index);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="p-6 text-center text-red-500">
        Vendor not found.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header & Back Action */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-green-600 hover:underline mb-2"
          >
            <ArrowLeft size={18} />
            Back to Vendor List
          </button>
          <h1 className="text-3xl font-bold">{vendor.shopName}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                vendor.status === "approved"
                  ? "bg-emerald-100 text-emerald-700"
                  : vendor.status === "pending"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              Verification: {vendor.status?.toUpperCase()}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                vendor.accountStatus === "active"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              Account: {vendor.accountStatus?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Status Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {vendor.status === "pending" && (
            <>
              <button
                onClick={() => handleStatusAction("approve")}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium"
              >
                <Check size={16} /> Approve
              </button>
              <button
                onClick={() => handleStatusAction("reject")}
                className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-medium"
              >
                <X size={16} /> Reject
              </button>
            </>
          )}

          {vendor.status === "approved" && (
            <>
              {vendor.accountStatus === "active" ? (
                <button
                  onClick={() => handleStatusAction("suspend")}
                  className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl font-medium"
                >
                  <ShieldAlert size={16} /> Suspend
                </button>
              ) : (
                <button
                  onClick={() => handleStatusAction("activate")}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium"
                >
                  <Check size={16} /> Activate
                </button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={handleOpenAdminEditModal}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shadow-sm"
          >
            <Edit size={16} /> Edit Vendor Details
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-colors ${
            activeTab === "profile"
              ? "border-green-600 text-green-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Building2 size={16} /> Store & Owner Details
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-colors ${
            activeTab === "documents"
              ? "border-green-600 text-green-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileText size={16} /> Documents & Bank
        </button>
        <button
          onClick={() => setActiveTab("permissions")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-colors ${
            activeTab === "permissions"
              ? "border-green-600 text-green-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Settings size={16} /> Permissions Control
        </button>

        <button
          onClick={() => setActiveTab("serviceAreas")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-semibold text-sm transition-colors ${
            activeTab === "serviceAreas"
              ? "border-green-600 text-green-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <MapPin size={16} /> Location & Service Areas
        </button>
      </div>

      {/* Tab Contents */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        {activeTab === "profile" && (
          <div className="grid gap-8 md:grid-cols-2">
            {/* Store details */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold border-b pb-2 text-slate-800">Store Details</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center border text-slate-400 font-semibold overflow-hidden">
                  {vendor.storeDetails?.storeLogo ? (
                    <img src={vendor.storeDetails.storeLogo} alt="Logo" className="object-cover w-full h-full" />
                  ) : (
                    "LOGO"
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-lg">{vendor.shopName}</h4>
                  <p className="text-gray-500 text-sm">{vendor.shopType}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Store Address</p>
                  <p className="font-semibold text-slate-800 mt-1">
                    {vendor.storeDetails?.storeAddress || vendor.address?.village || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">City</p>
                  <p className="font-semibold text-slate-800 mt-1">
                    {vendor.storeDetails?.city || vendor.address?.city || vendor.address?.district || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">State</p>
                  <p className="font-semibold text-slate-800 mt-1">
                    {vendor.storeDetails?.state || vendor.address?.state || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Pincode</p>
                  <p className="font-semibold text-slate-800 mt-1">
                    {vendor.storeDetails?.pincode || vendor.address?.pincode || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Service Areas</p>
                  <p className="font-semibold text-slate-800 mt-1">
                    {vendor.storeDetails?.serviceAreas?.join(", ") || vendor.assignedArea || "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Store status</p>
                  <span className="inline-block mt-1 bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded text-xs">
                    {vendor.storeDetails?.storeStatus || "OPEN"}
                  </span>
                </div>
              </div>
            </div>

            {/* Owner Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold border-b pb-2 text-slate-800">Owner Details</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border text-slate-400 overflow-hidden">
                  {vendor.ownerDetails?.profilePhoto ? (
                    <img src={vendor.ownerDetails.profilePhoto} alt="Owner" className="object-cover w-full h-full" />
                  ) : (
                    <User size={32} />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-lg">{vendor.ownerDetails?.ownerName || "N/A"}</h4>
                  <p className="text-gray-500 text-sm">Owner</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Mobile Number</p>
                  <p className="font-semibold text-slate-800 mt-1">
                    {vendor.ownerDetails?.mobileNumber || vendor.phone || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Email</p>
                  <p className="font-semibold text-slate-800 mt-1">
                    {vendor.ownerDetails?.email || vendor.businessEmail || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-6">
            {/* Government documents */}
            <div>
              <h3 className="text-lg font-bold border-b pb-2 text-slate-800 mb-4">Verification Documents</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border p-4 rounded-xl bg-slate-50 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">GST Number</p>
                    <p className="font-semibold text-slate-800 mt-1">{vendor.documents?.gstNumber || "N/A"}</p>
                  </div>
                  <FileText className="text-slate-400" />
                </div>
                <div className="border p-4 rounded-xl bg-slate-50 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">PAN Number</p>
                    <p className="font-semibold text-slate-800 mt-1">{vendor.documents?.pan || "N/A"}</p>
                  </div>
                  <FileText className="text-slate-400" />
                </div>
                <div className="border p-4 rounded-xl bg-slate-50 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Aadhaar Card</p>
                    <p className="font-semibold text-slate-800 mt-1">{vendor.documents?.aadhaar || "N/A"}</p>
                  </div>
                  <FileText className="text-slate-400" />
                </div>
                <div className="border p-4 rounded-xl bg-slate-50 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">FSSAI License</p>
                    <p className="font-semibold text-slate-800 mt-1">{vendor.documents?.fssai || "N/A"}</p>
                  </div>
                  <FileText className="text-slate-400" />
                </div>
              </div>
            </div>

            {/* Bank details */}
            <div>
              <h3 className="text-lg font-bold border-b pb-2 text-slate-800 mb-4">Settlement Bank Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Account Holder</p>
                  <p className="font-semibold text-slate-800 mt-1">{vendor.documents?.bankDetails?.accountHolder || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Account Number</p>
                  <p className="font-semibold text-slate-800 mt-1">{vendor.documents?.bankDetails?.accountNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">IFSC Code</p>
                  <p className="font-semibold text-slate-800 mt-1">{vendor.documents?.bankDetails?.ifsc || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Bank Name</p>
                  <p className="font-semibold text-slate-800 mt-1">{vendor.documents?.bankDetails?.bankName || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "permissions" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold border-b pb-2 text-slate-800 mb-2">Permissions Dashboard</h3>
              <p className="text-xs text-gray-400">Configure what pages, buttons, and APIs this vendor can access.</p>
            </div>

            <div className="divide-y border rounded-xl overflow-hidden bg-slate-50">
              {/* Category */}
              <div className="p-4 grid md:grid-cols-4 items-center">
                <span className="font-bold text-slate-700">Category Access</span>
                <div className="col-span-3 flex flex-wrap gap-6">
                  {["view", "add", "edit", "delete"].map((act) => (
                    <label key={act} className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                      <input
                        type="checkbox"
                        checked={permissions.category?.[act] || false}
                        onChange={() => handlePermissionToggle("category", act)}
                        className="w-4 h-4 rounded text-green-600 border-gray-300 focus:ring-green-500"
                      />
                      <span className="capitalize">{act}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sub Category */}
              <div className="p-4 grid md:grid-cols-4 items-center">
                <span className="font-bold text-slate-700">Sub Category Access</span>
                <div className="col-span-3 flex flex-wrap gap-6">
                  {["view", "add", "edit", "delete"].map((act) => (
                    <label key={act} className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                      <input
                        type="checkbox"
                        checked={permissions.subCategory?.[act] || false}
                        onChange={() => handlePermissionToggle("subCategory", act)}
                        className="w-4 h-4 rounded text-green-600 border-gray-300 focus:ring-green-500"
                      />
                      <span className="capitalize">{act}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Product Family */}
              <div className="p-4 grid md:grid-cols-4 items-center">
                <span className="font-bold text-slate-700">Product Family Access</span>
                <div className="col-span-3 flex flex-wrap gap-6">
                  {["view", "add", "edit", "delete"].map((act) => (
                    <label key={act} className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                      <input
                        type="checkbox"
                        checked={permissions.productFamily?.[act] || false}
                        onChange={() => handlePermissionToggle("productFamily", act)}
                        className="w-4 h-4 rounded text-green-600 border-gray-300 focus:ring-green-500"
                      />
                      <span className="capitalize">{act}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Area Access */}
              <div className="p-4 grid md:grid-cols-4 items-center">
                <span className="font-bold text-slate-700">Area Access</span>
                <div className="col-span-3 flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={permissions.areaAccess?.view || false}
                      onChange={() => handlePermissionToggle("areaAccess", "view")}
                      className="w-4 h-4 rounded text-green-600 border-gray-300 focus:ring-green-500"
                    />
                    <span>View Only</span>
                  </label>
                </div>
              </div>

              {/* Coupons Access */}
              <div className="p-4 grid md:grid-cols-4 items-center">
                <span className="font-bold text-slate-700">Coupon Access</span>
                <div className="col-span-3 flex flex-wrap gap-6">
                  {["view", "create", "edit", "delete"].map((act) => (
                    <label key={act} className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                      <input
                        type="checkbox"
                        checked={permissions.couponAccess?.[act] || false}
                        onChange={() => handlePermissionToggle("couponAccess", act)}
                        className="w-4 h-4 rounded text-green-600 border-gray-300 focus:ring-green-500"
                      />
                      <span className="capitalize">{act === "create" ? "Add / Create" : act}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Product Access */}
              <div className="p-4 grid md:grid-cols-4 items-center">
                <span className="font-bold text-slate-700">Product Access</span>
                <div className="col-span-3 flex flex-wrap gap-6">
                  {["view", "add", "edit", "delete"].map((act) => (
                    <label key={act} className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                      <input
                        type="checkbox"
                        checked={permissions.product?.[act] || false}
                        onChange={() => handlePermissionToggle("product", act)}
                        className="w-4 h-4 rounded text-green-600 border-gray-300 focus:ring-green-500"
                      />
                      <span className="capitalize">{act === "add" ? "Add / Create" : act}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Commission Edit Access */}
              <div className="p-4 grid md:grid-cols-4 items-center">
                <span className="font-bold text-slate-700">Commission Edit Access</span>
                <div className="col-span-3 flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={permissions.commissionEditAccess?.edit || false}
                      onChange={() => handlePermissionToggle("commissionEditAccess", "edit")}
                      className="w-4 h-4 rounded text-green-600 border-gray-300 focus:ring-green-500"
                    />
                    <span>Allow Vendor to Edit Listing Commission Override</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSavePermissions}
                className="flex items-center gap-2 bg-[#1a5d1a] text-white hover:bg-[#154a15] px-6 py-3 rounded-xl font-semibold shadow-sm transition-colors"
              >
                <CheckSquare size={18} /> Save Permissions
              </button>
            </div>
          </div>
        )}



        {activeTab === "serviceAreas" && (
          <div className="space-y-6">
            {/* Store Location Settings (Full-Width Card) */}
            <div className="border p-6 rounded-2xl bg-white shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                <MapPin size={20} className="text-green-600" />
                Store Location & Delivery Range
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left side: inputs */}
                <div className="lg:col-span-1 space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  {isEditingLocation && (
                    <div className="relative">
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Search Address / Location</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={addressSearch}
                          onChange={(e) => handleAddressSearch(e.target.value)}
                          placeholder="Search for area or address..."
                          className="w-full border rounded-xl pl-9 pr-3 py-2 outline-none focus:border-green-600 font-semibold text-sm bg-white"
                        />
                        <Search size={16} className="absolute left-3 top-3.5 text-gray-400" />
                      </div>

                      {searchSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                          {searchSuggestions.map((item) => (
                            <button
                              key={item.place_id}
                              type="button"
                              onClick={() => handleSelectAddressSuggestion(item)}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 border-b last:border-0 font-medium block truncate"
                            >
                              {item.display_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      disabled={!isEditingLocation}
                      value={latInput}
                      onChange={(e) => setLatInput(e.target.value)}
                      placeholder="e.g. 25.6126"
                      className="w-full border rounded-xl px-3 py-2.5 outline-none focus:border-green-600 disabled:bg-slate-100 font-semibold bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      disabled={!isEditingLocation}
                      value={lngInput}
                      onChange={(e) => setLngInput(e.target.value)}
                      placeholder="e.g. 85.1376"
                      className="w-full border rounded-xl px-3 py-2.5 outline-none focus:border-green-600 disabled:bg-slate-100 font-semibold bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Delivery Radius (KM)</label>
                    <input
                      type="number"
                      step="any"
                      disabled={!isEditingLocation}
                      value={radiusInput}
                      onChange={(e) => setRadiusInput(e.target.value)}
                      placeholder="e.g. 5"
                      className="w-full border rounded-xl px-3 py-2.5 outline-none focus:border-green-600 disabled:bg-slate-100 font-semibold bg-white"
                    />
                  </div>
                  <div className="pt-2 flex gap-2">
                    {!isEditingLocation ? (
                      <button
                        onClick={() => setIsEditingLocation(true)}
                        className="w-full bg-[#1a5d1a] hover:bg-[#154a15] text-white py-3 rounded-xl text-sm font-semibold transition"
                      >
                        Edit Location
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleSaveLocation}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-semibold transition"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingLocation(false);
                            setLatInput(vendor.latitude ?? "");
                            setLngInput(vendor.longitude ?? "");
                            setRadiusInput(vendor.deliveryRadius ?? "");
                          }}
                          className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-xl text-sm font-semibold transition"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Right side: large map */}
                <div className="lg:col-span-2 space-y-1 flex flex-col h-full justify-between">
                  <label className="text-xs font-bold text-slate-500 block">Coverage Map</label>
                  <CoverageMap
                    latitude={latInput}
                    longitude={lngInput}
                    radiusKm={radiusInput}
                    isEditable={isEditingLocation}
                    onLocationChange={(lat, lng) => {
                      setLatInput(lat.toFixed(6));
                      setLngInput(lng.toFixed(6));
                    }}
                    height="h-96"
                  />
                  <p className="text-[10px] text-slate-400 font-semibold italic mt-1 text-center">
                    💡 Hint: Drag the pin marker or click on the map to set coordinates (when edit mode is active).
                  </p>
                </div>
              </div>
            </div>

            {/* Service areas table and add area (below map) */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Form to Add/Edit service area */}
                <form onSubmit={handleAddOrUpdateServiceArea} className="border p-6 rounded-2xl bg-slate-50 space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                    <Plus size={20} className="text-green-600" />
                    {editingSaIndex !== null ? "Edit Service Area" : "Add Service Area"}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Pincode</label>
                      <input
                        type="text"
                        value={saPincode}
                        onChange={(e) => setSaPincode(e.target.value)}
                        placeholder="Pincode"
                        className="w-full border rounded-xl px-3 py-2 outline-none focus:border-green-600 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Area Name</label>
                      <input
                        type="text"
                        value={saAreaName}
                        onChange={(e) => setSaAreaName(e.target.value)}
                        placeholder="Area Name"
                        className="w-full border rounded-xl px-3 py-2 outline-none focus:border-green-600 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">City</label>
                      <input
                        type="text"
                        value={saCity}
                        onChange={(e) => setSaCity(e.target.value)}
                        placeholder="City"
                        className="w-full border rounded-xl px-3 py-2 outline-none focus:border-green-600 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">State</label>
                      <input
                        type="text"
                        value={saState}
                        onChange={(e) => setSaState(e.target.value)}
                        placeholder="State"
                        className="w-full border rounded-xl px-3 py-2 outline-none focus:border-green-600 text-sm font-semibold"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    {editingSaIndex !== null && (
                      <button
                        type="button"
                        onClick={() => {
                          setSaPincode("");
                          setSaAreaName("");
                          setSaCity("");
                          setSaState("");
                          setEditingSaIndex(null);
                        }}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className="bg-[#1a5d1a] hover:bg-[#154a15] text-white px-5 py-2 rounded-xl text-sm font-semibold transition"
                    >
                      {editingSaIndex !== null ? "Update Area" : "Add Area"}
                    </button>
                  </div>
                </form>

                {/* Service areas table */}
                <div className="border rounded-2xl bg-white overflow-hidden shadow-sm">
                  <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Assigned Pincodes & Service Areas</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {vendor.serviceAreas?.length || 0} Total
                    </span>
                  </div>
                  
                  {(!vendor.serviceAreas || vendor.serviceAreas.length === 0) ? (
                    <div className="p-8 text-center text-gray-400 font-medium">
                      No service areas assigned. Add service areas above to allow deliveries.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b bg-slate-50 text-slate-500 text-xs font-bold uppercase">
                            <th className="p-4">Pincode</th>
                            <th className="p-4">Area Name</th>
                            <th className="p-4">City</th>
                            <th className="p-4">State</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                          {vendor.serviceAreas.map((sa, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 font-medium text-slate-700">
                              <td className="p-4 font-bold text-slate-800">{sa.pincode}</td>
                              <td className="p-4">{sa.areaName}</td>
                              <td className="p-4">{sa.city}</td>
                              <td className="p-4">{sa.state}</td>
                              <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEditServiceAreaClick(sa, idx)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                    title="Edit"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteServiceArea(idx)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
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
                </div>
              </div>
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

      {/* Admin Edit Vendor Details Modal */}
      {showAdminEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="p-5 border-b flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg">Admin Edit — Vendor Profile & Documents</h3>
                <p className="text-xs text-slate-500 font-semibold">Update vendor store, owner, sensitive documents, and bank payout details</p>
              </div>
              <button
                onClick={() => setShowAdminEditModal(false)}
                className="p-1.5 hover:bg-slate-200 rounded-xl transition text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveAdminEdit} className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Store & Contact Info */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-widest text-purple-700 border-b pb-1.5 font-extrabold">Store & Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs block text-slate-600 mb-1 font-bold">Shop Name *</label>
                    <input
                      type="text"
                      required
                      value={adminEditData.shopName}
                      onChange={(e) => setAdminEditData({ ...adminEditData, shopName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs block text-slate-600 mb-1 font-bold">Shop Type</label>
                    <input
                      type="text"
                      value={adminEditData.shopType}
                      onChange={(e) => setAdminEditData({ ...adminEditData, shopType: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs block text-slate-600 mb-1 font-bold">Business Phone</label>
                    <input
                      type="text"
                      value={adminEditData.phone}
                      onChange={(e) => setAdminEditData({ ...adminEditData, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs block text-slate-600 mb-1 font-bold">Business Email</label>
                    <input
                      type="email"
                      value={adminEditData.businessEmail}
                      onChange={(e) => setAdminEditData({ ...adminEditData, businessEmail: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs block text-slate-600 mb-1 font-bold">WhatsApp Number</label>
                    <input
                      type="text"
                      value={adminEditData.whatsapp}
                      onChange={(e) => setAdminEditData({ ...adminEditData, whatsapp: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs block text-slate-600 mb-1 font-bold">Years in Business</label>
                    <input
                      type="number"
                      value={adminEditData.yearsInBusiness}
                      onChange={(e) => setAdminEditData({ ...adminEditData, yearsInBusiness: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Owner Info */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-widest text-purple-700 border-b pb-1.5 font-extrabold">Owner Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs block text-slate-600 mb-1 font-bold">Owner Name</label>
                    <input
                      type="text"
                      value={adminEditData.ownerDetails.ownerName}
                      onChange={(e) => setAdminEditData({
                        ...adminEditData,
                        ownerDetails: { ...adminEditData.ownerDetails, ownerName: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs block text-slate-600 mb-1 font-bold">Owner Mobile</label>
                    <input
                      type="text"
                      value={adminEditData.ownerDetails.mobileNumber}
                      onChange={(e) => setAdminEditData({
                        ...adminEditData,
                        ownerDetails: { ...adminEditData.ownerDetails, mobileNumber: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs block text-slate-600 mb-1 font-bold">Owner Email</label>
                    <input
                      type="email"
                      value={adminEditData.ownerDetails.email}
                      onChange={(e) => setAdminEditData({
                        ...adminEditData,
                        ownerDetails: { ...adminEditData.ownerDetails, email: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Store Address */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-widest text-purple-700 border-b pb-1.5 font-extrabold">Store Address</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs block text-slate-600 mb-1 font-bold">City / Town</label>
                    <input
                      type="text"
                      value={adminEditData.address.city}
                      onChange={(e) => setAdminEditData({
                        ...adminEditData,
                        address: { ...adminEditData.address, city: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs block text-slate-600 mb-1 font-bold">District</label>
                    <input
                      type="text"
                      value={adminEditData.address.district}
                      onChange={(e) => setAdminEditData({
                        ...adminEditData,
                        address: { ...adminEditData.address, district: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs block text-slate-600 mb-1 font-bold">State</label>
                    <input
                      type="text"
                      value={adminEditData.address.state}
                      onChange={(e) => setAdminEditData({
                        ...adminEditData,
                        address: { ...adminEditData.address, state: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs block text-slate-600 mb-1 font-bold">Address Line</label>
                    <input
                      type="text"
                      value={adminEditData.address.addressLine}
                      onChange={(e) => setAdminEditData({
                        ...adminEditData,
                        address: { ...adminEditData.address, addressLine: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs block text-slate-600 mb-1 font-bold">Pincode</label>
                    <input
                      type="text"
                      value={adminEditData.address.pincode}
                      onChange={(e) => setAdminEditData({
                        ...adminEditData,
                        address: { ...adminEditData.address, pincode: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Sensitive Documents (Admin Editable) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h4 className="text-xs uppercase tracking-widest text-purple-700 font-extrabold">Verification Documents (Admin Managed)</h4>
                  <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200">
                    Admin Exclusive Permission
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs block text-slate-600 mb-1 font-bold">GST Number</label>
                    <input
                      type="text"
                      value={adminEditData.documents.gstNumber}
                      onChange={(e) => setAdminEditData({
                        ...adminEditData,
                        documents: { ...adminEditData.documents, gstNumber: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 uppercase text-sm font-medium"
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                  <div>
                    <label className="text-xs block text-slate-600 mb-1 font-bold">Business Registration No</label>
                    <input
                      type="text"
                      value={adminEditData.documents.businessRegNo}
                      onChange={(e) => setAdminEditData({
                        ...adminEditData,
                        documents: { ...adminEditData.documents, businessRegNo: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs block text-slate-600 mb-1 font-bold">Aadhaar Number</label>
                    <input
                      type="text"
                      value={adminEditData.documents.aadhaar}
                      onChange={(e) => setAdminEditData({
                        ...adminEditData,
                        documents: { ...adminEditData.documents, aadhaar: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs block text-slate-600 mb-1 font-bold">PAN Number</label>
                    <input
                      type="text"
                      value={adminEditData.documents.pan}
                      onChange={(e) => setAdminEditData({
                        ...adminEditData,
                        documents: { ...adminEditData.documents, pan: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 uppercase text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Payout Account (Admin Editable) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h4 className="text-xs uppercase tracking-widest text-purple-700 font-extrabold">Bank Payout Account (Admin Managed)</h4>
                  <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200">
                    Admin Exclusive Permission
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs block text-slate-600 mb-1 font-bold">Account Holder</label>
                    <input
                      type="text"
                      value={adminEditData.documents.bankDetails.accountHolder}
                      onChange={(e) => setAdminEditData({
                        ...adminEditData,
                        documents: {
                          ...adminEditData.documents,
                          bankDetails: { ...adminEditData.documents.bankDetails, accountHolder: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs block text-slate-600 mb-1 font-bold">Bank Name</label>
                    <input
                      type="text"
                      value={adminEditData.documents.bankDetails.bankName}
                      onChange={(e) => setAdminEditData({
                        ...adminEditData,
                        documents: {
                          ...adminEditData.documents,
                          bankDetails: { ...adminEditData.documents.bankDetails, bankName: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs block text-slate-600 mb-1 font-bold">Account Number</label>
                    <input
                      type="text"
                      value={adminEditData.documents.bankDetails.accountNumber}
                      onChange={(e) => setAdminEditData({
                        ...adminEditData,
                        documents: {
                          ...adminEditData.documents,
                          bankDetails: { ...adminEditData.documents.bankDetails, accountNumber: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs block text-slate-600 mb-1 font-bold">IFSC Code</label>
                    <input
                      type="text"
                      value={adminEditData.documents.bankDetails.ifsc}
                      onChange={(e) => setAdminEditData({
                        ...adminEditData,
                        documents: {
                          ...adminEditData.documents,
                          bankDetails: { ...adminEditData.documents.bankDetails, ifsc: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500 uppercase text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAdminEditModal(false)}
                  className="px-5 py-2.5 border rounded-xl hover:bg-slate-50 font-bold transition cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminEditSaving}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition shadow-md disabled:bg-slate-300 cursor-pointer text-sm"
                >
                  {adminEditSaving ? "Saving Changes..." : "Save All Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}