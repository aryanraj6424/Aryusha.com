import React, { useState } from "react";

export default function MarketingBanners() {
  const [banners] = useState([
    {
      id: "BAN-001",
      title: "Summer Sale",
      description: "Up to 50% off on all products",
      image: "https://via.placeholder.com/200x100",
      position: "Home Page",
      status: "Active",
      startDate: "2024-01-01",
      endDate: "2024-01-31",
    },
    {
      id: "BAN-002",
      title: "New Arrivals",
      description: "Check out our latest collection",
      image: "https://via.placeholder.com/200x100",
      position: "Category Page",
      status: "Inactive",
      startDate: "2024-02-01",
      endDate: "2024-02-28",
    },
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Marketing & Banners</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Add New Banner
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Banner ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Position
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Start Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                End Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {banners.map((banner) => (
              <tr key={banner.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {banner.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{banner.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {banner.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{banner.position}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      banner.status
                    )}`}
                  >
                    {banner.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {banner.startDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{banner.endDate}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button className="text-blue-600 hover:text-blue-800 mr-3">
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-800">
                    Delete
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
