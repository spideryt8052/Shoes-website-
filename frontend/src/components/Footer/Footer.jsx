import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiMapPin,
  FiPhone,
  FiClock,
  FiMail,
  FiNavigation,
  FiStar,
  FiShield,
  FiCheckCircle,
} from 'react-icons/fi';
import { useStore } from '../../context/StoreContext';
import './Footer.css';

const Footer = () => {
  const { storeSettings, brands } = useStore();

  return (
    <footer className="site-footer">
      {/* Store Visit Highlights Bar */}
      <div className="store-highlights-bar">
        <div className="container highlights-grid">
          <div className="highlight-item">
            <FiCheckCircle className="highlight-icon" />
            <div>
              <h4>100% Genuine Footwear</h4>
              <p>Authorized retail showroom with official manufacturer warranties.</p>
            </div>
          </div>
          <div className="highlight-item">
            <FiNavigation className="highlight-icon" />
            <div>
              <h4>In-Store Trial & Comfort Fit</h4>
              <p>Try different sizes, walk in them, and find your exact comfort match.</p>
            </div>
          </div>
          <div className="highlight-item">
            <FiClock className="highlight-icon" />
            <div>
              <h4>Instant Store Purchase</h4>
              <p>No waiting days for delivery. Take your favourite shoes home right away.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container footer-main">
        <div className="footer-col brand-col">
          <div className="footer-logo">
            <span className="logo-emoji">👟</span>
            <span className="logo-text">{storeSettings.shopName || 'STEP HOUSE'}</span>
          </div>
          <p className="footer-desc">
            {storeSettings.shopDescription ||
              'A premier physical multi-brand retail footwear showroom. Discover top global brands with complete sizing availability, genuine manufacturer warranty, and personalized fitting assistance.'}
          </p>
          <div className="google-rating-pill">
            <span className="star-icon">★</span>
            <span className="rating-num">{storeSettings.googleRating || '4.8'}</span>
            <span className="rating-stars">★★★★★</span>
            <span className="rating-count">({storeSettings.totalGoogleReviews || '300+'} Google Reviews)</span>
          </div>
        </div>

        <div className="footer-col links-col">
          <h3 className="footer-col-title">Footwear Categories</h3>
          <ul className="footer-links-list">
            <li><Link to="/category/men">Men's Collection</Link></li>
            <li><Link to="/category/women">Women's Footwear</Link></li>
            <li><Link to="/category/kids">Kids & School Shoes</Link></li>
            <li><Link to="/category/sports">Sports & Running Shoes</Link></li>
            <li><Link to="/category/formal">Formal & Dress Shoes</Link></li>
            <li><Link to="/category/casual">Casual Sneakers & Loafers</Link></li>
            <li><Link to="/shoes">Browse Complete Catalogue</Link></li>
          </ul>
        </div>

        <div className="footer-col brands-col">
          <h3 className="footer-col-title">Showroom Brands</h3>
          <div className="footer-brand-tags">
            {brands.slice(0, 10).map((b) => (
              <Link key={b._id} to={`/shoes?brand=${encodeURIComponent(b.name)}`} className="brand-tag">
                {b.name}
              </Link>
            ))}
            <Link to="/brands" className="brand-tag view-all">
              + All Brands
            </Link>
          </div>
        </div>

        <div className="footer-col contact-col">
          <h3 className="footer-col-title">Visit Our Store</h3>
          <ul className="store-contact-list">
            <li>
              <FiMapPin className="contact-icon" />
              <span>
                {storeSettings.address}, {storeSettings.city}, {storeSettings.state} - {storeSettings.pincode}
              </span>
            </li>
            <li>
              <FiPhone className="contact-icon" />
              <span>
                <a href={`tel:${storeSettings.contactNumber}`}>{storeSettings.contactNumber}</a>
                {storeSettings.alternateContact && ` / ${storeSettings.alternateContact}`}
              </span>
            </li>
            <li>
              <FiClock className="contact-icon" />
              <span>
                {storeSettings.workingDays || 'Mon - Sun'}: {storeSettings.openingTime} - {storeSettings.closingTime}
              </span>
            </li>
            <li>
              <FiMail className="contact-icon" />
              <span>
                <a href={`mailto:${storeSettings.email || 'contact@stephouse.com'}`}>
                  {storeSettings.email || 'contact@stephouse.com'}
                </a>
              </span>
            </li>
          </ul>

          <div className="footer-actions">
            <a
              href={storeSettings.googleMapsLocationUrl || '#store-location'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-directions btn-sm"
            >
              <FiNavigation /> Get Store Directions
            </a>

            {storeSettings.googleReviewUrl && (
              <a
                href={storeSettings.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm review-btn"
              >
                <FiStar className="star-gold" /> Review Us on Google
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Notice & Bottom Bar */}
      <div className="footer-notice-bar">
        <div className="container notice-content">
          <p className="catalogue-notice">
            <strong>Store Policy Notice:</strong> This website serves as a real-time digital catalogue for our physical shoe store. We do not provide home delivery, online ordering, or online payment gateways. Visit our physical store to try, inspect, and purchase products in person.
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container bottom-content">
          <p>© {new Date().getFullYear()} {storeSettings.shopName || 'STEP HOUSE'}. All rights reserved.</p>
          <div className="bottom-links">
            <Link to="/contact">Store Location</Link>
            <span className="dot">•</span>
            <Link to="/shoes">Product Stock</Link>
            <span className="dot">•</span>
            <Link to="/admin/login" className="admin-access-link">
              <FiShield /> Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

