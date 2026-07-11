import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  Megaphone, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronRight,
  Menu,
  X
} from "lucide-react";

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    navigate("/admin/login");
  };

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    {
      section: "CATALOG",
      items: [
        { path: "/admin/categories", label: "Category Management", icon: Package },
        { path: "/admin/sub-categories", label: "Sub Category", icon: ChevronRight },
        { path: "/admin/product-families", label: "Product Family", icon: ChevronRight },
        { path: "/admin/products", label: "Products", icon: ChevronRight },
      ]
    },
    {
      section: "PRODUCT MANAGEMENT",
      items: [
        { path: "/admin/product-management", label: "Product Management", icon: Package },
        { path: "/admin/brands", label: "Brand Management", icon: ChevronRight },
        { path: "/admin/attributes", label: "Attribute Management", icon: ChevronRight },
        { path: "/admin/units", label: "Unit Management", icon: ChevronRight },
      ]
    },
    {
      section: "VENDOR & ORDERS",
      items: [
        { path: "/admin/vendors", label: "Vendor Management", icon: ShoppingBag },
        { path: "/admin/orders", label: "Orders Management", icon: ChevronRight },
        { path: "/admin/returns", label: "Returns & Refunds", icon: ChevronRight },
      ]
    },
    {
      section: "DELIVERY MANAGEMENT",
      items: [
        { path: "/admin/deliveries", label: "Deliveries Monitor", icon: ChevronRight },
        { path: "/admin/delivery-logs", label: "Delivery Logs", icon: ChevronRight },
        { path: "/admin/delivery-reports", label: "Delivery Reports", icon: ChevronRight },
        { path: "/admin/delivery-boys", label: "Rider Oversight", icon: ChevronRight },
      ]
    },
    {
      section: "CUSTOMER & MARKETING",
      items: [
        { path: "/admin/customers", label: "Customer Management", icon: Users },
        { path: "/admin/marketing", label: "Marketing & Banners", icon: Megaphone },
        { path: "/admin/offers", label: "Offers & Coupons", icon: ChevronRight },
      ]
    },
    {
      section: "REPORTS & SETTINGS",
      items: [
        { path: "/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
        { path: "/admin/settings", label: "System Settings", icon: Settings },
        { path: "/admin/fee-settings", label: "Fee Settings", icon: ChevronRight },
        { path: "/admin/users", label: "Users & Roles", icon: ChevronRight },
        { path: "/admin/support", label: "Support Tickets", icon: ChevronRight },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-[#1a5d1a] text-white p-3 rounded-lg shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-0 z-40 lg:z-auto
        w-64 bg-[#1a5d1a] text-white p-5 flex flex-col h-screen overflow-y-auto
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-green-100">Aryusha.com</h1>
          <p className="text-xs text-green-200 mt-1">Super Admin Panel</p>
        </div>

        <nav className="flex flex-col gap-4 flex-1">
          {/* Dashboard */}
          <button
            onClick={() => {
              navigate("/admin/dashboard");
              setIsOpen(false);
            }}
            className={`w-full text-left py-2.5 px-3 rounded-lg transition-colors flex items-center gap-3 ${
              isActive("/admin/dashboard") 
                ? "bg-green-600 text-white" 
                : "hover:bg-green-700 text-green-100"
            }`}
          >
            <LayoutDashboard size={18} />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          {/* Menu Sections */}
          {menuItems.map((section) => (
            <div key={section.section}>
              <h3 className="text-xs uppercase text-green-300 mb-2 px-3 font-semibold tracking-wider hidden sm:block">
                {section.section}
              </h3>
              <div className="flex flex-col gap-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left py-2 px-3 rounded-lg transition-colors flex items-center gap-3 ${
                        isActive(item.path) 
                          ? "bg-green-600 text-white" 
                          : "hover:bg-green-700 text-green-100"
                      }`}
                    >
                      <Icon size={16} />
                      <span className="hidden sm:inline">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="pt-4 border-t border-green-700">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
