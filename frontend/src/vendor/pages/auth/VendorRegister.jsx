// import { useState } from "react";
// import { registerVendor } from "../../services/vendorApi";
// export default function VendorRegister() {

//   const [formData, setFormData] =
//     useState({});

//   const handleChange = (e) => {

//     setFormData({
//       ...formData,
//       [e.target.name]:
//         e.target.value,
//     });

//   };

//  const handleSubmit =
//   async (e) => {
//     e.preventDefault();

//     try {

//       const response =
//         await registerVendor(
//           formData
//         );

//       alert(
//         response.message
//       );

//       console.log(response);

//     } catch (error) {

//       console.log(error);

//       alert(
//         error?.response?.data
//           ?.message ||
//           "Registration Failed"
//       );

//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 p-6">

//       <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-8">

//         <h2 className="text-3xl font-bold mb-8">
//           Vendor Registration
//         </h2>

//         <form
//           onSubmit={handleSubmit}
//           className="space-y-8"
//         >

//           {/* Shop Info */}

//           <div>

//             <h3 className="font-bold text-lg mb-4">
//               Shop Information
//             </h3>

//             <div className="grid md:grid-cols-2 gap-4">

//               <input
//                 name="shopName"
//                 placeholder="Shop Name"
//                 onChange={handleChange}
//                 className="border p-3 rounded-lg"
//               />

//               <input
//                 name="shopType"
//                 placeholder="Shop Type"
//                 onChange={handleChange}
//                 className="border p-3 rounded-lg"
//               />

//               <input
//                 name="yearsInBusiness"
//                 placeholder="Years Of Business"
//                 onChange={handleChange}
//                 className="border p-3 rounded-lg"
//               />

//               <input
//                 name="employees"
//                 placeholder="Number Of Employees"
//                 onChange={handleChange}
//                 className="border p-3 rounded-lg"
//               />

//             </div>

//           </div>

//           {/* Contact */}

//           <div>

//             <h3 className="font-bold text-lg mb-4">
//               Contact Details
//             </h3>

//             <div className="grid md:grid-cols-2 gap-4">

//               <input
//                 name="businessEmail"
//                 placeholder="Business Email"
//                 onChange={handleChange}
//                 className="border p-3 rounded-lg"
//               />

//               <input
//                 name="phone"
//                 placeholder="Phone Number"
//                 onChange={handleChange}
//                 className="border p-3 rounded-lg"
//               />

//               <input
//                 name="whatsapp"
//                 placeholder="WhatsApp Number"
//                 onChange={handleChange}
//                 className="border p-3 rounded-lg"
//               />

//             </div>

//           </div>

//           {/* Address */}

//           <div>

//             <h3 className="font-bold text-lg mb-4">
//               Shop Address
//             </h3>

//             <div className="grid md:grid-cols-2 gap-4">

//               <input
//                 name="village"
//                 placeholder="Village Address"
//                 onChange={handleChange}
//                 className="border p-3 rounded-lg"
//               />

//               <input
//                 name="district"
//                 placeholder="District"
//                 onChange={handleChange}
//                 className="border p-3 rounded-lg"
//               />

//               <input
//                 name="state"
//                 placeholder="State"
//                 onChange={handleChange}
//                 className="border p-3 rounded-lg"
//               />

//               <input
//                 name="pincode"
//                 placeholder="Pincode"
//                 onChange={handleChange}
//                 className="border p-3 rounded-lg"
//               />

//               <input
//                 name="country"
//                 placeholder="Country"
//                 onChange={handleChange}
//                 className="border p-3 rounded-lg"
//               />

//             </div>

//           </div>

//           {/* Documents */}

//           <div>

//             <h3 className="font-bold text-lg mb-4">
//               Business Documents
//             </h3>

//             <div className="grid md:grid-cols-2 gap-4">

//               <input
//                 name="businessRegNo"
//                 placeholder="Business Registration Number"
//                 onChange={handleChange}
//                 className="border p-3 rounded-lg"
//               />

//               <input
//                 name="gstNumber"
//                 placeholder="GST Number"
//                 onChange={handleChange}
//                 className="border p-3 rounded-lg"
//               />

//               <input
//                 name="resellerCertificate"
//                 placeholder="Reseller Certificate Number"
//                 onChange={handleChange}
//                 className="border p-3 rounded-lg"
//               />

//               <input
//                 name="aadhaar"
//                 placeholder="Aadhaar Number"
//                 onChange={handleChange}
//                 className="border p-3 rounded-lg"
//               />

//               <input
//                 name="pan"
//                 placeholder="PAN Number"
//                 onChange={handleChange}
//                 className="border p-3 rounded-lg"
//               />

//               <input
//                 type="file"
//                 className="border p-3 rounded-lg"
//               />

//               <input
//                 type="file"
//                 className="border p-3 rounded-lg"
//               />

//             </div>

//           </div>

//           <button
//             type="submit"
//             className="bg-purple-600 text-white px-8 py-3 rounded-xl"
//           >
//             Submit Registration
//           </button>

//         </form>

//       </div>

//     </div>
//   );
// }

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerVendor } from "../../services/vendorApi";
import { uploadFile } from "../../../services/uploadService";

export default function VendorRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    shopName: "",
    shopType: "",
    yearsInBusiness: "",
    employees: "",

    businessEmail: "",
    phone: "",
    whatsapp: "",

    village: "",
    district: "",
    state: "",
    pincode: "",
    country: "",

    businessRegNo: "",
    gstNumber: "",
    resellerCertificate: "",
    aadhaar: "",
    pan: "",
    storeFrontImage: "",
    storeBackImage: "",

    password: "",
    confirmPassword: "",
  });

  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);

  const handleFrontUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingFront(true);
      const data = await uploadFile(file, "vendors");
      setFormData((prev) => ({ ...prev, storeFrontImage: data.url }));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to upload image");
    } finally {
      setUploadingFront(false);
    }
  };

  const handleBackUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingBack(true);
      const data = await uploadFile(file, "vendors");
      setFormData((prev) => ({ ...prev, storeBackImage: data.url }));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to upload image");
    } finally {
      setUploadingBack(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await registerVendor(formData);
      navigate("/vendor/pending-approval");
    } catch (error) {
      console.log(error);

      alert(error?.response?.data?.message || "Registration Failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-8">
        <h2 className="text-3xl font-bold mb-8">Vendor Registration</h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Shop Info */}

          <div>
            <h3 className="font-bold text-lg mb-4">Shop Information</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <input
                name="shopName"
                placeholder="Shop Name"
                onChange={handleChange}
                className="border p-3 rounded-lg"
                required
              />

              <input
                name="shopType"
                placeholder="Shop Type"
                onChange={handleChange}
                className="border p-3 rounded-lg"
                required
              />

              <input
                name="yearsInBusiness"
                placeholder="Years Of Business"
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />

              <input
                name="employees"
                placeholder="Number Of Employees"
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />
            </div>
          </div>

          {/* Contact */}

          <div>
            <h3 className="font-bold text-lg mb-4">Contact Details</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="email"
                name="businessEmail"
                placeholder="Business Email"
                onChange={handleChange}
                className="border p-3 rounded-lg"
                required
              />

              <input
                name="phone"
                placeholder="Phone Number"
                onChange={handleChange}
                className="border p-3 rounded-lg"
                required
              />

              <input
                name="whatsapp"
                placeholder="WhatsApp Number"
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />
            </div>
          </div>

          {/* Address */}

          <div>
            <h3 className="font-bold text-lg mb-4">Shop Address</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <input
                name="village"
                placeholder="Village Address"
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />

              <input
                name="district"
                placeholder="District"
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />

              <input
                name="state"
                placeholder="State"
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />

              <input
                name="pincode"
                placeholder="Pincode"
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />

              <input
                name="country"
                placeholder="Country"
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />
            </div>
          </div>

          {/* Documents */}

          <div>
            <h3 className="font-bold text-lg mb-4">Business Documents</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <input
                name="businessRegNo"
                placeholder="Business Registration Number"
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />

              <input
                name="gstNumber"
                placeholder="GST Number"
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />

              <input
                name="resellerCertificate"
                placeholder="Reseller Certificate Number"
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />

              <input
                name="aadhaar"
                placeholder="Aadhaar Number"
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />

              <input
                name="pan"
                placeholder="PAN Number"
                onChange={handleChange}
                className="border p-3 rounded-lg"
              />

              <div className="flex flex-col gap-1 border p-3 rounded-lg bg-slate-50">
                <label className="text-xs font-semibold text-slate-500">Store Front Image (Required)</label>
                <div className="flex items-center gap-2 mt-1">
                  {formData.storeFrontImage && (
                    <img src={formData.storeFrontImage} alt="Front Preview" className="w-10 h-10 object-contain border rounded bg-white p-1" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFrontUpload}
                    className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                  />
                </div>
                {uploadingFront && <span className="text-[10px] text-purple-650 font-semibold mt-1">Uploading...</span>}
              </div>

              <div className="flex flex-col gap-1 border p-3 rounded-lg bg-slate-50">
                <label className="text-xs font-semibold text-slate-500">Store Back/Interior Image</label>
                <div className="flex items-center gap-2 mt-1">
                  {formData.storeBackImage && (
                    <img src={formData.storeBackImage} alt="Back Preview" className="w-10 h-10 object-contain border rounded bg-white p-1" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackUpload}
                    className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                  />
                </div>
                {uploadingBack && <span className="text-[10px] text-purple-650 font-semibold mt-1">Uploading...</span>}
              </div>
            </div>
          </div>

          {/* Account Security */}

          <div>
            <h3 className="font-bold text-lg mb-4">Account Security</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="password"
                name="password"
                placeholder="Password"
                onChange={handleChange}
                className="border p-3 rounded-lg"
                required
              />

              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                onChange={handleChange}
                className="border p-3 rounded-lg"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-purple-600 text-white px-8 py-3 rounded-xl hover:bg-purple-700"
          >
            Submit Registration
          </button>
        </form>
      </div>
    </div>
  );
}
