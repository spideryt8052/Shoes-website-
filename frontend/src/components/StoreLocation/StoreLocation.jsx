import React, { useState } from 'react';
import {
  FiMapPin,
  FiClock,
  FiPhone,
  FiMail,
  FiNavigation,
  FiCheckCircle,
  FiCompass,
  FiExternalLink,
} from 'react-icons/fi';
import { useStore } from '../../context/StoreContext';
import './StoreLocation.css';

const StoreLocation = () => {
  const { storeSettings } = useStore();
  const [activeBranchIndex, setActiveBranchIndex] = useState(0);

  // Fallback 3 branches in Bhagalpur
  const defaultBranches = [
    {
      id: 'branch-1',
      name: 'NEW MB SHOES (Main Flagship Showroom)',
      tag: 'Branch 1 (Main Store)',
      shortName: '1. Shah Market (Main)',
      address: 'D.N. Singh Road, Shah Market (Near Titan World), Khalifabagh Chowk, Tatarpur, Bhagalpur - 812001',
      landmark: 'Near Titan World, Shah Market, Khalifabagh Chowk',
      city: 'Bhagalpur',
      state: 'Bihar',
      pincode: '812001',
      contactNumber: '+91 94312 14500',
      googleMapsLocationUrl: 'https://maps.app.goo.gl/vF32PqqHXmZ6mKTx6',
      googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3608.2045584828623!2d86.9753713!3d25.247063!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f04bc68c3ae729%3A0x8e3ba4d6ccca5905!2sNEW%20MB%20SHOES!5e0!3m2!1sen!2sin!4v1715000000000!5m2!1sen!2sin',
      openingHours: '10:00 AM - 09:30 PM (All 7 Days Open)',
    },
    {
      id: 'branch-2',
      name: 'MB SHOES (Tatarpur Showroom)',
      tag: 'Branch 2 (Market)',
      shortName: '2. Tatarpur Market',
      address: 'Tatarpur Main Market Road, Near Chowk, Bhagalpur - 812002',
      landmark: 'Tatarpur Chowk Market Road',
      city: 'Bhagalpur',
      state: 'Bihar',
      pincode: '812002',
      contactNumber: '+91 94312 14500',
      googleMapsLocationUrl: 'https://maps.app.goo.gl/vF32PqqHXmZ6mKTx6',
      googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3608.2045584828623!2d86.9753713!3d25.247063!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f04bc68c3ae729%3A0x8e3ba4d6ccca5905!2sNEW%20MB%20SHOES!5e0!3m2!1sen!2sin!4v1715000000000!5m2!1sen!2sin',
      openingHours: '10:00 AM - 09:30 PM (All 7 Days Open)',
    },
    {
      id: 'branch-3',
      name: 'MB SHOES (Tilkamanjhi 3rd Showroom)',
      tag: 'Branch 3 (Tilkamanjhi)',
      shortName: '3. Tilkamanjhi Chowk',
      address: 'Tilkamanjhi Main Road / Chowk, Bhagalpur - 812001',
      landmark: 'Near Tilkamanjhi Chowk',
      city: 'Bhagalpur',
      state: 'Bihar',
      pincode: '812001',
      contactNumber: '+91 94312 14500',
      googleMapsLocationUrl: 'https://maps.app.goo.gl/38363DB6kC7D1Qiv5',
      googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3608.10!2d86.999969!3d25.2535303!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f037032e2bf8bf%3A0x29f99a87912db23a!2sMB%20SHOES!5e0!3m2!1sen!2sin!4v1715000000000!5m2!1sen!2sin',
      openingHours: '10:00 AM - 09:30 PM (All 7 Days Open)',
    },
  ];

  const branches =
    storeSettings.branches && storeSettings.branches.length > 0
      ? storeSettings.branches
      : defaultBranches;

  const activeBranch = branches[activeBranchIndex] || branches[0];

  return (
    <section className="store-location-section" id="store-location">
      <div className="container">
        <div className="section-header text-center">
          <span className="section-tag">Physical Showroom Network • Bhagalpur</span>
          <h2 className="section-title">Visit Our 3 Showrooms in Bhagalpur</h2>
          <p className="section-subtitle">
            Visit any of our 3 physical showrooms across Bhagalpur for authentic multi-brand footwear,
            foot span measurements, and instant trials.
          </p>
        </div>

        {/* Branch Selector Tabs */}
        <div className="branch-selector-bar">
          {branches.map((b, idx) => (
            <button
              key={b.id || idx}
              type="button"
              className={`branch-tab-btn ${activeBranchIndex === idx ? 'active' : ''}`}
              onClick={() => setActiveBranchIndex(idx)}
            >
              <span>📍 {b.shortName || b.name}</span>
              <span className="branch-tab-badge">{b.tag || `Branch ${idx + 1}`}</span>
            </button>
          ))}
        </div>

        <div className="location-grid">
          {/* Active Branch Info Card */}
          <div className="store-info-card">
            <div className="card-badge">
              <span className="live-dot"></span> OPEN TODAY FOR IN-STORE TRIAL
            </div>

            <h3 className="store-title">{activeBranch.name}</h3>
            <p className="store-subtitle">{activeBranch.tag || 'Authorized Multi-Brand Footwear Showroom'}</p>

            <div className="details-stack">
              <div className="detail-item">
                <div className="detail-icon-wrap">
                  <FiMapPin className="detail-icon" />
                </div>
                <div>
                  <h4>Store Address</h4>
                  <p className="address-text">{activeBranch.address}</p>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon-wrap">
                  <FiCompass className="detail-icon" />
                </div>
                <div>
                  <h4>Nearby Landmark</h4>
                  <p className="landmark-text">
                    {activeBranch.landmark || 'Convenient customer parking available on main road.'}
                  </p>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon-wrap">
                  <FiClock className="detail-icon" />
                </div>
                <div>
                  <h4>Showroom Timings</h4>
                  <p className="hours-text">
                    <strong>{activeBranch.openingHours || '10:00 AM - 09:30 PM (All 7 Days)'}</strong>
                  </p>
                  <span className="days-hint">Open Monday to Sunday</span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon-wrap">
                  <FiPhone className="detail-icon" />
                </div>
                <div>
                  <h4>Call Before Visiting / In-Store Assistance</h4>
                  <a
                    href={`tel:${activeBranch.contactNumber || storeSettings.contactNumber}`}
                    className="phone-big-link"
                  >
                    {activeBranch.contactNumber || storeSettings.contactNumber}
                  </a>
                </div>
              </div>
            </div>

            {/* Visit Actions for Active Branch */}
            <div className="location-cta-group">
              <a
                href={activeBranch.googleMapsLocationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-directions btn-lg"
              >
                <FiNavigation /> Get Google Maps Directions
              </a>

              <a
                href={`tel:${activeBranch.contactNumber || storeSettings.contactNumber}`}
                className="btn btn-outline btn-lg"
              >
                <FiPhone /> Call Showroom
              </a>
            </div>

            <div className="in-store-guarantees">
              <span><FiCheckCircle className="check-icon" /> Try Before Buying</span>
              <span><FiCheckCircle className="check-icon" /> Accurate Size Measurement</span>
              <span><FiCheckCircle className="check-icon" /> Instant Billing</span>
            </div>
          </div>

          {/* Embedded Google Map for Active Branch */}
          <div className="store-map-wrapper">
            {activeBranch.googleMapsEmbedUrl ? (
              <iframe
                title={`Store Location Map - ${activeBranch.name}`}
                src={activeBranch.googleMapsEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="map-placeholder">
                <FiMapPin size={48} className="map-pin-placeholder" />
                <h4>{activeBranch.name}</h4>
                <p>{activeBranch.address}</p>
                <a
                  href={activeBranch.googleMapsLocationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-directions btn-sm"
                >
                  <FiNavigation /> Open in Google Maps
                </a>
              </div>
            )}
          </div>
        </div>

        {/* All 3 Showrooms Overview Cards */}
        <div className="all-branches-container">
          <h3 className="all-branches-title">Our 3 Showrooms in Bhagalpur</h3>
          <p className="all-branches-sub">
            Visit the branch closest to you for genuine Nike, Adidas, Puma, Skechers, Woodland & Bata footwear.
          </p>

          <div className="branches-cards-grid">
            {branches.map((b, idx) => (
              <div
                key={b.id || idx}
                className={`branch-showroom-card ${activeBranchIndex === idx ? 'active-highlight' : ''}`}
              >
                <div>
                  <div className="branch-card-header">
                    <h4 className="branch-card-title">{b.name}</h4>
                    <span className="branch-pill">{b.tag || `Branch ${idx + 1}`}</span>
                  </div>

                  <p className="branch-card-address">
                    <FiMapPin size={15} style={{ marginRight: '6px', color: 'var(--color-primary)' }} />
                    {b.address}
                  </p>

                  <p className="branch-card-landmark">
                    <FiCompass size={14} />
                    <span>{b.landmark || b.city}</span>
                  </p>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <FiClock size={13} style={{ marginRight: '6px' }} />
                    {b.openingHours || '10:00 AM - 09:30 PM (Open Daily)'}
                  </div>
                </div>

                <div className="branch-card-actions">
                  <button
                    type="button"
                    className={`btn btn-sm ${activeBranchIndex === idx ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => {
                      setActiveBranchIndex(idx);
                      window.scrollTo({
                        top: document.getElementById('store-location')?.offsetTop - 80,
                        behavior: 'smooth',
                      });
                    }}
                  >
                    View On Map
                  </button>

                  <a
                    href={b.googleMapsLocationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-directions"
                  >
                    <FiNavigation size={13} /> Directions
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StoreLocation;
