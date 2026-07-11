export default function OrderCard({ order }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow">

      {/* Header */}

      <div className="flex justify-between items-center">

        <div>
          <h3 className="font-bold text-xl">
            Order #{order.orderId}
          </h3>

          <p className="text-gray-500">
            {order.date}
          </p>
        </div>

        <span
          className={`px-4 py-2 rounded-xl text-sm font-semibold
          ${
            order.status === "Delivered"
              ? "bg-green-100 text-green-700"
              : order.status === "Processing"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {order.status}
        </span>

      </div>

      {/* Products */}

      <div className="mt-5 space-y-2">

        {order.items.map((item, index) => (
          <div
            key={index}
            className="flex justify-between"
          >
            <span>{item.name}</span>

            <span>
              {item.quantity} x ₹{item.price}
            </span>
          </div>
        ))}

      </div>

      {/* Footer */}

      <div className="mt-5 border-t pt-4 flex justify-between items-center">

        <h4 className="font-bold text-lg">
          Total ₹{order.total}
        </h4>

        <div className="flex gap-3">

          <button
            className="bg-purple-600 text-white px-4 py-2 rounded-xl"
          >
            Reorder
          </button>

          <button
            className="border border-purple-600 text-purple-600 px-4 py-2 rounded-xl"
          >
            Invoice
          </button>

        </div>

      </div>

    </div>
  );
}