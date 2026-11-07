import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  FiMapPin,
  FiPhone,
  FiClock,
  FiSearch,
  FiMenu,
  FiX,
  FiShield,
  FiNavigation,
} from 'react-icons/fi';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

const Header = () => {
  const { storeSettings } = useStore();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shoes?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setMobileMenuOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Men', path: '/category/men' },
    { name: 'Women', path: '/category/women' },
    { name: 'Kids', path: '/category/kids' },
    { name: 'Sports', path: '/category/sports' },
    { name: 'Casual', path: '/category/casual' },
    { name: 'Formal', path: '/category/formal' },
    { name: 'Brands', path: '/brands' },
    { name: 'All Shoes', path: '/shoes' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <header className="site-header">
      {/* Top Announcement Bar */}
      <div className="top-bar">
        <div className="container top-bar-content">
          <div className="top-bar-left">
            <span className="info-item">
              <FiClock className="icon" /> {storeSettings.workingDays || 'Mon - Sun'}: {storeSettings.openingTime} - {storeSettings.closingTime}
            </span>
            <span className="info-divider">|</span>
            <a href={`tel:${storeSettings.contactNumber}`} className="info-item phone-link">
              <FiPhone className="icon" /> {storeSettings.contactNumber}
            </a>
          </div>
          <div className="top-bar-right">
            <span className="store-badge">PHYSICAL SHOWROOM CATALOGUE</span>
            {isAuthenticated ? (
              <Link to="/admin/dashboard" className="admin-link active-session">
                <FiShield /> Admin Dashboard
              </Link>
            ) : (
              <Link to="/admin/login" className="admin-link">
                <FiShield /> Staff Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="main-header">
        <div className="container main-header-content">
          {/* Mobile Menu Button */}
          <button
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>

          {/* Shop Brand Identity */}
          <Link to="/" className="brand-identity">
            <span className="brand-logo-icon">👟</span>
            <div className="brand-text">
              <h1 className="brand-name">{storeSettings.shopName || 'STEP HOUSE'}</h1>
              <span className="brand-tagline">
                {storeSettings.tagline || 'Multi-Brand Footwear Destination'}
              </span>
            </div>
          </Link>

          {/* Search Bar (Desktop) */}
          <form className="desktop-search-form" onSubmit={handleSearchSubmit}>
            <div className="search-input-wrap">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search Nike, Adidas, Sneakers, Formal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-submit-btn">
                Search
              </button>
            </div>
          </form>

          {/* Visit Store Action Button */}
          <div className="header-actions">
            <button
              className="mobile-search-toggle"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Open Search"
            >
              <FiSearch size={20} />
            </button>

            <a
              href={storeSettings.googleMapsLocationUrl || '#store-location'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-directions visit-store-btn"
              title="Open Google Maps Directions"
            >
              <FiNavigation className="nav-arrow-icon" />
              <span>Visit Store</span>
            </a>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {searchOpen && (
          <div className="mobile-search-bar container">
            <form onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Search shoes by brand, name, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Search
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Navigation Bar */}
      <nav className={`nav-bar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="container nav-content">
          <ul className="nav-links">
            {navLinks.map((link) => (
              <li key={link.name}>
                <NavLink
                  to={link.path}
                  end={link.path === '/'}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="nav-extra-info">
            <a
              href="#store-location"
              className="store-address-hint"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FiMapPin className="pin-icon" /> {storeSettings.city || 'Sector 18 Showroom'}
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;

