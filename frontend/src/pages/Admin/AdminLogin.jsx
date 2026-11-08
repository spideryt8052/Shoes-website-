import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  FiLock,
  FiMail,
  FiShield,
  FiAlertCircle,
  FiCheckCircle,
  FiArrowRight,
  FiSmartphone,
  FiKey,
  FiCopy,
  FiCheck,
  FiRefreshCw,
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

  // Authentication Flow State
  // Step 1: Primary Auth (Email OTP / Google / Password)
  // Step 2: Mandatory Google Authenticator (TOTP PIN)
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState('otp'); // 'otp' | 'google' | 'password'

  // Step 1 Form Data
  const [email, setEmail] = useState('yaseen@newmbshoes.com');
  const [password, setPassword] = useState('adminpassword123');
  const [emailOtp, setEmailOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

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

  // Handle Step 1: Send Email OTP
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
      const res = await api.post('/auth/send-email-otp', { email });
      if (res.data.success) {
        setOtpSent(true);
        setSuccessMsg(res.data.message);
        if (res.data.otpPreview) {
          setEmailOtp(res.data.otpPreview);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate email OTP. Check email address.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 1: Verify Email OTP -> Advance to Step 2
  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!emailOtp || emailOtp.length < 6) {
      setError('Please enter the full 6-digit OTP code.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/verify-email-otp', { email, otp: emailOtp });
      if (res.data.success && res.data.require2FA) {
        setTempToken(res.data.tempToken);
        setTwoFactorConfig({
          isConfigured: res.data.isConfigured,
          secret: res.data.secret || '',
          qrCodeUrl: res.data.qrCodeUrl || '',
          adminEmail: res.data.adminEmail || email,
        });
        setStep(2);
        setError('');
        setSuccessMsg('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 1: Google Sign-In -> Advance to Step 2
  const handleGoogleLogin = async () => {
    setError('');
    setSuccessMsg('');

    const targetEmail = email || 'yaseen@newmbshoes.com';

    try {
      setLoading(true);
      const res = await api.post('/auth/google-login', {
        email: targetEmail,
        name: 'Yaseen Jamshed (NEW MB SHOES)',
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
      setError(err.response?.data?.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 1: Password Login -> Advance to Step 2
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success && res.data.require2FA) {
        setTempToken(res.data.tempToken);
        setTwoFactorConfig({
          isConfigured: res.data.isConfigured,
          secret: res.data.secret || '',
          qrCodeUrl: res.data.qrCodeUrl || '',
          adminEmail: res.data.adminEmail || email,
        });
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: Verify Google Authenticator 6-Digit PIN -> Final Dashboard Access!
  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setError('');

    if (!totpCode || totpCode.trim().length !== 6) {
      setError('Please enter the 6-digit code from Google Authenticator.');
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
        const redirectPath = location.state?.from?.pathname || '/admin/dashboard';
        navigate(redirectPath, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid Google Authenticator code. Check your phone time.');
    } finally {
      setLoading(false);
    }
  };

  const copySecretKey = () => {
    if (twoFactorConfig.secret) {
      navigator.clipboard.writeText(twoFactorConfig.secret);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        {/* Header */}
        <div className="login-header">
          <div className="shield-icon-wrap">
            <FiShield size={30} />
          </div>
          <h2>{storeSettings.shopName || 'NEW MB SHOES'}</h2>
          <p>
            {step === 1
              ? 'Authorized Owner & Admin Sign In'
              : 'Step 2: Google Authenticator Security Gate'}
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

        {/* ================= STEP 1: PRIMARY LOGIN METHODS ================= */}
        {step === 1 && (
          <>
            {/* Tabs */}
            <div className="login-tabs">
              <button
                type="button"
                className={`login-tab-btn ${activeTab === 'otp' ? 'active' : ''}`}
                onClick={() => { setActiveTab('otp'); setError(''); }}
              >
                <FiMail /> Email OTP
              </button>
              <button
                type="button"
                className={`login-tab-btn ${activeTab === 'google' ? 'active' : ''}`}
                onClick={() => { setActiveTab('google'); setError(''); }}
              >
                <FiKey /> Google Login
              </button>
              <button
                type="button"
                className={`login-tab-btn ${activeTab === 'password' ? 'active' : ''}`}
                onClick={() => { setActiveTab('password'); setError(''); }}
              >
                <FiLock /> Password
              </button>
            </div>

            {/* TAB 1: EMAIL OTP */}
            {activeTab === 'otp' && (
              <form onSubmit={otpSent ? handleVerifyEmailOtp : handleSendEmailOtp} className="login-form">
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

                {otpSent && (
                  <div className="form-group">
                    <label htmlFor="email-otp-code">Enter 6-Digit OTP from Email</label>
                    <div className="input-with-icon">
                      <FiKey className="input-icon" />
                      <input
                        id="email-otp-code"
                        type="text"
                        maxLength="6"
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value)}
                        placeholder="123456"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-block btn-lg login-submit-btn"
                  disabled={loading}
                >
                  {loading
                    ? 'Processing...'
                    : otpSent
                    ? 'Verify OTP & Continue to Authenticator →'
                    : 'Send 6-Digit OTP Code'}
                </button>

                {otpSent && (
                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    className="btn btn-outline btn-block"
                    style={{ marginTop: '0.4rem' }}
                    disabled={loading}
                  >
                    <FiRefreshCw /> Resend OTP
                  </button>
                )}
              </form>
            )}

            {/* TAB 2: GOOGLE SIGN-IN */}
            {activeTab === 'google' && (
              <div className="login-form" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
                  Sign in instantly using your verified Google Account. You will then be prompted for your Google Authenticator PIN.
                </p>

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
                  <span>{loading ? 'Authenticating...' : 'Sign in with Google Account'}</span>
                </button>
              </div>
            )}

            {/* TAB 3: PASSWORD LOGIN */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordLogin} className="login-form">
                <div className="form-group">
                  <label htmlFor="admin-email">Email Address</label>
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

            {/* Credentials Info Box */}
            <div className="login-helper-box">
              <div className="helper-header">NEW MB SHOES Owner Account:</div>
              <code>Email: yaseen@newmbshoes.com</code>
              <code>Password: adminpassword123</code>
            </div>
          </>
        )}

        {/* ================= STEP 2: MANDATORY GOOGLE AUTHENTICATOR GATE ================= */}
        {step === 2 && (
          <div className="two-factor-wrap">
            <div className="two-factor-banner">
              <FiCheckCircle size={20} />
              <span>Step 1 Verified ({twoFactorConfig.adminEmail})</span>
            </div>

            {/* First time 2FA setup: Show QR Code */}
            {!twoFactorConfig.isConfigured && (
              <div className="qr-code-box">
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                  📱 Scan with Google Authenticator:
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
                  >
                    {copiedKey ? <FiCheck /> : <FiCopy />}
                  </button>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                  Open Google Authenticator app on your phone ➔ Tap '+' ➔ Scan QR Code.
                </p>
              </div>
            )}

            {/* If already configured */}
            {twoFactorConfig.isConfigured && (
              <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                <FiSmartphone size={40} style={{ color: '#0f172a', marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0 }}>
                  Open <strong>Google Authenticator</strong> on your phone and enter your current 6-digit PIN:
                </p>
              </div>
            )}

            {/* Form for 6-Digit TOTP PIN */}
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
                onClick={() => { setStep(1); setError(''); setTotpCode(''); }}
                className="btn btn-outline btn-block"
                style={{ marginTop: '0.4rem' }}
              >
                ← Back to Login Options
              </button>
            </form>
          </div>
        )}

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
