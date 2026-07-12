import { Routes, Route, Outlet } from "react-router-dom";
import { ToastProvider, ToastContainer } from "./components/Toast";

import HomePage from "./components/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import OTPVerificationPage from "./pages/auth/OTPVerificationPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

// Customer imports
import CustomerLayout from "./customer/layouts/CustomerLayout";
import CustomerDashboard from "./customer/pages/CustomerDashboard";
import ProductDetailsPage from "./customer/pages/ProductDetailsPage";
import LocationPage from "./customer/pages/LocationPage";
import AddressesPage from "./customer/pages/AddressesPage";
import RefundsPage from "./customer/pages/RefundsPage";
import SettingsPage from "./customer/pages/SettingsPage";
import CustomerProfilePage from "./customer/pages/profile/CustomerProfilePage";
import AccountPage from "./customer/pages/profile/AccountPage";
import OrdersPage from "./customer/pages/profile/OrdersPage";
import WishlistPage from "./customer/pages/profile/WishlistPage";
import HelpSupportPage from "./customer/pages/profile/HelpSupportPage";
import CartPage from "./customer/pages/CartPage";
import CheckoutPage from "./customer/pages/CheckoutPage";
import CustomerOrderTracking from "./customer/pages/CustomerOrderTracking";

// Vendor imports
import VendorLayout from "./vendor/layouts/VendorLayout";
import VendorLogin from "./vendor/pages/auth/VendorLogin";
import VendorRegister from "./vendor/pages/auth/VendorRegister";
import VendorForgotPassword from "./vendor/pages/auth/VendorForgotPassword";
import VendorLoginOtp from "./vendor/pages/auth/VendorLoginOtp";
import VendorVerifyLoginOtp from "./vendor/pages/auth/VendorVerifyLoginOtp";
import VendorOtpVerification from "./vendor/pages/auth/VendorOtpVerification";
import VendorResetPassword from "./vendor/pages/auth/VendorResetPassword";
import PendingApproval from "./vendor/pages/dashboard/PendingApproval";
import VendorDashboard from "./vendor/pages/dashboard/VendorDashboard";
import { VendorProvider } from "./vendor/context/VendorContext";
import VendorPermissionProtectedRoute from "./vendor/components/VendorPermissionProtectedRoute";
import VendorAssignedArea from "./vendor/pages/areas/VendorAssignedArea";
import VendorProfile from "./vendor/pages/profile/VendorProfile";

// Vendor Product, Inventory & Order imports
import ProductList from "./vendor/pages/products/ProductList";
import AddProduct from "./vendor/pages/products/AddProduct";
import EditProduct from "./vendor/pages/products/EditProduct";
import ManageVariants from "./vendor/pages/products/ManageVariants";
import ProductDetails from "./vendor/pages/products/ProductDetails";
import VendorOrderList from "./vendor/pages/orders/OrderList";

// Admin imports
import AdminRoutes from "./admin/routes/AdminRoutes";

// Delivery Boy imports
import { DeliveryBoyProvider } from "./deliveryBoy/context/DeliveryBoyContext";
import DeliveryBoyLayout from "./deliveryBoy/layouts/DeliveryBoyLayout";
import DeliveryBoyLogin from "./deliveryBoy/pages/auth/DeliveryBoyLogin";
import DeliveryBoyRegister from "./deliveryBoy/pages/auth/DeliveryBoyRegister";
import DeliveryBoyForgotPassword from "./deliveryBoy/pages/auth/DeliveryBoyForgotPassword";
import DeliveryBoyOtpVerification from "./deliveryBoy/pages/auth/DeliveryBoyOtpVerification";
import DeliveryBoyResetPassword from "./deliveryBoy/pages/auth/DeliveryBoyResetPassword";
import DeliveryBoyDashboard from "./deliveryBoy/pages/dashboard/DeliveryBoyDashboard";
import AssignedOrders from "./deliveryBoy/pages/orders/AssignedOrders";
import OrderDetail from "./deliveryBoy/pages/orders/OrderDetail";
import OnTheWay from "./deliveryBoy/pages/orders/OnTheWay";
import EnterOtp from "./deliveryBoy/pages/orders/EnterOtp";
import DeliveredSuccess from "./deliveryBoy/pages/orders/DeliveredSuccess";
import Earnings from "./deliveryBoy/pages/earnings/Earnings";
import DeliveryBoyProfile from "./deliveryBoy/pages/profile/DeliveryBoyProfile";
import Support from "./deliveryBoy/pages/support/Support";

function App() {
  return (
    <ToastProvider>
      <ToastContainer />
      <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-otp" element={<OTPVerificationPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Customer routes */}
      <Route path="/customer" element={<CustomerLayout />}>
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="product/:id" element={<ProductDetailsPage />} />
        <Route path="location" element={<LocationPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />

        <Route path="profile" element={<CustomerProfilePage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id/track" element={<CustomerOrderTracking />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route path="support" element={<HelpSupportPage />} />

        <Route path="addresses" element={<AddressesPage />} />
        <Route path="refunds" element={<RefundsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Vendor routes */}
      <Route path="/vendor/login" element={<VendorLogin />} />
      <Route path="/vendor/register" element={<VendorRegister />} />
      <Route path="/vendor/pending-approval" element={<PendingApproval />} />
      <Route path="/vendor/forgot-password" element={<VendorForgotPassword />} />
      <Route path="/vendor/login-otp" element={<VendorLoginOtp />} />
      <Route path="/vendor/verify-login-otp" element={<VendorVerifyLoginOtp />} />
      <Route path="/vendor/verify-otp" element={<VendorOtpVerification />} />
      <Route path="/vendor/reset-password" element={<VendorResetPassword />} />

      <Route
        path="/vendor"
        element={
          <VendorProvider>
            <VendorLayout />
          </VendorProvider>
        }
      >
        <Route path="dashboard" element={<VendorDashboard />} />
        <Route path="products" element={<VendorPermissionProtectedRoute module="product" action="view"><ProductList /></VendorPermissionProtectedRoute>} />
        <Route path="products/add" element={<VendorPermissionProtectedRoute module="product" action="add"><AddProduct /></VendorPermissionProtectedRoute>} />
        <Route path="products/edit/:id" element={<VendorPermissionProtectedRoute module="product" action="edit"><EditProduct /></VendorPermissionProtectedRoute>} />
        <Route path="products/:id" element={<VendorPermissionProtectedRoute module="product" action="view"><ProductDetails /></VendorPermissionProtectedRoute>} />
        <Route path="products/:id/variants" element={<VendorPermissionProtectedRoute module="product" action="edit"><ManageVariants /></VendorPermissionProtectedRoute>} />
        <Route path="assigned-area" element={<VendorAssignedArea />} />
        <Route path="orders" element={<VendorOrderList />} />
        <Route path="profile" element={<VendorProfile />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin/*" element={<AdminRoutes />} />

      {/* Delivery Boy routes */}
      <Route
        path="/delivery-boy"
        element={
          <DeliveryBoyProvider>
            <Outlet />
          </DeliveryBoyProvider>
        }
      >
        <Route path="login" element={<DeliveryBoyLogin />} />
        <Route path="register" element={<DeliveryBoyRegister />} />
        <Route path="forgot-password" element={<DeliveryBoyForgotPassword />} />
        <Route path="otp-verify" element={<DeliveryBoyOtpVerification />} />
        <Route path="reset-password" element={<DeliveryBoyResetPassword />} />

        <Route element={<DeliveryBoyLayout />}>
          <Route path="dashboard" element={<DeliveryBoyDashboard />} />
          <Route path="orders" element={<AssignedOrders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="orders/:id/map" element={<OnTheWay />} />
          <Route path="orders/:id/verify" element={<EnterOtp />} />
          <Route path="orders/:id/success" element={<DeliveredSuccess />} />
          <Route path="earnings" element={<Earnings />} />
          <Route path="profile" element={<DeliveryBoyProfile />} />
          <Route path="support" element={<Support />} />
        </Route>
      </Route>
    </Routes>
    </ToastProvider>
  );
}

export default App;
