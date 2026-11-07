import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiShield, FiPackage } from 'react-icons/fi';
import { useStore } from '../../context/StoreContext';
import './Brands.css';

const Brands = () => {
  const { brands, storeSettings } = useStore();

  return (
    <div className="brands-page">
      <section className="catalog-header-bar">
        <div className="container">
          <span className="section-tag">Authorized Retail Partnerships</span>
          <h1 className="catalog-page-title">Footwear Brands at {storeSettings.shopName || 'NEW MB SHOES'}</h1>
          <p className="catalog-page-desc">
            Explore authentic collections from world-renowned athletic and lifestyle footwear brands. All shoes are 100% genuine with authorized warranty cards.
          </p>
        </div>
      </section>

      <div className="container brands-container">
        <div className="brands-showcase-grid">
          {brands.map((b) => (
            <div key={b._id} className="brand-detailed-card">
              <div className="brand-card-header">
                <h2 className="brand-card-name">{b.name}</h2>
                {b.isFeatured && <span className="featured-tag">★ Featured</span>}
              </div>

              <p className="brand-card-desc">
                {b.description || `Explore authentic ${b.name} running shoes, sneakers, and lifestyle footwear available in our showroom.`}
              </p>

              <div className="brand-card-stats">
                <span className="stat-pill">
                  <FiPackage /> {b.productCount || 0} Models in Stock
                </span>
                <span className="stat-pill">
                  <FiShield /> 100% Genuine
                </span>
              </div>

              <Link
                to={`/shoes?brand=${encodeURIComponent(b.name)}`}
                className="btn btn-outline btn-block"
              >
                <span>Browse {b.name} Catalogue</span>
                <FiArrowRight />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Brands;
