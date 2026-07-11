import React from "react";

function VendorStatsCard({
  title,
  value,
  icon: Icon,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-5 hover:shadow-md transition">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-gray-500">
            {title}
          </p>

          <h3 className="text-2xl font-bold mt-2">
            {value}
          </h3>

        </div>

        {Icon && (
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">

            <Icon
              size={22}
              className="text-purple-600"
            />

          </div>
        )}

      </div>

    </div>
  );
}

export default VendorStatsCard;