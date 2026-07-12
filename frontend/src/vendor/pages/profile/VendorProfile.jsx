import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  TrendingUp,
  Package,
  Wallet,
  MapPin,
  ChevronRight,
  Edit,
  X,
  Building2,
  FileText,
  User,
  ShieldCheck
} from "lucide-react";
import axios from "axios";
import { useVendor } from "../../context/VendorContext";
import { calculateVendorProfileCompletion } from "../../utils/profileCompletion";
import { uploadFile } from "../../../services/uploadService";
import { useToast } from "../../../components/Toast";

export default function VendorProfile() {
  const navigate = useNavigate();
  const { vendor, refresh } = useVendor();
  const { showToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingLogo(true);
      const data = await uploadFile(file, "vendors");
      setProfileData((prev) => ({
        ...prev,
        storeDetails: { ...prev.storeDetails, storeLogo: data.url }
      }));
    } catch (err) {
      console.error(err);
      showToast({ type: "error", message: err.response?.data?.message || "Failed to upload image" });
    } finally {
      setUploadingLogo(false);
    }
  };

  // Profile Edit fields state
  const [profileData, setProfileData] = useState({
    shopName: "",
    phone: "",
    businessEmail: "",
    whatsapp: "",
    address: {
      city: "",
      state: "",
      pincode: "",
      district: "",
      addressLine: ""
    },
    ownerDetails: {
      ownerName: "",
      mobileNumber: "",
      email: ""
    },
    storeDetails: {
      storeName: "",
      storeLogo: "",
      storeAddress: ""
    },
    documents: {
      gstNumber: "",
      businessRegNo: "",
      bankDetails: {
        accountHolder: "",
        accountNumber: "",
        ifsc: "",
        bankName: ""
      }
    }
  });

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("vendorToken");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.get(`${import.meta.env.VITE_API_URL}/vendor/dashboard`, { headers });
      if (res.data.success) {
        setOrders(res.data.orders || []);
        setTotalProducts(res.data.totalProducts || 0);
      }
    } catch (error) {
      console.error("Error loading vendor profile stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Sync editor values when vendor profile changes
  useEffect(() => {
    if (vendor) {
      setProfileData({
        shopName: vendor.shopName || "",
        phone: vendor.phone || "",
        businessEmail: vendor.businessEmail || "",
        whatsapp: vendor.whatsapp || "",
        address: {
          city: vendor.address?.city || "",
          state: vendor.address?.state || "",
          pincode: vendor.address?.pincode || "",
          district: vendor.address?.district || "",
          addressLine: vendor.address?.addressLine || ""
        },
        ownerDetails: {
          ownerName: vendor.ownerDetails?.ownerName || "",
          mobileNumber: vendor.ownerDetails?.mobileNumber || "",
          email: vendor.ownerDetails?.email || ""
        },
        storeDetails: {
          storeName: vendor.storeDetails?.storeName || "",
          storeLogo: vendor.storeDetails?.storeLogo || "",
          storeAddress: vendor.storeDetails?.storeAddress || ""
        },
        documents: {
          gstNumber: vendor.documents?.gstNumber || "",
          businessRegNo: vendor.documents?.businessRegNo || "",
          bankDetails: {
            accountHolder: vendor.documents?.bankDetails?.accountHolder || "",
            accountNumber: vendor.documents?.bankDetails?.accountNumber || "",
            ifsc: vendor.documents?.bankDetails?.ifsc || "",
            bankName: vendor.documents?.bankDetails?.bankName || ""
          }
        }
      });
    }
  }, [vendor]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("vendorToken");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.put(`${import.meta.env.VITE_API_URL}/vendor/profile`, profileData, { headers });
      if (res.data.success) {
        showToast({ type: "success", message: "Profile details updated successfully!" });
        setShowEditModal(false);
        await refresh();
        fetchDashboardData();
      }
    } catch (error) {
      console.error(error);
      showToast({ type: "error", message: error.response?.data?.message || "Failed to update profile details." });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !vendor) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Calculate completion
  const { percentage, checklist, completed, total } = calculateVendorProfileCompletion(vendor, totalProducts);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Vendor Profile</h1>
          <p className="text-slate-500 font-medium">Manage your shop, bank account, and onboarding details</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refresh()}
            className="px-3.5 py-2.5 border rounded-xl hover:bg-slate-50 font-bold text-xs text-slate-600 transition flex items-center gap-1.5 shadow-sm bg-white cursor-pointer"
            title="Force sync database profile details"
          >
            🔄 Sync Data
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm text-xs cursor-pointer"
          >
            <Edit size={14} /> Edit Shop Settings
          </button>
        </div>
      </div>

      {/* Onboarding Checklist Tracker */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-slate-800 text-lg">Profile & Onboarding Completion</h3>
            <p className="text-slate-400 text-xs font-semibold mt-0.5">
              Fill in all registration fields to go fully live on QuickKart
            </p>
          </div>
          <span className="text-2xl font-black text-purple-600">{percentage}%</span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Checklist */}
        {percentage < 100 && (
          <div className="pt-4 border-t border-slate-50">
            <h4 className="font-bold text-slate-700 text-sm mb-3">Onboarding Checklist ({completed}/{total} completed)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {checklist.map((item) => (
                <div
                  key={item.key}
                  className={`flex items-start justify-between p-3 rounded-2xl border text-xs font-semibold ${
                    item.value
                      ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                      : "bg-amber-50 border-amber-100 text-amber-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{item.value ? "✓" : "🚧"}</span>
                    <div>
                      <p className="font-extrabold">{item.label}</p>
                      {item.value && item.detail && (
                        <p className="text-[10px] text-emerald-600 mt-0.5">{item.detail}</p>
                      )}
                    </div>
                  </div>
                  {!item.value && (
                    <button
                      onClick={() => {
                        if (item.key === "products") {
                          navigate("/vendor/products");
                        } else if (item.key === "location") {
                          navigate("/vendor/assigned-area");
                        } else {
                          setShowEditModal(true);
                        }
                      }}
                      className="text-[10px] font-black text-amber-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      Complete <ChevronRight size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Business Profile Details */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-8">
        {/* Store profile head */}
        <div className="flex flex-col sm:flex-row items-center gap-6 border-b pb-6 border-slate-100">
          <div className="w-24 h-24 rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden shadow-inner">
            {vendor.storeDetails?.storeLogo ? (
              <img src={vendor.storeDetails.storeLogo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Building2 size={36} className="text-slate-355" />
            )}
          </div>
          <div className="text-center sm:text-left space-y-1.5">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 justify-center sm:justify-start">
              {vendor.shopName}
              {vendor.accountStatus === "active" && (
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-0.5">
                  <ShieldCheck size={10} /> Live Partner
                </span>
              )}
            </h2>
            <p className="text-sm font-bold text-slate-500">Business Type: <span className="text-slate-700 capitalize">{vendor.shopType || "Not Specified"}</span></p>
            <p className="text-xs text-slate-400 font-semibold">Verification Status: <span className="text-purple-600 capitalize font-extrabold">{vendor.status || "Pending Approval"}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm font-semibold text-slate-600">
          {/* Store details */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-800 border-b pb-2 flex items-center gap-2">
              <Building2 size={18} className="text-purple-600" /> Store Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Business Phone</p>
                <p className="text-slate-800 mt-1 font-extrabold">{vendor.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Business Email</p>
                <p className="text-slate-800 mt-1 font-extrabold break-all">{vendor.businessEmail || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">WhatsApp Number</p>
                <p className="text-slate-800 mt-1 font-extrabold">{vendor.whatsapp || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Years In Business</p>
                <p className="text-slate-800 mt-1 font-extrabold">{vendor.yearsInBusiness ? `${vendor.yearsInBusiness} Years` : "N/A"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Store Address</p>
                <p className="text-slate-800 mt-1 font-extrabold">
                  {vendor.address?.addressLine ? `${vendor.address.addressLine}, ` : ""}
                  {vendor.address?.city ? `${vendor.address.city}, ` : ""}
                  {vendor.address?.district ? `${vendor.address.district}, ` : ""}
                  {vendor.address?.state ? `${vendor.address.state} - ` : ""}
                  {vendor.address?.pincode || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Owner details */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-800 border-b pb-2 flex items-center gap-2">
              <User size={18} className="text-purple-600" /> Owner Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Owner Name</p>
                <p className="text-slate-800 mt-1 font-extrabold">{vendor.ownerDetails?.ownerName || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Owner Mobile</p>
                <p className="text-slate-800 mt-1 font-extrabold">{vendor.ownerDetails?.mobileNumber || "N/A"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Owner Email</p>
                <p className="text-slate-800 mt-1 font-extrabold">{vendor.ownerDetails?.email || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Registration docs */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-800 border-b pb-2 flex items-center gap-2">
              <FileText size={18} className="text-purple-600" /> Documents & Registration
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">GST Number</p>
                <p className="text-slate-800 mt-1 font-extrabold uppercase">{vendor.documents?.gstNumber || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Business Reg No</p>
                <p className="text-slate-800 mt-1 font-extrabold">{vendor.documents?.businessRegNo || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Payout Details */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-800 border-b pb-2 flex items-center gap-2">
              <Wallet size={18} className="text-purple-600" /> Bank Payout Accounts
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Bank Name</p>
                <p className="text-slate-800 mt-1 font-extrabold">{vendor.documents?.bankDetails?.bankName || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Account Holder</p>
                <p className="text-slate-800 mt-1 font-extrabold">{vendor.documents?.bankDetails?.accountHolder || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Account Number</p>
                <p className="text-slate-850 mt-1 font-black bg-slate-50 px-2 py-1 rounded border border-slate-250 tracking-wider">{vendor.documents?.bankDetails?.accountNumber || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Bank IFSC Code</p>
                <p className="text-slate-800 mt-1 font-extrabold uppercase">{vendor.documents?.bankDetails?.ifsc || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Location & Service Coverage */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-800 border-b pb-2 flex items-center gap-2">
              <MapPin size={18} className="text-purple-600" /> Location & Service Coverage
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Assigned Geolocation</p>
                <p className="text-slate-800 mt-1 font-extrabold">
                  {vendor.latitude !== null && vendor.longitude !== null && vendor.latitude !== undefined && vendor.longitude !== undefined
                    ? `${vendor.latitude}, ${vendor.longitude}`
                    : "Not Assigned"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Delivery Radius</p>
                <p className="text-slate-800 mt-1 font-extrabold">
                  {vendor.deliveryRadius ? `${vendor.deliveryRadius} KM` : "0 KM"}
                </p>
              </div>
              {vendor.assignedArea && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Assigned Service Area</p>
                  <p className="text-slate-800 mt-1 font-extrabold">{vendor.assignedArea}</p>
                </div>
              )}
              {vendor.serviceAreas && vendor.serviceAreas.length > 0 && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Covered Postal / Pincode Areas</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {vendor.serviceAreas.map((area, idx) => (
                      <span key={idx} className="bg-purple-50 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-xl border border-purple-100 shadow-sm">
                        📍 {area.pincode} - {area.areaName} ({area.city})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Catalog Info */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-800 border-b pb-2 flex items-center gap-2">
              <Package size={18} className="text-purple-600" /> Catalog Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Products Listed</p>
                <p className="text-slate-800 mt-1 font-extrabold">{totalProducts} Products</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Shop Profile Details Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl mx-4 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-xl font-black text-slate-800">Edit Shop Profile Settings</h3>
                <p className="text-slate-400 text-[11px] font-bold mt-0.5">Update registration details for onboarding validation</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-6 text-sm font-semibold text-slate-700">
              {/* Shop Section */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-widest text-slate-400 border-b pb-1.5 font-extrabold">Shop Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs block text-slate-500 mb-1">Shop Name *</label>
                    <input
                      type="text"
                      required
                      value={profileData.shopName}
                      onChange={(e) => setProfileData({ ...profileData, shopName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:border-purple-600 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs block text-slate-500 mb-1">WhatsApp Mobile</label>
                    <input
                      type="text"
                      value={profileData.whatsapp}
                      onChange={(e) => setProfileData({ ...profileData, whatsapp: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:border-purple-600 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Owner Info */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-widest text-slate-400 border-b pb-1.5 font-extrabold">Owner Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs block text-slate-500 mb-1">Owner Name *</label>
                    <input
                      type="text"
                      required
                      value={profileData.ownerDetails.ownerName}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        ownerDetails: { ...profileData.ownerDetails, ownerName: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:border-purple-600 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs block text-slate-500 mb-1 font-semibold">Store Logo / Banner Image</label>
                    <div className="flex items-center gap-2 mt-1">
                      {profileData.storeDetails.storeLogo && (
                        <img src={profileData.storeDetails.storeLogo} alt="Logo Preview" className="w-10 h-10 object-contain border rounded bg-white p-1" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                      />
                    </div>
                    {uploadingLogo && <span className="text-[10px] text-purple-650 font-semibold block mt-1">Uploading to Cloudinary...</span>}
                  </div>
                </div>
              </div>

              {/* Business Address */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-widest text-slate-400 border-b pb-1.5 font-extrabold">Store Address</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs block text-slate-500 mb-1">City / Town</label>
                    <input
                      type="text"
                      value={profileData.address.city}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        address: { ...profileData.address, city: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:border-purple-600 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs block text-slate-500 mb-1">District</label>
                    <input
                      type="text"
                      value={profileData.address.district}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        address: { ...profileData.address, district: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:border-purple-600 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs block text-slate-500 mb-1">State</label>
                    <input
                      type="text"
                      value={profileData.address.state}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        address: { ...profileData.address, state: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:border-purple-600 font-medium"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs block text-slate-500 mb-1">Full Address Line</label>
                    <input
                      type="text"
                      value={profileData.address.addressLine}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        address: { ...profileData.address, addressLine: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:border-purple-600 font-medium"
                      placeholder="Shop No, Street, Landmark"
                    />
                  </div>
                  <div>
                    <label className="text-xs block text-slate-500 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={profileData.address.pincode}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        address: { ...profileData.address, pincode: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:border-purple-600 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* GST / Business Docs */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-widest text-slate-400 border-b pb-1.5 font-extrabold">GST / Registration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs block text-slate-500 mb-1">GST Number</label>
                    <input
                      type="text"
                      value={profileData.documents.gstNumber}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        documents: { ...profileData.documents, gstNumber: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:border-purple-600 uppercase font-medium"
                      placeholder="e.g. 22AAAAA0000A1Z5"
                    />
                  </div>
                  <div>
                    <label className="text-xs block text-slate-500 mb-1">Business Registration No</label>
                    <input
                      type="text"
                      value={profileData.documents.businessRegNo}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        documents: { ...profileData.documents, businessRegNo: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:border-purple-600 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Bank payout Details */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-widest text-slate-400 border-b pb-1.5 font-extrabold">Bank Payout Account</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs block text-slate-500 mb-1">Account Holder</label>
                    <input
                      type="text"
                      value={profileData.documents.bankDetails.accountHolder}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        documents: {
                          ...profileData.documents,
                          bankDetails: { ...profileData.documents.bankDetails, accountHolder: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:border-purple-600 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs block text-slate-500 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={profileData.documents.bankDetails.bankName}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        documents: {
                          ...profileData.documents,
                          bankDetails: { ...profileData.documents.bankDetails, bankName: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:border-purple-600 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs block text-slate-500 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={profileData.documents.bankDetails.accountNumber}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        documents: {
                          ...profileData.documents,
                          bankDetails: { ...profileData.documents.bankDetails, accountNumber: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:border-purple-600 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs block text-slate-500 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={profileData.documents.bankDetails.ifsc}
                      onChange={(e) => setProfileData({
                        ...profileData,
                        documents: {
                          ...profileData.documents,
                          bankDetails: { ...profileData.documents.bankDetails, ifsc: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 border rounded-xl outline-none focus:border-purple-600 uppercase font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 border rounded-xl hover:bg-slate-50 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition shadow-md disabled:bg-slate-300 cursor-pointer"
                >
                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
