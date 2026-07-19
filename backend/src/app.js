
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import locationRoutes from "./customer/routes/locationRoutes.js";
import authRoutes from "./customer/routes/authRoutes.js";
import addressRoutes from "./customer/routes/addressRoutes.js";
import vendorAuthRoutes from "./vendor/routes/vendorAuthRoutes.js";
import vendorRoutes from "./vendor/routes/vendorRoutes.js";
import vendorProductRoutes from "./vendor/routes/vendorProductRoutes.js";
import vendorProductsRoutes from "./vendor/routes/vendorProductsRoutes.js";
//admin
import adminAuthRoutes from "./admin/routes/adminAuthRoutes.js";
import adminVendorRoutes from "./admin/routes/vendorRoutes.js";
import productRoutes from "./admin/routes/productRoutes.js";
import attributeRoutes from "./admin/routes/attributeRoutes.js";
import feeSettingsRoutes from "./admin/routes/feeSettingsRoutes.js";
import couponRoutes from "./admin/routes/couponRoutes.js";
import adminOrderRoutes from "./admin/routes/orderRoutes.js";
import adminFeeRoutes from "./admin/routes/feeRoutes.js";
import customerFeeRoutes from "./customer/routes/feeRoutes.js";
import adminDeliveryRoutes from "./admin/routes/adminDeliveryRoutes.js";
import adminCustomerRoutes from "./admin/routes/adminCustomerRoutes.js";
import bannerRoutes from "./admin/routes/bannerRoutes.js";
import adminFinanceRoutes from "./admin/routes/adminFinanceRoutes.js";
import staticPageRoutes from "./admin/routes/staticPageRoutes.js";
import vendorFinanceRoutes from "./vendor/routes/vendorFinanceRoutes.js";
import vendorCustomerRoutes from "./vendor/routes/vendorCustomerRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import catalogRoutes from "./routes/catalogRoutes.js";
import brandRoutes from "./routes/brandRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import customerOrderRoutes from "./customer/routes/orderRoutes.js";
import customerCartRoutes from "./customer/routes/cartRoutes.js";
import customerWishlistRoutes from "./customer/routes/wishlistRoutes.js";
import deliveryBoyAuthRoutes from "./deliveryBoy/routes/deliveryBoyAuthRoutes.js";
import deliveryBoyRoutes from "./deliveryBoy/routes/deliveryBoyRoutes.js";
const app = express();

/*
|--------------------------------------------------------------------------
| Middleware
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://aryusha-com-vzwi.vercel.app",
    ],
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(express.json());

app.use(cookieParser());

/*
|--------------------------------------------------------------------------
| Test Route
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "QuickCart Backend Running 🚀",
  });
});

/*
|--------------------------------------------------------------------------
| Auth Routes
|--------------------------------------------------------------------------
*/

app.use("/api/auth", authRoutes);

//vender routes

app.use(
  "/api/vendor/auth",
  vendorAuthRoutes
);

app.use(
  "/api/vendor",
  vendorRoutes
);

app.use(
  "/api/vendor/product",
  vendorProductRoutes
);

app.use(
  "/api/vendor/products",
  vendorProductsRoutes
);

app.use("/api/vendor/finance", vendorFinanceRoutes);
app.use("/api/vendor/customers", vendorCustomerRoutes);


//admin route
app.use(
  "/api/admin/auth",
  adminAuthRoutes
);

app.use("/api/admin/finance", adminFinanceRoutes);

// addressRoutes

app.use(
  "/api/address",
  addressRoutes
);

app.use(
  "/api/admin/vendors",
  adminVendorRoutes
);

app.use(
  "/api/admin/fee-settings",
  feeSettingsRoutes
);

app.use(
  "/api/admin/coupons",
  couponRoutes
);

app.use(
  "/api/admin/fees",
  adminFeeRoutes
);

app.use(
  "/api/fees",
  customerFeeRoutes
);

// product and attribute routes
app.use(
  "/api/admin/product",
  productRoutes
);

app.use(
  "/api/admin/attribute",
  attributeRoutes
);

app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/customer/orders", customerOrderRoutes);
app.use("/api/customer/cart", customerCartRoutes);
app.use("/api/customer/wishlist", customerWishlistRoutes);

// Delivery Boy Routes
app.use("/api/delivery-boy/auth", deliveryBoyAuthRoutes);
app.use("/api/delivery-boy", deliveryBoyRoutes);

// Admin Customers & Banners
app.use("/api/admin/customers", adminCustomerRoutes);
app.use("/api/admin/banners", bannerRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin", adminDeliveryRoutes);
app.use("/api/footer", staticPageRoutes);

// location api
app.use("/api/location", locationRoutes);

// Catalog Routes (mounted at the bottom to prevent intercepting other /api routes)
app.use("/api", catalogRoutes);



/*
|--------------------------------------------------------------------------
| 404 Route
|--------------------------------------------------------------------------
*/
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found",
  });
});

export default app;
