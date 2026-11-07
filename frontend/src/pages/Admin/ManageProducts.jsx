import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiExternalLink,
  FiLayers,
  FiFilter,
  FiAlertCircle,
} from 'react-icons/fi';
import api from '../../services/api';
import { useStore } from '../../context/StoreContext';
import './ManageProducts.css';

const ManageProducts = () => {
  const { brands, categories } = useStore();
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedBrand !== 'All') params.append('brand', selectedBrand);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedStatus === 'inStock') params.append('availability', 'inStock');
      if (selectedStatus === 'outOfStock') params.append('availability', 'outOfStock');
      params.append('page', page);
      params.append('limit', 15);

      const res = await api.get(`/products?${params.toString()}`);
      if (res.data.success) {
        setProducts(res.data.products);
        setTotalProducts(res.data.totalProducts);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      console.error('Error fetching admin products:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedBrand, selectedCategory, selectedStatus, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete "${name}" from store records? This action cannot be undone.`)) {
      try {
        const res = await api.delete(`/products/${id}`);
        if (res.data.success) {
          setActionMessage({ type: 'success', text: `Product "${name}" was deleted successfully.` });
          fetchProducts();
        }
      } catch (err) {
        setActionMessage({
          type: 'error',
          text: err.response?.data?.message || 'Failed to delete product',
        });
      }
    }
  };

  return (
    <div className="manage-products-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="admin-page-heading">Manage Footwear Inventory</h1>
          <p className="admin-page-subtext">
            Add, update, adjust prices, edit variant sizes, or remove products from catalog.
          </p>
        </div>
        <Link to="/admin/add-product" className="btn btn-primary">
          <FiPlus /> Add New Shoe Model
        </Link>
      </div>

      {actionMessage.text && (
        <div className={`action-alert-bar ${actionMessage.type}`}>
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage({ type: '', text: '' })}>×</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="admin-filters-bar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by shoe name, SKU, or style..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="filter-dropdowns">
          <select
            value={selectedBrand}
            onChange={(e) => {
              setSelectedBrand(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">All Brands</option>
            {brands.map((b) => (
              <option key={b._id} value={b.name}>{b.name}</option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c.name}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Stock Statuses</option>
            <option value="inStock">In Stock Only</option>
            <option value="outOfStock">Out of Stock Only</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="admin-table-container">
        {loading ? (
          <div className="admin-loading-state">
            <div className="spinner"></div>
            <p>Retrieving catalog data...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-panel-msg">
            <FiAlertCircle size={32} />
            <p>No products found matching your current search or filter criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Brand</th>
                  <th>Gender & Category</th>
                  <th>Selling Price</th>
                  <th>Stock Matrix</th>
                  <th>Total Units</th>
                  <th>Showroom Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isOutOfStock = p.totalStock === 0 || !p.isAvailable;
                  const isLowStock = !isOutOfStock && p.totalStock <= 2;

                  return (
                    <tr key={p._id}>
                      <td>
                        <div className="table-product-cell">
                          <img
                            src={p.primaryImage || '/placeholder-shoe.jpg'}
                            alt=""
                            className="thumb-mini"
                          />
                          <div>
                            <strong className="cell-name">{p.name}</strong>
                            <span className="cell-sku">SKU: {p.sku}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="brand-tag-mini">{p.brandName}</span>
                      </td>

                      <td>
                        <span className="cat-text">{p.gender} • {p.categoryName}</span>
                      </td>

                      <td>
                        <div className="price-stack">
                          <strong>₹{p.sellingPrice.toLocaleString('en-IN')}</strong>
                          {p.originalPrice && p.originalPrice > p.sellingPrice && (
                            <span className="strike-orig">₹{p.originalPrice.toLocaleString('en-IN')}</span>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="variants-mini-pill-list">
                          {(p.variants || []).slice(0, 4).map((v) => (
                            <span
                              key={v._id || `${v.color}-${v.size}`}
                              className={`v-pill ${v.quantity === 0 ? 'zero' : v.quantity <= 2 ? 'low' : ''}`}
                              title={`${v.color} - Size ${v.size}: ${v.quantity} in stock`}
                            >
                              {v.size}: <strong>{v.quantity}</strong>
                            </span>
                          ))}
                          {(p.variants || []).length > 4 && (
                            <span className="v-more">+{p.variants.length - 4} more</span>
                          )}
                        </div>
                      </td>

                      <td>
                        <strong className={`total-qty-badge ${isOutOfStock ? 'zero' : isLowStock ? 'low' : 'good'}`}>
                          {p.totalStock} pairs
                        </strong>
                      </td>

                      <td>
                        {isOutOfStock ? (
                          <span className="stock-badge stock-out">Out of Stock</span>
                        ) : isLowStock ? (
                          <span className="stock-badge stock-low">Low Stock</span>
                        ) : (
                          <span className="stock-badge stock-in">In Stock</span>
                        )}
                      </td>

                      <td>
                        <div className="table-action-btns">
                          <Link
                            to={`/admin/edit-product/${p._id}`}
                            className="icon-action-btn edit"
                            title="Edit Product & Variants"
                          >
                            <FiEdit />
                          </Link>

                          <Link
                            to={`/admin/inventory?search=${encodeURIComponent(p.sku)}`}
                            className="icon-action-btn stock"
                            title="Quick Stock Adjustments"
                          >
                            <FiLayers />
                          </Link>

                          <Link
                            to={`/shoes/${p.slug || p._id}`}
                            target="_blank"
                            className="icon-action-btn view"
                            title="Preview on Public Website"
                          >
                            <FiExternalLink />
                          </Link>

                          <button
                            type="button"
                            className="icon-action-btn delete"
                            onClick={() => handleDelete(p._id, p.name)}
                            title="Delete Product"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-bar">
          <button
            className="pagination-btn"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Previous
          </button>
          <span className="page-indicator">
            Page {page} of {totalPages} ({totalProducts} shoes)
          </span>
          <button
            className="pagination-btn"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ManageProducts;

