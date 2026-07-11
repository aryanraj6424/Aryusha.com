import { useState } from "react";

export default function ProfileCard() {
  const [profile, setProfile] = useState({
    fullName: "Aryan Raj",
    email: "aryan@gmail.com",
    phoneNumber: "9876543210",
    gender: "Male",
    dob: "2002-01-01",
  });

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    console.log("Updated Profile:", profile);

    alert("Profile Updated Successfully ✅");
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg p-8">

      <div className="flex items-center gap-5 mb-8">

        <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center text-4xl">
          👤
        </div>

        <div>
          <h2 className="text-2xl font-bold">
            {profile.fullName}
          </h2>

          <p className="text-gray-500">
            Customer Account
          </p>
        </div>

      </div>

      <div className="grid md:grid-cols-2 gap-5">

        <div>
          <label className="font-medium">
            Full Name
          </label>

          <input
            type="text"
            name="fullName"
            value={profile.fullName}
            onChange={handleChange}
            className="w-full mt-2 border rounded-xl p-3"
          />
        </div>

        <div>
          <label className="font-medium">
            Email
          </label>

          <input
            type="email"
            name="email"
            value={profile.email}
            onChange={handleChange}
            className="w-full mt-2 border rounded-xl p-3"
          />
        </div>

        <div>
          <label className="font-medium">
            Phone Number
          </label>

          <input
            type="text"
            name="phoneNumber"
            value={profile.phoneNumber}
            onChange={handleChange}
            className="w-full mt-2 border rounded-xl p-3"
          />
        </div>

        <div>
          <label className="font-medium">
            Gender
          </label>

          <select
            name="gender"
            value={profile.gender}
            onChange={handleChange}
            className="w-full mt-2 border rounded-xl p-3"
          >
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label className="font-medium">
            Date Of Birth
          </label>

          <input
            type="date"
            name="dob"
            value={profile.dob}
            onChange={handleChange}
            className="w-full mt-2 border rounded-xl p-3"
          />
        </div>

      </div>

      <button
        onClick={handleSave}
        className="mt-8 bg-purple-600 text-white px-8 py-3 rounded-xl hover:bg-purple-700"
      >
        Save Changes
      </button>

    </div>
  );
}