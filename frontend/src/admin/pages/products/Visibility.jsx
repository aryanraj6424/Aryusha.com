export default function Visibility({ data, setData }) {
  const toggle = (field) => {
    setData({ ...data, [field]: !data[field] });
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow">
      <h2 className="text-lg font-semibold mb-3">Visibility</h2>

      {[
        "featured",
        "trending",
        "bestSeller",
        "newArrival",
      ].map((item) => (
        <label key={item} className="flex gap-2 mb-2">
          <input
            type="checkbox"
            checked={data[item] || false}
            onChange={() => toggle(item)}
          />
          {item}
        </label>
      ))}
    </div>
  );
}