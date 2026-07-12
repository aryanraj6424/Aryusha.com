import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../../components/Toast";

export default function AddVendor() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    // Vendor Info
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",

    // Business
    gstNumber: "",
    panNumber: "",
    businessType: "",

    // Location
    address: "",
    city: "",
    state: "",
    pincode: "",

    // Bank
    accountHolder: "",
    accountNumber: "",
    ifsc: "",
    bankName: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.businessName || !formData.phone || !formData.email) {
      showToast({ type: "warning", message: "Business Name, Phone, and Email are required." });
      return;
    }

    try {
      const payload = {
        shopName: formData.businessName,
        shopType: formData.businessType || "Individual",
        businessEmail: formData.email,
        phone: formData.phone,
        password: "password123", // default password
        ownerDetails: {
          ownerName: formData.ownerName,
          mobileNumber: formData.phone,
          email: formData.email,
          profilePhoto: "",
        },
        storeDetails: {
          storeName: formData.businessName,
          storeLogo: "",
          storeAddress: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          serviceAreas: [],
          storeStatus: "open",
        },
        documents: {
          businessRegNo: "",
          gstNumber: formData.gstNumber,
          resellerCertificate: "",
          aadhaar: "",
          pan: formData.panNumber,
          fssai: "",
          bankDetails: {
            accountHolder: formData.accountHolder,
            accountNumber: formData.accountNumber,
            ifsc: formData.ifsc,
            bankName: formData.bankName,
          },
        },
      };

      await axios.post(`${import.meta.env.VITE_API_URL}/admin/vendors`, payload);
      showToast({ type: "success", message: "Vendor added successfully." });
      navigate("/admin/vendors");
    } catch (error) {
      console.error(error);
      showToast({ type: "error", message: error.response?.data?.message || "Failed to add vendor." });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/admin/vendors"
            className="flex items-center gap-2 text-green-600 hover:underline"
          >
            <ArrowLeft size={18} />
            Back
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Add Vendor</h1>
        </div>
        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 rounded-lg bg-[#1a5d1a] px-5 py-2.5 text-white hover:bg-[#154a15]"
        >
          <Save size={18} />
          Save Vendor
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Vendor Information */}
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-5 text-xl font-semibold">Vendor Information</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <input
              type="text"
              name="businessName"
              placeholder="Business Name"
              value={formData.businessName}
              onChange={handleChange}
              className="rounded-lg border p-3"
              required
            />
            <input
              type="text"
              name="ownerName"
              placeholder="Owner Name"
              value={formData.ownerName}
              onChange={handleChange}
              className="rounded-lg border p-3"
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="rounded-lg border p-3"
              required
            />
            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              className="rounded-lg border p-3"
              required
            />
          </div>
        </div>

        {/* Business Information */}
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-5 text-xl font-semibold">Business Information</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <input
              type="text"
              name="gstNumber"
              placeholder="GST Number"
              value={formData.gstNumber}
              onChange={handleChange}
              className="rounded-lg border p-3"
            />
            <input
              type="text"
              name="panNumber"
              placeholder="PAN Number"
              value={formData.panNumber}
              onChange={handleChange}
              className="rounded-lg border p-3"
            />
            <select
              name="businessType"
              value={formData.businessType}
              onChange={handleChange}
              className="rounded-lg border p-3"
            >
              <option value="">Select Business Type</option>
              <option>Individual</option>
              <option>Partnership</option>
              <option>Private Limited</option>
              <option>LLP</option>
            </select>
          </div>
        </div>

        {/* Location */}
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-5 text-xl font-semibold">Business Address</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
              className="rounded-lg border p-3 md:col-span-2"
            />
            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleChange}
              className="rounded-lg border p-3"
            />
            <input
              type="text"
              name="state"
              placeholder="State"
              value={formData.state}
              onChange={handleChange}
              className="rounded-lg border p-3"
            />
            <input
              type="text"
              name="pincode"
              placeholder="Pincode"
              value={formData.pincode}
              onChange={handleChange}
              className="rounded-lg border p-3"
            />
          </div>
        </div>

        {/* Bank */}
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-5 text-xl font-semibold">Bank Details</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <input
              type="text"
              name="accountHolder"
              placeholder="Account Holder Name"
              value={formData.accountHolder}
              onChange={handleChange}
              className="rounded-lg border p-3"
            />
            <input
              type="text"
              name="accountNumber"
              placeholder="Account Number"
              value={formData.accountNumber}
              onChange={handleChange}
              className="rounded-lg border p-3"
            />
            <input
              type="text"
              name="ifsc"
              placeholder="IFSC Code"
              value={formData.ifsc}
              onChange={handleChange}
              className="rounded-lg border p-3"
            />
            <input
              type="text"
              name="bankName"
              placeholder="Bank Name"
              value={formData.bankName}
              onChange={handleChange}
              className="rounded-lg border p-3"
            />
          </div>
        </div>
      </form>
    </div>
  );
}