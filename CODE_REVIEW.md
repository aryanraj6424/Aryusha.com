# QuickCart — Backend Code Review Report

**Date:** 2026-07-22  
**Scope:** Full backend code quality & correctness review  
**Reviewer:** Automated code review  

---

## 1. Price / Amount Handling

### GOOD: Fees are recalculated server-side

The `placeOrder` controller (L115-126) and `getCartSummary` controller both call `calculateOrderFees()` on the server, ignoring the client-sent `deliveryCharge`, `taxAmount`, and `grandTotal`. The final `grandTotal` is recalculated at L126 in `orderController.js`.

### GOOD: Cart prices are resolved from the database

The `resolveCartItems()` helper in `cartController.js` (L11-73) fetches `sellingPrice` from `VendorListing` or `VendorProduct` in the database, overriding client-sent `item.price`.

---

### Finding CR-1: `totalAmount` (item subtotal) is trusted from the client

| Detail | Value |
|---|---|
| **File** | orderController.js L35, L148 |
| **Severity** | **High** |
| **Current Behavior** | `totalAmount` is destructured from `req.body` (L35) and saved directly to the order (L148). The server recalculates fees and `grandTotal` on top of it, but never verifies that `totalAmount` actually equals the sum of `(item.price * item.qty)` using DB-sourced prices. |
| **Problem** | A user could send `totalAmount: 1` while keeping real items. Fees are calculated on a 1 rupee base, resulting in a much lower `grandTotal`. |
| **Suggested Fix** | Recalculate `totalAmount` on the server by looping through items with DB-sourced prices (using the `resolveCartItems` helper from `cartController.js`), then use that value for fee calculations. |

---

### Finding CR-2: `item.price` values in the order are trusted from the client

| Detail | Value |
|---|---|
| **File** | orderController.js L30-45, L137-143 |
| **Severity** | **High** |
| **Current Behavior** | Each `item.price` from `req.body.items` is stored directly into the order document (L140). The server does NOT look up the actual price from `VendorListing` / `VendorProduct` for each item during order creation. |
| **Problem** | A user could send `items: [{ price: 0.01, qty: 1, ... }]` and pay almost nothing for an expensive product. |
| **Suggested Fix** | Before creating the order, resolve each item's price from the database (similar to what `resolveCartItems` does in `cartController.js`). Replace client-sent `item.price` with the DB price. |

---

### Finding CR-3: `couponDiscount` is trusted from the client at order placement

| Detail | Value |
|---|---|
| **File** | orderController.js L39-40, L126 |
| **Severity** | **Medium** |
| **Current Behavior** | `couponDiscount` is destructured from `req.body` (L40) and used directly in the `grandTotal` calculation (L126): `totalAmount - couponDiscount + totalCalculatedFees`. While `couponCode` is validated and its `usedCount` incremented (L174-181), the actual discount amount is NOT recalculated server-side at order time. |
| **Problem** | A user could send `couponDiscount: 99999` with a valid `couponCode` and get a near-zero `grandTotal`. The cart summary endpoint does proper coupon calculation, but the order endpoint doesn't repeat it. |
| **Suggested Fix** | Re-validate the coupon and recalculate the discount amount on the server during `placeOrder`, using the same logic from `getCartSummary`. |

---

## 2. Route Protection Map

### Auth Middleware Used

| Middleware | Location | Validates |
|---|---|---|
| `protect` | authMiddleware.js | Customer JWT -> `req.user` |
| `protectAdmin` | adminAuthMiddleware.js | Admin JWT -> `req.admin` |
| `protectVendor` | vendorAuthMiddleware.js | Vendor JWT + status checks -> `req.vendor` |
| `protectDeliveryBoy` | deliveryBoyAuthMiddleware.js | DeliveryBoy JWT + status checks -> `req.deliveryBoy` |

### Route Protection Table

| Route Prefix | Middleware | Protected? |
|---|---|---|
| `POST /api/auth/signup, login, forgot-password, verify-otp, reset-password` | None | Public (correct) |
| `PUT /api/auth/profile` | `protect` | Protected |
| `POST /api/auth/google` | None | Public (correct) |
| `POST /api/auth/token-refresh` | None | See CR-5 |
| `POST /api/auth/firebase-login` | None | Public (correct) |
| `/api/customer/orders/*` | `router.use(protect)` | Protected |
| `POST /api/customer/cart/summary` | `optionalProtect` | Public OK (read-only) |
| `GET /api/customer/cart/coupons, /slots` | `protect` | Protected |
| `POST /api/customer/cart/apply-coupon, remove-coupon` | `protect` | Protected |
| `/api/customer/wishlist/*` | `router.use(protect)` | Protected |
| `/api/address/*` | **None** | **UNPROTECTED - See CR-4** |
| `/api/admin/auth/*` | None | Public (correct) |
| `/api/admin/vendors/*` | **None** | **UNPROTECTED - See CR-6** |
| `/api/admin/product/*` | `router.use(protectAdmin)` | Protected |
| `/api/admin/coupons/*` | `router.use(protectAdmin)` | Protected |
| `/api/admin/orders/*` | `router.use(protectAdmin)` | Protected |
| `/api/admin/fees/*` | `router.use(protectAdmin)` | Protected |
| `/api/admin/fee-settings/*` | `router.use(protectAdmin)` | Protected |
| `/api/admin/banners/public` | None | Public (correct) |
| `/api/admin/banners/ (CRUD)` | `protectAdmin` | Protected |
| `/api/admin/customers/*` | `protectAdmin` | Protected |
| `/api/admin/deliveries/*` | `router.use(protectAdmin)` | Protected |
| `/api/admin/finance/*` | `router.use(protectAdmin)` | Protected |
| `/api/vendor/auth/*` | None | Public (correct) |
| `/api/vendor/*` (dashboard, orders) | `router.use(protectVendor)` | Protected |
| `/api/vendor/product/*` | `router.use(protectVendor)` | Protected |
| `/api/vendor/products/*` | `router.use(protectVendor)` | Protected |
| `/api/vendor/finance/*` | `router.use(protectVendor)` | Protected |
| `/api/vendor/customers/*` | `router.use(protectVendor)` | Protected |
| `/api/delivery-boy/auth/*` | None | Public (correct) |
| `/api/delivery-boy/*` | `router.use(protectDeliveryBoy)` | Protected |
| `/api/categories (GET)` | None | Public (correct) |
| `/api/categories (CUD)` | `protectAdmin` | Protected |
| `/api/brands (GET)` | None | Public (correct) |
| `/api/brands (CUD)` | `protectAdmin` | Protected |
| `/api/upload/*` | **None** | **UNPROTECTED - See CR-7** |
| `/api/fees (GET)` | None | Public (correct for checkout) |
| `/api/admin/attribute/*` | **None** | **UNPROTECTED - See CR-8** |
| `/api/footer/pages/:slug (GET)` | None | Public (correct) |
| `/api/footer/cities (GET)` | None | Public (correct) |
| `/api/footer/pages (admin CMS)` | `protectAdmin` | Protected |
| `/api/location/*` | None | Public (correct) |
| Catalog public routes | None | Public (correct) |
| Catalog admin routes | `protectAdmin` | Protected |

---

### Finding CR-4: Address routes have NO authentication middleware

| Detail | Value |
|---|---|
| **File** | addressRoutes.js L44-69 |
| **Severity** | **High** |
| **Current Behavior** | All three address endpoints (`POST /create`, `GET /user/:userId`, `DELETE /:id`) are completely unprotected — no auth middleware at all. |
| **Problem** | Anyone can create addresses for any user, view any user's addresses by guessing their userId, or delete any address by ID. |
| **Suggested Fix** | Add `router.use(protect)` before all address routes. Additionally, the `createAddress` passes `req.body` directly to `Address.create()` (L9) — use `req.user._id` as the `userId` instead. |

---

### Finding CR-5: Token refresh endpoint requires no authentication

| Detail | Value |
|---|---|
| **File** | authRoutes.js L47-58 |
| **Severity** | **Medium** |
| **Current Behavior** | `POST /api/auth/token-refresh` accepts a `userId` in the body and returns a fresh JWT — with no verification of the old token or any other secret. |
| **Problem** | Anyone who knows (or guesses) a valid `userId` (MongoDB ObjectId) can generate a valid JWT for that user without any credentials. |
| **Suggested Fix** | This endpoint should require the old (expired) JWT to be sent, verify it (allow expired tokens), and only then issue a new one. Or remove it entirely and use standard refresh-token patterns. |

---

### Finding CR-6: Admin vendor management routes have NO auth middleware

| Detail | Value |
|---|---|
| **File** | admin/routes/vendorRoutes.js L53-153 |
| **Severity** | **High** |
| **Current Behavior** | The admin vendor routes (`/api/admin/vendors/*`) have no `protectAdmin` middleware applied. All 17+ endpoints (create vendor, delete vendor, approve, reject, suspend, manage permissions, etc.) are publicly accessible. |
| **Problem** | Anyone can approve/reject/delete vendors, change permissions, or create new vendor accounts without admin authentication. |
| **Suggested Fix** | Add `router.use(protectAdmin)` after the router creation, or apply `protectAdmin` to each route individually. |

---

### Finding CR-7: Upload and delete routes have NO auth middleware

| Detail | Value |
|---|---|
| **File** | uploadRoutes.js L8, L33 |
| **Severity** | **High** |
| **Current Behavior** | `POST /api/upload/` and `POST /api/upload/delete` have no authentication. Anyone can upload files to your Cloudinary account or delete any asset by `public_id`. |
| **Problem** | Unrestricted uploads could be used for abuse (storage cost, hosting malicious content). The delete endpoint allows anyone to remove legitimate images. |
| **Suggested Fix** | Add authentication middleware (`protect` or `protectAdminOrVendor`) to both endpoints. Consider restricting allowed file types and sizes. |

---

### Finding CR-8: Attribute routes have NO auth middleware

| Detail | Value |
|---|---|
| **File** | attributeRoutes.js L10-27 |
| **Severity** | **High** |
| **Current Behavior** | All attribute CRUD endpoints (`/api/admin/attribute/*`) are completely unprotected despite being under the `/admin/` path. |
| **Problem** | Anyone can create, update, or delete product attributes without admin authentication. |
| **Suggested Fix** | Add `router.use(protectAdmin)` before the route definitions. |

---

## 3. Input Validation

### Finding CR-9: No server-side validation library is used anywhere

| Detail | Value |
|---|---|
| **Scope** | Entire backend |
| **Severity** | **Medium** |
| **Current Behavior** | The project does not use any validation library (Zod, Joi, express-validator, etc.). All validation is manual `if` checks scattered across controllers. |
| **Problem** | Manual checks are easy to miss, inconsistent, and don't provide structured error messages. Several endpoints have minimal or no validation at all. |
| **Suggested Fix** | Adopt a validation library (e.g., Zod or Joi) and create schemas for each route's expected input. Apply validation middleware before controllers. |

---

### Finding CR-10: `placeOrder` doesn't validate item structure

| Detail | Value |
|---|---|
| **File** | orderController.js L30-49 |
| **Severity** | **Medium** |
| **Current Behavior** | The order endpoint checks that `items` exists and has length > 0, but doesn't validate individual items have required fields (`productId`, `variantId`, `price`, `qty`) or that values are the correct types (e.g., `qty` is a positive integer). |
| **Problem** | Malformed items could cause runtime errors, unexpected DB entries, or bypass stock checks. |
| **Suggested Fix** | Validate each item has `productId`, `variantId`, `qty >= 1`, and that all IDs are valid ObjectIds. |

---

### Finding CR-11: `createAddress` passes `req.body` directly to `Address.create()`

| Detail | Value |
|---|---|
| **File** | addressController.js L9 |
| **Severity** | **Medium** |
| **Current Behavior** | `Address.create(req.body)` — no field whitelisting, no validation. |
| **Problem** | Users can inject arbitrary fields into the address document. Combined with CR-4 (no auth), this is especially concerning. |
| **Suggested Fix** | Destructure only the expected fields from `req.body` and validate them. |

---

### Finding CR-12: `resetPassword` endpoint requires no prior OTP verification state

| Detail | Value |
|---|---|
| **File** | authController.js L177-195 |
| **Severity** | **High** |
| **Current Behavior** | `POST /api/auth/reset-password` accepts `{ phoneNumber, password }` and directly resets the password. It does NOT verify that OTP was successfully validated first — anyone can call this endpoint directly with any phone number. |
| **Problem** | Password reset can be performed without OTP verification. The `verifyOtp` step doesn't set any verified flag either — it just returns a token. The admin reset endpoint (L198-247 in `adminAuthController.js`) has the same issue. |
| **Suggested Fix** | Either: (a) require the token from `verifyOtp` as an auth header, or (b) store a `resetVerified` flag on the user document after OTP verification and check it in `resetPassword`. |

---

## 4. Data Ownership Checks

### Finding CR-13: `getCustomerOrders` doesn't verify the requesting user owns the data

| Detail | Value |
|---|---|
| **File** | orderController.js L207-224 |
| **Severity** | **Medium** |
| **Current Behavior** | `GET /api/customer/orders/user/:userId` — uses `req.params.userId` to fetch orders, but doesn't verify that `req.params.userId === req.user._id`. |
| **Problem** | An authenticated user can pass any other user's ID in the URL and see their order history. |
| **Suggested Fix** | Use `req.user._id` directly instead of `req.params.userId`, or verify they match. |

---

### Finding CR-14: `getOrderById` has no ownership check

| Detail | Value |
|---|---|
| **File** | orderController.js L229-250 |
| **Severity** | **High** |
| **Current Behavior** | `GET /api/customer/orders/:id` fetches any order by its `_id` without checking if `order.customerId === req.user._id`. |
| **Problem** | Any authenticated user can view details of any other user's order by knowing or guessing the order's MongoDB `_id`. |
| **Suggested Fix** | Add: `if (order.customerId.toString() !== req.user._id.toString()) return res.status(403).json(...)` |

---

### Finding CR-15: `downloadInvoice` has no ownership check

| Detail | Value |
|---|---|
| **File** | orderController.js L255-422 |
| **Severity** | **High** |
| **Current Behavior** | `GET /api/customer/orders/:id/invoice` generates and returns a PDF invoice for any order without verifying the requesting user is the order's customer. |
| **Problem** | Any authenticated user can download invoices for anyone else's orders. |
| **Suggested Fix** | Add ownership check: `if (order.customerId.toString() !== req.user._id.toString()) return res.status(403)...` |

---

### GOOD: `getOrderTracking`, `getOrderOtp`, and `rateOrder` all have proper ownership checks

These endpoints correctly verify `order.customerId.toString() !== req.user._id.toString()` (L437, L488, L520).

---

### Finding CR-16: `getUserAddresses` uses URL param instead of authenticated user

| Detail | Value |
|---|---|
| **File** | addressController.js L25-48 |
| **Severity** | **High** |
| **Current Behavior** | `GET /api/address/user/:userId` fetches addresses by `req.params.userId`. Combined with CR-4 (no auth), anyone can view anyone's addresses. Even with auth added, it should use `req.user._id`. |
| **Suggested Fix** | Use `req.user._id` instead of `req.params.userId`. |

---

### Finding CR-17: `deleteAddress` has no ownership check

| Detail | Value |
|---|---|
| **File** | addressController.js L51-74 |
| **Severity** | **High** |
| **Current Behavior** | `DELETE /api/address/:id` deletes any address by its `_id` without checking if it belongs to the requesting user. |
| **Suggested Fix** | Verify `address.userId === req.user._id` before deleting. |

---

## 5. Sensitive Data Exposure

### Finding CR-18: Signup/Login/OTP responses return the full user document including password hash

| Detail | Value |
|---|---|
| **File** | authController.js L31, L58, L107, L166, L221, L265, L280, L292, L301 |
| **Severity** | **High** |
| **Current Behavior** | Responses like `res.json({ user, token })` return the entire Mongoose document, which includes `password` (hashed), `otp`, `otpExpires`, `googleId`, and other internal fields. Same issue exists in `loginAdmin` (L51-57 of `adminAuthController.js`), which returns the full `admin` object including `password`. |
| **Problem** | Password hashes, OTPs, and internal fields are exposed to the client in API responses. |
| **Suggested Fix** | Either: (a) add `.select("-password -otp -otpExpires")` to all user queries, or (b) explicitly construct the response object with only safe fields: `{ _id, fullName, phoneNumber, email, provider }`. |

---

### Finding CR-19: OTP logged to console in production

| Detail | Value |
|---|---|
| **File** | authController.js L136, adminAuthController.js L107-110 |
| **Severity** | **Medium** |
| **Current Behavior** | `console.log("Generated OTP:", otp)` and `console.log("ADMIN OTP:", otp)` print sensitive OTPs to server logs. |
| **Problem** | If production logs are accessible (e.g., via a logging service dashboard), OTPs are exposed. |
| **Suggested Fix** | Remove OTP console logs or guard them with a `NODE_ENV === 'development'` check. |

---

### Finding CR-20: Frontend `.env` contains Firebase config that is not gitignored

| Detail | Value |
|---|---|
| **File** | frontend/.env |
| **Severity** | **Medium** |
| **Current Behavior** | Firebase API keys, project IDs, and app IDs are stored in `frontend/.env`. The `frontend/.gitignore` does NOT include `.env`. |
| **Problem** | Firebase config will be committed to version control. While Firebase client keys are designed to be semi-public (restricted by security rules), it's still better practice to gitignore `.env` and use `.env.example` for documentation. |
| **Suggested Fix** | Add `.env` to `frontend/.gitignore`. An `.env.example` already exists which is good. |

---

### Finding CR-21: `protectAdmin` middleware doesn't verify the admin account still exists

| Detail | Value |
|---|---|
| **File** | adminAuthMiddleware.js L30-37 |
| **Severity** | **Low** |
| **Current Behavior** | After decoding the JWT, `Admin.findById(decoded.id)` may return `null` (e.g., if the admin was deleted), but the middleware doesn't check for this — it just sets `req.admin = null` and calls `next()`. |
| **Problem** | Controllers expecting `req.admin` to be populated may fail unexpectedly or allow access with a deleted admin's token. The customer `protect` middleware (L33-36) has the same issue. |
| **Suggested Fix** | Add a null-check after `findById`: `if (!admin) return res.status(401).json({ message: "Account not found" })`. The `protectVendor` and `protectDeliveryBoy` middlewares already do this correctly. |

---

## 6. Additional Findings

### Finding CR-22: `placeOrder` uses `customerId` from `req.body`, not from `req.user`

| Detail | Value |
|---|---|
| **File** | orderController.js L31, L134 |
| **Severity** | **Medium** |
| **Current Behavior** | `customerId` is taken from `req.body` (L31) and stored in the order (L134). Even though the route is protected by `protect`, the order is created with the client-provided `customerId`, not `req.user._id`. |
| **Problem** | An authenticated user could place orders under a different user's `customerId`, polluting another user's order history. |
| **Suggested Fix** | Use `req.user._id` as the `customerId` instead of trusting `req.body.customerId`. |

---

### Finding CR-23: `roleMiddleware.js` and `errorMiddleware.js` are empty files

| Detail | Value |
|---|---|
| **Files** | roleMiddleware.js, errorMiddleware.js |
| **Severity** | **Low** |
| **Current Behavior** | Both files are empty (0 bytes). |
| **Problem** | No centralized error handling middleware or role-based access middleware. Without error middleware, unhandled errors may leak stack traces. |
| **Suggested Fix** | Implement error middleware to catch unhandled errors globally and sanitize error responses. Implement role middleware if needed. |

---

### Finding CR-24: All auth middleware uses the same `JWT_SECRET`

| Detail | Value |
|---|---|
| **Files** | All three auth middleware files |
| **Severity** | **Medium** |
| **Current Behavior** | Customer, Admin, Vendor, and DeliveryBoy all use the same `process.env.JWT_SECRET` for token verification. |
| **Problem** | A customer's JWT could potentially be used to authenticate as an admin, vendor, or delivery boy if the user IDs happen to collide (unlikely with MongoDB ObjectIds, but architecturally unsound). The token doesn't encode a `role` claim that is checked. |
| **Suggested Fix** | Either: (a) use separate JWT secrets per role, or (b) include a `role` claim in each JWT and verify it in the respective middleware. |

---

### Finding CR-25: No rate limiting on login/auth endpoints

| Detail | Value |
|---|---|
| **Scope** | All auth routes |
| **Severity** | **Medium** |
| **Current Behavior** | No rate limiting library (e.g., `express-rate-limit`) is applied to login, signup, OTP verification, or password reset endpoints. |
| **Problem** | Brute-force attacks on login, OTP guessing, and credential stuffing are not mitigated. |
| **Suggested Fix** | Add `express-rate-limit` to auth-related endpoints, especially login and OTP verification routes. |

---

## Summary Table

| ID | Description | Severity | Category |
|---|---|---|---|
| CR-1 | `totalAmount` trusted from client at order placement | High | Price Handling |
| CR-2 | `item.price` values trusted from client at order placement | High | Price Handling |
| CR-3 | `couponDiscount` trusted from client at order placement | Medium | Price Handling |
| CR-4 | Address routes have NO auth middleware | High | Route Protection |
| CR-5 | Token refresh requires no authentication | Medium | Route Protection |
| CR-6 | Admin vendor management routes have NO auth | High | Route Protection |
| CR-7 | Upload/delete routes have NO auth | High | Route Protection |
| CR-8 | Attribute routes have NO auth | High | Route Protection |
| CR-9 | No validation library used anywhere | Medium | Input Validation |
| CR-10 | `placeOrder` doesn't validate item structure | Medium | Input Validation |
| CR-11 | `createAddress` passes raw `req.body` to DB | Medium | Input Validation |
| CR-12 | `resetPassword` needs no prior OTP verification | High | Input Validation |
| CR-13 | `getCustomerOrders` — no ownership check | Medium | Data Ownership |
| CR-14 | `getOrderById` — no ownership check | High | Data Ownership |
| CR-15 | `downloadInvoice` — no ownership check | High | Data Ownership |
| CR-16 | `getUserAddresses` — uses URL param, no ownership | High | Data Ownership |
| CR-17 | `deleteAddress` — no ownership check | High | Data Ownership |
| CR-18 | Auth responses expose password hash, OTP, internal fields | High | Data Exposure |
| CR-19 | OTP logged to console | Medium | Data Exposure |
| CR-20 | Frontend `.env` not gitignored | Medium | Data Exposure |
| CR-21 | `protectAdmin` / `protect` don't null-check user | Low | Auth Middleware |
| CR-22 | `placeOrder` uses `req.body.customerId` instead of `req.user._id` | Medium | Data Ownership |
| CR-23 | `roleMiddleware.js` and `errorMiddleware.js` are empty | Low | Architecture |
| CR-24 | All roles share the same `JWT_SECRET` | Medium | Auth Architecture |
| CR-25 | No rate limiting on auth endpoints | Medium | Auth Protection |

---

### Totals

| Metric | Count |
|---|---|
| **Total Issues Found** | 25 |
| **High Severity** | 12 |
| **Medium Severity** | 11 |
| **Low Severity** | 2 |

### Safe Areas

| Area | Notes |
|---|---|
| **Fee calculation** | Fees are correctly recalculated server-side via `calculateOrderFees()` |
| **Cart price resolution** | `resolveCartItems()` correctly fetches prices from DB |
| **Vendor auth middleware** | Checks approval status + account status in addition to JWT |
| **DeliveryBoy auth middleware** | Same robust checks as vendor middleware |
| **Coupon validation (cart summary)** | Thorough validation of coupon rules, dates, limits |
| **Vendor product ownership** | Vendor product CRUD correctly enforces `createdBy === req.vendor._id` |
| **Order tracking/OTP/rating** | These endpoints have proper ownership checks |
| **Admin orders, coupons, fees, finance, delivery** | All properly protected with `protectAdmin` |
| **Vendor routes** | All properly protected with `protectVendor` |
| **Delivery boy routes** | All properly protected with `protectDeliveryBoy` |
| **Stock validation** | Order placement correctly checks and decrements stock in a transaction |
| **Duplicate order prevention** | 15-second window check prevents accidental double-submissions |
