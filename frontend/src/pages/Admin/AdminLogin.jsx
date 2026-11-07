import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiLock, FiMail, FiShield, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import './AdminLogin.css';

const AdminLogin = () => {
  const { login, isAuthenticated } = useAuth();
  const { storeSettings } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both your admin email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      const redirectPath = location.state?.from?.pathname || '/admin/dashboard';
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="login-header">
          <div className="shield-icon-wrap">
            <FiShield size={32} />
          </div>
          <h2>{storeSettings.shopName || 'STEP HOUSE'} Admin Portal</h2>
          <p>Authorized inventory & showroom management access</p>
        </div>

        {error && (
          <div className="login-error-alert">
            <FiAlertCircle className="err-icon" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="admin-email">Admin Email Address</label>
            <div className="input-with-icon">
              <FiMail className="input-icon" />
              <input
                id="admin-email"
                type="email"
                placeholder="admin@stephouse.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="admin-password">Password</label>
            <div className="input-with-icon">
              <FiLock className="input-icon" />
              <input
                id="admin-password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg login-submit-btn"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            {!loading && <FiArrowRight />}
          </button>
        </form>

        <div className="login-helper-box">
          <div className="helper-header">Default Demo Credentials:</div>
          <code>Email: admin@stephouse.com</code>
          <code>Password: adminpassword123</code>
        </div>

        <div className="login-footer">
          <Link to="/" className="back-to-store">
            ← Return to Public Shoe Catalogue
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

