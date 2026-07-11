export default function ReturnPolicy({ data, setData }) {
  return (
    <div className="p-4 bg-white rounded-xl shadow">
      <h2 className="text-lg font-semibold mb-3">
        Return Policy
      </h2>

      <select
        value={data.returnPolicy || ""}
        onChange={(e) =>
          setData({ ...data, returnPolicy: e.target.value })
        }
        className="w-full border p-2 rounded"
      >
        <option value="">Select</option>
        <option value="returnable">Returnable</option>
        <option value="non-returnable">Non Returnable</option>
        <option value="replacement">Replacement Only</option>
      </select>
    </div>
  );
}