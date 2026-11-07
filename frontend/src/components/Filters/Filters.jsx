import React, { useState } from 'react';
import { FiFilter, FiX, FiCheck, FiRotateCcw } from 'react-icons/fi';
import { useStore } from '../../context/StoreContext';
import './Filters.css';

const SHOE_SIZES = ['UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11', 'Kids 11', 'Kids 12', 'Kids 13', 'Kids 1', 'Kids 2'];
const POPULAR_COLORS = ['Black', 'White', 'Grey', 'Navy Blue', 'Tan', 'Brown', 'Red', 'Green'];
const OCCASIONS = ['Sports', 'Casual', 'Formal', 'Daily', 'School', 'Outdoor'];

const Filters = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalResults,
}) => {
  const { brands, categories } = useStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleGenderChange = (gender) => {
    onFilterChange('gender', filters.gender === gender ? 'All' : gender);
  };

  const handleBrandToggle = (brandName) => {
    let current = filters.brand ? filters.brand.split(',') : [];
    if (current.includes(brandName)) {
      current = current.filter((b) => b !== brandName);
    } else {
      current.push(brandName);
    }
    onFilterChange('brand', current.length > 0 ? current.join(',') : 'All');
  };

  const handleCategoryToggle = (categoryName) => {
    let current = filters.category ? filters.category.split(',') : [];
    if (current.includes(categoryName)) {
      current = current.filter((c) => c !== categoryName);
    } else {
      current.push(categoryName);
    }
    onFilterChange('category', current.length > 0 ? current.join(',') : 'All');
  };

  const handleSizeToggle = (size) => {
    let current = filters.size ? filters.size.split(',') : [];
    if (current.includes(size)) {
      current = current.filter((s) => s !== size);
    } else {
      current.push(size);
    }
    onFilterChange('size', current.length > 0 ? current.join(',') : 'All');
  };

  const handleColorToggle = (color) => {
    let current = filters.color ? filters.color.split(',') : [];
    if (current.includes(color)) {
      current = current.filter((c) => c !== color);
    } else {
      current.push(color);
    }
    onFilterChange('color', current.length > 0 ? current.join(',') : 'All');
  };

  const activeFilterCount = [
    filters.gender !== 'All' && filters.gender ? 1 : 0,
    filters.brand !== 'All' && filters.brand ? filters.brand.split(',').length : 0,
    filters.category !== 'All' && filters.category ? filters.category.split(',').length : 0,
    filters.size !== 'All' && filters.size ? filters.size.split(',').length : 0,
    filters.color !== 'All' && filters.color ? filters.color.split(',').length : 0,
    filters.occasion !== 'All' && filters.occasion ? 1 : 0,
    filters.availability !== 'all' && filters.availability ? 1 : 0,
    filters.maxPrice ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const selectedBrands = filters.brand && filters.brand !== 'All' ? filters.brand.split(',') : [];
  const selectedCategories = filters.category && filters.category !== 'All' ? filters.category.split(',') : [];
  const selectedSizes = filters.size && filters.size !== 'All' ? filters.size.split(',') : [];
  const selectedColors = filters.color && filters.color !== 'All' ? filters.color.split(',') : [];

  return (
    <>
      {/* Mobile Filter Toggle Trigger */}
      <div className="mobile-filter-bar">
        <button className="btn btn-outline mobile-filter-btn" onClick={() => setIsMobileOpen(true)}>
          <FiFilter /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>
        <span className="results-counter">{totalResults} Shoes Available</span>
      </div>

      {/* Filter Sidebar Container */}
      <aside className={`filters-sidebar ${isMobileOpen ? 'mobile-drawer-open' : ''}`}>
        <div className="filters-header">
          <div className="filters-header-title">
            <FiFilter className="filter-icon" />
            <h3>Filter Products</h3>
            {activeFilterCount > 0 && <span className="active-count-badge">{activeFilterCount}</span>}
          </div>
          <div className="filters-header-actions">
            {activeFilterCount > 0 && (
              <button className="reset-btn" onClick={onResetFilters} title="Reset all filters">
                <FiRotateCcw /> Reset
              </button>
            )}
            <button className="close-mobile-btn" onClick={() => setIsMobileOpen(false)}>
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* 1. Availability Status (Critical for physical store) */}
        <div className="filter-group">
          <h4 className="filter-title">Showroom Stock Status</h4>
          <div className="availability-options">
            <label className="radio-label">
              <input
                type="radio"
                name="availability"
                checked={!filters.availability || filters.availability === 'all'}
                onChange={() => onFilterChange('availability', 'all')}
              />
              <span>All Shoes</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="availability"
                checked={filters.availability === 'inStock'}
                onChange={() => onFilterChange('availability', 'inStock')}
              />
              <span className="stock-highlight in-stock-text">In Stock Only</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="availability"
                checked={filters.availability === 'outOfStock'}
                onChange={() => onFilterChange('availability', 'outOfStock')}
              />
              <span className="out-of-stock-text">Out of Stock Only</span>
            </label>
          </div>
        </div>

        {/* 2. Gender / Department */}
        <div className="filter-group">
          <h4 className="filter-title">Department</h4>
          <div className="pill-group">
            {['All', 'Men', 'Women', 'Kids', 'Unisex'].map((g) => (
              <button
                key={g}
                type="button"
                className={`filter-pill ${(filters.gender || 'All') === g ? 'active' : ''}`}
                onClick={() => handleGenderChange(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Occasion */}
        <div className="filter-group">
          <h4 className="filter-title">Occasion & Use</h4>
          <div className="pill-group">
            {['All', ...OCCASIONS].map((occ) => (
              <button
                key={occ}
                type="button"
                className={`filter-pill ${(filters.occasion || 'All') === occ ? 'active' : ''}`}
                onClick={() => onFilterChange('occasion', filters.occasion === occ ? 'All' : occ)}
              >
                {occ}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Shoe Size Selection */}
        <div className="filter-group">
          <h4 className="filter-title">Available Sizes</h4>
          <div className="sizes-grid">
            {SHOE_SIZES.map((s) => {
              const isSelected = selectedSizes.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  className={`size-filter-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => handleSizeToggle(s)}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Brands (Dynamic from MongoDB) */}
        <div className="filter-group">
          <h4 className="filter-title">Brands</h4>
          <div className="checkbox-scroll-list">
            {brands.map((b) => {
              const isChecked = selectedBrands.includes(b.name);
              return (
                <label key={b._id} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleBrandToggle(b.name)}
                  />
                  <span className="checkbox-name">{b.name}</span>
                  {b.productCount !== undefined && (
                    <span className="item-count">({b.productCount})</span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* 6. Categories */}
        <div className="filter-group">
          <h4 className="filter-title">Footwear Style</h4>
          <div className="checkbox-scroll-list">
            {categories.map((c) => {
              const isChecked = selectedCategories.includes(c.name);
              return (
                <label key={c._id} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleCategoryToggle(c.name)}
                  />
                  <span className="checkbox-name">{c.name}</span>
                  {c.productCount !== undefined && (
                    <span className="item-count">({c.productCount})</span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* 7. Colours */}
        <div className="filter-group">
          <h4 className="filter-title">Colours</h4>
          <div className="pill-group">
            {POPULAR_COLORS.map((col) => {
              const isSelected = selectedColors.includes(col);
              return (
                <button
                  key={col}
                  type="button"
                  className={`filter-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => handleColorToggle(col)}
                >
                  {col}
                </button>
              );
            })}
          </div>
        </div>

        {/* 8. Price Range */}
        <div className="filter-group">
          <h4 className="filter-title">Price Range</h4>
          <div className="price-inputs">
            <div className="price-field">
              <span>₹</span>
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice || ''}
                onChange={(e) => onFilterChange('minPrice', e.target.value)}
              />
            </div>
            <span className="price-sep">to</span>
            <div className="price-field">
              <span>₹</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice || ''}
                onChange={(e) => onFilterChange('maxPrice', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Mobile Apply Button */}
        <div className="mobile-drawer-footer">
          <button className="btn btn-primary btn-block" onClick={() => setIsMobileOpen(false)}>
            View {totalResults} Results
          </button>
        </div>
      </aside>
    </>
  );
};

export default Filters;

