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
  FiPlus,
  FiTrash2,
  FiNavigation,
} from 'react-icons/fi';
import api from '../../services/api';
import { useStore } from '../../context/StoreContext';
import './StoreSettingsView.css';

const StoreSettingsView = () => {
  const { storeSettings, fetchSettings } = useStore();
  const [formData, setFormData] = useState({
    shopName: 'NEW MB SHOES',
    tagline: '',
    heroBannerImage: '',
    showroomPhotos: [],
    announcementBanner: { enabled: true, text: '' },
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
    googleRating: 4.3,
    totalGoogleReviews: 128,
    googleSheetWebhookUrl: '',
    autoSyncGoogleSheet: false,
    branches: [],
  });

  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (storeSettings) {
      setFormData({
        shopName: storeSettings.shopName || 'NEW MB SHOES',
        tagline: storeSettings.tagline || '',
        heroBannerImage: storeSettings.heroBannerImage || '',
        showroomPhotos: Array.isArray(storeSettings.showroomPhotos) ? storeSettings.showroomPhotos : [],
        announcementBanner: storeSettings.announcementBanner || {
          enabled: true,
          text: '📍 Visit NEW MB SHOES across our 3 showrooms in Bhagalpur (Shah Market, Tatarpur, Tilkamanjhi) for authentic branded footwear!',
        },
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
        googleRating: storeSettings.googleRating || 4.3,
        totalGoogleReviews: storeSettings.totalGoogleReviews || 128,
        googleSheetWebhookUrl: storeSettings.googleSheetWebhookUrl || '',
        autoSyncGoogleSheet: Boolean(storeSettings.autoSyncGoogleSheet),
        branches: storeSettings.branches && storeSettings.branches.length > 0 ? storeSettings.branches : [],
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

  const handleBranchChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...(prev.branches || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, branches: updated };
    });
  };

  const handleAddBranch = () => {
    setFormData((prev) => ({
      ...prev,
      branches: [
        ...(prev.branches || []),
        {
          name: `Branch ${(prev.branches?.length || 0) + 1}`,
          tag: 'Showroom Branch',
          address: '',
          landmark: '',
          city: 'Bhagalpur',
          state: 'Bihar',
          pincode: '812001',
          contactNumber: prev.contactNumber || '+91 94312 14500',
          googleMapsLocationUrl: '',
          googleMapsEmbedUrl: '',
          openingHours: '10:00 AM - 09:30 PM (All 7 Days)',
          isPrimary: false,
        },
      ],
    }));
  };

  const handleRemoveBranch = (index) => {
    if (window.confirm('Are you sure you want to remove this branch location?')) {
      setFormData((prev) => ({
        ...prev,
        branches: prev.branches.filter((_, i) => i !== index),
      }));
    }
  };

  const handleAddShowroomPhoto = () => {
    if (!newPhotoUrl.trim()) return;
    setFormData((prev) => ({
      ...prev,
      showroomPhotos: [...(prev.showroomPhotos || []), newPhotoUrl.trim()],
    }));
    setNewPhotoUrl('');
  };

  const handleRemoveShowroomPhoto = (index) => {
    setFormData((prev) => ({
      ...prev,
      showroomPhotos: (prev.showroomPhotos || []).filter((_, i) => i !== index),
    }));
  };

  const handleAnnouncementToggle = (e) => {
    const checked = e.target.checked;
    setFormData((prev) => ({
      ...prev,
      announcementBanner: {
        ...(prev.announcementBanner || {}),
        enabled: checked,
      },
    }));
  };

  const handleAnnouncementTextChange = (e) => {
    const text = e.target.value;
    setFormData((prev) => ({
      ...prev,
      announcementBanner: {
        ...(prev.announcementBanner || {}),
        text,
      },
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

        {/* Card: Homepage Banner & Top Announcement Bar */}
        <div className="form-card">
          <h3 className="card-section-title">🖼️ Homepage Banner & Announcement</h3>
          <p className="card-subtitle">
            Customize the main banner photo and the top announcement bar visible to all website visitors.
          </p>

          <div className="form-group">
            <label>Homepage Hero Banner Image URL</label>
            <input
              type="text"
              name="heroBannerImage"
              value={formData.heroBannerImage}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/... or your banner photo URL"
            />
            {formData.heroBannerImage && (
              <div style={{ marginTop: '0.75rem', borderRadius: '8px', overflow: 'hidden', maxHeight: '180px', border: '1px solid #e2e8f0' }}>
                <img
                  src={formData.heroBannerImage}
                  alt="Banner Preview"
                  style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="checkbox"
                id="announcement-toggle"
                checked={Boolean(formData.announcementBanner?.enabled)}
                onChange={handleAnnouncementToggle}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="announcement-toggle" style={{ fontWeight: 600, cursor: 'pointer', margin: 0 }}>
                Enable Top Announcement Bar (Offers / Timings)
              </label>
            </div>
            <textarea
              rows="2"
              value={formData.announcementBanner?.text || ''}
              onChange={handleAnnouncementTextChange}
              placeholder="e.g. 📍 Visit NEW MB SHOES across our 3 showrooms in Bhagalpur (Shah Market, Tatarpur, Tilkamanjhi) for authentic branded footwear!"
            />
          </div>
        </div>

        {/* Card: Showroom Photos Gallery */}
        <div className="form-card">
          <h3 className="card-section-title">📸 Physical Showroom Photos Gallery</h3>
          <p className="card-subtitle">
            Add photos of your shop entrance, shoe display racks, and billing counter for customers to see.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="text"
              value={newPhotoUrl}
              onChange={(e) => setNewPhotoUrl(e.target.value)}
              placeholder="Paste photo image URL (e.g. https://...)"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={handleAddShowroomPhoto}
              className="btn btn-outline"
              style={{ whiteSpace: 'nowrap' }}
            >
              <FiPlus /> Add Photo
            </button>
          </div>

          {formData.showroomPhotos && formData.showroomPhotos.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
              {formData.showroomPhotos.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', height: '110px' }}>
                  <img
                    src={url}
                    alt={`Showroom ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveShowroomPhoto(idx)}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: 'rgba(239, 68, 68, 0.85)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>
              No showroom photos added yet. Paste image URLs above to showcase your physical showrooms.
            </p>
          )}
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

        {/* Card 6: Showroom Branches Network */}
        <div className="form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h3 className="card-section-title" style={{ margin: 0 }}>
                <FiMapPin /> Showroom Branches & Stores Network
              </h3>
              <p className="card-subtitle" style={{ margin: '4px 0 0' }}>
                Manage all your physical store locations in Bhagalpur (Shah Market, Tatarpur, Tilkamanjhi, etc.)
              </p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={handleAddBranch}
            >
              <FiPlus /> Add Another Branch
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
            {formData.branches && formData.branches.length > 0 ? (
              formData.branches.map((b, idx) => (
                <div
                  key={b._id || idx}
                  style={{
                    background: 'var(--bg-neutral)',
                    padding: '18px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      🏪 Branch #{idx + 1}: {b.name || 'Untitled Store'}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                      onClick={() => handleRemoveBranch(idx)}
                      disabled={formData.branches.length <= 1}
                      title="Remove this branch"
                    >
                      <FiTrash2 /> Remove
                    </button>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Branch Name *</label>
                      <input
                        type="text"
                        value={b.name || ''}
                        onChange={(e) => handleBranchChange(idx, 'name', e.target.value)}
                        placeholder="e.g. MB SHOES (Tilkamanjhi Branch)"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Branch Tag / Label</label>
                      <input
                        type="text"
                        value={b.tag || ''}
                        onChange={(e) => handleBranchChange(idx, 'tag', e.target.value)}
                        placeholder="e.g. 3rd Dukan - Tilkamanjhi"
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '10px' }}>
                    <label>Full Store Address *</label>
                    <input
                      type="text"
                      value={b.address || ''}
                      onChange={(e) => handleBranchChange(idx, 'address', e.target.value)}
                      placeholder="e.g. Tilkamanjhi Main Road / Chowk, Bhagalpur - 812001"
                      required
                    />
                  </div>

                  <div className="form-grid-2" style={{ marginTop: '10px' }}>
                    <div className="form-group">
                      <label>Nearby Landmark</label>
                      <input
                        type="text"
                        value={b.landmark || ''}
                        onChange={(e) => handleBranchChange(idx, 'landmark', e.target.value)}
                        placeholder="e.g. Near Tilkamanjhi Chowk"
                      />
                    </div>

                    <div className="form-group">
                      <label>Store Contact Number</label>
                      <input
                        type="text"
                        value={b.contactNumber || ''}
                        onChange={(e) => handleBranchChange(idx, 'contactNumber', e.target.value)}
                        placeholder="+91 94312 14500"
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '10px' }}>
                    <label>Google Maps Location URL (Directions Link) *</label>
                    <input
                      type="url"
                      value={b.googleMapsLocationUrl || ''}
                      onChange={(e) => handleBranchChange(idx, 'googleMapsLocationUrl', e.target.value)}
                      placeholder="https://maps.app.goo.gl/38363DB6kC7D1Qiv5"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: '10px' }}>
                    <label>Google Maps Embed iframe URL (Optional for embedded map view)</label>
                    <input
                      type="text"
                      value={b.googleMapsEmbedUrl || ''}
                      onChange={(e) => handleBranchChange(idx, 'googleMapsEmbedUrl', e.target.value)}
                      placeholder="https://www.google.com/maps/embed?pb=..."
                    />
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No branches configured.</p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default StoreSettingsView;

