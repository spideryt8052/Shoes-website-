import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiNavigation,
  FiShield,
  FiAward,
  FiCheckCircle,
  FiSearch,
} from 'react-icons/fi';
import api from '../../services/api';
import { useStore } from '../../context/StoreContext';
import ProductCard from '../../components/ProductCard/ProductCard';
import GoogleReviews from '../../components/GoogleReviews/GoogleReviews';
import StoreLocation from '../../components/StoreLocation/StoreLocation';
import './Home.css';

const Home = () => {
  const { storeSettings, brands, categories } = useStore();
  const [newArrivals, setNewArrivals] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [inStockShoes, setInStockShoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeProducts = async () => {
      try {
        setLoading(true);
        const [newRes, popRes, stockRes] = await Promise.all([
          api.get('/products?newArrival=true&limit=4'),
          api.get('/products?popular=true&limit=4'),
          api.get('/products?availability=inStock&limit=8'),
        ]);

        if (newRes.data.success) setNewArrivals(newRes.data.products);
        if (popRes.data.success) setPopularProducts(popRes.data.products);
        if (stockRes.data.success) setInStockShoes(stockRes.data.products);
      } catch (err) {
        console.error('Error fetching home products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeProducts();
  }, []);

  return (
    <div className="home-page">
      {/* 1. Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="live-pulse"></span>
              <span>AUTHENTIC PHYSICAL SHOWROOM CATALOGUE</span>
            </div>

            <h1 className="hero-title">
              Discover Premium Shoes In Person at {storeSettings.shopName || 'NEW MB SHOES'}.
            </h1>

            <p className="hero-description">
              Browse our digital catalog of genuine Nike, Adidas, Puma, Skechers, Woodland & Bata footwear. Check real-time store availability, visit our showroom, and find your exact comfort fit.
            </p>

            <div className="hero-action-buttons">
              <a
                href={storeSettings.googleMapsLocationUrl || '#store-location'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-directions btn-lg"
              >
                <FiNavigation /> Visit Store / Directions
              </a>

              <Link to="/shoes" className="btn btn-outline btn-lg">
                <span>Browse All Shoes</span>
                <FiArrowRight />
              </Link>
            </div>

            <div className="hero-guarantees">
              <div className="guarantee-item">
                <FiShield className="g-icon" />
                <span>100% Genuine Brands</span>
              </div>
              <div className="guarantee-item">
                <FiAward className="g-icon" />
                <span>Official Warranty</span>
              </div>
              <div className="guarantee-item">
                <FiCheckCircle className="g-icon" />
                <span>Zero Delivery Wait</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image-card">
              <img
                src={storeSettings.heroBannerImage || "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1000&auto=format&fit=crop&q=80"}
                alt="Shoe Showroom Collection"
                className="hero-main-img"
              />
              <div className="hero-float-card">
                <div className="float-brand">AUTHORIZED RETAILER</div>
                <div className="float-text">Over 14+ Global Footwear Brands in Stock</div>
                <div className="float-status">✓ Real-time MongoDB Inventory</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Brands Section */}
      <section className="featured-brands-section">
        <div className="container">
          <div className="section-header text-center">
            <span className="section-tag">Authorized Multi-Brand Retailer</span>
            <h2 className="section-title">Official Shoe Brands</h2>
            <p className="section-subtitle">
              We carry genuine, manufacturer-warranted collections from the most trusted global footwear leaders.
            </p>
          </div>

          <div className="brands-grid">
            {brands.slice(0, 12).map((brand) => (
              <Link
                key={brand._id}
                to={`/shoes?brand=${encodeURIComponent(brand.name)}`}
                className="brand-card"
              >
                <span className="brand-name-text">{brand.name}</span>
                {brand.productCount !== undefined && (
                  <span className="brand-stock-units">
                    {brand.productCount} models available
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="text-center view-all-brands-wrap">
            <Link to="/brands" className="btn btn-outline">
              Explore All {brands.length} Brands <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Shop by Category / Department */}
      <section className="shop-categories-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Explore Collections</span>
            <h2 className="section-title">Shop by Category & Department</h2>
          </div>

          <div className="category-cards-grid">
            <Link to="/category/men" className="cat-card men-card">
              <div className="cat-card-overlay"></div>
              <div className="cat-card-text">
                <span className="cat-tag">Men's Footwear</span>
                <h3>Running, Sneakers, Loafers & Formal</h3>
                <span className="cat-explore-link">Explore Collection →</span>
              </div>
            </Link>

            <Link to="/category/women" className="cat-card women-card">
              <div className="cat-card-overlay"></div>
              <div className="cat-card-text">
                <span className="cat-tag">Women's Footwear</span>
                <h3>Sneakers, Memory Foam, Flats & Heels</h3>
                <span className="cat-explore-link">Explore Collection →</span>
              </div>
            </Link>

            <Link to="/category/kids" className="cat-card kids-card">
              <div className="cat-card-overlay"></div>
              <div className="cat-card-text">
                <span className="cat-tag">Kids Footwear</span>
                <h3>School Shoes, Sports Shoes & Sandals</h3>
                <span className="cat-explore-link">Explore Collection →</span>
              </div>
            </Link>
          </div>

          {/* Quick Sub-Categories Pills */}
          <div className="quick-categories-pills">
            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat._id}
                to={`/shoes?category=${encodeURIComponent(cat.name)}`}
                className="quick-cat-pill"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. New Arrivals */}
      <section className="products-showcase-section">
        <div className="container">
          <div className="section-header-row">
            <div>
              <span className="section-tag">Fresh In Showroom</span>
              <h2 className="section-title">New Arrivals</h2>
            </div>
            <Link to="/shoes?newArrival=true" className="view-more-link">
              View All New Arrivals <FiArrowRight />
            </Link>
          </div>

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading live showroom inventory...</p>
            </div>
          ) : (
            <div className="products-grid">
              {newArrivals.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. In-Store Visit Banner */}
      <section className="in-store-experience-banner">
        <div className="container banner-inner">
          <div className="banner-left">
            <span className="banner-badge">Why Visit Our Store?</span>
            <h2>Never Guess Shoe Sizes Online Again</h2>
            <p>
              Footwear sizes vary between Nike, Adidas, Puma, and Woodland. When you visit <strong>{storeSettings.shopName || 'NEW MB SHOES'}</strong>, our footwear specialists measure your exact foot span and provide multiple size trials on the spot.
            </p>
            <div className="banner-perks">
              <div className="perk">✓ Instant comfort comparison</div>
              <div className="perk">✓ 100% genuine retail invoice</div>
              <div className="perk">✓ Immediate handover</div>
            </div>
          </div>
          <div className="banner-right">
            <div className="store-callout-card">
              <h3>{storeSettings.shopName || 'NEW MB SHOES'}</h3>
              <p className="callout-address">{storeSettings.address}, {storeSettings.city}</p>
              <p className="callout-timings"><strong>Open:</strong> {storeSettings.openingTime} - {storeSettings.closingTime}</p>
              <a
                href={storeSettings.googleMapsLocationUrl || '#store-location'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-directions"
              >
                <FiNavigation /> Get Google Maps Directions
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Popular Products */}
      <section className="products-showcase-section bg-subtle-section">
        <div className="container">
          <div className="section-header-row">
            <div>
              <span className="section-tag">Customer Favorites</span>
              <h2 className="section-title">Popular Footwear in Store</h2>
            </div>
            <Link to="/shoes?popular=true" className="view-more-link">
              View All Popular Shoes <FiArrowRight />
            </Link>
          </div>

          <div className="products-grid">
            {popularProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 7. Available Products Grid (Live Inventory) */}
      <section className="products-showcase-section">
        <div className="container">
          <div className="section-header-row">
            <div>
              <span className="section-tag">Real-Time Inventory</span>
              <h2 className="section-title">In Stock Shoes Right Now</h2>
              <p className="section-subtitle">
                All models below are physically present on showroom racks ready for immediate trial.
              </p>
            </div>
            <Link to="/shoes?availability=inStock" className="view-more-link">
              Browse Complete Inventory <FiArrowRight />
            </Link>
          </div>

          <div className="products-grid">
            {inStockShoes.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 8. Physical Showroom Gallery (if uploaded) */}
      {storeSettings.showroomPhotos && storeSettings.showroomPhotos.length > 0 && (
        <section className="showroom-gallery-section" style={{ padding: '3.5rem 0', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <div className="container">
            <div className="section-header text-center" style={{ marginBottom: '2rem' }}>
              <span className="section-tag">Showroom Experience</span>
              <h2 className="section-title">Take a Look Inside Our Stores</h2>
              <p className="section-subtitle">
                Visit our spacious showrooms, trial areas, and authentic branded footwear collections across Bhagalpur.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {storeSettings.showroomPhotos.map((photo, i) => (
                <div key={i} style={{ borderRadius: '12px', overflow: 'hidden', height: '220px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                  <img src={photo} alt={`Showroom Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 9. Google Reviews Section */}
      <GoogleReviews />

      {/* 10. Store Location & Google Maps Section */}
      <StoreLocation />
    </div>
  );
};

export default Home;
