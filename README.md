# STEP HOUSE — Multi-Brand Shoe Store & Inventory Management System

A production-ready, full-stack MERN (MongoDB, Express.js, React.js, Node.js) web application designed specifically for **physical multi-brand shoe retail stores**.

This website serves as a **real-time digital catalogue** for a physical footwear showroom. Customers can explore available shoes, check live stock availability by size and colourway, check prices, inspect Google reviews, and visit the showroom using Google Maps directions.

> **CRITICAL STORE POLICY NOTICE:**  
> This application is strictly an **in-store discovery catalogue**, **NOT an e-commerce checkout platform**. Customers cannot place online orders, add items to cart, or process online payments. All purchases, trials, and warranty handovers happen physically inside the store showroom.

---

## 🚀 Live Services & Architecture Overview

| Service | Technology | Port / Endpoint | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | React 19 + Vite + React Router + CSS3 | `http://localhost:5173` | Running |
| **Backend REST API** | Node.js + Express.js | `http://localhost:5000/api` | Running |
| **Database** | MongoDB 8.2 | `mongodb://127.0.0.1:27017/step_house_shoes` | Connected |
| **Admin Portal** | Protected JWT & Role-Based Dashboard | `http://localhost:5173/admin/login` | Active |

---

## 🔑 Default Administrator Credentials

To access the inventory management system and showroom controls:
- **URL:** [http://localhost:5173/admin/login](http://localhost:5173/admin/login)
- **Email:** `admin@stephouse.com`
- **Password:** `adminpassword123`
- **Role:** Administrator (Full inventory, catalog, and store settings access)

---

## 📦 Project Structure

```
shoe-store/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection logic
│   ├── controllers/
│   │   ├── authController.js     # JWT auth, user sessions, bcrypt
│   │   ├── productController.js  # Dynamic search, filters, CRUD, image uploads
│   │   ├── inventoryController.js# Size/color variant matrix, stock in/out, KPIs
│   │   ├── brandController.js    # Dynamic brand additions & updates
│   │   ├── categoryController.js # Footwear categories & subcategories
│   │   ├── storeSettingsController.js # Shop identity, address, timings, Maps URLs
│   │   ├── reviewController.js   # Google reviews & ratings management
│   │   └── stockHistoryController.js  # Immutable stock movement audit trail
│   ├── middleware/
│   │   ├── auth.js               # JWT verification & role authorization
│   │   ├── upload.js             # Multer image upload handling
│   │   ├── rateLimiter.js        # Brute-force protection & API rate limits
│   │   └── errorHandler.js       # Centralized error handler
│   ├── models/
│   │   ├── Admin.js              # Staff & admin accounts with bcrypt
│   │   ├── Brand.js              # Dynamic brand documents
│   │   ├── Category.js           # Categories & occasions
│   │   ├── Product.js            # Products & variant stock matrix schema
│   │   ├── StockHistory.js       # Stock change audit logs
│   │   ├── StoreSettings.js      # Store branding, location, hours, threshold
│   │   └── Review.js             # Verified customer & Google reviews
│   ├── routes/                   # REST API route definitions
│   ├── seeds/
│   │   └── seedData.js           # Comprehensive realistic database seed
│   ├── uploads/                  # Uploaded shoe photography
│   ├── test-workflows.js         # Automated end-to-end integration test suite
│   ├── .env                      # Environment configuration
│   ├── app.js                    # Express app configuration & middleware
│   └── server.js                 # HTTP server entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header/           # Store branding, phone, search, "Visit Store" button
│   │   │   ├── Footer/           # Address, Google reviews, directions, disclaimer
│   │   │   ├── ProductCard/      # In-stock badges, price, size availability preview
│   │   │   ├── Filters/          # Dynamic faceted sidebar (Gender, Brand, Size, Stock)
│   │   │   ├── GoogleReviews/    # Google score card, rating breakdown, customer cards
│   │   │   └── StoreLocation/    # Embedded Google Map, store timings, directions button
│   │   ├── pages/
│   │   │   ├── Home/             # Hero, Featured Brands, New Arrivals, Live Stock
│   │   │   ├── CategoryPage/     # Multi-faceted search and catalog browser
│   │   │   ├── Brands/           # All dynamic brands showcase
│   │   │   ├── ProductDetails/   # Image gallery, size-by-size stock status, directions CTA
│   │   │   ├── Contact/          # Showroom map, timings, visit guide, FAQs
│   │   │   └── Admin/            # Full Admin Suite:
│   │   │       ├── AdminLogin.jsx
│   │   │       ├── AdminLayout.jsx
│   │   │       ├── Dashboard.jsx
│   │   │       ├── ManageProducts.jsx
│   │   │       ├── AddEditProduct.jsx
│   │   │       ├── InventoryManager.jsx
│   │   │       ├── ManageCategories.jsx
│   │   │       ├── ManageBrands.jsx
│   │   │       ├── StockHistoryView.jsx
│   │   │       ├── StoreSettingsView.jsx
│   │   │       ├── GoogleReviewsManager.jsx
│   │   │       └── AdminUsersManager.jsx
│   │   ├── context/
│   │   │   ├── StoreContext.jsx  # Global store branding & dynamic settings
│   │   │   └── AuthContext.jsx   # Admin authentication session state
│   │   ├── services/
│   │   │   └── api.js            # Axios client with interceptors
│   │   ├── styles/
│   │   │   ├── variables.css     # Clean color palette, shadows, typography
│   │   │   └── index.css         # Modern, human-designed retail CSS system
│   │   ├── App.jsx               # React Router DOM configuration
│   │   └── main.jsx
│   ├── vite.config.js            # Vite configuration with API proxy
│   └── package.json
│
├── package.json                  # Root monorepo scripts
└── README.md
```

---

## 👟 Real Inventory & Variant Matrix System

Every product manages stock at the individual **Colour** and **Shoe Size** level:

```javascript
variants: [
  { size: "UK 7", color: "Black/White", quantity: 4 }, // In Stock
  { size: "UK 8", color: "Black/White", quantity: 0 }, // Out of Stock
  { size: "UK 9", color: "Black/White", quantity: 5 }, // In Stock
  { size: "UK 10", color: "Black/White", quantity: 1 }  // Low Stock (<= threshold)
]
```

### Automatic Real-Time In-Store Availability:
1. **Pre-save recalculation:** Mongoose hooks calculate `totalStock` as the sum of all variant quantities and set `isAvailable = totalStock > 0`.
2. **Size Pills on Product Card & Details Page:**
   - Sizes with `quantity > 0` are rendered with active **In Stock** badges.
   - Sizes with `quantity === 0` are rendered with **Out of Stock** struck-through badges.
3. **No Fake Inventory:** The public catalog reflects exact quantities stored in MongoDB.
4. **Audit Logging:** Every quantity adjustment (sale, stock-in, or manual change) automatically creates a detailed record in `StockHistory` with timestamp, staff name, change amount, and remarks.

---

## 🛠 Setup & Installation Guide

### Prerequisites
- Node.js (v18.0.0 or higher)
- MongoDB Server running locally on port 27017 or a MongoDB Atlas URI

### 1. Database Setup
Ensure MongoDB is running:
```powershell
mongod --dbpath <path-to-db> --port 27017
```

### 2. Backend Configuration
Navigate to `backend/`:
```bash
cd backend
npm install
```

Configure `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/step_house_shoes
JWT_SECRET=super_secret_step_house_jwt_key_2026_xyz!
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
LOW_STOCK_THRESHOLD=2
```

Seed the database with realistic products, dynamic brands, Google reviews, and admin accounts:
```bash
npm run seed
```

Start the backend server:
```bash
npm start
# or npm run dev
```

### 3. Frontend Configuration
Navigate to `frontend/`:
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your web browser.

---

## 🧪 Automated Testing & Verification

A comprehensive automated test suite covers all required operational workflows:

```bash
node backend/test-workflows.js
```

### Verified Test Cases:
1. ✅ **Public Catalogue Access:** Public customers can explore shoes without login.
2. ✅ **Live Inventory Rules:** In-stock vs out-of-stock sizes verified (e.g. Size 7 in stock, Size 8 out of stock).
3. ✅ **Zero Stock Enforcement:** Products with 0 total stock display "Out of Stock" and disable availability indicator.
4. ✅ **Route Security:** Public users cannot access protected `/api/inventory` (HTTP 401 Unauthorized).
5. ✅ **Admin Authentication:** Staff/Admin logs in with JWT and bcrypt password comparison.
6. ✅ **Dynamic Brands:** New brands can be added dynamically and immediately become available.
7. ✅ **Add Product with Matrix:** Product creation with multi-size and multi-colour variant stock.
8. ✅ **Live Inventory Update:** Stock adjustment from 0 to 5 updates catalog and writes immutable audit entry.
9. ✅ **Audit Trail:** StockHistory records movement type, admin name, timestamp, and remarks.
10. ✅ **Edit Product:** Real-time price and detail updates.
11. ✅ **Delete Product:** Product and associated records removed cleanly.
12. ✅ **Faceted Filters & Search:** Gender, brand, category, size, price, and text search working dynamically.
13. ✅ **Store Settings & Google Maps:** Shop name, Google Maps directions URL, and rating (4.8★) configured.

---

## 🎨 Design Philosophy
- **Authentic Retail Aesthetic:** Warm off-white surfaces, crisp typography (Plus Jakarta Sans & Outfit), proper whitespace, natural card borders.
- **Physical Shopping Focus:** Prominent "Visit Store" button that opens Google Maps navigation, showroom hours, and trial guarantee callouts.
- **Mobile Responsive:** Works seamlessly on mobile phones, tablets, laptops, and desktop screens with responsive navigation drawers and filter slide-outs.

