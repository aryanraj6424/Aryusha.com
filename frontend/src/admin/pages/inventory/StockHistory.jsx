import { useEffect, useState } from "react";
import { getStockHistory } from "../../services/inventoryApi";
import Loader from "../../components/Loader";

export default function StockHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await getStockHistory();
      setHistory(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Stock History</h1>

      {loading ? (
        <Loader />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Product</th>
                <th className="p-2">Type</th>
                <th className="p-2">Quantity</th>
                <th className="p-2">Date</th>
              </tr>
            </thead>

            <tbody>
              {history.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-2">{item.productName}</td>
                  <td className="p-2">
                    <span
                      className={
                        item.type === "IN"
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {item.type}
                    </span>
                  </td>
                  <td className="p-2">{item.quantity}</td>
                  <td className="p-2">
                    {new Date(item.date).toLocaleDateString()}
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