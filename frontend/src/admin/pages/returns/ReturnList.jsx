import React, { useState } from "react";

export default function ReturnList() {
  const [returns] = useState([
    {
      id: "RET-001",
      orderId: "ORD-001",
      customer: "John Doe",
      reason: "Damaged Product",
      status: "Pending",
      date: "2024-01-15",
      amount: 2999,
    },
    {
      id: "RET-002",
      orderId: "ORD-002",
      customer: "Jane Smith",
      reason: "Wrong Item",
      status: "Approved",
      date: "2024-01-14",
      amount: 1499,
    },
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Returns & Refunds</h1>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search returns..."
            className="px-4 py-2 border rounded-lg"
          />
          <select className="px-4 py-2 border rounded-lg">
            <option>All Status</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Return ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {returns.map((ret) => (
              <tr key={ret.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {ret.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{ret.orderId}</td>
                <td className="px-6 py-4 whitespace-nowrap">{ret.customer}</td>
                <td className="px-6 py-4 whitespace-nowrap">{ret.reason}</td>
                <td className="px-6 py-4 whitespace-nowrap">₹{ret.amount}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      ret.status
                    )}`}
                  >
                    {ret.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{ret.date}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button className="text-green-600 hover:text-green-800 mr-3">
                    Approve
                  </button>
                  <button className="text-red-600 hover:text-red-800">
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
