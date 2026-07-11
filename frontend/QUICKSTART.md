# 🚀 QuickKart Product & Attributes Setup Guide

## What Was Fixed

You now have a **real, fully functional** backend implementation for:

- ✅ Creating and managing **Products**
- ✅ Creating and managing **Attributes**
- ✅ **Real database persistence** (MongoDB)
- ✅ **Automatic attribute seeding** on server start

## System Requirements

- **MongoDB** running locally on `localhost:27017`
- **Node.js** for both backend and frontend
- **npm** or yarn

## Quick Setup

### 1️⃣ MongoDB Setup

Ensure MongoDB is running:

```bash
# On Windows (if installed as service)
net start MongoDB

# Or run MongoDB locally
mongod
```

### 2️⃣ Backend Setup

```bash
cd backend
npm install  # If not done already

# Start the server
npm start
```

**Expected output:**

```
✓ MongoDB Connected: localhost
✓ Seeded 6 default attributes
🚀 Server running on port 5000
```

### 3️⃣ Frontend Setup

```bash
# In root directory
npm install  # If not done already

# Start development server
npm run dev
```

## Testing the Features

### Test 1: Add a Product

1. Go to Admin → **Product Management** → **Add New Product**
2. Fill in all steps:
   - **Basic Information**: Name, Brand, SKU, Category
   - **Pricing**: MRP and Selling Price
   - **Images**: Upload product images
   - **Inventory**: Set stock quantity
   - **Description**: Add product descriptions
   - **Attributes**: Select and fill attributes
3. Click **Save Product**
4. ✅ Product should be saved to database

### Test 2: Check Product was Saved

1. Go back to **Product Management** → **Products**
2. You should see your newly created product in the list
3. It will have all the data you entered

### Test 3: Verify Attributes Load

1. When you go to the **Attributes step** (step 6):
   - Should NOT show "Unable to load attributes"
   - Should show the 6 pre-loaded attributes:
     - Color
     - Size
     - Material
     - Brand
     - Weight
     - Warranty

## Default Attributes

The system automatically seeds these attributes on first run:

| Attribute | Type     | Default Values                         |
| --------- | -------- | -------------------------------------- |
| Color     | color    | Red, Blue, Green, Black, White, Yellow |
| Size      | size     | XS, S, M, L, XL, XXL                   |
| Material  | dropdown | Cotton, Polyester, Wool, Silk, Linen   |
| Brand     | text     | (custom input)                         |
| Weight    | text     | (custom input)                         |
| Warranty  | text     | 6 Months, 1 Year, 2 Years, Lifetime    |

## Database Collections

Products are stored in MongoDB in:

- **Database**: `quickkart`
- **Collections**:
  - `products` - All product data
  - `attributes` - All attribute definitions

## API Endpoints

### Products

- `GET /api/admin/product/all` - List all products
- `POST /api/admin/product/create` - Create product
- `GET /api/admin/product/:id` - Get single product
- `PUT /api/admin/product/update/:id` - Update product
- `DELETE /api/admin/product/delete/:id` - Delete product

### Attributes

- `GET /api/admin/attribute/all` - List all attributes
- `POST /api/admin/attribute/create` - Create attribute
- `GET /api/admin/attribute/:id` - Get single attribute
- `PUT /api/admin/attribute/update/:id` - Update attribute
- `DELETE /api/admin/attribute/delete/:id` - Delete attribute

## Troubleshooting

### ❌ "Unable to load attributes"

- Check if backend is running on port 5000
- Verify MongoDB connection
- Check browser console for error details

### ❌ Product not saving

- Verify all required fields are filled:
  - Product Name
  - Category
  - MRP
  - Selling Price
- Check backend console for error messages

### ❌ MongoDB connection error

- Ensure MongoDB service is running
- Verify connection string in `.env`
- Port should be `27017`

## Environment Configuration

**Backend (.env)**

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/quickkart
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
```

**Frontend (.env)**

```
VITE_API_URL=http://localhost:5000/api
```

## File Structure

```
backend/
├── src/
│   ├── admin/
│   │   ├── models/
│   │   │   ├── Attribute.js (NEW)
│   │   │   ├── Product.js (NEW)
│   │   │   └── Admin.js
│   │   ├── controllers/
│   │   │   ├── attributeController.js (NEW)
│   │   │   ├── productController.js (NEW)
│   │   │   └── ...
│   │   ├── routes/
│   │   │   ├── attributeRoutes.js (NEW)
│   │   │   ├── productRoutes.js (NEW)
│   │   │   └── ...
│   │   └── seed/
│   │       └── seedAttributes.js (NEW)
│   ├── app.js (UPDATED)
│   └── config/
│       └── db.js (UPDATED)
├── server.js (UPDATED)
└── .env (UPDATED)

frontend/
└── src/admin/
    ├── services/
    │   ├── productApi.js (UPDATED)
    │   └── attributeApi.js (UPDATED)
    └── pages/products/
        ├── DynamicAttributes.jsx (UPDATED)
        ├── Description.jsx (UPDATED)
        └── AddProduct.jsx (UPDATED)
```

## Next Steps

After successful testing:

1. Create more attributes as needed via "Attribute Management"
2. Create multiple products with different attributes
3. Test editing and deleting products
4. Set up the product listing/viewing page for customers

---

**Status**: ✅ Full backend + frontend integration complete
**Last Updated**: 2026-07-04
