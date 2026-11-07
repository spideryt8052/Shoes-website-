import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FiLayers,
  FiSearch,
  FiPlus,
  FiMinus,
  FiEdit,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiFilter,
  FiRotateCw,
} from 'react-icons/fi';
import api from '../../services/api';
import { useStore } from '../../context/StoreContext';
import './InventoryManager.css';

const InventoryManager = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const { brands, categories } = useStore();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('all'); // all, lowStock, outOfStock, inStock
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State for custom stock adjustment with remarks
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    productId: '',
    productName: '',
    variantId: '',
    size: '',
    color: '',
    currentQuantity: 0,
    newQuantity: 0,
    changeType: 'Manual Adjustment',
    remarks: '',
  });

  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedBrand !== 'All') params.append('brand', selectedBrand);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      params.append('page', page);
      params.append('limit', 15);

      const res = await api.get(`/inventory?${params.toString()}`);
      if (res.data.success) {
        setProducts(res.data.products);
        setTotalPages(res.data.totalPages);
        setTotalCount(res.data.total);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedBrand, selectedCategory, selectedStatus, page]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Quick increment / decrement
  const handleQuickAdjust = async (product, variant, delta) => {
    const newQty = Math.max(0, variant.quantity + delta);
    const changeType = delta > 0 ? 'Stock In' : 'Stock Out';
    const remarks = delta > 0 ? 'Quick Restock +1 pair' : 'Physical Sale / Store Trial -1 pair';

    try {
      setUpdating(true);
      const res = await api.post('/inventory/update-variant', {
        productId: product._id,
        variantId: variant._id,
        newQuantity: newQty,
        changeType,
        remarks,
      });

      if (res.data.success) {
        setFeedback({
          type: 'success',
          text: `Updated ${product.name} (${variant.color} / Size ${variant.size}) to ${newQty} pairs. Live catalogue updated!`,
        });

        // Update local state smoothly
        setProducts((prev) =>
          prev.map((p) => {
            if (p._id !== product._id) return p;
            const updatedVariants = p.variants.map((v) =>
              v._id === variant._id ? { ...v, quantity: newQty } : v
            );
            const newTotal = updatedVariants.reduce((sum, v) => sum + v.quantity, 0);
            return {
              ...p,
              variants: updatedVariants,
              totalStock: newTotal,
              isAvailable: newTotal > 0,
            };
          })
        );
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Error updating stock',
      });
    } finally {
      setUpdating(false);
    }
  };

  // Open modal for detailed adjustment
  const openAdjustModal = (product, variant) => {
    setModalData({
      productId: product._id,
      productName: product.name,
      variantId: variant._id,
      size: variant.size,
      color: variant.color,
      currentQuantity: variant.quantity,
      newQuantity: variant.quantity,
      changeType: 'Manual Adjustment',
      remarks: '',
    });
    setModalOpen(true);
  };

  // Submit Modal adjustment
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      const res = await api.post('/inventory/update-variant', {
        productId: modalData.productId,
        variantId: modalData.variantId,
        newQuantity: modalData.newQuantity,
        changeType: modalData.changeType,
        remarks: modalData.remarks || `Adjusted stock from ${modalData.currentQuantity} to ${modalData.newQuantity}`,
      });

      if (res.data.success) {
        setFeedback({
          type: 'success',
          text: `Stock successfully adjusted for ${modalData.productName} (${modalData.color} / Size ${modalData.size})!`,
        });
        setModalOpen(false);
        fetchInventory();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Error processing inventory adjustment',
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="inventory-manager-page">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="admin-page-heading">Physical Inventory Management</h1>
          <p className="admin-page-subtext">
            Manage live pairs for every size and colourway. Changes instantly reflect on the customer website.
          </p>
        </div>

        <div className="header-actions-group">
          <button className="btn btn-outline btn-sm" onClick={fetchInventory} disabled={loading}>
            <FiRotateCw /> Refresh Live Stock
          </button>
          <Link to="/admin/stock-history" className="btn btn-outline btn-sm">
            <FiClock /> Stock Audit Log
          </Link>
        </div>
      </div>

      {feedback.text && (
        <div className={`action-alert-bar ${feedback.type}`}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback({ type: '', text: '' })}>×</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="admin-filters-bar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by shoe name, SKU, or colour..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="filter-dropdowns">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Inventory Statuses</option>
            <option value="lowStock">⚠️ Low Stock Alerts (≤2 pairs)</option>
            <option value="outOfStock">❌ Out of Stock (0 pairs)</option>
            <option value="inStock">✓ Sufficient Stock (&gt;2 pairs)</option>
          </select>

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
        </div>
      </div>

      {/* Inventory Products Accordion / List */}
      <div className="inventory-cards-list">
        {loading ? (
          <div className="admin-loading-state">
            <div className="spinner"></div>
            <p>Accessing physical inventory database...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-panel-msg">
            <FiAlertTriangle size={32} />
            <p>No products match the selected inventory filter.</p>
          </div>
        ) : (
          products.map((product) => {
            const isOutOfStock = product.totalStock === 0;
            const isLowStock = !isOutOfStock && product.totalStock <= 2;

            return (
              <div key={product._id} className="inventory-product-card">
                {/* Product Summary Header */}
                <div className="inv-card-header">
                  <div className="inv-prod-info">
                    <img
                      src={product.primaryImage || '/placeholder-shoe.jpg'}
                      alt=""
                      className="inv-thumb"
                    />
                    <div>
                      <h3 className="inv-title">
                        <Link to={`/shoes/${product._id}`} target="_blank">
                          {product.name}
                        </Link>
                      </h3>
                      <div className="inv-meta">
                        <span className="inv-brand">{product.brandName}</span>
                        <span className="inv-sku">SKU: {product.sku}</span>
                        <span className="inv-price">₹{product.sellingPrice.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="inv-total-block">
                    <span className="total-label">Total Showroom Units:</span>
                    <strong className={`total-qty ${isOutOfStock ? 'zero' : isLowStock ? 'low' : 'good'}`}>
                      {product.totalStock} pairs
                    </strong>
                    <span className="total-badge">
                      {isOutOfStock ? (
                        <span className="stock-badge stock-out">Out of Stock</span>
                      ) : isLowStock ? (
                        <span className="stock-badge stock-low">Low Stock</span>
                      ) : (
                        <span className="stock-badge stock-in">In Stock</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Variant Breakdown Matrix */}
                <div className="inv-variants-table-wrap">
                  <table className="inv-variants-table">
                    <thead>
                      <tr>
                        <th>Colourway</th>
                        <th>Shoe Size</th>
                        <th>Current Quantity</th>
                        <th>Status</th>
                        <th>Quick Stock Adjustments</th>
                        <th>Detailed Entry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(product.variants || []).map((v) => {
                        const isZero = v.quantity === 0;
                        const isLow = v.quantity > 0 && v.quantity <= 2;

                        return (
                          <tr key={v._id || `${v.color}-${v.size}`}>
                            <td>
                              <span className="color-badge">{v.color}</span>
                            </td>
                            <td>
                              <strong className="size-bold">{v.size}</strong>
                            </td>
                            <td>
                              <span className={`qty-number ${isZero ? 'zero' : isLow ? 'low' : 'good'}`}>
                                {v.quantity} pair(s)
                              </span>
                            </td>
                            <td>
                              {isZero ? (
                                <span className="stock-badge stock-out">Out of Stock</span>
                              ) : isLow ? (
                                <span className="stock-badge stock-low">Low ({v.quantity})</span>
                              ) : (
                                <span className="stock-badge stock-in">In Stock</span>
                              )}
                            </td>
                            <td>
                              <div className="quick-stepper">
                                <button
                                  type="button"
                                  className="stepper-btn minus"
                                  disabled={v.quantity <= 0 || updating}
                                  onClick={() => handleQuickAdjust(product, v, -1)}
                                  title="Decrease by 1 (Sale/Removal)"
                                >
                                  <FiMinus />
                                </button>
                                <span className="stepper-count">{v.quantity}</span>
                                <button
                                  type="button"
                                  className="stepper-btn plus"
                                  disabled={updating}
                                  onClick={() => handleQuickAdjust(product, v, 1)}
                                  title="Increase by 1 (Restock)"
                                >
                                  <FiPlus />
                                </button>
                              </div>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm custom-adjust-btn"
                                onClick={() => openAdjustModal(product, v)}
                              >
                                <FiEdit /> Set Exact Quantity
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
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
            Page {page} of {totalPages} ({totalCount} models)
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

      {/* Detailed Stock Adjustment Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Adjust Showroom Inventory</h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleModalSubmit} className="modal-form">
              <div className="modal-product-summary">
                <strong>{modalData.productName}</strong>
                <span>Colour: {modalData.color} | Size: {modalData.size}</span>
                <span>Current In-Store: <strong>{modalData.currentQuantity} pairs</strong></span>
              </div>

              <div className="form-group">
                <label>New Inventory Quantity (Pairs) *</label>
                <input
                  type="number"
                  min="0"
                  value={modalData.newQuantity}
                  onChange={(e) =>
                    setModalData({ ...modalData, newQuantity: Math.max(0, parseInt(e.target.value, 10) || 0) })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Change Reason / Type *</label>
                <select
                  value={modalData.changeType}
                  onChange={(e) => setModalData({ ...modalData, changeType: e.target.value })}
                >
                  <option value="Manual Adjustment">Manual Audit / Count Adjustment</option>
                  <option value="Stock In">Stock In (New Warehouse Shipment)</option>
                  <option value="Stock Out">Stock Out (In-Store Customer Purchase)</option>
                  <option value="Damaged / Removed">Damaged / Removed from Rack</option>
                  <option value="Bulk Restock">Bulk Seasonal Restock</option>
                </select>
              </div>

              <div className="form-group">
                <label>Audit Remarks / Invoice Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Received shipment invoice #SH-8849"
                  value={modalData.remarks}
                  onChange={(e) => setModalData({ ...modalData, remarks: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updating}
                >
                  {updating ? 'Recording...' : 'Update & Log Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
