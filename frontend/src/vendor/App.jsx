
import { Routes, Route } from "react-router-dom";

import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import OTPVerificationPage from "./pages/auth/OTPVerificationPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

import HomePage from "./components/HomePage";

// Customer Imports
import CustomerLayout from "./customer/layouts/CustomerLayout";
import CustomerDashboard from "./customer/pages/CustomerDashboard";
import AddressesPage from "./customer/pages/AddressesPage";
import RefundsPage from "./customer/pages/RefundsPage";
import SettingsPage from "./customer/pages/SettingsPage";
import LocationPage from "./customer/pages/LocationPage";

// Vendor Imports
import VendorLayout from "./vendor/layouts/VendorLayout";
import VendorLogin from "./vendor/pages/auth/VendorLogin";
import VendorLoginOtp from "./vendor/pages/auth/VendorLoginOtp";
import VendorVerifyLoginOtp from "./vendor/pages/auth/VendorVerifyLoginOtp";
import VendorRegister from "./vendor/pages/auth/VendorRegister";
import VendorDashboard from "./vendor/pages/dashboard/VendorDashboard";
import PendingApproval from "./vendor/pages/dashboard/PendingApproval";
import VendorForgotPassword from "./vendor/pages/auth/VendorForgotPassword";
import VendorOtpVerification from "./vendor/pages/auth/VendorOtpVerification";
import VendorResetPassword from "./vendor/pages/auth/VendorResetPassword";

// Vendor Page Sub-components
import ProductList from "./vendor/pages/products/ProductList";
import AddProduct from "./vendor/pages/products/AddProduct";
import EditProduct from "./vendor/pages/products/EditProduct";
import VendorAssignedArea from "./vendor/pages/areas/VendorAssignedArea";
// Profile Section
import CustomerProfilePage from "./customer/pages/profile/CustomerProfilePage";
import AccountPage from "./customer/pages/profile/AccountPage";
import OrdersPage from "./customer/pages/profile/OrdersPage";
import WishlistPage from "./customer/pages/profile/WishlistPage";
import HelpSupportPage from "./customer/pages/profile/HelpSupportPage";

function App() {
  return (
    <Routes>
      {/* Public Routes */}

      <Route path="/" element={<HomePage />} />

      <Route path="/login" element={<LoginPage />} />

      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage />}
      />

      <Route
        path="/verify-otp"
        element={<OTPVerificationPage />}
      />

      <Route
        path="/reset-password"
        element={<ResetPasswordPage />}
      />

      {/* Customer Routes */}

      <Route
        path="/customer"
        element={<CustomerLayout />}
      >
        <Route
          path="dashboard"
          element={<CustomerDashboard />}
        />

        <Route
          path="location"
          element={<LocationPage />}
        />

        {/* Profile Section */}

        <Route
          path="profile"
          element={<CustomerProfilePage />}
        />

        <Route
          path="account"
          element={<AccountPage />}
        />

        <Route
          path="orders"
          element={<OrdersPage />}
        />

        <Route
          path="wishlist"
          element={<WishlistPage />}
        />

        <Route
          path="support"
          element={<HelpSupportPage />}
        />

        {/* Other Pages */}

        <Route
          path="addresses"
          element={<AddressesPage />}
        />

        <Route
          path="refunds"
          element={<RefundsPage />}
        />

        <Route
          path="settings"
          element={<SettingsPage />}
        />
      </Route>
      

      {/* Vendor Public Routes */}

<Route
  path="/vendor/login"
  element={<VendorLogin />}
/>

<Route
  path="/vendor/register"
  element={<VendorRegister />}
/>

<Route
  path="/vendor/pending-approval"
  element={<PendingApproval />}
/>

<Route
  path="/vendor/forgot-password"
  element={<VendorForgotPassword />}
/>

<Route
  path="/vendor/login-otp"
  element={<VendorLoginOtp />}
/>

<Route
  path="/vendor/verify-login-otp"
  element={<VendorVerifyLoginOtp />}
/>

<Route
  path="/vendor/verify-otp"
  element={<VendorOtpVerification />}
/>

<Route
  path="/vendor/reset-password"
  element={<VendorResetPassword />}
/>

{/* Vendor Protected Routes */}

<Route
  path="/vendor"
  element={<VendorLayout />}
>
  <Route path="dashboard" element={<VendorDashboard />} />
  <Route path="products" element={<ProductList />} />
  <Route path="products/add" element={<AddProduct />} />
  <Route path="products/edit/:id" element={<EditProduct />} />
  <Route path="assigned-area" element={<VendorAssignedArea />} />
</Route>


    </Routes>
  );
}

export default App;