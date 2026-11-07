import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiNavigation,
  FiMapPin,
  FiPhone,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
  FiArrowLeft,
  FiShield,
  FiShare2,
} from 'react-icons/fi';
import api from '../../services/api';
import { useStore } from '../../context/StoreContext';
import ProductCard from '../../components/ProductCard/ProductCard';
import './ProductDetails.css';

const ProductDetails = () => {
  const { identifier } = useParams();
  const { storeSettings } = useStore();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeImage, setActiveImage] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/products/${identifier}`);
        if (res.data.success && res.data.product) {
          const p = res.data.product;
          setProduct(p);
          setRelatedProducts(res.data.relatedProducts || []);
          setActiveImage(p.primaryImage || (p.images && p.images[0]) || '/placeholder-shoe.jpg');

          // Initialize selected color & size
          if (p.variants && p.variants.length > 0) {
            setSelectedColor(p.variants[0].color);
            setSelectedSize(p.variants[0].size);
          }
        } else {
          setError('Shoe model not found');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error loading shoe details');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo(0, 0);
  }, [identifier]);

  if (loading) {
    return (
      <div className="container loading-container">
        <div className="spinner"></div>
        <p>Checking live showroom inventory for this model...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container error-container">
        <h2>Shoe Not Found</h2>
        <p>{error || 'The requested shoe model is unavailable or has been archived.'}</p>
        <Link to="/shoes" className="btn btn-primary">
          <FiArrowLeft /> Return to Shoe Catalogue
        </Link>
      </div>
    );
  }

  // Extract unique colors available
  const allColors = Array.from(new Set((product.variants || []).map((v) => v.color)));

  // Filter variants for currently selected color
  const variantsForSelectedColor = (product.variants || []).filter(
    (v) => !selectedColor || v.color.toLowerCase() === selectedColor.toLowerCase()
  );

  // Find currently selected variant info
  const currentVariant = variantsForSelectedColor.find((v) => v.size === selectedSize);
  const currentVariantQty = currentVariant ? currentVariant.quantity : 0;

  // Calculate overall product stock
  const isProductOutOfStock = product.totalStock === 0 || !product.isAvailable;
  const isProductLowStock = !isProductOutOfStock && product.totalStock <= 2;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="product-details-page">
      {/* Breadcrumbs */}
      <div className="breadcrumbs-bar">
        <div className="container breadcrumb-links">
          <Link to="/">Home</Link>
          <span className="bc-sep">/</span>
          <Link to="/shoes">All Shoes</Link>
          <span className="bc-sep">/</span>
          <Link to={`/shoes?brand=${encodeURIComponent(product.brandName)}`}>{product.brandName}</Link>
          <span className="bc-sep">/</span>
          <span className="bc-current">{product.name}</span>
        </div>
      </div>

      <div className="container product-details-layout">
        {/* Left Column: Image Gallery */}
        <div className="gallery-column">
          <div className="main-image-wrap">
            <img
              src={activeImage}
              alt={product.name}
              className="gallery-main-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000&auto=format&fit=crop&q=80';
              }}
            />

            {/* Overall Stock Status Tag */}
            <div className="gallery-stock-badge">
              {isProductOutOfStock ? (
                <span className="stock-badge stock-out">
                  <FiXCircle /> Out of Stock in Showroom
                </span>
              ) : isProductLowStock ? (
                <span className="stock-badge stock-low">
                  <FiAlertCircle /> Only {product.totalStock} Pairs Left in Store
                </span>
              ) : (
                <span className="stock-badge stock-in">
                  <FiCheckCircle /> Available in Store ({product.totalStock} units)
                </span>
              )}
            </div>
          </div>

          {/* Thumbnails list */}
          {product.images && product.images.length > 1 && (
            <div className="thumbnails-row">
              {product.images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`thumbnail-btn ${activeImage === imgUrl ? 'active' : ''}`}
                  onClick={() => setActiveImage(imgUrl)}
                >
                  <img src={imgUrl} alt={`${product.name} view ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}

          {/* Showroom Visit Assurance Card */}
          <div className="showroom-assurance-box">
            <h4>Showroom Trial Guarantee</h4>
            <ul>
              <li><FiCheckCircle className="icon" /> 100% genuine product with authorized manufacturer bill</li>
              <li><FiCheckCircle className="icon" /> Trial both left and right shoes for real fit and walk test</li>
              <li><FiCheckCircle className="icon" /> Professional foot measurement assistance</li>
              <li><FiCheckCircle className="icon" /> Instant billing - take your shoes home today</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Product Info & In-Store Purchase Direction */}
        <div className="details-info-column">
          <div className="brand-and-sku">
            <Link to={`/shoes?brand=${encodeURIComponent(product.brandName)}`} className="product-brand-link">
              {product.brandName}
            </Link>
            <span className="sku-tag">SKU: {product.sku}</span>
          </div>

          <h1 className="product-heading">{product.name}</h1>

          {/* Pricing */}
          <div className="product-price-box">
            <span className="price-tag">₹{product.sellingPrice.toLocaleString('en-IN')}</span>
            {product.originalPrice && product.originalPrice > product.sellingPrice && (
              <>
                <span className="orig-price">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                <span className="save-badge">
                  Save ₹{(product.originalPrice - product.sellingPrice).toLocaleString('en-IN')} (
                  {Math.round(((product.originalPrice - product.sellingPrice) / product.originalPrice) * 100)}% OFF)
                </span>
              </>
            )}
            <span className="tax-inclusive">Inclusive of all physical store taxes</span>
          </div>

          {/* Product Specifications Badges */}
          <div className="spec-chips">
            <span className="chip">Department: <strong>{product.gender}</strong></span>
            <span className="chip">Category: <strong>{product.categoryName}</strong></span>
            {product.subcategory && <span className="chip">Style: <strong>{product.subcategory}</strong></span>}
            <span className="chip">Occasion: <strong>{product.occasion}</strong></span>
          </div>

          {/* 1. Color Selection */}
          {allColors.length > 0 && (
            <div className="selection-section">
              <div className="selection-label-row">
                <span className="sel-label">Available Colorways:</span>
                <span className="sel-value">{selectedColor}</span>
              </div>
              <div className="color-options-row">
                {allColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`color-pill ${selectedColor === color ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedColor(color);
                      // Update selected size to first variant in this color
                      const matching = (product.variants || []).filter((v) => v.color === color);
                      if (matching.length > 0) setSelectedSize(matching[0].size);
                    }}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Size & Real Live Stock Availability Breakdown */}
          <div className="selection-section">
            <div className="selection-label-row">
              <span className="sel-label">Select Size & Check Store Stock:</span>
              <span className="size-guide-hint">Try in store for exact fit</span>
            </div>

            <div className="sizes-stock-matrix">
              {variantsForSelectedColor.map((v) => {
                const isSelected = selectedSize === v.size;
                const isVariantOutOfStock = v.quantity === 0;
                const isVariantLowStock = v.quantity > 0 && v.quantity <= 2;

                return (
                  <button
                    key={v._id || `${v.color}-${v.size}`}
                    type="button"
                    className={`size-box ${isSelected ? 'selected' : ''} ${isVariantOutOfStock ? 'out-of-stock-box' : ''}`}
                    onClick={() => setSelectedSize(v.size)}
                  >
                    <span className="size-title">{v.size}</span>
                    <span className="size-status">
                      {isVariantOutOfStock ? (
                        'Out of Stock'
                      ) : isVariantLowStock ? (
                        `${v.quantity} Left`
                      ) : (
                        'In Stock'
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Current Variant Stock Notice */}
            <div className="current-stock-feedback">
              {currentVariant ? (
                currentVariantQty > 0 ? (
                  <div className="feedback-in-stock">
                    <FiCheckCircle className="fb-icon" />
                    <div>
                      <strong>Size {selectedSize} ({selectedColor}) is IN STOCK:</strong>
                      <span> {currentVariantQty} pair(s) currently available on showroom racks.</span>
                    </div>
                  </div>
                ) : (
                  <div className="feedback-out-of-stock">
                    <FiXCircle className="fb-icon" />
                    <div>
                      <strong>Size {selectedSize} ({selectedColor}) is OUT OF STOCK:</strong>
                      <span> We are currently out of this size. Other sizes may still be available.</span>
                    </div>
                  </div>
                )
              ) : (
                <div className="feedback-hint">
                  Please tap a size above to inspect exact showroom pairs.
                </div>
              )}
            </div>
          </div>

          {/* Physical Store Call-to-Action Message (Crucial Requirement: NO Add to Cart or Online Payment) */}
          <div className="physical-purchase-banner">
            <div className="banner-header">
              <span className="notice-icon">📍</span>
              <div>
                <h3>Visit Our Physical Store to Purchase</h3>
                <p>
                  This shoe is available for trial and direct purchase at our showroom. We do not sell online or accept home deliveries to ensure 100% fitting accuracy.
                </p>
              </div>
            </div>

            <div className="store-quick-details">
              <p><FiMapPin /> {storeSettings.shopName || 'STEP HOUSE'}: {storeSettings.address}, {storeSettings.city}</p>
              <p><FiClock /> Open Today: {storeSettings.openingTime} - {storeSettings.closingTime}</p>
              <p><FiPhone /> Call for Hold/Inquiry: <a href={`tel:${storeSettings.contactNumber}`}>{storeSettings.contactNumber}</a></p>
            </div>

            <div className="purchase-actions-row">
              <a
                href={storeSettings.googleMapsLocationUrl || '#store-location'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-directions btn-lg btn-block-mobile"
              >
                <FiNavigation /> Get Google Maps Directions
              </a>

              <a
                href={`tel:${storeSettings.contactNumber}`}
                className="btn btn-outline btn-lg btn-block-mobile"
              >
                <FiPhone /> Call Store to Hold
              </a>

              <button
                type="button"
                className="btn btn-outline share-btn"
                onClick={handleShare}
                title="Share shoe link"
              >
                <FiShare2 /> {copied ? 'Copied!' : 'Share'}
              </button>
            </div>
          </div>

          {/* Product Description */}
          <div className="product-description-wrap">
            <h3>Product Overview</h3>
            <p className="description-text">{product.description}</p>
          </div>
        </div>
      </div>

      {/* Related Shoes Section */}
      {relatedProducts.length > 0 && (
        <section className="related-shoes-section container">
          <div className="section-header">
            <span className="section-tag">Similar Styles</span>
            <h2 className="section-title">You Might Also Like</h2>
          </div>
          <div className="products-grid">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel._id} product={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetails;
