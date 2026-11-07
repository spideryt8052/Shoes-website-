import React from 'react';
import {
  FiMapPin,
  FiClock,
  FiPhone,
  FiMail,
  FiNavigation,
  FiCheckCircle,
  FiCompass,
} from 'react-icons/fi';
import { useStore } from '../../context/StoreContext';
import './StoreLocation.css';

const StoreLocation = () => {
  const { storeSettings } = useStore();

  return (
    <section className="store-location-section" id="store-location">
      <div className="container">
        <div className="section-header text-center">
          <span className="section-tag">Physical Showroom Experience</span>
          <h2 className="section-title">Visit {storeSettings.shopName || 'STEP HOUSE'}</h2>
          <p className="section-subtitle">
            Experience shoes in person. Check your exact foot size, trial comfort padding, get genuine manufacturer warranty, and take them home instantly.
          </p>
        </div>

        <div className="location-grid">
          {/* Store Info Card */}
          <div className="store-info-card">
            <div className="card-badge">
              <span className="live-dot"></span> OPEN TODAY FOR IN-STORE TRIAL
            </div>

            <h3 className="store-title">{storeSettings.shopName || 'STEP HOUSE'}</h3>
            <p className="store-subtitle">{storeSettings.tagline || 'Multi-Brand Footwear Destination'}</p>

            <div className="details-stack">
              <div className="detail-item">
                <div className="detail-icon-wrap">
                  <FiMapPin className="detail-icon" />
                </div>
                <div>
                  <h4>Store Address</h4>
                  <p className="address-text">
                    {storeSettings.address}, {storeSettings.city}, {storeSettings.state} - {storeSettings.pincode}
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
                    <strong>{storeSettings.openingTime} - {storeSettings.closingTime}</strong>
                  </p>
                  <span className="days-hint">{storeSettings.workingDays || 'Open 7 Days a Week'}</span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon-wrap">
                  <FiPhone className="detail-icon" />
                </div>
                <div>
                  <h4>Call Before Visiting / In-Store Assistance</h4>
                  <a href={`tel:${storeSettings.contactNumber}`} className="phone-big-link">
                    {storeSettings.contactNumber}
                  </a>
                  {storeSettings.alternateContact && (
                    <span className="alt-phone"> / {storeSettings.alternateContact}</span>
                  )}
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon-wrap">
                  <FiCompass className="detail-icon" />
                </div>
                <div>
                  <h4>Nearby Landmark & Parking</h4>
                  <p className="landmark-text">
                    Valet & Dedicated customer parking available near metro square entrance.
                  </p>
                </div>
              </div>
            </div>

            {/* Visit Actions */}
            <div className="location-cta-group">
              <a
                href={storeSettings.googleMapsLocationUrl || 'https://maps.google.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-directions btn-lg"
              >
                <FiNavigation /> Get Google Maps Directions
              </a>

              <a href={`tel:${storeSettings.contactNumber}`} className="btn btn-outline btn-lg">
                <FiPhone /> Call Showroom
              </a>
            </div>

            <div className="in-store-guarantees">
              <span><FiCheckCircle className="check-icon" /> Try Before Buying</span>
              <span><FiCheckCircle className="check-icon" /> Free Size Measurement</span>
              <span><FiCheckCircle className="check-icon" /> Instant Billing</span>
            </div>
          </div>

          {/* Embedded Google Map */}
          <div className="store-map-wrapper">
            {storeSettings.googleMapsEmbedUrl ? (
              <iframe
                title="Store Location Google Map"
                src={storeSettings.googleMapsEmbedUrl}
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
                <h4>Store Location Coordinates</h4>
                <p>{storeSettings.address}, {storeSettings.city}</p>
                <a
                  href={storeSettings.googleMapsLocationUrl || 'https://maps.google.com'}
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
      </div>
    </section>
  );
};

export default StoreLocation;

