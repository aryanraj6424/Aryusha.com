import RefundCard from "../components/RefundCard";

export default function RefundsPage() {
  const refunds = [
    {
      orderId: "QC123456",
      reason: "Damaged Product",
      status: "Pending",
    },

    {
      orderId: "QC123450",
      reason: "Wrong Product",
      status: "Approved",
    },
  ];

  return (
    <div>

      <h1 className="text-4xl font-bold mb-8">
        Refund Requests
      </h1>

      <div className="space-y-5">

        {refunds.map((refund, index) => (
          <RefundCard
            key={index}
            refund={refund}
          />
        ))}

      </div>

    </div>
  );
}