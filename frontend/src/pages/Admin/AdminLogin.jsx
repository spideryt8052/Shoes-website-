import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  FiMail,
  FiShield,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
} from 'react-icons/fi';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import './AdminLogin.css';

const AdminLogin = () => {
  const { saveSession, isAuthenticated } = useAuth();
  const { storeSettings } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Form State: Email & OTP (persisted across renders)
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('last_admin_email') || 'yaseenbrp25@gmail.com';
  });
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);

  // Google Modal State
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Check URL query parameters for session expired notices
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired')) {
      setError('Your admin session has expired. Please sign in again.');
    }
  }, [location]);

  // Handle Google Button Click -> Asks for Email ID
  const handleGoogleBtnClick = () => {
    setError('');
    setSuccessMsg('');
    const current = (email || localStorage.getItem('last_admin_email') || '').trim();
    setGoogleEmailInput(current);
    setGoogleModalOpen(true);
  };

  // Google Modal Submit -> Sends OTP to the provided Google Email
  const handleGoogleModalSubmit = async (e) => {
    e.preventDefault();
    if (!googleEmailInput || !googleEmailInput.trim()) {
      setError('Please enter your Google (Gmail) email address.');
      return;
    }
    const targetEmail = googleEmailInput.trim().toLowerCase();
    setGoogleModalOpen(false);
    await sendOtpForEmail(targetEmail);
  };

  // Optional: Direct Google 1-Click from Modal (if user wants direct sign in)
  const handleDirectGoogleLogin = async () => {
    const targetEmail = (googleEmailInput || email || localStorage.getItem('last_admin_email') || '').trim().toLowerCase();
    if (!targetEmail) {
      setError('Please enter your Google email address first.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.post('/auth/google-login', {
        email: targetEmail,
        name: 'Google Verified Admin',
      });

      if (res.data.success && res.data.token) {
        saveSession(res.data.token, res.data.admin);
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Google account not authorized. Please check email.');
    } finally {
      setLoading(false);
    }
  };

  // Helper: Send OTP to Email (OTP is NEVER revealed on screen!)
  const sendOtpForEmail = async (targetEmail) => {
    setError('');
    setSuccessMsg('');
    setEmailOtp(''); // Strictly blank!

    const clean = String(targetEmail || '').trim().toLowerCase();
    if (!clean) {
      setError('Please enter a valid email address.');
      return;
    }

    setEmail(clean);
    try {
      localStorage.setItem('last_admin_email', clean);
    } catch (e) {
      // ignore
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/send-email-otp', { email: clean });
      if (res.data.success) {
        setEmailOtpSent(true);
        setSuccessMsg(res.data.message || `A 6-digit OTP code has been sent to ${clean}. Please check your Gmail.`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please verify email address.');
    } finally {
      setLoading(false);
    }
  };

  // Main Form Send OTP Handler
  const handleSendEmailOtp = (e) => {
    e?.preventDefault();
    if (!email || !email.trim()) {
      setError('Please enter your admin email address.');
      return;
    }
    sendOtpForEmail(email.trim());
  };

  // Main Form Verify OTP Handler
  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    setError('');

    const targetEmail = (email || localStorage.getItem('last_admin_email') || '').trim().toLowerCase();
    if (!targetEmail) {
      setError('Please enter your email address.');
      setEmailOtpSent(false);
      return;
    }

    const cleanPin = String(emailOtp || '').trim();
    if (!cleanPin || cleanPin.length !== 6) {
      setError('Please enter the 6-digit OTP code received on your email.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/verify-email-otp', {
        email: targetEmail,
        otp: cleanPin,
      });

      if (res.data.success && res.data.token) {
        saveSession(res.data.token, res.data.admin);
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        {/* Header */}
        <div className="login-header">
          <div className="shield-icon-wrap">
            <FiShield size={32} />
          </div>
          <h2>{storeSettings.shopName || 'NEW MB SHOES'}</h2>
          <p>Admin Login</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="login-error-alert">
            <FiAlertCircle className="err-icon" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="login-success-alert">
            <FiCheckCircle className="err-icon" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Sign in with Google Button (Prompts for Email if empty) */}
        <button
          type="button"
          onClick={handleGoogleBtnClick}
          className="google-login-btn"
          disabled={loading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.9c2.28-2.1 3.645-5.18 3.645-9.14z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.1-6.68-4.93H1.26v3.13C3.25 21.36 7.33 24 12 24z" />
            <path fill="#FBBC05" d="M5.32 14.27c-.24-.73-.38-1.5-.38-2.27s.14-1.54.38-2.27V6.6H1.26A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.26 5.4l4.06-3.13z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.6l4.06 3.13c.94-2.83 3.58-4.98 6.68-4.98z" />
          </svg>
          <span>{loading ? 'Processing...' : 'Sign in with Google'}</span>
        </button>

        {/* Divider */}
        <div className="login-divider">
          <span>OR SIGN IN WITH EMAIL OTP</span>
        </div>

        {/* Email OTP Sign-in Form */}
        {!emailOtpSent ? (
          <form onSubmit={handleSendEmailOtp} className="login-form">
            <div className="form-group">
              <label htmlFor="admin-email">Admin Email Address (Gmail)</label>
              <div className="input-with-icon">
                <FiMail className="input-icon" />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your Gmail ID"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg login-submit-btn"
              disabled={loading}
            >
              {loading ? 'Sending OTP to Gmail...' : 'Send 6-Digit OTP to Email →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyEmailOtp} className="login-form">
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.65rem 0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <span>OTP Sent to: <strong style={{ color: '#0f172a' }}>{email || localStorage.getItem('last_admin_email')}</strong></span>
              <button
                type="button"
                onClick={() => { setEmailOtpSent(false); setEmailOtp(''); setError(''); }}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 700 }}
              >
                Change
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="admin-otp">Enter 6-Digit Verification Code</label>
              <input
                id="admin-otp"
                type="text"
                maxLength="6"
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="pin-input-big"
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg login-submit-btn"
              disabled={loading || emailOtp.length !== 6}
            >
              {loading ? 'Verifying OTP...' : 'Verify OTP & Enter Dashboard →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.6rem' }}>
              <button
                type="button"
                onClick={() => sendOtpForEmail(email || localStorage.getItem('last_admin_email'))}
                disabled={loading}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Didn't receive OTP? Resend code
              </button>
            </div>
          </form>
        )}

        {/* Footer: Signup Link for New Users */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '0.9rem', color: '#64748b' }}>New admin user? </span>
          <Link
            to="/admin/signup"
            style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}
          >
            Sign Up here →
          </Link>
        </div>

        {/* Return to Store Link */}
        <div className="login-footer">
          <Link to="/" className="back-to-store">
            ← Return to Store
          </Link>
        </div>
      </div>

      {/* Google Account Prompt Modal (Opens when user clicks Sign in with Google) */}
      {googleModalOpen && (
        <div className="google-modal-overlay" onClick={() => setGoogleModalOpen(false)}>
          <div className="google-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="google-modal-header">
              <div className="google-modal-title">
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.9c2.28-2.1 3.645-5.18 3.645-9.14z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.1-6.68-4.93H1.26v3.13C3.25 21.36 7.33 24 12 24z" />
                  <path fill="#FBBC05" d="M5.32 14.27c-.24-.73-.38-1.5-.38-2.27s.14-1.54.38-2.27V6.6H1.26A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.26 5.4l4.06-3.13z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.6l4.06 3.13c.94-2.83 3.58-4.98 6.68-4.98z" />
                </svg>
                <span>Sign in with Google</span>
              </div>
              <button
                type="button"
                className="google-modal-close"
                onClick={() => setGoogleModalOpen(false)}
              >
                <FiX />
              </button>
            </div>

            <p className="google-modal-desc">
              Apna registered Google (Gmail) account enter karein. Login ke liye 6-digit OTP aapke Gmail par aayega:
            </p>

            <form onSubmit={handleGoogleModalSubmit}>
              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Google Email Address</label>
                <div className="input-with-icon">
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    placeholder="name@gmail.com"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="google-modal-actions">
                <button
                  type="submit"
                  className="btn btn-primary btn-block btn-lg"
                  disabled={loading}
                  style={{ fontWeight: 700 }}
                >
                  {loading ? 'Sending OTP...' : 'Send Login OTP to Gmail →'}
                </button>
              </div>

              <div style={{ textAlign: 'center', marginTop: '0.8rem' }}>
                <button
                  type="button"
                  onClick={handleDirectGoogleLogin}
                  disabled={loading}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Ya bina OTP ke direct Google sign-in karein →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogin;
