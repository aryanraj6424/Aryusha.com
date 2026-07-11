export default function Delivery({ data, setData }) {
  return (
    <div className="p-4 bg-white rounded-xl shadow">
      <h2 className="text-lg font-semibold mb-3">Delivery Info</h2>

      <label className="flex gap-2">
        <input
          type="checkbox"
          checked={data.deliverable || false}
          onChange={(e) =>
            setData({ ...data, deliverable: e.target.checked })
          }
        />
        Deliverable
      </label>

      <label className="flex gap-2 mt-2">
        <input
          type="checkbox"
          checked={data.perishable || false}
          onChange={(e) =>
            setData({ ...data, perishable: e.target.checked })
          }
        />
        Perishable
      </label>

      <label className="flex gap-2 mt-2">
        <input
          type="checkbox"
          checked={data.coldStorage || false}
          onChange={(e) =>
            setData({ ...data, coldStorage: e.target.checked })
          }
        />
        Cold Storage Required
      </label>
    </div>
  );
}