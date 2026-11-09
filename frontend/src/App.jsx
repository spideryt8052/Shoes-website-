import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import { AuthProvider, useAuth } from './context/AuthContext';

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
import RemovalRequestsManager from './pages/Admin/RemovalRequestsManager';
import SecuritySettings from './pages/Admin/SecuritySettings';

// Helper component: redirects staff to Inventory, and admin/developer to Dashboard
const RoleIndexRedirect = () => {
  const { admin } = useAuth();
  const isMaster =
    admin?.isMaster ||
    admin?.role === 'developer' ||
    ['yaseenbrp25@gmail.com', 'yaseen@newmbshoes.com'].includes(admin?.email?.toLowerCase());
  const isStaff = !isMaster && admin?.role === 'staff';
  return <Navigate to={isStaff ? '/admin/inventory' : '/admin/dashboard'} replace />;
};

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
              {/* Intelligent role redirect on /admin */}
              <Route index element={<RoleIndexRedirect />} />

              {/* Staff Allowed Routes: Inventory & Product Add/Edit & Removal Requests */}
              <Route path="inventory" element={<InventoryManager />} />
              <Route path="products" element={<ManageProducts />} />
              <Route path="add-product" element={<AddEditProduct />} />
              <Route path="edit-product/:id" element={<AddEditProduct />} />
              <Route path="removal-requests" element={<RemovalRequestsManager />} />

              {/* Admin & Developer Only Routes (Staff is strictly blocked & redirected) */}
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'developer']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="quick-sell"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'developer']}>
                    <QuickSell />
                  </ProtectedRoute>
                }
              />
              <Route
                path="sales-ledger"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'developer']}>
                    <SalesLedger />
                  </ProtectedRoute>
                }
              />
              <Route
                path="categories"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'developer']}>
                    <ManageCategories />
                  </ProtectedRoute>
                }
              />
              <Route
                path="brands"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'developer']}>
                    <ManageBrands />
                  </ProtectedRoute>
                }
              />
              <Route
                path="stock-history"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'developer']}>
                    <StockHistoryView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'developer']}>
                    <StoreSettingsView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="reviews"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'developer']}>
                    <GoogleReviewsManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'developer']}>
                    <AdminUsersManager />
                  </ProtectedRoute>
                }
              />
              <Route
                path="security"
                element={
                  <ProtectedRoute allowedRoles={['admin', 'developer']}>
                    <SecuritySettings />
                  </ProtectedRoute>
                }
              />
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
