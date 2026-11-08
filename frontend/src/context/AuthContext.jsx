import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    try {
      const saved = localStorage.getItem('step_house_admin');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('step_house_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('step_house_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success && res.data.admin) {
            setAdmin(res.data.admin);
            localStorage.setItem('step_house_admin', JSON.stringify(res.data.admin));
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, []);

  const saveSession = (receivedToken, receivedAdmin) => {
    setToken(receivedToken);
    setAdmin(receivedAdmin);
    localStorage.setItem('step_house_token', receivedToken);
    localStorage.setItem('step_house_admin', JSON.stringify(receivedAdmin));
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      if (res.data.token && res.data.admin) {
        saveSession(res.data.token, res.data.admin);
      }
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout network error
    } finally {
      setToken(null);
      setAdmin(null);
      localStorage.removeItem('step_house_token');
      localStorage.removeItem('step_house_admin');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated: !!token && !!admin,
        loading,
        login,
        logout,
        saveSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

