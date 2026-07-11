import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

export default function EditVendor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    businessType: "",
    gstNumber: "",
    panNumber: "",
    fssai: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    accountHolder: "",
    accountNumber: "",
    ifsc: "",
    bankName: "",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/vendors/${id}`);
        const v = res.data.vendor;
        setFormData({
          businessName: v.shopName || "",
          ownerName: v.ownerDetails?.ownerName || "",
          email: v.businessEmail || "",
          phone: v.phone || "",
          businessType: v.shopType || "",
          gstNumber: v.documents?.gstNumber || "",
          panNumber: v.documents?.pan || "",
          fssai: v.documents?.fssai || "",
          address: v.storeDetails?.storeAddress || v.address?.village || "",
          city: v.storeDetails?.city || v.address?.city || "",
          state: v.storeDetails?.state || v.address?.state || "",
          pincode: v.storeDetails?.pincode || v.address?.pincode || "",
          accountHolder: v.documents?.bankDetails?.accountHolder || "",
          accountNumber: v.documents?.bankDetails?.accountNumber || "",
          ifsc: v.documents?.bankDetails?.ifsc || "",
          bankName: v.documents?.bankDetails?.bankName || "",
        });
      } catch (error) {
        console.error(error);
        alert("Failed to load vendor details.");
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
  }, [id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        shopName: formData.businessName,
        shopType: formData.businessType,
        businessEmail: formData.email,
        phone: formData.phone,
        ownerDetails: {
          ownerName: formData.ownerName,
          mobileNumber: formData.phone,
          email: formData.email,
        },
        storeDetails: {
          storeName: formData.businessName,
          storeAddress: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
        documents: {
          gstNumber: formData.gstNumber,
          pan: formData.panNumber,
          fssai: formData.fssai,
          bankDetails: {
            accountHolder: formData.accountHolder,
            accountNumber: formData.accountNumber,
            ifsc: formData.ifsc,
            bankName: formData.bankName,
          },
        },
      };

      await axios.put(`${import.meta.env.VITE_API_URL}/admin/vendors/${id}`, payload);
      alert("Vendor updated successfully.");
      navigate("/admin/vendors");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to update vendor.");
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading vendor details...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Vendor</h1>
        <p className="text-gray-500 mt-1">Vendor ID: {id}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Vendor Information */}
        <div className="rounded-xl bg-white p-6 shadow space-y-5">
          <h2 className="text-xl font-semibold">Vendor Information</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="font-medium text-sm text-slate-700 block mb-1">Business Name</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
                required
              />
            </div>
            <div>
              <label className="font-medium text-sm text-slate-700 block mb-1">Owner Name</label>
              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />
            </div>
            <div>
              <label className="font-medium text-sm text-slate-700 block mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
                required
              />
            </div>
            <div>
              <label className="font-medium text-sm text-slate-700 block mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
                required
              />
            </div>
          </div>
        </div>

        {/* Business Information */}
        <div className="rounded-xl bg-white p-6 shadow space-y-5">
          <h2 className="text-xl font-semibold">Business Information</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="font-medium text-sm text-slate-700 block mb-1">GST Number</label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />
            </div>
            <div>
              <label className="font-medium text-sm text-slate-700 block mb-1">PAN Number</label>
              <input
                type="text"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />
            </div>
            <div>
              <label className="font-medium text-sm text-slate-700 block mb-1">FSSAI Number</label>
              <input
                type="text"
                name="fssai"
                value={formData.fssai}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />
            </div>
            <div>
              <label className="font-medium text-sm text-slate-700 block mb-1">Business Type</label>
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              >
                <option value="">Select Business Type</option>
                <option>Individual</option>
                <option>Partnership</option>
                <option>Private Limited</option>
                <option>LLP</option>
              </select>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="rounded-xl bg-white p-6 shadow space-y-5">
          <h2 className="text-xl font-semibold">Business Address</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="font-medium text-sm text-slate-700 block mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />
            </div>
            <div>
              <label className="font-medium text-sm text-slate-700 block mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />
            </div>
            <div>
              <label className="font-medium text-sm text-slate-700 block mb-1">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />
            </div>
            <div>
              <label className="font-medium text-sm text-slate-700 block mb-1">Pincode</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="rounded-xl bg-white p-6 shadow space-y-5">
          <h2 className="text-xl font-semibold">Bank Details</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="font-medium text-sm text-slate-700 block mb-1">Account Holder Name</label>
              <input
                type="text"
                name="accountHolder"
                value={formData.accountHolder}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />
            </div>
            <div>
              <label className="font-medium text-sm text-slate-700 block mb-1">Account Number</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />
            </div>
            <div>
              <label className="font-medium text-sm text-slate-700 block mb-1">IFSC Code</label>
              <input
                type="text"
                name="ifsc"
                value={formData.ifsc}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />
            </div>
            <div>
              <label className="font-medium text-sm text-slate-700 block mb-1">Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-lg border text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-[#1a5d1a] text-white hover:bg-[#154a15]"
          >
            Update Vendor
          </button>
        </div>
      </form>
    </div>
  );
}