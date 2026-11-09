import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, admin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="admin-loading-state" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  const isMaster =
    admin?.isMaster ||
    admin?.role === 'developer' ||
    ['yaseenbrp25@gmail.com', 'yaseen@newmbshoes.com'].includes(admin?.email?.toLowerCase());

  // Role enforcement for protected sections
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = isMaster ? 'developer' : (admin?.role || 'staff');
    if (!isMaster && !allowedRoles.includes(userRole)) {
      // If staff tries to access admin-only pages, redirect to their allowed inventory workspace
      return <Navigate to="/admin/inventory" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
