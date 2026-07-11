import { useState } from "react";

export default function AddUnit() {

  const [form, setForm] = useState({
    name: "",
    shortName: "",
    description: "",
    status: true,
  });

  const handleChange = (e) => {

    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });

  };

  const handleSubmit = (e) => {

    e.preventDefault();

    console.log(form);

  };

  return (

    <div className="p-6">

      <h1 className="text-2xl font-bold mb-6">
        Add Unit
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow space-y-5"
      >

        <div>

          <label className="block mb-2">
            Unit Name
          </label>

          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Kilogram"
            className="w-full border rounded-lg p-3"
          />

        </div>

        <div>

          <label className="block mb-2">
            Short Name
          </label>

          <input
            type="text"
            name="shortName"
            value={form.shortName}
            onChange={handleChange}
            placeholder="kg"
            className="w-full border rounded-lg p-3"
          />

        </div>

        <div>

          <label className="block mb-2">
            Description
          </label>

          <textarea
            rows="4"
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded-lg p-3"
          />

        </div>

        <div className="flex items-center gap-3">

          <input
            type="checkbox"
            name="status"
            checked={form.status}
            onChange={handleChange}
          />

          Active

        </div>

        <button
          className="bg-green-600 text-white px-6 py-3 rounded-lg"
        >
          Save Unit
        </button>

      </form>

    </div>

  );

}