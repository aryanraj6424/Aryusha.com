import { useState } from "react";

export default function AccountPage() {

  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
      gender: "",
      dob: "",
      pincode: "",
    });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleSave = () => {
    alert("Profile Updated");
  };

  return (
    <div className="max-w-2xl mx-auto p-5">

      <h2 className="text-2xl font-bold mb-5">
        My Account
      </h2>

      <div className="bg-white rounded-2xl shadow p-5 space-y-4">

        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full border p-3 rounded-xl"
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full border p-3 rounded-xl"
        />

        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className="w-full border p-3 rounded-xl"
        >
          <option value="">
            Select Gender
          </option>

          <option>
            Male
          </option>

          <option>
            Female
          </option>

          <option>
            Other
          </option>

        </select>

        <input
          type="date"
          name="dob"
          value={formData.dob}
          onChange={handleChange}
          className="w-full border p-3 rounded-xl"
        />

        <input
          type="text"
          name="pincode"
          placeholder="Pincode"
          value={formData.pincode}
          onChange={handleChange}
          className="w-full border p-3 rounded-xl"
        />

        <button
          onClick={handleSave}
          className="bg-purple-600 text-white px-5 py-3 rounded-xl"
        >
          Save Changes
        </button>

      </div>

    </div>
  );
}