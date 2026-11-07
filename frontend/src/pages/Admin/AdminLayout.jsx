import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import {
  FiGrid,
  FiBox,
  FiPlusSquare,
  FiLayers,
  FiTag,
  FiActivity,
  FiClock,
  FiSettings,
  FiStar,
  FiUsers,
  FiLogOut,
  FiMenu,
  FiX,
  FiExternalLink,
  FiBell,
  FiZap,
  FiFileText,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import './AdminLayout.css';

const AdminLayout = () => {
  const { admin, logout } = useAuth();
  const { storeSettings } = useStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out of the admin dashboard?')) {
      await logout();
      navigate('/admin/login');
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <FiGrid /> },
    { label: 'Quick Sell (POS)', path: '/admin/quick-sell', icon: <FiZap /> },
    { label: 'Sales & Google Sheets', path: '/admin/sales-ledger', icon: <FiFileText /> },
    { label: 'Manage Products', path: '/admin/products', icon: <FiBox /> },
    { label: 'Add New Product', path: '/admin/add-product', icon: <FiPlusSquare /> },
    { label: 'Inventory Management', path: '/admin/inventory', icon: <FiLayers /> },
    { label: 'Categories', path: '/admin/categories', icon: <FiTag /> },
    { label: 'Brands', path: '/admin/brands', icon: <FiActivity /> },
    { label: 'Stock History', path: '/admin/stock-history', icon: <FiClock /> },
    { label: 'Store Settings', path: '/admin/settings', icon: <FiSettings /> },
    { label: 'Google Reviews Settings', path: '/admin/reviews', icon: <FiStar /> },
    { label: 'Admin Users', path: '/admin/users', icon: <FiUsers /> },
  ];

  return (
    <div className="admin-container">
      {/* Admin Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-store-brand">
            <span className="admin-brand-icon">👟</span>
            <div>
              <h3>{storeSettings.shopName || 'STEP HOUSE'}</h3>
              <span className="admin-subtext">Inventory Portal</span>
            </div>
          </div>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>
            <FiX size={20} />
          </button>
        </div>

        {/* Current Admin User Info */}
        <div className="admin-profile-strip">
          <div className="profile-circle">{admin?.name?.charAt(0) || 'A'}</div>
          <div className="profile-details">
            <span className="admin-user-name">{admin?.name || 'Administrator'}</span>
            <span className="admin-user-role">{admin?.role || 'admin'}</span>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="admin-nav-menu">
          <ul className="admin-nav-list">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/admin/dashboard'}
                  className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="admin-sidebar-footer">
          <button type="button" className="logout-btn" onClick={handleLogout}>
            <FiLogOut className="nav-icon" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Viewport */}
      <div className="admin-main-viewport">
        {/* Top Header */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <button className="sidebar-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <FiMenu size={22} />
            </button>
            <span className="portal-breadcrumb">Showroom Inventory Management System</span>
          </div>

          <div className="topbar-right">
            <Link to="/" target="_blank" className="btn btn-outline btn-sm live-store-btn" title="Open customer website in new tab">
              <FiExternalLink /> Live Public Website
            </Link>
          </div>
        </header>

        {/* Child Page Content */}
        <main className="admin-page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

