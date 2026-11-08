import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  FiLock,
  FiMail,
  FiShield,
  FiAlertCircle,
  FiCheckCircle,
  FiSmartphone,
  FiKey,
  FiCopy,
  FiCheck,
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

  // Clean State Machine:
  // 'LOGIN'             -> Primary sign-in (Password, Email OTP, or Google)
  // '2FA_PIN'           -> Strictly asks for 6-digit Google Authenticator PIN (NO QR code shown!)
  // '2FA_SETUP'         -> First-time account 2FA setup (only for unconfigured accounts)
  // 'FORGOT_EMAIL_OTP'  -> Step 1 of Forgot: Verify registered email with OTP
  // 'FORGOT_NEW_SETUP'  -> Step 2 of Forgot: Old 2FA is wiped, scan brand-new QR code
  const [view, setView] = useState('LOGIN');
  const [loginTab, setLoginTab] = useState('password'); // 'password' | 'otp' | 'google'

  // Primary Login Form State
  const [email, setEmail] = useState('yaseen@newmbshoes.com');
  const [password, setPassword] = useState('adminpassword123');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);

  // 2FA Verification State
  const [tempToken, setTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  // Setup / New QR Code Data (Used ONLY when 2FA is unconfigured or just reset)
  const [setupData, setSetupData] = useState({ secret: '', qrCodeUrl: '' });
  const [copiedKey, setCopiedKey] = useState(false);

  // Forgot Authenticator Flow State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotOtpSent, setForgotOtpSent] = useState(false);

  // UI status
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

  // ----------------------------------------------------------------------
  // HANDLERS: PRIMARY LOGIN (STEP 1)
  // ----------------------------------------------------------------------

  // Handle Password Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/login', { email: email.trim().toLowerCase(), password });

      if (res.data.success && res.data.require2FA) {
        setTempToken(res.data.tempToken);
        setAdminEmail(res.data.adminEmail || email);

        if (res.data.isConfigured) {
          // 2FA is already active on phone -> Strictly show PIN input (NO QR code!)
          setView('2FA_PIN');
        } else {
          // Account never finished initial 2FA setup
          setSetupData({ secret: res.data.secret || '', qrCodeUrl: res.data.qrCodeUrl || '' });
          setView('2FA_SETUP');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Send Email OTP (Step 1 Alternative)
  const handleSendEmailOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email) {
      setError('Please enter your admin email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/send-email-otp', { email: email.trim().toLowerCase() });
      if (res.data.success) {
        setEmailOtpSent(true);
        setSuccessMsg(res.data.message || `OTP sent to ${email}`);
        if (res.data.otpPreview) {
          setEmailOtp(res.data.otpPreview);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP to email.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify Email OTP (Step 1 Alternative)
  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!emailOtp || emailOtp.length < 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/verify-email-otp', {
        email: email.trim().toLowerCase(),
        otp: emailOtp.trim(),
      });

      if (res.data.success && res.data.token) {
        saveSession(res.data.token, res.data.admin);
        navigate('/admin/dashboard', { replace: true });
      } else if (res.data.success && res.data.require2FA) {
        setTempToken(res.data.tempToken);
        setAdminEmail(res.data.adminEmail || email);

        if (res.data.isConfigured) {
          setView('2FA_PIN');
        } else {
          setSetupData({ secret: res.data.secret || '', qrCodeUrl: res.data.qrCodeUrl || '' });
          setView('2FA_SETUP');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleLogin = async () => {
    setError('');
    setSuccessMsg('');
    const targetEmail = email || 'yaseen@newmbshoes.com';

    try {
      setLoading(true);
      const res = await api.post('/auth/google-login', {
        email: targetEmail.trim().toLowerCase(),
        name: 'Yaseen Jamshed (NEW MB SHOES)',
      });

      if (res.data.success && res.data.require2FA) {
        setTempToken(res.data.tempToken);
        setAdminEmail(res.data.adminEmail || targetEmail);

        if (res.data.isConfigured) {
          setView('2FA_PIN');
        } else {
          setSetupData({ secret: res.data.secret || '', qrCodeUrl: res.data.qrCodeUrl || '' });
          setView('2FA_SETUP');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------------
  // HANDLERS: VERIFY 2FA PIN (STEP 2)
  // ----------------------------------------------------------------------
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
          'Invalid 6-digit PIN. Please verify the code in your Google Authenticator app.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------------
  // HANDLERS: DEDICATED FORGOT GOOGLE AUTHENTICATOR RECOVERY
  // ----------------------------------------------------------------------

  // Start Forgot Flow
  const openForgotFlow = () => {
    setError('');
    setSuccessMsg('');
    setForgotEmail(adminEmail || email || 'yaseen@newmbshoes.com');
    setForgotOtp('');
    setForgotOtpSent(false);
    setView('FORGOT_EMAIL_OTP');
  };

  // Step 1: Send 6-digit OTP to Admin Email
  const handleSendForgotOtp = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!forgotEmail) {
      setError('Please enter your registered admin email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/reset-2fa-request', {
        email: forgotEmail.trim().toLowerCase(),
        tempToken,
      });

      if (res.data.success) {
        setForgotOtpSent(true);
        setSuccessMsg(`A 6-digit recovery OTP has been sent to ${forgotEmail}.`);
        if (res.data.otpPreview) {
          setForgotOtp(res.data.otpPreview);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send recovery OTP. Check email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Verify Email OTP -> ONLY NOW does backend wipe old secret & generate brand new QR Code!
  const handleVerifyForgotOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setError('Please enter the 6-digit recovery OTP.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/reset-2fa-verify', {
        email: forgotEmail.trim().toLowerCase(),
        otp: forgotOtp.trim(),
      });

      if (res.data.success) {
        // Email OTP is verified! Previous code is revoked in DB.
        // Now advance to Step 2: Show the brand new QR Code!
        setTempToken(res.data.tempToken);
        setSetupData({
          secret: res.data.secret,
          qrCodeUrl: res.data.qrCodeUrl,
        });
        setTotpCode('');
        setView('FORGOT_NEW_SETUP');
        setSuccessMsg('Email OTP Verified! Old authenticator code deleted. Scan your new QR code below:');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired recovery OTP code.');
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

  const resetToLogin = () => {
    setView('LOGIN');
    setError('');
    setSuccessMsg('');
    setTotpCode('');
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        {/* Header */}
        <div className="login-header">
          <div
            className="shield-icon-wrap"
            style={view.startsWith('FORGOT') ? { background: '#991b1b' } : {}}
          >
            {view.startsWith('FORGOT') ? <FiKey size={28} /> : <FiShield size={30} />}
          </div>
          <h2>{storeSettings.shopName || 'NEW MB SHOES'}</h2>
          <p>
            {view === 'LOGIN' && 'Authorized Showroom Admin Sign In'}
            {view === '2FA_PIN' && 'Google Authenticator 6-Digit PIN Gate'}
            {view === '2FA_SETUP' && 'First-Time Google Authenticator Setup'}
            {view === 'FORGOT_EMAIL_OTP' && 'Forgot Authenticator - Step 1: Verify Email OTP'}
            {view === 'FORGOT_NEW_SETUP' && 'Forgot Authenticator - Step 2: Link New Authenticator'}
          </p>
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

        {/* ============================================================== */}
        {/* VIEW 1: PRIMARY LOGIN (STEP 1)                                */}
        {/* ============================================================== */}
        {view === 'LOGIN' && (
          <>
            {/* Tabs */}
            <div className="login-tabs">
              <button
                type="button"
                className={`login-tab-btn ${loginTab === 'password' ? 'active' : ''}`}
                onClick={() => { setLoginTab('password'); setError(''); }}
              >
                <FiLock /> Password
              </button>
              <button
                type="button"
                className={`login-tab-btn ${loginTab === 'otp' ? 'active' : ''}`}
                onClick={() => { setLoginTab('otp'); setError(''); }}
              >
                <FiMail /> Email OTP
              </button>
              <button
                type="button"
                className={`login-tab-btn ${loginTab === 'google' ? 'active' : ''}`}
                onClick={() => { setLoginTab('google'); setError(''); }}
              >
                <FiKey /> Google
              </button>
            </div>

            {/* TAB 1: PASSWORD LOGIN */}
            {loginTab === 'password' && (
              <form onSubmit={handlePasswordLogin} className="login-form">
                <div className="form-group">
                  <label htmlFor="admin-email">Admin Email Address</label>
                  <div className="input-with-icon">
                    <FiMail className="input-icon" />
                    <input
                      id="admin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yaseen@newmbshoes.com"
                      required
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block btn-lg login-submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Verifying Password...' : 'Verify Password & Continue to Authenticator →'}
                </button>
              </form>
            )}

            {/* TAB 2: EMAIL OTP LOGIN */}
            {loginTab === 'otp' && (
              <div className="login-form">
                <div className="form-group">
                  <label htmlFor="otp-email">Admin Email Address</label>
                  <div className="input-with-icon">
                    <FiMail className="input-icon" />
                    <input
                      id="otp-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yaseen@newmbshoes.com"
                      required
                    />
                  </div>
                </div>

                {!emailOtpSent ? (
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    className="btn btn-primary btn-block btn-lg"
                    disabled={loading}
                  >
                    {loading ? 'Sending OTP...' : 'Send 6-Digit Email OTP →'}
                  </button>
                ) : (
                  <form onSubmit={handleVerifyEmailOtp} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div className="form-group">
                      <label>Enter 6-Digit Email OTP</label>
                      <input
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
                      className="btn btn-primary btn-block btn-lg"
                      disabled={loading || emailOtp.length !== 6}
                    >
                      {loading ? 'Verifying...' : 'Verify OTP & Enter Dashboard →'}
                    </button>

                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Resend Email OTP
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* TAB 3: GOOGLE SIGN-IN */}
            {loginTab === 'google' && (
              <div className="login-form">
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label>Owner Email Account</label>
                  <div className="input-with-icon">
                    <FiMail className="input-icon" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yaseen@newmbshoes.com"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="google-login-btn"
                  disabled={loading}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.9c2.28-2.1 3.645-5.18 3.645-9.14z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.1-6.68-4.93H1.26v3.13C3.25 21.36 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.32 14.27c-.24-.73-.38-1.5-.38-2.27s.14-1.54.38-2.27V6.6H1.26A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.26 5.4l4.06-3.13z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.6l4.06 3.13c.94-2.83 3.58-4.98 6.68-4.98z" />
                  </svg>
                  <span>{loading ? 'Authenticating...' : 'Sign in with Google Account'}</span>
                </button>
              </div>
            )}

            {/* Quick Helper Credentials */}
            <div className="login-helper-box">
              <div className="helper-header">NEW MB SHOES Owner Account:</div>
              <code>Email: yaseen@newmbshoes.com</code>
              <code>Password: adminpassword123</code>
            </div>

            {/* Links */}
            <div style={{ textAlign: 'center', marginTop: '1.2rem', paddingTop: '0.8rem', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <Link to="/admin/signup" style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}>
                Need a new showroom account? Sign Up Here →
              </Link>
              <button
                type="button"
                onClick={openForgotFlow}
                style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                🔑 Google Authenticator Code Bhool Gaye? Reset via Email OTP →
              </button>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: 2FA PIN ENTRY (STEP 2 FOR CONFIGURED ACCOUNTS)          */}
        {/* NO QR CODE SHOWN HERE! CLEAN & SECURE.                        */}
        {/* ============================================================== */}
        {view === '2FA_PIN' && (
          <div className="two-factor-wrap">
            <div className="two-factor-banner">
              <FiCheckCircle size={20} />
              <span>Step 1 Verified: {adminEmail}</span>
            </div>

            <div style={{ textAlign: 'center', padding: '0.75rem 0' }}>
              <FiSmartphone size={44} style={{ color: '#0f172a', marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.92rem', color: '#334155', margin: 0, fontWeight: 500 }}>
                Open <strong>Google Authenticator</strong> on your phone and enter your live 6-digit PIN:
              </p>
            </div>

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
                className="btn btn-primary btn-block btn-lg"
                disabled={loading || totpCode.length !== 6}
              >
                {loading ? 'Verifying PIN...' : 'Verify PIN & Enter Dashboard 🚀'}
              </button>

              <button
                type="button"
                onClick={resetToLogin}
                className="btn btn-outline btn-block"
                style={{ marginTop: '0.4rem' }}
              >
                ← Back to Login Options
              </button>
            </form>

            {/* Direct Link to Forgot Flow */}
            <div style={{ marginTop: '1.2rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.8rem', textAlign: 'center' }}>
              <button
                type="button"
                onClick={openForgotFlow}
                style={{
                  background: '#fff1f2',
                  border: '1px solid #fecdd3',
                  color: '#be123c',
                  borderRadius: '8px',
                  padding: '0.65rem 0.9rem',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <FiKey /> Google Authenticator Code Bhool Gaye? Reset via Email OTP →
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: FIRST-TIME 2FA SETUP (FOR UNCONFIGURED ACCOUNTS)       */}
        {/* ============================================================== */}
        {view === '2FA_SETUP' && (
          <div className="two-factor-wrap">
            <div className="two-factor-banner">
              <FiCheckCircle size={20} />
              <span>Step 1 Verified: {adminEmail}</span>
            </div>

            <div className="qr-code-box">
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                📱 Link Google Authenticator on your phone:
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
                >
                  {copiedKey ? <FiCheck color="#16a34a" /> : <FiCopy />}
                </button>
              </div>

              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                Open Google Authenticator on phone ➔ Tap '+' ➔ Scan QR Code ➔ Enter 6-digit PIN below.
              </p>
            </div>

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
                className="btn btn-primary btn-block btn-lg"
                disabled={loading || totpCode.length !== 6}
              >
                {loading ? 'Activating...' : 'Activate Authenticator & Enter Dashboard 🚀'}
              </button>

              <button type="button" onClick={resetToLogin} className="btn btn-outline btn-block">
                ← Back to Login
              </button>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 4: FORGOT AUTHENTICATOR - STEP 1 (EMAIL OTP VERIFICATION) */}
        {/* ============================================================== */}
        {view === 'FORGOT_EMAIL_OTP' && (
          <div className="forgot-flow-wrap">
            <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
              <FiKey size={38} style={{ color: '#dc2626', marginBottom: '0.4rem' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.3rem 0' }}>
                Forgot Google Authenticator?
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                Step 1 of 2: Verify your registered Admin Email with a 6-digit OTP. Naya code email verify hone ke baad hi aayega.
              </p>
            </div>

            <form onSubmit={forgotOtpSent ? handleVerifyForgotOtp : handleSendForgotOtp} className="login-form">
              <div className="form-group">
                <label>Registered Admin Email Address</label>
                <div className="input-with-icon">
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="yaseen@newmbshoes.com"
                    required
                    disabled={forgotOtpSent}
                  />
                </div>
              </div>

              {!forgotOtpSent ? (
                <button
                  type="button"
                  onClick={handleSendForgotOtp}
                  disabled={loading}
                  className="btn btn-primary btn-block btn-lg"
                  style={{ background: '#dc2626', borderColor: '#dc2626' }}
                >
                  {loading ? 'Sending OTP...' : '📩 Send 6-Digit Verification OTP to Email'}
                </button>
              ) : (
                <>
                  <div className="form-group">
                    <label>Enter 6-Digit Email OTP</label>
                    <input
                      type="text"
                      maxLength="6"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="pin-input-big"
                      autoFocus
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || forgotOtp.length !== 6}
                    className="btn btn-primary btn-block btn-lg"
                    style={{ background: '#dc2626', borderColor: '#dc2626' }}
                  >
                    {loading ? 'Verifying OTP...' : '✅ Verify Email OTP & Generate New QR Code →'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '0.3rem' }}>
                    <button
                      type="button"
                      onClick={handleSendForgotOtp}
                      disabled={loading}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Didn't receive OTP? Resend code
                    </button>
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={resetToLogin}
                className="btn btn-outline btn-block"
                style={{ marginTop: '0.5rem' }}
              >
                ← Cancel & Return to Login
              </button>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 5: FORGOT AUTHENTICATOR - STEP 2 (BRAND NEW QR CODE)      */}
        {/* SHOWN ONLY AFTER EMAIL OTP IS 100% VERIFIED IN STEP 1!         */}
        {/* ============================================================== */}
        {view === 'FORGOT_NEW_SETUP' && (
          <div className="forgot-flow-wrap">
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <FiCheckCircle size={38} style={{ color: '#16a34a', marginBottom: '0.4rem' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.3rem 0' }}>
                Setup New Authenticator
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                Step 2 of 2: Purana code cancel ho gaya hai. Scan this brand-new QR code into your phone.
              </p>
            </div>

            <div className="qr-code-box">
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                📱 Scan New QR Code with Phone App:
              </div>

              {setupData.qrCodeUrl && (
                <img
                  src={setupData.qrCodeUrl}
                  alt="Brand New Google Authenticator QR Code"
                  className="qr-code-img"
                />
              )}

              <div className="manual-key-row">
                <span>New Secret Key:</span>
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

              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                Open Google Authenticator on phone ➔ Tap '+' ➔ Scan QR Code ➔ Enter new 6-digit PIN.
              </p>
            </div>

            <form onSubmit={handleVerify2FA} className="login-form" style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label style={{ textAlign: 'center', fontWeight: 700 }}>
                  Enter 6-Digit PIN from your newly scanned phone app:
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
                {loading ? 'Verifying PIN...' : 'Verify New PIN & Enter Dashboard 🚀'}
              </button>

              <button
                type="button"
                onClick={resetToLogin}
                className="btn btn-outline btn-block"
                style={{ marginTop: '0.4rem' }}
              >
                ← Return to Login
              </button>
            </form>
          </div>
        )}

        {/* Footer */}
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
