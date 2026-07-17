// import { useState, useEffect } from "react";
// import {
//   createAddress,
//   getUserAddresses,
//   deleteAddress,
// } from "../../services/addressApi";

// function AddressesPage() {
//   const [formData, setFormData] = useState({
//     fullName: "",
//     phoneNumber: "",
//     houseNo: "",
//     area: "",
//     city: "",
//     state: "",
//     pincode: "",
//     addressType: "Home",
//   });

//   const [loading, setLoading] = useState(false);
//   const [addresses, setAddresses] = useState([]);
//   const [success, setSuccess] = useState("");
//   const [errorMsg, setErrorMsg] = useState("");

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const loadAddresses = async () => {
//     try {
//       const user = JSON.parse(
//         localStorage.getItem("user")
//       );

//       if (!user) return;

//       const response =
//         await getUserAddresses(user._id);

//       setAddresses(
//         response.addresses || []
//       );
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   // Page load hote hi addresses fetch
//   useEffect(() => {
//     loadAddresses();
//   }, []);


//   const handleUseAddress = (
//   address
// ) => {

//   localStorage.setItem(
//     "selectedAddress",
//     JSON.stringify(address)
//   );

//   alert(
//     "Address Selected Successfully"
//   );
// };


// const handleDelete = async (
//   id
// ) => {
//   try {

//     await deleteAddress(id);

//     await loadAddresses();

//     alert(
//       "Address Deleted Successfully"
//     );

//   } catch (error) {

//     console.error(error);

//     alert(
//       "Failed to Delete Address"
//     );
//   }
// };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       setLoading(true);
//       setSuccess("");
//       setErrorMsg("");

//       const user = JSON.parse(
//         localStorage.getItem("user")
//       );

//       const response =
//         await createAddress({
//           userId: user._id,
//           ...formData,
//         });

//       console.log(
//         "ADDRESS SAVED:",
//         response
//       );

//       setSuccess(
//         "✅ Address Saved Successfully"
//       );

//       // Address list refresh
//       await loadAddresses();

//       // Form reset
//       setFormData({
//         fullName: "",
//         phoneNumber: "",
//         houseNo: "",
//         area: "",
//         city: "",
//         state: "",
//         pincode: "",
//         addressType: "Home",
//       });

//     } catch (error) {
//       console.error(error);

//       setErrorMsg(
//         error.response?.data?.message ||
//           "Failed to Save Address"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-4xl mx-auto p-8">

//       <h1 className="text-3xl font-bold mb-8">
//         Add Address
//       </h1>

//       {success && (
//         <div className="mb-4 bg-green-100 text-green-700 px-4 py-3 rounded-xl">
//           {success}
//         </div>
//       )}

//       {errorMsg && (
//         <div className="mb-4 bg-red-100 text-red-700 px-4 py-3 rounded-xl">
//           {errorMsg}
//         </div>
//       )}

//       <form
//         onSubmit={handleSubmit}
//         className="space-y-4 bg-white p-6 rounded-2xl shadow"
//       >
//         <input
//           name="fullName"
//           value={formData.fullName}
//           onChange={handleChange}
//           placeholder="Full Name"
//           className="w-full border p-3 rounded-xl"
//         />

//         <input
//           name="phoneNumber"
//           value={formData.phoneNumber}
//           onChange={handleChange}
//           placeholder="Phone Number"
//           className="w-full border p-3 rounded-xl"
//         />

//         <input
//           name="houseNo"
//           value={formData.houseNo}
//           onChange={handleChange}
//           placeholder="House No / Flat No"
//           className="w-full border p-3 rounded-xl"
//         />

//         <input
//           name="area"
//           value={formData.area}
//           onChange={handleChange}
//           placeholder="Area / Locality"
//           className="w-full border p-3 rounded-xl"
//         />

//         <input
//           name="city"
//           value={formData.city}
//           onChange={handleChange}
//           placeholder="City"
//           className="w-full border p-3 rounded-xl"
//         />

//         <input
//           name="state"
//           value={formData.state}
//           onChange={handleChange}
//           placeholder="State"
//           className="w-full border p-3 rounded-xl"
//         />

//         <input
//           name="pincode"
//           value={formData.pincode}
//           onChange={handleChange}
//           placeholder="Pincode"
//           className="w-full border p-3 rounded-xl"
//         />

//         <select
//           name="addressType"
//           value={formData.addressType}
//           onChange={handleChange}
//           className="w-full border p-3 rounded-xl"
//         >
//           <option value="Home">
//             Home
//           </option>

//           <option value="Work">
//             Work
//           </option>

//           <option value="Other">
//             Other
//           </option>
//         </select>

//         <button
//           type="submit"
//           disabled={loading}
//           className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold"
//         >
//           {loading
//             ? "Saving..."
//             : "Save Address"}
//         </button>
//       </form>

//       {/* Saved Addresses */}

//       <div className="mt-10">

//         <h2 className="text-2xl font-bold mb-4">
//           Saved Addresses
//         </h2>

//         {addresses.length === 0 ? (
//           <div className="bg-gray-50 border rounded-xl p-4 text-gray-500">
//             No Address Found
//           </div>
//         ) : (
//           <div className="space-y-4">

//             {addresses.map((address) => (
//               <div
//                 key={address._id}
//                 className="border rounded-2xl p-5 bg-white shadow-sm"
//               >
//                 <div className="flex justify-between items-center mb-2">
//                   <h3 className="font-bold text-lg">
//                     {address.fullName}
//                   </h3>

//                   <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
//                     {address.addressType}
//                   </span>
//                 </div>

//                 <p>
//                   {address.houseNo},{" "}
//                   {address.area}
//                 </p>

//                 <p>
//                   {address.city},{" "}
//                   {address.state}
//                 </p>

//                 <p>
//                   {address.pincode}
//                 </p>

//                 <p className="mt-2">
//                   📞 {address.phoneNumber}
//                 </p>

//                 <div className="flex gap-2 mt-4">

//   <button
//     onClick={() =>
//       handleUseAddress(address)
//     }
//     className="bg-purple-600 text-white px-4 py-2 rounded-lg"
//   >
//     Use This Address
//   </button>

//   <button
//     onClick={() =>
//       handleDelete(address._id)
//     }
//     className="bg-red-500 text-white px-4 py-2 rounded-lg"
//   >
//     Delete
//   </button>

// </div>
//               </div>

              
//             ))}


//             <button
//   onClick={() => handleUseAddress(address)}
//   className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg"
// >
//   Use This Address
// </button>

//           </div>
//         )}

//       </div>

//     </div>
//   );
// }

// export default AddressesPage;


import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../../components/Toast";
import ConfirmDialog from "../../components/Toast/ConfirmDialog";
import { getAddressFromCoords } from "../../services/locationApi";
import LocationMapSelector from "../components/location/LocationMapSelector";

import {
  createAddress,
  getUserAddresses,
  deleteAddress,
} from "../../services/addressApi";

function AddressesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [confirmState, setConfirmState] = useState(null);
  const [showMap, setShowMap] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    houseNo: "",
    area: "",
    city: "",
    state: "",
    pincode: "",
    addressType: "Home",
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [success, setSuccess] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Coordinates state
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [locLoading, setLocLoading] = useState(false);

  // Auto pre-fill from router coordinates state
  useEffect(() => {
    if (location.state?.prefill) {
      const { latitude, longitude, address: prefAddr } = location.state.prefill;
      setLat(latitude);
      setLng(longitude);
      setFormData((prev) => ({
        ...prev,
        pincode: prefAddr?.postcode || prev.pincode,
        city: prefAddr?.city || prev.city,
        state: prefAddr?.state || prev.state,
        area: prefAddr?.road || prefAddr?.formatted?.split(",")?.[0] || prev.area,
      }));
      showToast({ type: "success", message: "Location details pre-filled from map!" });
    }
  }, [location.state]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showToast({ type: "warning", message: "Geolocation is not supported by your browser." });
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setLat(latitude);
        setLng(longitude);
        setLocLoading(false);

        // Autofill address details using the backend-proxied getAddressFromCoords
        try {
          const result = await getAddressFromCoords(latitude, longitude);
          setFormData((prev) => ({
            ...prev,
            pincode: result.postcode || prev.pincode,
            city: result.city || prev.city,
            state: prev.state || "",
            area: result.formatted.split(",")[0] || prev.area || "",
          }));
          showToast({ type: "success", message: "Location coordinates and address resolved successfully!" });
        } catch (err) {
          console.error(err);
          showToast({ type: "warning", message: `Coordinates detected: Lat ${latitude.toFixed(6)}, Lng ${longitude.toFixed(6)}. Please input address details manually.` });
        }
      },
      (error) => {
        setLocLoading(false);
        console.error(error);
        showToast({ type: "error", message: "Location access denied or failed. Please enter coordinates and address details manually." });
      }
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error as user types
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  /* ── Validation ────────────────────────────────────────── */
  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim())       errs.fullName    = "Full name is required.";
    if (!formData.phoneNumber.trim())    errs.phoneNumber = "Phone number is required.";
    else if (!/^\d{10}$/.test(formData.phoneNumber.trim())) errs.phoneNumber = "Enter a valid 10-digit phone number.";
    if (!formData.houseNo.trim())        errs.houseNo     = "House / Flat No is required.";
    if (!formData.area.trim())           errs.area        = "Area / Locality is required.";
    if (!formData.city.trim())           errs.city        = "City is required.";
    if (!formData.state.trim())          errs.state       = "State is required.";
    if (!formData.pincode.trim())        errs.pincode     = "Pincode is required.";
    else if (!/^\d{6}$/.test(formData.pincode.trim())) errs.pincode = "Enter a valid 6-digit pincode.";
    return errs;
  };

  const loadAddresses = async () => {
    try {
      const user = JSON.parse(
        localStorage.getItem("user")
      );

      if (!user) return;

      const response =
        await getUserAddresses(user._id);

      setAddresses(
        response.addresses || []
      );
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleUseAddress = (address) => {
    localStorage.setItem("selectedAddress", JSON.stringify(address));
    setSuccess("✅ Address Selected Successfully");
    const returnTo = location.state?.returnTo || "/customer/checkout";
    setTimeout(() => { navigate(returnTo); }, 800);
  };

  const handleDelete = async (id) => {
    setConfirmState({
      message: "Are you sure you want to delete this address?",
      type: "danger",
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await deleteAddress(id);
          await loadAddresses();
          showToast({ type: "success", message: "Address Deleted Successfully" });
        } catch (error) {
          console.error(error);
          showToast({ type: "error", message: "Failed to Delete Address" });
        }
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setSuccess("");
      setErrorMsg("");

      // Validate before submitting
      const errs = validate();
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        setLoading(false);
        return;
      }

      const user = JSON.parse(localStorage.getItem("user"));

      if (!user) {
        // Guest mode — build address with validated data
        const guestAddress = {
          _id: "guest-temp-address",
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          houseNo: formData.houseNo,
          area: formData.area,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          addressType: formData.addressType,
          latitude: lat,
          longitude: lng,
          fullAddress: `${formData.houseNo}, ${formData.area}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
        };
        localStorage.setItem("selectedAddress", JSON.stringify(guestAddress));
        setSuccess("✅ Delivery Address Set Successfully!");
        showToast({ type: "success", message: "Delivery Address set successfully!" });
        const returnTo = location.state?.returnTo || "/customer/checkout";
        setTimeout(() => { navigate(returnTo); }, 800);
        return;
      }

      const response =
        await createAddress({
          userId: user._id,
          ...formData,
          latitude: lat,
          longitude: lng
        });

      console.log(
        "ADDRESS SAVED:",
        response
      );

      if (response && response.success && response.address) {
        localStorage.setItem("selectedAddress", JSON.stringify(response.address));
      }

      setSuccess(
        "✅ Address Saved Successfully"
      );

      await loadAddresses();

      setFormData({
        fullName: "",
        phoneNumber: "",
        houseNo: "",
        area: "",
        city: "",
        state: "",
        pincode: "",
        addressType: "Home",
      });
      setLat(null);
      setLng(null);
    } catch (error) {
      console.error(error);

      setErrorMsg(
        error.response?.data?.message ||
          "Failed to Save Address"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">
        Add Address
      </h1>

      {success && (
        <div className="mb-4 bg-green-100 text-green-700 px-4 py-3 rounded-xl">
          {success}
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 bg-red-100 text-red-700 px-4 py-3 rounded-xl">
          {errorMsg}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-6 rounded-2xl shadow"
      >
        <input
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="Full Name *"
          className={`w-full border p-3 rounded-xl outline-none focus:border-purple-600 ${
            fieldErrors.fullName ? "border-red-400 bg-red-50" : ""
          }`}
        />
        {fieldErrors.fullName && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.fullName}</p>
        )}

        <input
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          placeholder="Phone Number * (10 digits)"
          className={`w-full border p-3 rounded-xl outline-none focus:border-purple-600 ${
            fieldErrors.phoneNumber ? "border-red-400 bg-red-50" : ""
          }`}
        />
        {fieldErrors.phoneNumber && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.phoneNumber}</p>
        )}

        <input
          name="houseNo"
          value={formData.houseNo}
          onChange={handleChange}
          placeholder="House No / Flat No *"
          className={`w-full border p-3 rounded-xl outline-none focus:border-purple-600 ${
            fieldErrors.houseNo ? "border-red-400 bg-red-50" : ""
          }`}
        />
        {fieldErrors.houseNo && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.houseNo}</p>
        )}

        <input
          name="area"
          value={formData.area}
          onChange={handleChange}
          placeholder="Area / Locality *"
          className={`w-full border p-3 rounded-xl outline-none focus:border-purple-600 ${
            fieldErrors.area ? "border-red-400 bg-red-50" : ""
          }`}
        />
        {fieldErrors.area && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.area}</p>
        )}

        <input
          name="city"
          value={formData.city}
          onChange={handleChange}
          placeholder="City *"
          className={`w-full border p-3 rounded-xl outline-none focus:border-purple-600 ${
            fieldErrors.city ? "border-red-400 bg-red-50" : ""
          }`}
        />
        {fieldErrors.city && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.city}</p>
        )}

        <input
          name="state"
          value={formData.state}
          onChange={handleChange}
          placeholder="State *"
          className={`w-full border p-3 rounded-xl outline-none focus:border-purple-600 ${
            fieldErrors.state ? "border-red-400 bg-red-50" : ""
          }`}
        />
        {fieldErrors.state && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.state}</p>
        )}

        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <input
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            placeholder="Pincode * (6 digits)"
            className={`flex-1 border p-3 rounded-xl outline-none focus:border-purple-600 font-semibold min-w-[120px] ${
              fieldErrors.pincode ? "border-red-400 bg-red-50" : ""
            }`}
          />
          <button
            type="button"
            disabled={locLoading}
            onClick={handleDetectLocation}
            className="bg-purple-100 hover:bg-purple-200 disabled:bg-slate-100 text-purple-700 font-bold px-4 rounded-xl text-xs sm:text-sm transition flex-shrink-0"
          >
            {locLoading ? "Detecting..." : "Detect Location"}
          </button>
          <button
            type="button"
            onClick={() => setShowMap(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 rounded-xl text-xs sm:text-sm transition flex-shrink-0"
          >
            Select on Map 🗺️
          </button>
        </div>
        {fieldErrors.pincode && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.pincode}</p>
        )}

        <select
          name="addressType"
          value={formData.addressType}
          onChange={handleChange}
          className="w-full border p-3 rounded-xl"
        >
          <option value="Home">
            Home
          </option>

          <option value="Work">
            Work
          </option>

          <option value="Other">
            Other
          </option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold"
        >
          {loading
            ? "Saving..."
            : "Save Address"}
        </button>
      </form>

      {/* Saved Addresses */}

      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">
          Saved Addresses
        </h2>

        {addresses.length === 0 ? (
          <div className="bg-gray-50 border rounded-xl p-4 text-gray-500">
            No Address Found
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address._id}
                className="border rounded-2xl p-5 bg-white shadow-sm"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg">
                    {address.fullName}
                  </h3>

                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                    {address.addressType}
                  </span>
                </div>

                <p>
                  {address.houseNo},{" "}
                  {address.area}
                </p>

                <p>
                  {address.city},{" "}
                  {address.state}
                </p>

                <p>
                  {address.pincode}
                </p>

                <p className="mt-2">
                  📞 {address.phoneNumber}
                </p>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() =>
                      handleUseAddress(
                        address
                      )
                    }
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg"
                  >
                    Use This Address
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(
                        address._id
                      )
                    }
                    className="bg-red-500 text-white px-4 py-2 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
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
      {showMap && (
        <LocationMapSelector
          initialLocation={lat && lng ? { latitude: lat, longitude: lng } : null}
          onClose={() => setShowMap(false)}
          onConfirm={({ latitude, longitude, address: prefAddr }) => {
            setLat(latitude);
            setLng(longitude);
            setFormData((prev) => ({
              ...prev,
              pincode: prefAddr?.postcode || prev.pincode,
              city: prefAddr?.city || prev.city,
              state: prefAddr?.state || prev.state,
              area: prefAddr?.road || prefAddr?.formatted?.split(",")?.[0] || prev.area,
            }));
            setShowMap(false);
            showToast({ type: "success", message: "Location resolved from map!" });
          }}
        />
      )}
    </div>
  );
}

export default AddressesPage;