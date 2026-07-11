import { useEffect, useState } from "react";
import { getInventory } from "../../services/inventoryApi";
import SearchBox from "../../components/SearchBox";
import Loader from "../../components/Loader";

export default function InventoryList() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await getInventory();
      setInventory(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredData = inventory.filter((item) =>
    item.productName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Inventory</h1>

        <SearchBox value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Product</th>
                <th className="p-2">Stock</th>
                <th className="p-2">Warehouse</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-2">{item.productName}</td>
                  <td className="p-2">{item.stock}</td>
                  <td className="p-2">{item.warehouse}</td>
                  <td className="p-2">
                    {item.stock > 10 ? (
                      <span className="text-green-600">In Stock</span>
                    ) : (
                      <span className="text-red-600">Low Stock</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}