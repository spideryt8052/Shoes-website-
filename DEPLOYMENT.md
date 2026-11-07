# 🚀 STEP HOUSE - Vercel Deployment Guide

A complete, production-ready guide to deploy your **STEP HOUSE** MERN Stack Shoe Store & Inventory System to **Vercel** in under 5 minutes.

---

## 📋 Prerequisites
1. **GitHub Account** (to push your repository)
2. **Vercel Account** ([vercel.com](https://vercel.com) - Login with GitHub)
3. **Free MongoDB Atlas Cloud Database** ([mongodb.com/atlas](https://www.mongodb.com/atlas) - Free M0 cluster)

---

## 🛠️ Step 1: Create a Free MongoDB Atlas Database

Since Vercel is a serverless cloud platform, your local `mongodb://127.0.0.1:27017` won't be reachable from the cloud. You need a free cloud MongoDB database:

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas) and sign up / log in.
2. Click **Create Cluster** ➔ Choose the **FREE (M0)** tier.
3. Under **Database Access**, create a user (e.g., username: `stephouse_admin`, choose a strong password).
4. Under **Network Access**, click **Add IP Address** ➔ Select **Allow Access From Anywhere (`0.0.0.0/0`)** so Vercel serverless functions can connect.
5. Click **Database ➔ Connect ➔ Drivers (Node.js)** and copy your connection string:
   ```text
   mongodb+srv://stephouse_admin:<password>@cluster0.xxxxx.mongodb.net/step_house_shoes?retryWrites=true&w=majority
   ```
   *(Replace `<password>` with your database user password)*

---

## 📦 Step 2: Push Your Code to GitHub

Open your terminal in this project folder (`M.B Shose`):

```bash
git init
git add .
git commit -m "Production-ready STEP HOUSE Shoe Store"
git branch -M main
git remote add origin https://github.com/your-username/step-house-shoes.git
git push -u origin main
```

---

## ⚡ Step 3: Deploy on Vercel (1-Click Monorepo)

1. Open [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **"Add New..." ➔ "Project"**.
3. Select your GitHub repository (`step-house-shoes`) and click **Import**.
4. In the Project Configuration:
   - **Framework Preset:** Other / Vite
   - **Root Directory:** `./` (Leave as default root)
   - **Build Command:** `npm run build` *(Auto-configured in vercel.json)*
   - **Output Directory:** `frontend/dist` *(Auto-configured in vercel.json)*
5. Open the **Environment Variables** section and add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | `your_long_random_jwt_secret_key_2026!` | Secret key for admin JWT auth |
| `JWT_EXPIRES_IN` | `7d` | Admin session duration |
| `NODE_ENV` | `production` | Set to production |
| `CLIENT_URL` | `https://your-project.vercel.app` | (Or add after first deployment) |

6. Click **Deploy**!
Vercel will install dependencies, build the React frontend, configure serverless API routes, and provide your live URL (e.g. `https://step-house.vercel.app`).

---

## 🎯 Step 4: Seed Initial Data on Cloud Database

To load the initial brands, categories, products, and admin account into your new cloud database:

Run this command locally on your machine pointing to your MongoDB Atlas URI:

```bash
cd backend
MONGODB_URI="mongodb+srv://stephouse_admin:<password>@cluster0.xxxxx.mongodb.net/step_house_shoes?retryWrites=true&w=majority" node seeds/seedData.js
```

Now open your live Vercel URL:
- **Public Showroom:** `https://your-project.vercel.app/`
- **Admin Login:** `https://your-project.vercel.app/admin/login`
- **Default Admin:** `admin@stephouse.com`
- **Default Password:** `adminpassword123`

---

## 📁 Key Files Configured For Vercel:
- **`vercel.json`** - Routes `/api/*` requests to serverless handler and all frontend routes to React index.html.
- **`api/index.js`** - Serverless function entrypoint with MongoDB connection pooling.
- **`frontend/vercel.json`** - SPA rewrite rules for client-side routing.
- **`backend/config/db.js`** - Cached database connection handler for serverless functions.

