import {
  Package,
  ShoppingCart,
  Users,
  Store,
  IndianRupee,
  TrendingUp,
} from "lucide-react";

export default function DashboardAnalytics({ data }) {
  const formatCurrency = (val) => {
    if (val === undefined || val === null) return "₹0.00";
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${val.toFixed(2)}`;
  };

  const growthVal = data?.growthPct !== undefined ? `${data.growthPct >= 0 ? '+' : ''}${data.growthPct}%` : "0%";

  const analytics = [
    {
      title: "Total Products",
      value: data?.totalProducts ?? 0,
      icon: Package,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Total Orders",
      value: data?.totalOrders ?? 0,
      icon: ShoppingCart,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Customers",
      value: data?.totalCustomers ?? 0,
      icon: Users,
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Vendors",
      value: data?.totalVendors ?? 0,
      icon: Store,
      color: "bg-orange-100 text-orange-600",
    },
    {
      title: "Revenue",
      value: formatCurrency(data?.totalRevenue),
      icon: IndianRupee,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      title: "Growth",
      value: growthVal,
      icon: TrendingUp,
      color: data?.growthPct < 0 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600",
    },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mt-6">
      {analytics.map((item, index) => {
        const Icon = item.icon;

        return (
          <div
            key={index}
            className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{item.title}</p>

                <h2 className="mt-2 text-2xl font-black text-gray-800 tracking-tight">
                  {item.value}
                </h2>
              </div>

              <div className={`rounded-full p-3 ${item.color}`}>
                <Icon size={24} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}