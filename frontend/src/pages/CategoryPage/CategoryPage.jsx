import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { FiSliders, FiArrowDown, FiRotateCcw, FiSearch } from 'react-icons/fi';
import api from '../../services/api';
import ProductCard from '../../components/ProductCard/ProductCard';
import Filters from '../../components/Filters/Filters';
import './CategoryPage.css';

const CategoryPage = () => {
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Parse state from URL params
  const initialSearch = searchParams.get('search') || '';
  const initialBrand = searchParams.get('brand') || 'All';
  const initialCategory = searchParams.get('category') || 'All';
  const initialAvailability = searchParams.get('availability') || 'all';
  const initialSort = searchParams.get('sort') || 'newest';

  // Determine gender/category based on route
  const getRouteCategory = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/category/men')) return { gender: 'Men', title: "Men's Footwear Catalogue", desc: "Explore running, sneakers, loafers, formal shoes, and sandals for men." };
    if (path.includes('/category/women')) return { gender: 'Women', title: "Women's Footwear Catalogue", desc: "Discover memory foam sneakers, comfort flats, heels, and casual wear for women." };
    if (path.includes('/category/kids')) return { gender: 'Kids', title: "Kids Footwear & School Shoes", desc: "Durable school uniform shoes, kids sneakers, and play sandals." };
    if (path.includes('/category/sports')) return { occasion: 'Sports', title: "Sports & Running Footwear", desc: "High performance running, gym training, and court sports shoes." };
    if (path.includes('/category/casual')) return { occasion: 'Casual', title: "Casual Shoes & Sneakers", desc: "Everyday lifestyle sneakers, slip-ons, and comfortable walking shoes." };
    if (path.includes('/category/formal')) return { occasion: 'Formal', title: "Formal & Dress Footwear", desc: "Handcrafted genuine leather oxfords, derbys, monk straps, and dress heels." };
    return { title: 'Complete Footwear Catalogue', desc: 'Browse our complete physical showroom inventory across all sizes and brands.' };
  };

  const routeInfo = getRouteCategory();

  const [filters, setFilters] = useState({
    search: initialSearch,
    gender: routeInfo.gender || 'All',
    brand: initialBrand,
    category: initialCategory,
    subcategory: 'All',
    occasion: routeInfo.occasion || 'All',
    minPrice: '',
    maxPrice: '',
    size: 'All',
    color: 'All',
    availability: initialAvailability,
    sort: initialSort,
    page: 1,
  });

  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Sync route changes
  useEffect(() => {
    const newRoute = getRouteCategory();
    setFilters((prev) => ({
      ...prev,
      gender: newRoute.gender || 'All',
      occasion: newRoute.occasion || 'All',
      search: searchParams.get('search') || '',
      brand: searchParams.get('brand') || 'All',
      category: searchParams.get('category') || 'All',
      availability: searchParams.get('availability') || 'all',
      page: 1,
    }));
  }, [location.pathname, searchParams]);

  // Fetch filtered products from backend API
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.gender && filters.gender !== 'All') params.append('gender', filters.gender);
      if (filters.brand && filters.brand !== 'All') params.append('brand', filters.brand);
      if (filters.category && filters.category !== 'All') params.append('category', filters.category);
      if (filters.occasion && filters.occasion !== 'All') params.append('occasion', filters.occasion);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.size && filters.size !== 'All') params.append('size', filters.size);
      if (filters.color && filters.color !== 'All') params.append('color', filters.color);
      if (filters.availability && filters.availability !== 'all') params.append('availability', filters.availability);
      if (filters.sort) params.append('sort', filters.sort);
      params.append('page', filters.page);
      params.append('limit', 12);

      const res = await api.get(`/products?${params.toString()}`);
      if (res.data.success) {
        setProducts(res.data.products);
        setTotalProducts(res.data.totalProducts);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      console.error('Error fetching catalog products:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // reset to page 1 on filter modification
    }));
  };

  const handleResetFilters = () => {
    const route = getRouteCategory();
    setFilters({
      search: '',
      gender: route.gender || 'All',
      brand: 'All',
      category: 'All',
      subcategory: 'All',
      occasion: route.occasion || 'All',
      minPrice: '',
      maxPrice: '',
      size: 'All',
      color: 'All',
      availability: 'all',
      sort: 'newest',
      page: 1,
    });
    setSearchParams({});
  };

  return (
    <div className="category-page">
      {/* Page Title & Breadcrumb Header */}
      <section className="catalog-header-bar">
        <div className="container">
          <h1 className="catalog-page-title">{routeInfo.title}</h1>
          <p className="catalog-page-desc">{routeInfo.desc}</p>
        </div>
      </section>

      <div className="container catalog-layout">
        {/* Left Filter Sidebar */}
        <div className="catalog-sidebar-col">
          <Filters
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            totalResults={totalProducts}
          />
        </div>

        {/* Right Product Grid Area */}
        <main className="catalog-content-col">
          {/* Top Control Bar: Total count + Active Search + Sorting dropdown */}
          <div className="catalog-controls-bar">
            <div className="controls-left">
              <span className="results-count">
                Showing <strong>{products.length}</strong> of <strong>{totalProducts}</strong> shoes in showroom
              </span>
              {filters.search && (
                <span className="search-query-tag">
                  Query: "{filters.search}"
                  <button onClick={() => handleFilterChange('search', '')}>×</button>
                </span>
              )}
            </div>

            <div className="controls-right">
              <label htmlFor="sort-select" className="sort-label">Sort by:</label>
              <select
                id="sort-select"
                className="sort-dropdown"
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
              >
                <option value="newest">Newest Arrivals</option>
                <option value="popular">Popular Favorites</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Alphabetical (A - Z)</option>
              </select>
            </div>
          </div>

          {/* Active Filter Pills Bar */}
          {(filters.brand !== 'All' || filters.category !== 'All' || filters.size !== 'All' || filters.color !== 'All' || filters.availability !== 'all') && (
            <div className="active-pills-bar">
              <span className="pills-label">Active Filters:</span>
              {filters.availability !== 'all' && (
                <span className="active-pill">
                  {filters.availability === 'inStock' ? 'In Stock Only' : 'Out of Stock Only'}
                  <button onClick={() => handleFilterChange('availability', 'all')}>×</button>
                </span>
              )}
              {filters.brand !== 'All' && filters.brand.split(',').map((b) => (
                <span key={b} className="active-pill">
                  {b}
                  <button onClick={() => {
                    const remaining = filters.brand.split(',').filter(x => x !== b);
                    handleFilterChange('brand', remaining.length ? remaining.join(',') : 'All');
                  }}>×</button>
                </span>
              ))}
              {filters.category !== 'All' && filters.category.split(',').map((c) => (
                <span key={c} className="active-pill">
                  {c}
                  <button onClick={() => {
                    const remaining = filters.category.split(',').filter(x => x !== c);
                    handleFilterChange('category', remaining.length ? remaining.join(',') : 'All');
                  }}>×</button>
                </span>
              ))}
              {filters.size !== 'All' && filters.size.split(',').map((s) => (
                <span key={s} className="active-pill">
                  Size: {s}
                  <button onClick={() => {
                    const remaining = filters.size.split(',').filter(x => x !== s);
                    handleFilterChange('size', remaining.length ? remaining.join(',') : 'All');
                  }}>×</button>
                </span>
              ))}
              <button className="clear-all-link" onClick={handleResetFilters}>
                Clear All
              </button>
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Scanning showroom inventory database...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <h3>No Shoes Found Matching Criteria</h3>
              <p>
                We could not find any shoes matching your selected filters. Try broadening your size, brand, or price selections.
              </p>
              <button className="btn btn-primary" onClick={handleResetFilters}>
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="catalog-products-grid">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination-bar">
                  <button
                    className="pagination-btn"
                    disabled={filters.page <= 1}
                    onClick={() => handleFilterChange('page', filters.page - 1)}
                  >
                    Previous
                  </button>

                  <div className="pagination-pages">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        className={`page-num ${filters.page === i + 1 ? 'active' : ''}`}
                        onClick={() => handleFilterChange('page', i + 1)}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    className="pagination-btn"
                    disabled={filters.page >= totalPages}
                    onClick={() => handleFilterChange('page', filters.page + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default CategoryPage;

