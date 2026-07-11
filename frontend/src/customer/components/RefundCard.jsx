export default function RefundCard({
  refund,
}) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow">

      <div className="flex justify-between">

        <div>

          <h3 className="font-bold text-xl">
            {refund.orderId}
          </h3>

          <p className="text-gray-500 mt-2">
            {refund.reason}
          </p>

        </div>

        <span
          className={`px-4 py-2 rounded-xl
          ${
            refund.status === "Approved"
              ? "bg-green-100 text-green-700"
              : refund.status === "Pending"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {refund.status}
        </span>

      </div>

    </div>
  );
}