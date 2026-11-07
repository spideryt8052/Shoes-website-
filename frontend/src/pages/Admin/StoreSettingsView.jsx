import React, { useState, useEffect } from 'react';
import {
  FiSettings,
  FiSave,
  FiMapPin,
  FiPhone,
  FiClock,
  FiStar,
  FiAlertTriangle,
  FiCheckCircle,
  FiShare2,
} from 'react-icons/fi';
import api from '../../services/api';
import { useStore } from '../../context/StoreContext';
import './StoreSettingsView.css';

const StoreSettingsView = () => {
  const { storeSettings, fetchSettings } = useStore();
  const [formData, setFormData] = useState({
    shopName: 'STEP HOUSE',
    tagline: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    contactNumber: '',
    alternateContact: '',
    email: '',
    openingTime: '10:00 AM',
    closingTime: '09:30 PM',
    workingDays: 'Open All 7 Days (Mon - Sun)',
    googleMapsLocationUrl: '',
    googleMapsEmbedUrl: '',
    googleBusinessProfileUrl: '',
    googleReviewUrl: '',
    shopDescription: '',
    lowStockThreshold: 2,
    googleRating: 4.8,
    totalGoogleReviews: 312,
    googleSheetWebhookUrl: '',
    autoSyncGoogleSheet: false,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (storeSettings) {
      setFormData({
        shopName: storeSettings.shopName || 'STEP HOUSE',
        tagline: storeSettings.tagline || '',
        address: storeSettings.address || '',
        city: storeSettings.city || '',
        state: storeSettings.state || '',
        pincode: storeSettings.pincode || '',
        contactNumber: storeSettings.contactNumber || '',
        alternateContact: storeSettings.alternateContact || '',
        email: storeSettings.email || '',
        openingTime: storeSettings.openingTime || '10:00 AM',
        closingTime: storeSettings.closingTime || '09:30 PM',
        workingDays: storeSettings.workingDays || 'Open All 7 Days (Mon - Sun)',
        googleMapsLocationUrl: storeSettings.googleMapsLocationUrl || '',
        googleMapsEmbedUrl: storeSettings.googleMapsEmbedUrl || '',
        googleBusinessProfileUrl: storeSettings.googleBusinessProfileUrl || '',
        googleReviewUrl: storeSettings.googleReviewUrl || '',
        shopDescription: storeSettings.shopDescription || '',
        lowStockThreshold: storeSettings.lowStockThreshold || 2,
        googleRating: storeSettings.googleRating || 4.8,
        totalGoogleReviews: storeSettings.totalGoogleReviews || 312,
        googleSheetWebhookUrl: storeSettings.googleSheetWebhookUrl || '',
        autoSyncGoogleSheet: Boolean(storeSettings.autoSyncGoogleSheet),
      });
    }
  }, [storeSettings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      setLoading(true);
      const res = await api.put('/store-settings', formData);
      if (res.data.success) {
        setMessage({
          type: 'success',
          text: 'Showroom identity & settings updated successfully! Live website refreshed.',
        });
        fetchSettings();
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Error updating store settings',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="store-settings-page">
      <div className="page-header-row">
        <div>
          <h1 className="admin-page-heading">Physical Store & Branding Settings</h1>
          <p className="admin-page-subtext">
            Update store name, contact numbers, hours, Google Maps directions link, and low stock threshold.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="btn btn-primary btn-lg"
          disabled={loading}
        >
          <FiSave /> {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {message.text && (
        <div className={`action-alert-bar ${message.type}`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="settings-grid">
        {/* Card 1: Branding & Identity */}
        <div className="form-card">
          <h3 className="card-section-title">Store Brand & Identity</h3>
          <p className="card-subtitle">
            Changes to the shop name immediately update the header, footer, and page metadata.
          </p>

          <div className="form-group">
            <label>Shop / Showroom Name *</label>
            <input
              type="text"
              name="shopName"
              value={formData.shopName}
              onChange={handleChange}
              placeholder="STEP HOUSE"
              required
            />
          </div>

          <div className="form-group">
            <label>Brand Tagline</label>
            <input
              type="text"
              name="tagline"
              value={formData.tagline}
              onChange={handleChange}
              placeholder="Multi-Brand Footwear Destination"
            />
          </div>

          <div className="form-group">
            <label>Store Overview / Description</label>
            <textarea
              name="shopDescription"
              rows="4"
              value={formData.shopDescription}
              onChange={handleChange}
              placeholder="Describe your retail footwear showroom..."
            />
          </div>
        </div>

        {/* Card 2: Contact & Operating Hours */}
        <div className="form-card">
          <h3 className="card-section-title">Operating Hours & Contact</h3>
          <p className="card-subtitle">
            Ensure customers know showroom timings before visiting for physical fitting.
          </p>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Primary Phone Number *</label>
              <input
                type="text"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="+91 98102 34567"
                required
              />
            </div>

            <div className="form-group">
              <label>Alternate Contact Phone</label>
              <input
                type="text"
                name="alternateContact"
                value={formData.alternateContact}
                onChange={handleChange}
                placeholder="+91 98102 34568"
              />
            </div>

            <div className="form-group">
              <label>Showroom Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contact@stephouse.in"
              />
            </div>

            <div className="form-group">
              <label>Working Days Notice</label>
              <input
                type="text"
                name="workingDays"
                value={formData.workingDays}
                onChange={handleChange}
                placeholder="Open All 7 Days (Mon - Sun)"
              />
            </div>

            <div className="form-group">
              <label>Opening Time *</label>
              <input
                type="text"
                name="openingTime"
                value={formData.openingTime}
                onChange={handleChange}
                placeholder="10:00 AM"
                required
              />
            </div>

            <div className="form-group">
              <label>Closing Time *</label>
              <input
                type="text"
                name="closingTime"
                value={formData.closingTime}
                onChange={handleChange}
                placeholder="09:30 PM"
                required
              />
            </div>
          </div>
        </div>

        {/* Card 3: Physical Address & Google Maps Integration */}
        <div className="form-card">
          <h3 className="card-section-title">Physical Address & Google Maps Integration</h3>
          <p className="card-subtitle">
            Controls where customers are directed when clicking "Visit Store" or "Get Directions".
          </p>

          <div className="form-group full-width">
            <label>Street Address / Plaza Shop Number *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Shop No. 12-14, Commercial Boulevard, Sector 18"
              required
            />
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label>City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Noida"
                required
              />
            </div>

            <div className="form-group">
              <label>State *</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Uttar Pradesh"
                required
              />
            </div>

            <div className="form-group">
              <label>PIN Code *</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="201301"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Google Maps Directions URL (Opens when customer clicks "Visit Store")</label>
            <input
              type="text"
              name="googleMapsLocationUrl"
              value={formData.googleMapsLocationUrl}
              onChange={handleChange}
              placeholder="https://maps.google.com/?q=..."
            />
          </div>

          <div className="form-group">
            <label>Google Maps Embed iframe URL (For embedded map view)</label>
            <input
              type="text"
              name="googleMapsEmbedUrl"
              value={formData.googleMapsEmbedUrl}
              onChange={handleChange}
              placeholder="https://www.google.com/maps/embed?pb=..."
            />
          </div>
        </div>

        {/* Card 4: Inventory Thresholds & Google Trust */}
        <div className="form-card">
          <h3 className="card-section-title">Inventory Thresholds & Google Profile</h3>
          <p className="card-subtitle">
            Configure system alerts when store pairs run low and link Google Business Reviews.
          </p>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Low Stock Warning Threshold (Pairs) *</label>
              <input
                type="number"
                name="lowStockThreshold"
                value={formData.lowStockThreshold}
                onChange={handleChange}
                min="1"
                required
              />
              <span className="field-hint">
                When variant or total stock is ≤ this number, "Low Stock" warning badge is triggered.
              </span>
            </div>

            <div className="form-group">
              <label>Google Review Page URL ("Review Us on Google")</label>
              <input
                type="text"
                name="googleReviewUrl"
                value={formData.googleReviewUrl}
                onChange={handleChange}
                placeholder="https://search.google.com/local/writereview?placeid=..."
              />
            </div>

            <div className="form-group">
              <label>Google Rating (1.0 to 5.0)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                name="googleRating"
                value={formData.googleRating}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Total Verified Google Reviews Count</label>
              <input
                type="number"
                name="totalGoogleReviews"
                value={formData.totalGoogleReviews}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Card 5: Automated Google Sheets Integration */}
        <div className="form-card">
          <h3 className="card-section-title">
            <FiShare2 /> Google Sheets & Cloud Spreadsheet Automation
          </h3>
          <p className="card-subtitle">
            Connect your personal Google Sheet so every shoe sold in your showroom automatically syncs as a new row in real time.
          </p>

          <div className="form-group">
            <label>Google Apps Script Webhook URL</label>
            <input
              type="url"
              name="googleSheetWebhookUrl"
              value={formData.googleSheetWebhookUrl}
              onChange={handleChange}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
            />
            <span className="field-hint">
              Paste the deployed Web App URL from your Google Sheet (see "Sales & Google Sheets ➔ Setup Guide" tab for the script).
            </span>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600 }}>
              <input
                type="checkbox"
                name="autoSyncGoogleSheet"
                checked={formData.autoSyncGoogleSheet}
                onChange={handleChange}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              Enable Real-Time Automatic Sync to Google Sheet on Every Sale
            </label>
            <span className="field-hint" style={{ marginLeft: '28px' }}>
              When checked, every sale recorded via Quick Sell (POS) or End-of-Day batch entry pushes to your Google Sheet immediately in the background.
            </span>
          </div>
        </div>
      </form>
    </div>
  );
};

export default StoreSettingsView;

