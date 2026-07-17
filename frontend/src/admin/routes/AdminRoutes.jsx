import { Routes, Route, Navigate } from "react-router-dom";

// ==============================
// Layout & Protection
// ==============================
import AdminLayout from "../layouts/AdminLayout";
import AdminProtectedRoute from "../components/AdminProtectedRoute";

// ==============================
// Auth
// ==============================
import AdminLogin from "../pages/auth/AdminLogin";
import AdminForgotPassword from "../pages/auth/AdminForgotPassword";
import AdminOtpVerification from "../pages/auth/AdminOtpVerification";
import AdminResetPassword from "../pages/auth/AdminResetPassword";

// ==============================
// Dashboard
// ==============================
import AdminDashboard from "../pages/dashboard/AdminDashboard";
import DashboardAnalytics from "../pages/dashboard/DashboardAnalytics";

// ==============================
// Vendors
// ==============================
import VendorList from "../pages/Vendors/VendorList";
import AddVendor from "../pages/Vendors/AddVendor";
import EditVendor from "../pages/Vendors/EditVendor";
import VendorDetails from "../pages/Vendors/VendorDetails";

// ==============================
// Catalog - Categories
// ==============================
import CategoryList from "../pages/catalog/categories/CategoryList";
import AddCategory from "../pages/catalog/categories/AddCategory";
import EditCategory from "../pages/catalog/categories/EditCategory";

// ==============================
// Catalog - Sub Categories
// ==============================
import SubCategoryList from "../pages/catalog/subCategories/SubCategoryList";
import AddSubCategory from "../pages/catalog/subCategories/AddSubCategory";
import EditSubCategory from "../pages/catalog/subCategories/EditSubCategory";

// ==============================
// Catalog - Product Families
// ==============================
import ProductFamilyList from "../pages/catalog/productFamilies/ProductFamilyList";
import AddProductFamily from "../pages/catalog/productFamilies/AddProductFamily";
import EditProductFamily from "../pages/catalog/productFamilies/EditProductFamily";

// ==============================
// Catalog - Brands
// ==============================
import BrandList from "../pages/catalog/brands/BrandList";
import AddBrand from "../pages/catalog/brands/AddBrand";
import EditBrand from "../pages/catalog/brands/EditBrand";

// ==============================
// Catalog - Units
// ==============================
import UnitList from "../pages/catalog/units/UnitList";
import AddUnit from "../pages/catalog/units/AddUnit";
import EditUnit from "../pages/catalog/units/EditUnit";

// ==============================
// Catalog - Attributes
// ==============================
import AttributeList from "../pages/catalog/attributes/AttributeList";
import AddAttribute from "../pages/catalog/attributes/AddAttribute";
import EditAttribute from "../pages/catalog/attributes/EditAttribute";

// ==============================
// Catalog - Attribute Groups
// ==============================
import AttributeGroupList from "../pages/catalog/attributeGroups/AttributeGroupList";
import AddAttributeGroup from "../pages/catalog/attributeGroups/AddAttributeGroup";
import EditAttributeGroup from "../pages/catalog/attributeGroups/EditAttributeGroup";

// ==============================
// Catalog - Family Attribute Mapping
// ==============================
import FamilyAttributeMapping from "../pages/catalog/familyAttributeMapping/FamilyAttributeMapping";

// ==============================
// Products
// ==============================
import ProductManagement from "../pages/products/ProductManagement";
import ProductList from "../pages/products/ProductList";
import AddProduct from "../pages/products/AddProduct";
import EditProduct from "../pages/products/EditProduct";
import ProductDetails from "../pages/products/ProductDetails";
import ManageVariants from "../pages/products/ManageVariants";

// ==============================
// Inventory
// ==============================
import InventoryList from "../pages/inventory/InventoryList";
import LowStock from "../pages/inventory/LowStock";
import StockHistory from "../pages/inventory/StockHistory";

// ==============================
// Orders
// ==============================
import OrderList from "../pages/orders/OrderList";
import OrderDetails from "../pages/orders/OrderDetails";

// ==============================
// Returns
// ==============================
import ReturnList from "../pages/returns/ReturnList";

// ==============================
// Customers
// ==============================
import CustomerList from "../pages/customers/CustomerList";

// ==============================
// Marketing
// ==============================
import MarketingBanners from "../pages/marketing/MarketingBanners";

// ==============================
// Offers
// ==============================
import OffersCoupons from "../pages/offers/OffersCoupons";

// ==============================
// Reports
// ==============================
import ReportsAnalytics from "../pages/reports/ReportsAnalytics";
import FeeManagement from "../pages/fees/FeeManagement";
import AdminFinance from "../pages/finance/AdminFinance";

// ==============================
// Deliveries & Riders
// ==============================
import DeliveriesMonitor from "../pages/deliveries/DeliveriesMonitor";
import DeliveryLogs from "../pages/deliveries/DeliveryLogs";
import DeliveryReports from "../pages/deliveries/DeliveryReports";
import DeliveryBoyOverview from "../pages/deliveries/DeliveryBoyOverview";
import DeliveryBoyDetail from "../pages/deliveries/DeliveryBoyDetail";

// ==============================
// Settings
// ==============================
import SystemSettings from "../pages/settings/SystemSettings";
import FeeSettings from "../pages/settings/FeeSettings";

// ==============================
// Users & Roles
// ==============================
import UsersRoles from "../pages/users/UsersRoles";

// ==============================
// Support
// ==============================
import SupportTickets from "../pages/support/SupportTickets";

export default function AdminRoutes() {
  return (
    <Routes>
      {/* ==========================
            Public Routes
      ========================== */}

      <Route index element={<Navigate to="login" replace />} />
      <Route path="login" element={<AdminLogin />} />

      <Route path="forgot-password" element={<AdminForgotPassword />} />

      <Route path="verify-otp" element={<AdminOtpVerification />} />

      <Route path="reset-password" element={<AdminResetPassword />} />

      {/* ==========================
            Protected Routes
      ========================== */}

      <Route
        path=""
        element={
          <AdminProtectedRoute>
            <AdminLayout />
          </AdminProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route path="dashboard" element={<AdminDashboard />} />

        {/* Vendors */}
        <Route path="vendors" element={<VendorList />} />
        <Route path="vendors/add" element={<AddVendor />} />
        <Route path="vendors/edit/:id" element={<EditVendor />} />
        <Route path="vendors/:id" element={<VendorDetails />} />

        {/* Categories */}
        <Route path="categories" element={<CategoryList />} />
        <Route path="categories/add" element={<AddCategory />} />
        <Route path="categories/edit/:id" element={<EditCategory />} />

        {/* Sub Categories */}
        <Route path="sub-categories" element={<SubCategoryList />} />
        <Route path="sub-categories/add" element={<AddSubCategory />} />
        <Route path="sub-categories/edit/:id" element={<EditSubCategory />} />

        {/* Product Families */}
        <Route path="product-families" element={<ProductFamilyList />} />
        <Route path="product-families/add" element={<AddProductFamily />} />
        <Route
          path="product-families/edit/:id"
          element={<EditProductFamily />}
        />

        {/* Brands */}
        <Route path="brands" element={<BrandList />} />
        <Route path="brands/add" element={<AddBrand />} />
        <Route path="brands/edit/:id" element={<EditBrand />} />

        {/* Units */}
        <Route path="units" element={<UnitList />} />
        <Route path="units/add" element={<AddUnit />} />
        <Route path="units/edit/:id" element={<EditUnit />} />

        {/* Attributes */}
        <Route path="attributes" element={<AttributeList />} />
        <Route path="attributes/add" element={<AddAttribute />} />
        <Route path="attributes/edit/:id" element={<EditAttribute />} />

        {/* Attribute Groups */}
        <Route path="attribute-groups" element={<AttributeGroupList />} />
        <Route path="attribute-groups/add" element={<AddAttributeGroup />} />
        <Route
          path="attribute-groups/edit/:id"
          element={<EditAttributeGroup />}
        />

        {/* Family Mapping */}
        <Route
          path="family-attribute-mapping"
          element={<FamilyAttributeMapping />}
        />

        {/* Products */}
        <Route path="product-management" element={<ProductManagement />} />
        <Route path="products" element={<ProductList />} />
        <Route path="products/add" element={<AddProduct />} />
        <Route path="products/edit/:id" element={<EditProduct />} />
        <Route path="products/:id/variants" element={<ManageVariants />} />
        <Route path="products/:id" element={<ProductDetails />} />

        {/* Inventory */}
        <Route path="inventory" element={<InventoryList />} />
        <Route path="inventory/low-stock" element={<LowStock />} />
        <Route path="inventory/history" element={<StockHistory />} />

        {/* Orders */}
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/:id" element={<OrderDetails />} />

        {/* Returns */}
        <Route path="returns" element={<ReturnList />} />

        {/* Customers */}
        <Route path="customers" element={<CustomerList />} />

        {/* Marketing */}
        <Route path="marketing" element={<MarketingBanners />} />

        {/* Offers */}
        <Route path="offers" element={<OffersCoupons />} />
        <Route path="fees" element={<FeeManagement />} />

        {/* Reports */}
        <Route path="reports" element={<ReportsAnalytics />} />
        <Route path="finance" element={<AdminFinance />} />

        {/* Deliveries & Riders */}
        <Route path="deliveries" element={<DeliveriesMonitor />} />
        <Route path="delivery-logs" element={<DeliveryLogs />} />
        <Route path="delivery-reports" element={<DeliveryReports />} />
        <Route path="delivery-boys" element={<DeliveryBoyOverview />} />
        <Route path="delivery-boys/:id" element={<DeliveryBoyDetail />} />

        {/* Settings */}
        <Route path="settings" element={<SystemSettings />} />
        <Route path="fee-settings" element={<FeeSettings />} />

        {/* Users & Roles */}
        <Route path="users" element={<UsersRoles />} />

        {/* Support */}
        <Route path="support" element={<SupportTickets />} />
      </Route>
    </Routes>
  );
}
