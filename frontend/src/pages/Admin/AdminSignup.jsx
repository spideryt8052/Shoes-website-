import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './AdminLogin.css';

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
  FiHome,
  FiUserPlus,
} from 'react-icons/fi';

const AdminSignup = () => {
  const navigate = useNavigate();
  const { isAuthenticated, saveSession } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clean 2-Phase State:
  // 'REGISTER'   -> Step 1: Name, Email, Password, Branch & Role
  // 'SETUP_2FA'  -> Step 2: Scan QR Code & Enter First 6-Digit PIN to activate
  const [phase, setPhase] = useState('REGISTER');

  // Step 1 Form Data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showroomBranch, setShowroomBranch] = useState('Shah Market (Main Flagship)');
  const [role, setRole] = useState('admin');
  const [inviteCode, setInviteCode] = useState('');

  // Step 2 2FA Data
  const [tempToken, setTempToken] = useState('');
  const [setupData, setSetupData] = useState({ secret: '', qrCodeUrl: '' });
  const [totpCode, setTotpCode] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Step 1: Submit Registration
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
        inviteCode: inviteCode.trim() || '123456',
      });

      if (res.data.success && res.data.token) {
        saveSession(res.data.token, res.data.admin);
        navigate('/admin/dashboard', { replace: true });
        return;
      } else if (res.data.success && res.data.pendingApproval) {
        setPhase('PENDING_APPROVAL');
        setSuccessMsg(res.data.message || 'Registration submitted! Master Developer ke approval ke baad login khulega.');
        return;
      } else if (res.data.success && res.data.require2FA) {
        setTempToken(res.data.tempToken);
        setSetupData({
          secret: res.data.secret || '',
          qrCodeUrl: res.data.qrCodeUrl || '',
        });
        setSuccessMsg('Account created! Now scan the QR code to link Google Authenticator:');
        setPhase('SETUP_2FA');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Registration failed. Please check details and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: Verify Initial 6-Digit PIN -> Final Dashboard Access
  const handleVerifyInitial2FA = async (e) => {
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
          'Invalid 6-digit PIN. Please verify code in Google Authenticator.'
      );
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    if (setupData.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card" style={{ maxWidth: '520px' }}>
        {/* Header */}
        <div className="login-header">
          <div className="shield-icon-wrap" style={{ background: '#0f172a' }}>
            {phase === 'REGISTER' ? <FiUserPlus size={28} /> : <FiShield size={28} />}
          </div>
          <h2>NEW MB SHOES</h2>
          <p>
            {phase === 'REGISTER'
              ? 'Authorized Staff & Admin Registration'
              : 'Link Google Authenticator (Step 2 Security)'}
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

        {/* ============================================================== */}
        {/* PHASE 1: REGISTRATION FORM                                    */}
        {/* ============================================================== */}
        {phase === 'REGISTER' && (
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

              {/* Showroom Branch */}
              <div className="form-group">
                <label htmlFor="admin-branch">Showroom Branch</label>
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

              {/* Showroom Security Passcode (Optional) */}
              <div className="form-group">
                <label htmlFor="admin-invite-code">Showroom Security Passcode (Optional)</label>
                <div className="input-with-icon">
                  <FiShield className="input-icon" />
                  <input
                    id="admin-invite-code"
                    type="password"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Optional (or enter passcode)"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg login-submit-btn"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account & Enter Dashboard →'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Already have an admin account? </span>
              <Link
                to="/admin/login"
                style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}
              >
                Log In Here →
              </Link>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* PHASE 2: INITIAL 2FA SETUP (SCAN QR CODE & CONFIRM PIN)        */}
        {/* ============================================================== */}
        {phase === 'SETUP_2FA' && (
          <div className="two-factor-wrap">
            <div className="two-factor-banner">
              <FiCheckCircle size={20} />
              <span>Account Created: {email}</span>
            </div>

            <div className="qr-code-box">
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                📱 Scan with Google Authenticator App:
              </div>

              {setupData.qrCodeUrl && (
                <img
                  src={setupData.qrCodeUrl}
                  alt="Google Authenticator QR Code"
                  className="qr-code-img"
                />
              )}

              <div className="manual-key-row">
                <span>Secret Key:</span>
                <span className="manual-key-text">{setupData.secret}</span>
                <button
                  type="button"
                  onClick={copySecret}
                  className="btn btn-outline"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                  title="Copy Secret Key"
                >
                  {copiedKey ? <FiCheck color="#16a34a" /> : <FiCopy />}
                </button>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#475569', textAlign: 'left', width: '100%', lineHeight: '1.4' }}>
                <strong>Easy 3 steps on your phone:</strong>
                <ol style={{ paddingLeft: '1.2rem', margin: '0.4rem 0 0 0' }}>
                  <li>Open <strong>Google Authenticator</strong> on your phone.</li>
                  <li>Tap <strong>+</strong> ➔ <strong>Scan a QR code</strong>.</li>
                  <li>Scan the QR code above and enter the 6-digit PIN below.</li>
                </ol>
              </div>
            </div>

            <form onSubmit={handleVerifyInitial2FA} className="login-form">
              <div className="form-group">
                <label style={{ textAlign: 'center', fontWeight: 700 }}>
                  Enter 6-Digit PIN from your phone app:
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
                {loading ? 'Activating Account...' : 'Activate Account & Enter Dashboard 🚀'}
              </button>

              <button
                type="button"
                onClick={() => setPhase('REGISTER')}
                className="btn btn-outline btn-block"
                style={{ marginTop: '0.4rem' }}
              >
                ← Back to registration details
              </button>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* PHASE 3: PENDING MASTER DEVELOPER APPROVAL                     */}
        {/* ============================================================== */}
        {phase === 'PENDING_APPROVAL' && (
          <div className="two-factor-wrap" style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '0.8rem' }}>⏳</div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
              Registration Submitted!
            </h3>
            <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Aapka account create ho gaya hai. Security policy ke tehat, showroom portal me login karne ke liye <strong>Developer / Master Admin</strong> ka approval anivarya hai.
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', textAlign: 'left', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #edf2f7' }}>
                <span style={{ color: '#64748b' }}>Staff Name:</span>
                <strong>{name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #edf2f7' }}>
                <span style={{ color: '#64748b' }}>Staff Email:</span>
                <strong>{email}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>Account Status:</span>
                <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.78rem' }}>
                  ⏳ Pending Master Approval
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.2rem' }}>
              Master Developer ke approve karte hi aap apne isi email aur password/OTP se login kar sakenge.
            </p>

            <Link to="/admin/login" className="btn btn-primary btn-block btn-lg" style={{ textDecoration: 'none', display: 'block' }}>
              ← Return to Admin Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSignup;
