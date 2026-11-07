import React from 'react';
import { Link } from 'react-router-dom';
import { FiCheckCircle, FiAlertCircle, FiXCircle, FiArrowRight } from 'react-icons/fi';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  if (!product) return null;

  const {
    _id,
    name,
    slug,
    brandName,
    categoryName,
    gender,
    sellingPrice,
    originalPrice,
    primaryImage,
    images,
    totalStock = 0,
    isAvailable,
    variants = [],
  } = product;

  // Resolve image source
  const displayImage = primaryImage || (images && images.length > 0 ? images[0] : '/placeholder-shoe.jpg');

  // Compute discount percentage if original price exists
  const discountPercent =
    originalPrice && originalPrice > sellingPrice
      ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
      : null;

  // Identify in-stock sizes and out-of-stock sizes
  const inStockSizes = Array.from(
    new Set(variants.filter((v) => v.quantity > 0).map((v) => v.size))
  );

  const outOfStockSizes = Array.from(
    new Set(
      variants
        .filter((v) => v.quantity === 0)
        .map((v) => v.size)
        .filter((s) => !inStockSizes.includes(s))
    )
  );

  // Determine overall stock badge
  const isOutOfStock = totalStock === 0 || !isAvailable;
  const isLowStock = !isOutOfStock && totalStock <= 2;

  return (
    <div className={`product-card ${isOutOfStock ? 'is-out-of-stock' : ''}`}>
      {/* Product Image & Badges */}
      <div className="product-image-wrap">
        <Link to={`/shoes/${slug || _id}`}>
          <img
            src={displayImage}
            alt={name}
            loading="lazy"
            className="product-thumbnail"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&auto=format&fit=crop&q=80';
            }}
          />
        </Link>

        {/* Status Badges Overlay */}
        <div className="card-top-badges">
          {isOutOfStock ? (
            <span className="stock-badge stock-out">
              <FiXCircle /> Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="stock-badge stock-low">
              <FiAlertCircle /> Only {totalStock} Left
            </span>
          ) : (
            <span className="stock-badge stock-in">
              <FiCheckCircle /> In Stock
            </span>
          )}

          {discountPercent && (
            <span className="discount-tag">-{discountPercent}%</span>
          )}
        </div>

        {/* Gender / Category Pill */}
        <div className="card-bottom-pill">
          <span>{gender} • {categoryName}</span>
        </div>
      </div>

      {/* Product Details */}
      <div className="product-info">
        <span className="product-brand">{brandName}</span>
        <h3 className="product-title">
          <Link to={`/shoes/${slug || _id}`} title={name}>
            {name}
          </Link>
        </h3>

        {/* Price Section */}
        <div className="product-pricing">
          <span className="current-price">₹{sellingPrice.toLocaleString('en-IN')}</span>
          {originalPrice && originalPrice > sellingPrice && (
            <span className="original-price">₹{originalPrice.toLocaleString('en-IN')}</span>
          )}
        </div>

        {/* Size Availability Grid */}
        <div className="size-availability-preview">
          <span className="size-label">Store Sizes:</span>
          <div className="sizes-pill-list">
            {inStockSizes.slice(0, 4).map((s) => (
              <span key={s} className="size-pill in-stock" title={`${s} - In Stock`}>
                {s}
              </span>
            ))}
            {outOfStockSizes.slice(0, 2).map((s) => (
              <span key={s} className="size-pill out-of-stock" title={`${s} - Out of Stock`}>
                {s}
              </span>
            ))}
            {inStockSizes.length > 4 && (
              <span className="size-pill more-sizes">+{inStockSizes.length - 4}</span>
            )}
            {inStockSizes.length === 0 && outOfStockSizes.length === 0 && (
              <span className="no-sizes-hint">Ask in store</span>
            )}
          </div>
        </div>

        {/* Card Footer Button */}
        <Link to={`/shoes/${slug || _id}`} className="card-view-btn">
          <span>Check In-Store Availability</span>
          <FiArrowRight />
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;

