export default function Logistics({ data, setData }) {
  return (
    <div className="p-4 bg-white rounded-xl shadow">
      <h2 className="text-lg font-semibold mb-3">Logistics</h2>

      <input
        placeholder="Weight (kg)"
        value={data.weight || ""}
        onChange={(e) =>
          setData({ ...data, weight: e.target.value })
        }
        className="w-full border p-2 rounded mb-2"
      />

      <input
        placeholder="Length"
        value={data.length || ""}
        onChange={(e) =>
          setData({ ...data, length: e.target.value })
        }
        className="w-full border p-2 rounded mb-2"
      />

      <input
        placeholder="Width"
        value={data.width || ""}
        onChange={(e) =>
          setData({ ...data, width: e.target.value })
        }
        className="w-full border p-2 rounded"
      />
    </div>
  );
}