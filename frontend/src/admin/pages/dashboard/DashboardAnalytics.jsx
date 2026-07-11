import {
  Package,
  ShoppingCart,
  Users,
  Store,
  IndianRupee,
  TrendingUp,
} from "lucide-react";

export default function DashboardAnalytics() {
  const analytics = [
    {
      title: "Total Products",
      value: "1,245",
      icon: Package,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Total Orders",
      value: "8,526",
      icon: ShoppingCart,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Customers",
      value: "3,842",
      icon: Users,
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Vendors",
      value: "86",
      icon: Store,
      color: "bg-orange-100 text-orange-600",
    },
    {
      title: "Revenue",
      value: "₹8.25L",
      icon: IndianRupee,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      title: "Growth",
      value: "+18%",
      icon: TrendingUp,
      color: "bg-pink-100 text-pink-600",
    },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {analytics.map((item, index) => {
        const Icon = item.icon;

        return (
          <div
            key={index}
            className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{item.title}</p>

                <h2 className="mt-2 text-2xl font-bold text-gray-800">
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