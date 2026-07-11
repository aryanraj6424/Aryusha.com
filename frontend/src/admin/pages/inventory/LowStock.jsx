import { useEffect, useState } from "react";
import { getLowStock } from "../../services/inventoryApi";
import Loader from "../../components/Loader";

export default function LowStock() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLowStock = async () => {
    try {
      setLoading(true);
      const res = await getLowStock();
      setData(res);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStock();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Low Stock Alerts</h1>

      {loading ? (
        <Loader />
      ) : (
        <div className="grid gap-3">
          {data.map((item) => (
            <div
              key={item.id}
              className="p-3 border rounded-lg flex justify-between"
            >
              <div>
                <h2 className="font-semibold">{item.productName}</h2>
                <p className="text-sm text-gray-500">
                  Warehouse: {item.warehouse}
                </p>
              </div>

              <div className="text-red-600 font-bold">
                {item.stock} left
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}