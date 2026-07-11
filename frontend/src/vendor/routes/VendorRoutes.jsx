import { lazy } from "react";
import VendorProtectedRoute from "../components/VendorProtectedRoute";

// Lazy load components for better performance
const VendorDashboard = lazy(() => import("../pages/dashboard/VendorDashboard"));
const ProductList = lazy(() => import("../pages/products/ProductList"));
const AddProduct = lazy(() => import("../pages/products/AddProduct"));
const EditProduct = lazy(() => import("../pages/products/EditProduct"));
const ManageVariants = lazy(() => import("../pages/products/ManageVariants"));
const ProductDetails = lazy(() => import("../pages/products/ProductDetails"));
const OrderList = lazy(() => import("../pages/orders/OrderList"));
const InventoryList = lazy(() => import("../pages/inventory/InventoryList"));
const EarningsDashboard = lazy(() => import("../pages/earnings/EarningsDashboard"));
const VendorSettings = lazy(() => import("../pages/settings/VendorSettings"));
const CouponList = lazy(() => import("../pages/coupons/CouponList"));
const ReportsDashboard = lazy(() => import("../pages/reports/ReportsDashboard"));
const CustomerList = lazy(() => import("../pages/customers/CustomerList"));
const SupportCenter = lazy(() => import("../pages/support/SupportCenter"));
const Notifications = lazy(() => import("../pages/support/Notifications"));

// Auth pages
const VendorLogin = lazy(() => import("../pages/auth/VendorLogin"));
const VendorRegister = lazy(() => import("../pages/auth/VendorRegister"));
const VendorForgotPassword = lazy(() => import("../pages/auth/VendorForgotPassword"));

const vendorRoutes = [
  // Public routes
  {
    path: "/vendor/login",
    element: <VendorLogin />,
  },
  {
    path: "/vendor/register",
    element: <VendorRegister />,
  },
  {
    path: "/vendor/forgot-password",
    element: <VendorForgotPassword />,
  },

  // Protected routes
  {
    path: "/vendor/dashboard",
    element: (
      <VendorProtectedRoute>
        <VendorDashboard />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/products",
    element: (
      <VendorProtectedRoute>
        <ProductList />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/products/add",
    element: (
      <VendorProtectedRoute>
        <AddProduct />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/products/edit/:id",
    element: (
      <VendorProtectedRoute>
        <EditProduct />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/products/:id/variants",
    element: (
      <VendorProtectedRoute>
        <ManageVariants />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/products/:id",
    element: (
      <VendorProtectedRoute>
        <ProductDetails />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/orders",
    element: (
      <VendorProtectedRoute>
        <OrderList />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/orders/new",
    element: (
      <VendorProtectedRoute>
        <OrderList />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/orders/processing",
    element: (
      <VendorProtectedRoute>
        <OrderList />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/orders/completed",
    element: (
      <VendorProtectedRoute>
        <OrderList />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/orders/cancelled",
    element: (
      <VendorProtectedRoute>
        <OrderList />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/orders/:id",
    element: (
      <VendorProtectedRoute>
        <OrderList />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/inventory",
    element: (
      <VendorProtectedRoute>
        <InventoryList />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/earnings",
    element: (
      <VendorProtectedRoute>
        <EarningsDashboard />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/wallet",
    element: (
      <VendorProtectedRoute>
        <EarningsDashboard />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/withdraw",
    element: (
      <VendorProtectedRoute>
        <EarningsDashboard />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/settings",
    element: (
      <VendorProtectedRoute>
        <VendorSettings />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/settings/profile",
    element: (
      <VendorProtectedRoute>
        <VendorSettings />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/settings/timings",
    element: (
      <VendorProtectedRoute>
        <VendorSettings />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/settings/security",
    element: (
      <VendorProtectedRoute>
        <VendorSettings />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/settings/documents",
    element: (
      <VendorProtectedRoute>
        <VendorSettings />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/coupons",
    element: (
      <VendorProtectedRoute>
        <CouponList />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/reports",
    element: (
      <VendorProtectedRoute>
        <ReportsDashboard />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/reports/sales",
    element: (
      <VendorProtectedRoute>
        <ReportsDashboard />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/reports/products",
    element: (
      <VendorProtectedRoute>
        <ReportsDashboard />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/reports/areas",
    element: (
      <VendorProtectedRoute>
        <ReportsDashboard />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/customers",
    element: (
      <VendorProtectedRoute>
        <CustomerList />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/support",
    element: (
      <VendorProtectedRoute>
        <SupportCenter />
      </VendorProtectedRoute>
    ),
  },
  {
    path: "/vendor/notifications",
    element: (
      <VendorProtectedRoute>
        <Notifications />
      </VendorProtectedRoute>
    ),
  },
];

export default vendorRoutes;
