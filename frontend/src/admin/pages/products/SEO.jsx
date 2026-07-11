export default function SEO({ data, setData }) {
  return (
    <div className="p-4 bg-white rounded-xl shadow">
      <h2 className="text-lg font-semibold mb-3">SEO</h2>

      <input
        placeholder="Meta Title"
        value={data.metaTitle || ""}
        onChange={(e) =>
          setData({ ...data, metaTitle: e.target.value })
        }
        className="w-full border p-2 rounded mb-2"
      />

      <textarea
        placeholder="Meta Description"
        value={data.metaDescription || ""}
        onChange={(e) =>
          setData({ ...data, metaDescription: e.target.value })
        }
        className="w-full border p-2 rounded"
      />
    </div>
  );
}