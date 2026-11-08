import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { AuthProvider } from './context/AuthContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import ProtectedRoute from './routes/ProtectedRoute';

// Public Pages
import Home from './pages/Home/Home';
import CategoryPage from './pages/CategoryPage/CategoryPage';
import Brands from './pages/Brands/Brands';
import ProductDetails from './pages/ProductDetails/ProductDetails';
import Contact from './pages/Contact/Contact';

// Admin Pages
import AdminLogin from './pages/Admin/AdminLogin';
import AdminSignup from './pages/Admin/AdminSignup';
import AdminLayout from './pages/Admin/AdminLayout';
import Dashboard from './pages/Admin/Dashboard';
import QuickSell from './pages/Admin/QuickSell';
import SalesLedger from './pages/Admin/SalesLedger';
import ManageProducts from './pages/Admin/ManageProducts';
import AddEditProduct from './pages/Admin/AddEditProduct';
import InventoryManager from './pages/Admin/InventoryManager';
import ManageCategories from './pages/Admin/ManageCategories';
import ManageBrands from './pages/Admin/ManageBrands';
import StockHistoryView from './pages/Admin/StockHistoryView';
import StoreSettingsView from './pages/Admin/StoreSettingsView';
import GoogleReviewsManager from './pages/Admin/GoogleReviewsManager';
import AdminUsersManager from './pages/Admin/AdminUsersManager';
import SecuritySettings from './pages/Admin/SecuritySettings';

function App() {
  return (
    <Router>
      <AuthProvider>
        <StoreProvider>
          <Routes>
            {/* Customer Website Routes (No Login Required) */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="shoes" element={<CategoryPage />} />
              <Route path="shoes/:identifier" element={<ProductDetails />} />
              <Route path="category/:categorySlug" element={<CategoryPage />} />
              <Route path="brands" element={<Brands />} />
              <Route path="contact" element={<Contact />} />
            </Route>

            {/* Admin Authentication Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/signup" element={<AdminSignup />} />
            <Route path="/admin/register" element={<Navigate to="/admin/signup" replace />} />

            {/* Protected Admin Management Portal */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="quick-sell" element={<QuickSell />} />
              <Route path="sales-ledger" element={<SalesLedger />} />
              <Route path="products" element={<ManageProducts />} />
              <Route path="add-product" element={<AddEditProduct />} />
              <Route path="edit-product/:id" element={<AddEditProduct />} />
              <Route path="inventory" element={<InventoryManager />} />
              <Route path="categories" element={<ManageCategories />} />
              <Route path="brands" element={<ManageBrands />} />
              <Route path="stock-history" element={<StockHistoryView />} />
              <Route path="settings" element={<StoreSettingsView />} />
              <Route path="reviews" element={<GoogleReviewsManager />} />
              <Route path="users" element={<AdminUsersManager />} />
              <Route path="security" element={<SecuritySettings />} />
            </Route>

            {/* Fallback Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </StoreProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
