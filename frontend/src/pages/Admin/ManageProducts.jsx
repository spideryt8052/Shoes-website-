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
  FiClock,
  FiX,
  FiCheckCircle,
} from 'react-icons/fi';
import api from '../../services/api';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import './ManageProducts.css';

const ManageProducts = () => {
  const { brands, categories } = useStore();
  const { admin: currentAdmin } = useAuth();

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

  // Role detection
  const isMasterUser = (u) => {
    if (!u) return false;
    return (
      u.isMaster === true ||
      u.role === 'developer' ||
      ['yaseenbrp25@gmail.com', 'yaseen@newmbshoes.com'].includes(u.email?.toLowerCase())
    );
  };

  const isDeveloper = isMasterUser(currentAdmin);
  const isAdmin = currentAdmin?.role === 'admin' || isDeveloper;
  const isStaff = !isAdmin;

  // Staff Removal Request Modal & Quota
  const [dailyStatus, setDailyStatus] = useState({ requestsToday: 0, maxDaily: 5, remainingToday: 5 });
  const [removalModal, setRemovalModal] = useState({
    open: false,
    productId: null,
    productName: '',
    productSku: '',
    productImage: '',
    reason: '',
    submitting: false,
  });

  const fetchDailyStatus = useCallback(async () => {
    try {
      const res = await api.get('/removal-requests/daily-status');
      if (res.data.success) {
        setDailyStatus(res.data);
      }
    } catch (err) {
      // silent
    }
  }, []);

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
    if (isStaff) {
      fetchDailyStatus();
    }
  }, [fetchProducts, isStaff, fetchDailyStatus]);

  // Admin / Developer direct permanent delete
  const handleAdminDirectDelete = async (id, name) => {
    if (
      window.confirm(
        `Are you sure you want to permanently delete "${name}" from store records? This action cannot be undone.`
      )
    ) {
      try {
        const res = await api.delete(`/products/${id}`);
        if (res.data.success) {
          setActionMessage({
            type: 'success',
            text: `Product "${name}" was deleted successfully.`,
          });
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

  // Click on delete button in table
  const handleDeleteBtnClick = (product) => {
    if (isStaff) {
      // Staff must submit a removal request (max 5 per day)
      setRemovalModal({
        open: true,
        productId: product._id,
        productName: product.name,
        productSku: product.sku,
        productImage: product.primaryImage || (product.images && product.images[0]) || '',
        reason: 'Out of stock / Damaged shoe model',
        submitting: false,
      });
    } else {
      handleAdminDirectDelete(product._id, product.name);
    }
  };

  // Staff submits removal request
  const handleStaffSubmitRemoval = async (e) => {
    e.preventDefault();
    if (!removalModal.reason.trim()) {
      alert('Kripya item remove karne ka reason likhein.');
      return;
    }

    try {
      setRemovalModal((prev) => ({ ...prev, submitting: true }));
      const res = await api.post('/removal-requests', {
        itemType: 'product',
        productId: removalModal.productId,
        reason: removalModal.reason.trim(),
      });

      if (res.data.success) {
        setActionMessage({
          type: 'success',
          text: `✅ Removal request for "${removalModal.productName}" bhej di gayi hai! Admin ya Developer ke approve karte hi remove ho jayega. (Aaj bachi requests: ${res.data.remainingToday} / 5)`,
        });
        setRemovalModal({
          open: false,
          productId: null,
          productName: '',
          productSku: '',
          productImage: '',
          reason: '',
          submitting: false,
        });
        fetchDailyStatus();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting removal request');
      setRemovalModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  return (
    <div className="manage-products-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="admin-page-heading">Manage Footwear Inventory</h1>
          <p className="admin-page-subtext">
            Add new shoes, update prices, variant sizes, or request removal of discontinued models.
          </p>
        </div>
        <Link to="/admin/add-product" className="btn btn-primary">
          <FiPlus /> Add New Shoe Model
        </Link>
      </div>

      {/* Staff Daily Quota Notice */}
      {isStaff && (
        <div
          style={{
            background: dailyStatus.remainingToday > 0 ? '#f0fdf4' : '#fef2f2',
            border: `1.5px solid ${dailyStatus.remainingToday > 0 ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '10px',
            padding: '12px 18px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiClock style={{ color: dailyStatus.remainingToday > 0 ? '#16a34a' : '#dc2626', fontSize: '1.2rem' }} />
            <div style={{ fontSize: '0.88rem', color: '#1e293b' }}>
              <strong>Staff Removal Quota:</strong> Ek din me maximum 5 item remove karne ki request bhej sakte hain.
              Remaining: <strong>{dailyStatus.remainingToday} / {dailyStatus.maxDaily}</strong>
            </div>
          </div>

          <Link
            to="/admin/removal-requests"
            className="btn btn-sm btn-outline"
            style={{ fontSize: '0.8rem', padding: '4px 10px' }}
          >
            Track My Removal Requests
          </Link>
        </div>
      )}

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
              <option key={b._id} value={b.name}>
                {b.name}
              </option>
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
              <option key={c._id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Stock Status</option>
            <option value="inStock">In Stock Only</option>
            <option value="outOfStock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="admin-table-container">
        {loading ? (
          <div className="admin-loading-state">
            <div className="spinner"></div>
            <p>Loading footwear inventory catalog...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="admin-empty-state">
            <FiLayers size={48} />
            <h3>No Shoe Models Found</h3>
            <p>Try clearing your search query or add a brand new shoe model to your inventory.</p>
            <Link to="/admin/add-product" className="btn btn-primary">
              <FiPlus /> Add First Shoe Model
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>Brand & Category</th>
                  <th>SKU Code</th>
                  <th>Selling Price</th>
                  <th>Stock Levels</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const stockTotal =
                    p.totalStock !== undefined
                      ? p.totalStock
                      : p.variants?.reduce((acc, v) => acc + (v.quantity || 0), 0) || 0;

                  return (
                    <tr key={p._id}>
                      {/* Product Thumbnail & Name */}
                      <td>
                        <div className="table-product-cell">
                          <img
                            src={p.primaryImage || (p.images && p.images[0]) || '/placeholder.png'}
                            alt={p.name}
                            className="table-thumb"
                            onError={(e) => {
                              e.target.src =
                                'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=60';
                            }}
                          />
                          <div>
                            <span className="product-title-bold">{p.name}</span>
                            <span className="product-subtitle-mini">
                              {p.gender} • {p.variants?.length || 0} Size Variant(s)
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Brand & Category */}
                      <td>
                        <div>
                          <span className="brand-tag-mini">{p.brandName}</span>
                          <span className="category-text-mini">{p.categoryName}</span>
                        </div>
                      </td>

                      {/* SKU */}
                      <td>
                        <code className="sku-badge">{p.sku}</code>
                      </td>

                      {/* Pricing */}
                      <td>
                        <div className="pricing-cell">
                          <span className="current-price">₹{p.sellingPrice?.toLocaleString('en-IN')}</span>
                          {p.originalPrice > p.sellingPrice && (
                            <span className="mrp-strikethrough">₹{p.originalPrice?.toLocaleString('en-IN')}</span>
                          )}
                        </div>
                      </td>

                      {/* Stock Variant Counts */}
                      <td>
                        <div className="stock-level-cell">
                          <strong className={stockTotal === 0 ? 'text-red' : stockTotal < 5 ? 'text-amber' : ''}>
                            {stockTotal} Pairs
                          </strong>
                          <span className="variant-preview">
                            {p.variants?.map((v) => `${v.size}(${v.quantity})`).join(', ')}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`stock-badge ${stockTotal > 0 ? 'stock-in' : 'stock-out'}`}>
                          {stockTotal > 0 ? 'Available' : 'Sold Out'}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td>
                        <div className="table-action-btns">
                          <Link
                            to={`/admin/edit-product/${p._id}`}
                            className="icon-action-btn edit"
                            title="Edit Shoe Details & Stock"
                          >
                            <FiEdit />
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
                            onClick={() => handleDeleteBtnClick(p)}
                            title={isStaff ? 'Send Item Removal Request (Staff Quota 5/Day)' : 'Delete Product'}
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

      {/* Staff Removal Request Modal */}
      {removalModal.open && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiTrash2 style={{ color: '#dc2626', fontSize: '1.25rem' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>
                  Item Removal Request
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRemovalModal({ ...removalModal, open: false })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <FiX size={20} />
              </button>
            </div>

            <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
              Staff accounts direct catalog delete nahi kar sakte. Ye request <strong>Admin</strong> aur <strong>Developer</strong> ke approval ke liye jayegi.
            </p>

            {/* Quota reminder */}
            <div
              style={{
                background: dailyStatus.remainingToday > 0 ? '#eff6ff' : '#fef2f2',
                border: `1px solid ${dailyStatus.remainingToday > 0 ? '#bfdbfe' : '#fecaca'}`,
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                fontSize: '0.84rem',
                color: dailyStatus.remainingToday > 0 ? '#1e40af' : '#b91c1c',
                fontWeight: 600,
              }}
            >
              Daily Limit: 5 requests per day • Aaj bachi requests: {dailyStatus.remainingToday} / {dailyStatus.maxDaily}
            </div>

            {/* Selected item details */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: '#f8fafc',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #e2e8f0',
              }}
            >
              {removalModal.productImage ? (
                <img
                  src={removalModal.productImage}
                  alt=""
                  style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }}
                />
              ) : (
                <div style={{ width: '48px', height: '48px', background: '#e2e8f0', borderRadius: '6px' }} />
              )}
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                  {removalModal.productName}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  SKU: <code>{removalModal.productSku}</code>
                </div>
              </div>
            </div>

            <form onSubmit={handleStaffSubmitRemoval}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.88rem' }}>
                  Removal Reason (Item hatane ka karan) *
                </label>
                <select
                  value={removalModal.reason}
                  onChange={(e) => setRemovalModal({ ...removalModal, reason: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    marginBottom: '8px',
                  }}
                >
                  <option value="Out of stock / Damaged shoe model">Out of stock / Damaged shoe model</option>
                  <option value="Discontinued by shoe company / brand">Discontinued by shoe company / brand</option>
                  <option value="Wrong catalog entry / Duplicate model">Wrong catalog entry / Duplicate model</option>
                  <option value="Physical batch returned / Defective pair">Physical batch returned / Defective pair</option>
                  <option value="Other reason (specified below)">Other reason (Type below)</option>
                </select>

                <textarea
                  placeholder="Kripya koi aur detail ya remarks likhein..."
                  value={removalModal.reason}
                  onChange={(e) => setRemovalModal({ ...removalModal, reason: e.target.value })}
                  rows={3}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setRemovalModal({ ...removalModal, open: false })}
                  disabled={removalModal.submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={removalModal.submitting || dailyStatus.remainingToday <= 0}
                  style={{ background: '#dc2626', borderColor: '#dc2626' }}
                >
                  {removalModal.submitting
                    ? 'Submitting...'
                    : dailyStatus.remainingToday <= 0
                    ? 'Daily Limit Reached'
                    : 'Send Removal Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProducts;
