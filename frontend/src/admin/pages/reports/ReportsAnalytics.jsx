import React from "react";

export default function ReportsAnalytics() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Reports & Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600">₹15.5L</p>
          <p className="text-sm text-gray-500 mt-2">+12.5% from last month</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm">Total Orders</h3>
          <p className="text-3xl font-bold text-blue-600">2,345</p>
          <p className="text-sm text-gray-500 mt-2">+8.2% from last month</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm">Average Order Value</h3>
          <p className="text-3xl font-bold text-purple-600">₹661</p>
          <p className="text-sm text-gray-500 mt-2">+3.1% from last month</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm">Active Customers</h3>
          <p className="text-3xl font-bold text-orange-600">1,234</p>
          <p className="text-sm text-gray-500 mt-2">+5.7% from last month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Sales Overview</h2>
          <div className="h-64 flex items-center justify-center bg-gray-100 rounded">
            <p className="text-gray-500">Chart placeholder - Sales data visualization</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Top Selling Products</h2>
          <div className="h-64 flex items-center justify-center bg-gray-100 rounded">
            <p className="text-gray-500">Chart placeholder - Top products visualization</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Category Performance</h2>
          <div className="h-64 flex items-center justify-center bg-gray-100 rounded">
            <p className="text-gray-500">Chart placeholder - Category breakdown</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Customer Demographics</h2>
          <div className="h-64 flex items-center justify-center bg-gray-100 rounded">
            <p className="text-gray-500">Chart placeholder - Customer data</p>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Recent Reports</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div>
              <p className="font-medium">Monthly Sales Report</p>
              <p className="text-sm text-gray-500">Generated on Jan 31, 2024</p>
            </div>
            <button className="text-blue-600 hover:text-blue-800">Download</button>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div>
              <p className="font-medium">Inventory Report</p>
              <p className="text-sm text-gray-500">Generated on Jan 30, 2024</p>
            </div>
            <button className="text-blue-600 hover:text-blue-800">Download</button>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div>
              <p className="font-medium">Customer Analytics</p>
              <p className="text-sm text-gray-500">Generated on Jan 29, 2024</p>
            </div>
            <button className="text-blue-600 hover:text-blue-800">Download</button>
          </div>
        </div>
      </div>
    </div>
  );
}
