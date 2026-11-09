import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  FiMail,
  FiLock,
  FiShield,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiEye,
  FiEyeOff,
  FiKey,
  FiArrowRight,
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

  // Login Mode: 'PASSWORD' (ID & Password) or 'OTP' (Email OTP)
  const [loginMode, setLoginMode] = useState('PASSWORD');

  // ID & Password State
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('last_admin_email') || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Email OTP State
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Google Modal State
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');

  // 2FA Gate State (for accounts that configured Google Authenticator)
  const [require2FA, setRequire2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  // Check URL query parameters for session expired notices
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired')) {
      setError('Your admin session has expired. Please sign in again.');
    }
  }, [location]);

  // OTP cooldown timer
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  // Persist email to localStorage
  const rememberEmail = (mail) => {
    try {
      if (mail) localStorage.setItem('last_admin_email', mail);
    } catch (e) {
      // ignore
    }
  };

  // ==============================================================
  // METHOD 1: ID & PASSWORD LOGIN
  // ==============================================================
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsPendingApproval(false);

    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your email ID.');
      return;
    }

    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    rememberEmail(cleanEmail);

    try {
      setLoading(true);
      const res = await api.post('/auth/login', {
        email: cleanEmail,
        password,
      });

      // Case A: 2FA required (Google Authenticator)
      if (res.data.require2FA) {
        setTempToken(res.data.tempToken);
        setRequire2FA(true);
        setSuccessMsg('Please enter the 6-digit PIN from Google Authenticator.');
        return;
      }

      // Case B: Direct login success
      if (res.data.success && res.data.token) {
        saveSession(res.data.token, res.data.admin);
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err) {
      if (err.response?.data?.pendingApproval) {
        setIsPendingApproval(true);
        setError(
          err.response.data.message ||
            '⏳ Account approval pending: Aapka account abhi Master Developer ke approval ke liye pending hai. Approval milne ke baad hi login kar sakenge.'
        );
      } else {
        setError(err.response?.data?.message || 'Invalid email or password. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ==============================================================
  // METHOD 2: EMAIL OTP LOGIN
  // ==============================================================
  const handleSendEmailOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsPendingApproval(false);

    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your admin email address.');
      return;
    }

    rememberEmail(cleanEmail);

    try {
      setLoading(true);
      const res = await api.post('/auth/send-email-otp', { email: cleanEmail });
      if (res.data.success) {
        setEmailOtpSent(true);
        setEmailOtp('');
        setOtpCooldown(60);
        setSuccessMsg(
          res.data.message || `A 6-digit OTP code has been sent to ${cleanEmail}. Please check your Gmail.`
        );
      }
    } catch (err) {
      if (err.response?.data?.pendingApproval) {
        setIsPendingApproval(true);
        setError(
          err.response.data.message ||
            '⏳ Account approval pending: Master Developer ke approve karne ke baad hi OTP generate hoga.'
        );
      } else {
        setError(err.response?.data?.message || 'Failed to send OTP. Please check your email address.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsPendingApproval(false);

    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPin = String(emailOtp || '').trim();

    if (!cleanPin || cleanPin.length !== 6) {
      setError('Please enter the 6-digit OTP received on your email.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/verify-email-otp', {
        email: cleanEmail,
        otp: cleanPin,
      });

      // 2FA Gate
      if (res.data.require2FA) {
        setTempToken(res.data.tempToken);
        setRequire2FA(true);
        setSuccessMsg('Please enter the 6-digit PIN from Google Authenticator.');
        return;
      }

      // Login success
      if (res.data.success && res.data.token) {
        saveSession(res.data.token, res.data.admin);
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err) {
      if (err.response?.data?.pendingApproval) {
        setIsPendingApproval(true);
        setError(err.response.data.message || '⏳ Account approval pending.');
      } else {
        setError(err.response?.data?.message || 'Invalid or expired OTP code.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ==============================================================
  // METHOD 3: GOOGLE SIGN-IN MODAL
  // ==============================================================
  const handleGoogleBtnClick = () => {
    setError('');
    setSuccessMsg('');
    setIsPendingApproval(false);
    const current = (email || localStorage.getItem('last_admin_email') || '').trim();
    setGoogleEmailInput(current);
    setGoogleModalOpen(true);
  };

  const handleGoogleModalSubmit = async (e) => {
    e.preventDefault();
    if (!googleEmailInput || !googleEmailInput.trim()) {
      setError('Please enter your Google (Gmail) address.');
      return;
    }
    const targetEmail = googleEmailInput.trim().toLowerCase();
    setGoogleModalOpen(false);
    setEmail(targetEmail);
    setLoginMode('OTP');
    rememberEmail(targetEmail);

    // Trigger OTP sending
    try {
      setLoading(true);
      const res = await api.post('/auth/send-email-otp', { email: targetEmail });
      if (res.data.success) {
        setEmailOtpSent(true);
        setEmailOtp('');
        setOtpCooldown(60);
        setSuccessMsg(
          res.data.message || `A 6-digit OTP code has been sent to ${targetEmail}. Please check your Gmail.`
        );
      }
    } catch (err) {
      if (err.response?.data?.pendingApproval) {
        setIsPendingApproval(true);
        setError(err.response.data.message || '⏳ Account pending approval.');
      } else {
        setError(err.response?.data?.message || 'Failed to send OTP.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDirectGoogleLogin = async () => {
    const targetEmail = (googleEmailInput || email || '').trim().toLowerCase();
    if (!targetEmail) {
      setError('Please enter your Google email address.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setIsPendingApproval(false);
      const res = await api.post('/auth/google-login', {
        email: targetEmail,
        name: 'Google Verified Admin',
      });

      if (res.data.require2FA) {
        setGoogleModalOpen(false);
        setTempToken(res.data.tempToken);
        setRequire2FA(true);
        return;
      }

      if (res.data.success && res.data.token) {
        saveSession(res.data.token, res.data.admin);
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err) {
      if (err.response?.data?.pendingApproval) {
        setGoogleModalOpen(false);
        setIsPendingApproval(true);
        setError(err.response.data.message || '⏳ Account pending approval.');
      } else {
        setError(err.response?.data?.message || 'Google account not authorized. Please check your email.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ==============================================================
  // STEP 2: GOOGLE AUTHENTICATOR PIN (Only for 2FA-enabled accounts)
  // ==============================================================
  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setError('');

    const cleanPin = String(totpCode || '').trim();
    if (!cleanPin || cleanPin.length !== 6) {
      setError('Please enter the 6-digit PIN from Google Authenticator.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/verify-2fa', {
        tempToken,
        totpCode: cleanPin,
      });

      if (res.data.success && res.data.token) {
        saveSession(res.data.token, res.data.admin);
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid 6-digit Authenticator PIN.');
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
          <p>Showroom Admin & Staff Portal</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className={`login-error-alert ${isPendingApproval ? 'approval-pending-alert' : ''}`}>
            <FiAlertCircle className="err-icon" style={{ flexShrink: 0 }} />
            <div>
              <span>{error}</span>
              {isPendingApproval && (
                <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: '#b45309' }}>
                  Aapka request Master Developer ke dashboard me dikh raha hai. Approve hone ke turant baad aap login kar sakenge.
                </div>
              )}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="login-success-alert">
            <FiCheckCircle className="err-icon" style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 2FA Authenticator Screen (Only for accounts with Google Authenticator enabled) */}
        {require2FA ? (
          <div className="two-factor-wrap">
            <div className="two-factor-banner">
              <FiKey size={20} />
              <span>Two-Factor Authentication</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '1.25rem', textAlign: 'center' }}>
              Apne mobile ke <strong>Google Authenticator</strong> app se 6-digit PIN enter karein:
            </p>
            <form onSubmit={handleVerify2FA} className="login-form">
              <div className="form-group">
                <input
                  type="text"
                  maxLength="6"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="pin-input-big"
                  autoFocus
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg login-submit-btn"
                disabled={loading || totpCode.length !== 6}
              >
                {loading ? 'Verifying PIN...' : 'Verify PIN & Enter Dashboard →'}
              </button>
              <button
                type="button"
                onClick={() => { setRequire2FA(false); setTotpCode(''); }}
                className="btn btn-outline btn-block"
                style={{ marginTop: '0.6rem' }}
              >
                ← Back to Login
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Login Mode Selector Tabs */}
            <div className="login-tabs">
              <button
                type="button"
                className={`login-tab-btn ${loginMode === 'PASSWORD' ? 'active' : ''}`}
                onClick={() => {
                  setLoginMode('PASSWORD');
                  setError('');
                  setSuccessMsg('');
                  setIsPendingApproval(false);
                }}
              >
                <FiLock size={15} />
                <span>ID & Password</span>
              </button>
              <button
                type="button"
                className={`login-tab-btn ${loginMode === 'OTP' ? 'active' : ''}`}
                onClick={() => {
                  setLoginMode('OTP');
                  setError('');
                  setSuccessMsg('');
                  setIsPendingApproval(false);
                }}
              >
                <FiMail size={15} />
                <span>Email OTP</span>
              </button>
            </div>

            {/* TAB 1: ID & PASSWORD LOGIN */}
            {loginMode === 'PASSWORD' && (
              <form onSubmit={handlePasswordLogin} className="login-form">
                <div className="form-group">
                  <label htmlFor="admin-email">Admin Email (ID)</label>
                  <div className="input-with-icon">
                    <FiMail className="input-icon" />
                    <input
                      id="admin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. yaseenbrp25@gmail.com"
                      autoComplete="off"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="admin-password">Password</label>
                  </div>
                  <div className="input-with-icon" style={{ position: 'relative' }}>
                    <FiLock className="input-icon" />
                    <input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your account password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block btn-lg login-submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Authenticating...' : 'Log In with ID & Password →'}
                </button>
              </form>
            )}

            {/* TAB 2: EMAIL OTP LOGIN */}
            {loginMode === 'OTP' && (
              <>
                {!emailOtpSent ? (
                  <form onSubmit={handleSendEmailOtp} className="login-form">
                    <div className="form-group">
                      <label htmlFor="admin-otp-email">Admin Email Address (Gmail)</label>
                      <div className="input-with-icon">
                        <FiMail className="input-icon" />
                        <input
                          id="admin-otp-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. yaseenbrp25@gmail.com"
                          autoComplete="off"
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
                      <span>OTP Sent to: <strong style={{ color: '#0f172a' }}>{email}</strong></span>
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

                    <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                      <button
                        type="button"
                        onClick={handleSendEmailOtp}
                        disabled={loading || otpCooldown > 0}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: otpCooldown > 0 ? '#94a3b8' : '#2563eb',
                          fontSize: '0.85rem',
                          cursor: otpCooldown > 0 ? 'default' : 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        {otpCooldown > 0 ? `Resend code in ${otpCooldown}s` : "Didn't receive OTP? Resend code"}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

            {/* Google Sign-in Option */}
            <div className="login-divider">
              <span>OR</span>
            </div>

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
          </>
        )}

        {/* Footer: Signup Link for New Users */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '0.9rem', color: '#64748b' }}>New showroom staff or admin? </span>
          <Link
            to="/admin/signup"
            style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}
          >
            Sign Up with Email OTP →
          </Link>
        </div>

        {/* Return to Store Link */}
        <div className="login-footer">
          <Link to="/" className="back-to-store">
            ← Return to Store
          </Link>
        </div>
      </div>

      {/* Google Account Prompt Modal */}
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