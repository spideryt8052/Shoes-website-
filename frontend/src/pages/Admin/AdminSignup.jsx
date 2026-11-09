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
  FiHome,
  FiUserPlus,
  FiArrowRight,
  FiRefreshCw,
  FiClock,
  FiEdit2,
  FiEye,
  FiEyeOff,
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

  // 3 Clear Phases:
  // 'FORM'             -> Step 1: User fills Name, Email, Password, Branch, Role
  // 'VERIFY_OTP'       -> Step 2: Enters 6-Digit OTP sent to their Gmail
  // 'PENDING_APPROVAL' -> Step 3: Confirmation that request is pending Master Developer approval
  const [phase, setPhase] = useState('FORM');

  // Step 1 Form Data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showroomBranch, setShowroomBranch] = useState('Shah Market (Main Flagship)');
  const [role, setRole] = useState('staff');
  const [inviteCode, setInviteCode] = useState('');

  // Step 2 OTP Data
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Timer countdown for OTP resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Step 1 Handler: Validates details and dispatches 6-digit OTP to user's email
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/send-signup-otp', { email: cleanEmail });

      if (res.data.success) {
        setPhase('VERIFY_OTP');
        setOtp('');
        setResendCooldown(60);
        setSuccessMsg(
          res.data.message || `A 6-digit OTP code has been sent to ${cleanEmail}. Please check your Gmail.`
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to send OTP to email. Please check your email address and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler for Step 2
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    try {
      setLoading(true);
      const res = await api.post('/auth/send-signup-otp', { email: cleanEmail });
      if (res.data.success) {
        setResendCooldown(60);
        setSuccessMsg(`New 6-digit OTP code sent to ${cleanEmail}. Please check your Gmail.`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 Handler: Verifies Email OTP and creates account request for Master Developer
  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanOtp = String(otp || '').trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email.');
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
        otp: cleanOtp,
      });

      // Master Developer auto-logs in
      if (res.data.success && res.data.token) {
        saveSession(res.data.token, res.data.admin);
        navigate('/admin/dashboard', { replace: true });
        return;
      }

      // Standard users go to Pending Approval phase
      if (res.data.success && res.data.pendingApproval) {
        setPhase('PENDING_APPROVAL');
        setSuccessMsg(
          res.data.message || 'Email verified & registration request submitted! Master Developer ke approve karne ke baad aap login kar sakenge.'
        );
        return;
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Invalid or expired OTP code. Please enter the correct code or request a new one.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card" style={{ maxWidth: '520px' }}>
        {/* Header */}
        <div className="login-header">
          <div className="shield-icon-wrap" style={{ background: '#0f172a' }}>
            {phase === 'FORM' && <FiUserPlus size={28} />}
            {phase === 'VERIFY_OTP' && <FiMail size={28} />}
            {phase === 'PENDING_APPROVAL' && <FiClock size={28} />}
          </div>
          <h2>NEW MB SHOES</h2>
          <p>
            {phase === 'FORM' && 'Staff & Admin Registration (Step 1 of 2)'}
            {phase === 'VERIFY_OTP' && 'Verify Email Address (Step 2 of 2)'}
            {phase === 'PENDING_APPROVAL' && 'Master Developer Approval Pending'}
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
        {/* PHASE 1: REGISTRATION DETAILS FORM                             */}
        {/* ============================================================== */}
        {phase === 'FORM' && (
          <>
            <form onSubmit={handleRequestOtp} className="login-form" autoComplete="off">
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
                    placeholder="e.g. Yaseen Jamshed"
                    autoComplete="off"
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="form-group">
                <label htmlFor="admin-email">Email Address (Gmail)</label>
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
                <small style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.25rem', display: 'block' }}>
                  Is email par 6-digit verification OTP aayega.
                </small>
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
                  <option value="staff">Billing Staff (Counter POS Quick Sell)</option>
                  <option value="manager">Showroom Manager (Stock, POS, Reports)</option>
                  <option value="admin">Store Admin (Full Management Access)</option>
                </select>
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="admin-password">Password (Minimum 6 characters)</label>
                <div className="input-with-icon" style={{ position: 'relative' }}>
                  <FiLock className="input-icon" />
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create secure password"
                    minLength={6}
                    autoComplete="new-password"
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
                  >
                    {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label htmlFor="admin-confirm-password">Confirm Password</label>
                <div className="input-with-icon">
                  <FiLock className="input-icon" />
                  <input
                    id="admin-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    minLength={6}
                    autoComplete="new-password"
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
                    placeholder="Optional (leave blank or enter 123456)"
                    autoComplete="off"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg login-submit-btn"
                disabled={loading}
              >
                {loading ? 'Sending Verification OTP...' : 'Send Verification OTP to Email →'}
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
        {/* PHASE 2: VERIFY EMAIL OTP                                     */}
        {/* ============================================================== */}
        {phase === 'VERIFY_OTP' && (
          <div className="two-factor-wrap">
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>OTP Sent To Email:</div>
                <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>{email}</strong>
              </div>
              <button
                type="button"
                onClick={() => { setPhase('FORM'); setError(''); }}
                className="btn btn-outline"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <FiEdit2 size={13} /> Edit
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Aapke email address par 6-digit ka verification code bheja gaya hai. Kripya code enter karein taaki aapki request Master Developer ke paas approval ke liye submit ho sake.
            </p>

            <form onSubmit={handleVerifyOtpAndRegister} className="login-form">
              <div className="form-group">
                <label style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.95rem' }}>
                  Enter 6-Digit Email OTP:
                </label>
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="pin-input-big"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={loading || otp.length !== 6}
              >
                {loading ? 'Verifying OTP & Submitting...' : 'Verify OTP & Submit Request →'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading || resendCooldown > 0}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? '#94a3b8' : '#2563eb',
                    fontSize: '0.88rem',
                    cursor: resendCooldown > 0 ? 'default' : 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Didn’t receive code? Resend OTP'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setPhase('FORM')}
                className="btn btn-outline btn-block"
                style={{ marginTop: '0.75rem' }}
              >
                ← Back to registration form
              </button>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* PHASE 3: PENDING MASTER DEVELOPER APPROVAL                     */}
        {/* ============================================================== */}
        {phase === 'PENDING_APPROVAL' && (
          <div className="two-factor-wrap" style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '0.8rem' }}>⏳</div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
              Registration Request Submitted!
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 700, marginBottom: '1rem' }}>
              ✅ Email OTP Verified Successfully
            </p>

            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Aapka email verify ho chuka hai. Showroom portal ki security ke tehat, naye accounts ke liye <strong>Master Developer (Developer)</strong> ka approval anivarya hai.
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', textAlign: 'left', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #edf2f7' }}>
                <span style={{ color: '#64748b' }}>Staff Name:</span>
                <strong>{name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #edf2f7' }}>
                <span style={{ color: '#64748b' }}>Email ID:</span>
                <strong>{email}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #edf2f7' }}>
                <span style={{ color: '#64748b' }}>Branch:</span>
                <span>{showroomBranch}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #edf2f7' }}>
                <span style={{ color: '#64748b' }}>Role:</span>
                <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{role}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: '#64748b' }}>Account Status:</span>
                <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.78rem' }}>
                  ⏳ Pending Master Approval
                </span>
              </div>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.5rem', textAlign: 'left', fontSize: '0.84rem', color: '#1e40af' }}>
              💡 <strong>Login Process:</strong> Master Developer ke approve karte hi aap apne isi <strong>Email (ID)</strong> aur <strong>Password</strong> se sidha login kar sakenge.
            </div>

            <Link
              to="/admin/login"
              className="btn btn-primary btn-block btn-lg"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              Go to Admin Login <FiArrowRight />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSignup;