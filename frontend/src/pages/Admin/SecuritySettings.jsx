import React, { useState, useEffect, useCallback } from 'react';
import {
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiSmartphone,
  FiLock,
  FiCopy,
  FiCheck,
  FiX,
  FiKey,
  FiUser,
  FiMail,
} from 'react-icons/fi';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './SecuritySettings.css';

const SecuritySettings = () => {
  const { admin } = useAuth();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Setup modal / state
  const [settingUp, setSettingUp] = useState(false);
  const [setupData, setSetupData] = useState({ secret: '', qrCodeUrl: '' });
  const [verifyCode, setVerifyCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Alerts
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Fetch 2FA Status
  const fetch2FAStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/2fa/status');
      if (res.data.success) {
        setIs2FAEnabled(res.data.isTwoFactorEnabled);
      }
    } catch (err) {
      console.error('Error fetching 2FA status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch2FAStatus();
  }, [fetch2FAStatus]);

  // Start 2FA Setup Flow
  const handleStartSetup = async () => {
    setFeedback({ type: '', text: '' });
    try {
      setSubmitting(true);
      const res = await api.post('/auth/2fa/setup');
      if (res.data.success) {
        setSetupData({
          secret: res.data.secret,
          qrCodeUrl: res.data.qrCodeUrl,
        });
        setVerifyCode('');
        setSettingUp(true);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to generate 2FA QR code.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Verify and Enable 2FA
  const handleEnable2FA = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });

    if (!verifyCode || verifyCode.trim().length !== 6) {
      setFeedback({ type: 'error', text: 'Please enter the 6-digit code from Google Authenticator.' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/auth/2fa/enable', { code: verifyCode.trim() });
      if (res.data.success) {
        setIs2FAEnabled(true);
        setSettingUp(false);
        setFeedback({
          type: 'success',
          text: 'Google Authenticator 2FA has been successfully activated on your account!',
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Invalid 6-digit verification code. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Disable 2FA
  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable Google Authenticator 2FA?')) {
      return;
    }

    setFeedback({ type: '', text: '' });
    try {
      setSubmitting(true);
      const res = await api.post('/auth/2fa/disable');
      if (res.data.success) {
        setIs2FAEnabled(false);
        setSettingUp(false);
        setFeedback({
          type: 'success',
          text: 'Google Authenticator 2FA has been disabled. You can log in using Email OTP or Password.',
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to disable 2FA.',
      });
    } finally {
      setSubmitting(false);
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
    <div className="security-settings-container">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h2>🛡️ Account Security & Google Authenticator (2FA)</h2>
          <p className="admin-page-subtitle">
            Manage two-factor authentication, email verification, and showroom staff account security.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {feedback.text && (
        <div className={`alert ${feedback.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          {feedback.type === 'success' ? <FiCheckCircle size={20} /> : <FiAlertCircle size={20} />}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="security-grid">
        {/* Left Column: Admin Profile Card */}
        <div className="security-card">
          <h3 className="security-section-title">
            <FiUser /> Admin Profile Information
          </h3>
          <div className="profile-info-list">
            <div className="profile-info-row">
              <span className="profile-info-label">Full Name:</span>
              <span className="profile-info-val">{admin?.name || 'Administrator'}</span>
            </div>
            <div className="profile-info-row">
              <span className="profile-info-label">Email Address:</span>
              <span className="profile-info-val">{admin?.email || 'yaseenbrp25@gmail.com'}</span>
            </div>
            <div className="profile-info-row">
              <span className="profile-info-label">Access Role:</span>
              <span className="profile-info-badge">{admin?.role || 'admin'}</span>
            </div>
            <div className="profile-info-row">
              <span className="profile-info-label">Login Method:</span>
              <span className="profile-info-val">Email OTP & Password</span>
            </div>
          </div>
        </div>

        {/* Right Column: Google Authenticator (2FA) Card */}
        <div className="security-card">
          <div className="security-card-header">
            <div>
              <h3 className="security-section-title" style={{ margin: 0 }}>
                <FiSmartphone /> Google Authenticator (2-Step Verification)
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Just like other standard websites, protect your account with Google Authenticator when you want.
              </p>
            </div>
            <div className={`status-pill ${is2FAEnabled ? 'active' : 'inactive'}`}>
              {is2FAEnabled ? '🟢 2FA Active' : '⚪ 2FA Disabled'}
            </div>
          </div>

          <div style={{ marginTop: '16px', lineHeight: '1.5', fontSize: '0.9rem', color: '#334155' }}>
            {is2FAEnabled ? (
              <div>
                <p style={{ color: '#047857', fontWeight: 600, margin: '0 0 12px 0' }}>
                  ✅ Google Authenticator is currently active and protecting your login sessions.
                </p>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleDisable2FA}
                  disabled={submitting}
                  style={{ borderColor: '#ef4444', color: '#dc2626' }}
                >
                  {submitting ? 'Disabling...' : 'Turn Off / Disable 2FA'}
                </button>
              </div>
            ) : (
              <div>
                <p style={{ margin: '0 0 14px 0', color: '#64748b' }}>
                  Two-factor authentication is currently optional. When enabled, signing in with password will
                  ask for a 6-digit code from Google Authenticator on your mobile phone.
                </p>
                {!settingUp && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleStartSetup}
                    disabled={submitting}
                    style={{ fontWeight: 700 }}
                  >
                    <FiShield /> {submitting ? 'Generating...' : 'Set Up Google Authenticator →'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Interactive 2FA Setup Form */}
          {settingUp && !is2FAEnabled && (
            <div className="setup-box-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>
                  📱 Scan QR Code with Phone App
                </h4>
                <button
                  type="button"
                  onClick={() => setSettingUp(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                >
                  <FiX size={18} />
                </button>
              </div>

              <div style={{ textAlign: 'center', margin: '14px 0' }}>
                {setupData.qrCodeUrl && (
                  <img
                    src={setupData.qrCodeUrl}
                    alt="Google Authenticator QR Code"
                    style={{ width: '180px', height: '180px', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  />
                )}
              </div>

              <div className="manual-key-box">
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Secret Key:</span>
                <code style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                  {setupData.secret}
                </code>
                <button
                  type="button"
                  onClick={copySecret}
                  className="btn btn-sm btn-outline"
                  style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                >
                  {copiedKey ? <FiCheck color="#16a34a" /> : <FiCopy />}
                </button>
              </div>

              <form onSubmit={handleEnable2FA} style={{ marginTop: '16px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                    Enter 6-Digit Code from Google Authenticator to confirm:
                  </label>
                  <input
                    type="text"
                    maxLength="6"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="pin-input-big"
                    style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.4rem' }}
                    autoFocus
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    disabled={submitting || verifyCode.length !== 6}
                    style={{ fontWeight: 700 }}
                  >
                    {submitting ? 'Verifying...' : '✅ Activate Google Authenticator'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setSettingUp(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
