import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './AdminLogin.css'; // Reuses clean login styles

// React Icons
import {
  FiUser,
  FiMail,
  FiLock,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiCopy,
  FiCheck,
  FiSmartphone,
  FiArrowRight,
  FiUserPlus,
  FiHome,
} from 'react-icons/fi';

const AdminSignup = () => {
  const navigate = useNavigate();
  const { isAuthenticated, saveSession } = useAuth();

  // Multi-step registration flow:
  // Step 1: Name, Email, Password, Role/Branch -> Creates Account & Generates 2FA Secret
  // Step 2: Google Authenticator QR Code Setup & 6-Digit PIN Verification -> Final Access
  const [step, setStep] = useState(1);

  // Step 1 Form Data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [showroomBranch, setShowroomBranch] = useState('Shah Market (Main Flagship)');

  // Step 2 2FA Data
  const [tempToken, setTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [twoFactorConfig, setTwoFactorConfig] = useState({
    isConfigured: false,
    secret: '',
    qrCodeUrl: '',
    adminEmail: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Copy 2FA Secret to Clipboard
  const copySecretKey = () => {
    if (twoFactorConfig.secret) {
      navigator.clipboard.writeText(twoFactorConfig.secret);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
    }
  };

  // Handle Step 1: Submit Registration Form
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/register', {
        name: `${name.trim()} (${showroomBranch})`,
        email: email.trim().toLowerCase(),
        password,
        role,
      });

      if (res.data.success && res.data.require2FA) {
        setTempToken(res.data.tempToken);
        setTwoFactorConfig({
          isConfigured: false,
          secret: res.data.secret || '',
          qrCodeUrl: res.data.qrCodeUrl || '',
          adminEmail: res.data.adminEmail || email,
        });
        setSuccessMsg('Account created successfully! Now link Google Authenticator to secure your portal.');
        setStep(2);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Registration failed. Please check details and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 1: Alternative Google Sign-Up
  const handleGoogleSignup = async () => {
    setError('');
    setSuccessMsg('');

    const targetEmail = email || prompt('Enter your Google Account email for admin access:');
    if (!targetEmail) return;

    try {
      setLoading(true);
      const res = await api.post('/auth/google-login', {
        email: targetEmail.trim().toLowerCase(),
        name: name ? `${name.trim()} (${showroomBranch})` : 'Google Verified Admin',
      });

      if (res.data.success && res.data.require2FA) {
        setTempToken(res.data.tempToken);
        setTwoFactorConfig({
          isConfigured: res.data.isConfigured,
          secret: res.data.secret || '',
          qrCodeUrl: res.data.qrCodeUrl || '',
          adminEmail: res.data.adminEmail || targetEmail,
        });
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Google account registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: Verify Google Authenticator 6-Digit PIN -> Final Dashboard Access
  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setError('');

    if (!totpCode || totpCode.trim().length !== 6) {
      setError('Please enter the 6-digit PIN from Google Authenticator.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/verify-2fa', {
        tempToken,
        totpCode: totpCode.trim(),
      });

      if (res.data.success && res.data.token) {
        saveSession(res.data.token, res.data.admin);
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Invalid or expired 6-digit PIN. Please re-check Google Authenticator and ensure your phone time is accurate.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card" style={{ maxWidth: '520px' }}>
        {/* Header Branding */}
        <div className="login-header">
          <div className="shield-icon-wrap" style={{ background: '#1e293b' }}>
            {step === 1 ? <FiUserPlus size={28} /> : <FiShield size={28} />}
          </div>
          <h2>NEW MB SHOES</h2>
          <p>
            {step === 1
              ? 'Showroom Staff & Admin Registration'
              : 'Link Google Authenticator (Step 2 Mandatory Security)'}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="login-error-alert">
            <FiAlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="login-success-alert">
            <FiCheckCircle size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ================= STEP 1: REGISTRATION FORM ================= */}
        {step === 1 && (
          <>
            <form onSubmit={handleRegister} className="login-form">
              {/* Full Name */}
              <div className="form-group">
                <label htmlFor="admin-name">Full Name</label>
                <div className="input-with-icon">
                  <FiUser className="input-icon" />
                  <input
                    id="admin-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Yaseen Jamshed / Store Manager"
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="form-group">
                <label htmlFor="admin-email">Email Address</label>
                <div className="input-with-icon">
                  <FiMail className="input-icon" />
                  <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@newmbshoes.com or your email"
                    required
                  />
                </div>
              </div>

              {/* Showroom Branch / Location */}
              <div className="form-group">
                <label htmlFor="admin-branch">Showroom Branch / Locality</label>
                <div className="input-with-icon">
                  <FiHome className="input-icon" />
                  <select
                    id="admin-branch"
                    value={showroomBranch}
                    onChange={(e) => setShowroomBranch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.9rem 0.75rem 2.6rem',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-main)',
                      outline: 'none',
                      fontSize: '0.9rem',
                    }}
                  >
                    <option value="Shah Market (Main Flagship)">Main Flagship - Shah Market, D.N. Singh Road</option>
                    <option value="Tatarpur Showroom">Branch 2 - Tatarpur Chowk Showroom</option>
                    <option value="Tilkamanjhi Showroom">Branch 3 - Tilkamanjhi Chowk Showroom</option>
                    <option value="Central Administration">Central Administration (All Branches)</option>
                  </select>
                </div>
              </div>

              {/* Role */}
              <div className="form-group">
                <label htmlFor="admin-role">Account Access Role</label>
                <select
                  id="admin-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.9rem',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-main)',
                    outline: 'none',
                    fontSize: '0.9rem',
                  }}
                >
                  <option value="admin">Store Owner / Full Admin (All Permissions)</option>
                  <option value="manager">Showroom Manager (Stock, POS, Settings)</option>
                  <option value="staff">Billing Staff (Counter POS Quick Sell Only)</option>
                </select>
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="admin-password">Password (Minimum 6 characters)</label>
                <div className="input-with-icon">
                  <FiLock className="input-icon" />
                  <input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create secure password"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label htmlFor="admin-confirm-password">Confirm Password</label>
                <div className="input-with-icon">
                  <FiLock className="input-icon" />
                  <input
                    id="admin-confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              {/* Submit Registration */}
              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg login-submit-btn"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account & Continue to Authenticator →'}
              </button>
            </form>

            <div style={{ textAlign: 'center', margin: '1.2rem 0 0.8rem 0', color: '#64748b', fontSize: '0.85rem' }}>
              ─── OR ───
            </div>

            {/* Google Signup Button */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="google-login-btn"
              disabled={loading}
              style={{ width: '100%' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.9c2.28-2.1 3.645-5.18 3.645-9.14z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.1-6.68-4.93H1.26v3.13C3.25 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.32 14.27c-.24-.73-.38-1.5-.38-2.27s.14-1.54.38-2.27V6.6H1.26A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.26 5.4l4.06-3.13z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.6l4.06 3.13c.94-2.83 3.58-4.98 6.68-4.98z"
                />
              </svg>
              <span>{loading ? 'Processing...' : 'Sign up with Google Account'}</span>
            </button>

            {/* Switch to Login link */}
            <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Already have an admin account? </span>
              <Link
                to="/admin/login"
                style={{
                  color: '#0f172a',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                }}
              >
                Log In Here →
              </Link>
            </div>
          </>
        )}

        {/* ================= STEP 2: MANDATORY GOOGLE AUTHENTICATOR SETUP ================= */}
        {step === 2 && (
          <div className="two-factor-wrap">
            <div className="two-factor-banner">
              <FiCheckCircle size={20} />
              <span>Step 1 Complete: {twoFactorConfig.adminEmail}</span>
            </div>

            {/* QR Code Card */}
            <div className="qr-code-box">
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                📱 Link with Google Authenticator:
              </div>

              {twoFactorConfig.qrCodeUrl && (
                <img
                  src={twoFactorConfig.qrCodeUrl}
                  alt="Google Authenticator QR Code"
                  className="qr-code-img"
                />
              )}

              <div className="manual-key-row">
                <span>Secret Key:</span>
                <span className="manual-key-text">{twoFactorConfig.secret}</span>
                <button
                  type="button"
                  onClick={copySecretKey}
                  className="btn btn-outline"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                  title="Copy Secret Key"
                >
                  {copiedKey ? <FiCheck color="#16a34a" /> : <FiCopy />}
                </button>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#475569', textAlign: 'left', width: '100%', lineHeight: '1.4' }}>
                <strong>Easy 3-step setup on your phone:</strong>
                <ol style={{ paddingLeft: '1.2rem', margin: '0.4rem 0 0 0' }}>
                  <li>Open <strong>Google Authenticator</strong> app on your Android or iPhone.</li>
                  <li>Tap the <strong>+</strong> button ➔ select <strong>Scan a QR code</strong>.</li>
                  <li>Scan this QR code and type the 6-digit code below to finish.</li>
                </ol>
              </div>
            </div>

            {/* Form for 6-Digit TOTP PIN */}
            <form onSubmit={handleVerify2FA} className="login-form">
              <div className="form-group">
                <label style={{ textAlign: 'center', fontSize: '0.9rem', fontWeight: 700 }}>
                  Enter 6-Digit Code from Phone App:
                </label>
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
                className="btn btn-primary btn-block btn-lg"
                disabled={loading || totpCode.length !== 6}
              >
                {loading ? 'Verifying PIN...' : 'Verify PIN & Enter Admin Dashboard →'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                ← Back to registration details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSignup;

