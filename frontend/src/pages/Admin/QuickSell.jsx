import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiZap,
  FiSearch,
  FiCheckCircle,
  FiAlertCircle,
  FiShoppingBag,
  FiArrowRight,
  FiClock,
  FiDollarSign,
  FiUser,
  FiPhone,
  FiFileText,
  FiPrinter,
  FiX,
} from 'react-icons/fi';
import api from '../../services/api';
import { useStore } from '../../context/StoreContext';
import './QuickSell.css';

const QuickSell = () => {
  const { storeSettings } = useStore();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Selected item state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [sellingPrice, setSellingPrice] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI / QR');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [remarks, setRemarks] = useState('');

  // Receipt modal state
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // Submit and feedback states
  const [submitting, setSubmitting] = useState(false);
  const [saleResult, setSaleResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Today's recent sales feed
  const [recentSales, setRecentSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(false);

  // Fetch all active products
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await api.get('/products?limit=100');
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error('Error fetching products for POS:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch recent sales for today
  const fetchRecentSales = async () => {
    try {
      setLoadingSales(true);
      const res = await api.get('/sales?period=today&limit=8');
      if (res.data.success) {
        setRecentSales(res.data.sales);
      }
    } catch (err) {
      console.error('Error fetching today sales:', err);
    } finally {
      setLoadingSales(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchRecentSales();
  }, []);

  // Filter products for search autocomplete
  const filteredProducts = products.filter((p) => {
    if (!searchTerm.trim()) return false;
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.brandName && p.brandName.toLowerCase().includes(term)) ||
      (p.sku && p.sku.toLowerCase().includes(term))
    );
  });

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setSearchTerm('');
    setDropdownOpen(false);
    setSellingPrice(product.sellingPrice);
    setDiscount(0);
    setQuantity(1);
    setErrorMessage('');
    setSaleResult(null);

    // Auto-select first in-stock variant if available
    const firstInStock = product.variants.find((v) => v.quantity > 0);
    setSelectedVariant(firstInStock || (product.variants.length > 0 ? product.variants[0] : null));
  };

  const handleSelectVariant = (variant) => {
    if (variant.quantity <= 0) return;
    setSelectedVariant(variant);
    setQuantity(1);
    setErrorMessage('');
  };

  // Calculate live total
  const unitPrice = Number(sellingPrice) || 0;
  const parsedQty = Math.max(1, Number(quantity) || 1);
  const parsedDiscount = Math.max(0, Number(discount) || 0);
  const totalAmount = Math.max(0, unitPrice * parsedQty - parsedDiscount);

  const handleSubmitSale = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSaleResult(null);

    if (!selectedProduct) {
      setErrorMessage('Please search and select a shoe model first.');
      return;
    }

    if (!selectedVariant) {
      setErrorMessage('Please select an available size.');
      return;
    }

    if (selectedVariant.quantity < parsedQty) {
      setErrorMessage(
        `Only ${selectedVariant.quantity} pair(s) in store for Size ${selectedVariant.size}. Cannot sell ${parsedQty}.`
      );
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        productId: selectedProduct._id,
        variantId: selectedVariant._id,
        quantity: parsedQty,
        sellingPrice: unitPrice,
        discount: parsedDiscount,
        paymentMethod,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim(),
        remarks: remarks.trim(),
      };

      const res = await api.post('/sales', payload);
      if (res.data.success) {
        setSaleResult(res.data);

        // Update local variant stock immediately
        const newRem = res.data.remainingVariantStock;
        setSelectedVariant((prev) => (prev ? { ...prev, quantity: newRem } : null));

        // Update product in list so subsequent clicks reflect new stock
        setProducts((prev) =>
          prev.map((p) => {
            if (p._id === selectedProduct._id) {
              const updatedVariants = p.variants.map((v) =>
                v._id === selectedVariant._id ? { ...v, quantity: newRem } : v
              );
              return {
                ...p,
                variants: updatedVariants,
                totalStock: res.data.totalProductStock,
                isAvailable: res.data.isAvailable,
              };
            }
            return p;
          })
        );

        // Refresh recent sales
        fetchRecentSales();

        // Reset inputs
        setQuantity(1);
        setDiscount(0);
        setCustomerName('');
        setCustomerPhone('');
        setRemarks('');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error recording in-store sale');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="quick-sell-container">
      {/* Top Banner / Title */}
      <div className="admin-page-header">
        <div>
          <h2>⚡ Real-Time In-Store Quick Sell (Counter POS)</h2>
          <p className="admin-page-subtitle">
            Instantly record shoe sales at the cash counter. In-store inventory reduces in real-time,
            and the live website updates out-of-stock sizes instantly.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/admin/sales-ledger" className="btn btn-outline">
            <FiFileText /> View Sales Ledger & Google Sheets
          </Link>
        </div>
      </div>

      {/* Success Notification */}
      {saleResult && (
        <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiCheckCircle size={22} color="#16a34a" />
            <div>
              <strong>In-Store Sale Confirmed! (Invoice #{saleResult.sale.invoiceNumber})</strong>
              <div style={{ fontSize: '0.88rem', marginTop: '2px' }}>
                {saleResult.message} Website stock updated in real time.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => {
                setReceiptData(saleResult.sale);
                setShowReceiptModal(true);
              }}
            >
              <FiPrinter /> Print Receipt Slip
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => setSaleResult(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiAlertCircle size={22} color="#dc2626" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="pos-grid-layout">
        {/* Left Column: POS Form */}
        <div className="pos-card">
          <h3 className="pos-section-title">
            <FiShoppingBag /> Step 1: Select Shoe from Showroom Catalogue
          </h3>

          {/* Autocomplete Search Input */}
          <div className="shoe-search-wrapper">
            <FiSearch className="search-icon-pos" size={18} />
            <input
              type="text"
              className="shoe-search-input"
              placeholder="Search shoe name, brand (e.g. Nike, Campus, Adidas) or SKU..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
            />

            {dropdownOpen && filteredProducts.length > 0 && (
              <div className="shoe-dropdown-results">
                {filteredProducts.map((p) => (
                  <div
                    key={p._id}
                    className="shoe-dropdown-item"
                    onClick={() => handleSelectProduct(p)}
                  >
                    <img
                      src={p.primaryImage || '/placeholder-shoe.jpg'}
                      alt={p.name}
                      className="dropdown-shoe-thumb"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100';
                      }}
                    />
                    <div className="dropdown-shoe-info">
                      <div className="dropdown-shoe-name">{p.name}</div>
                      <div className="dropdown-shoe-meta">
                        <span>{p.brandName}</span>
                        <span>•</span>
                        <span>₹{p.sellingPrice.toLocaleString('en-IN')}</span>
                        <span>•</span>
                        <span style={{ color: p.totalStock > 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                          {p.totalStock > 0 ? `${p.totalStock} pairs left` : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Selected Shoe Card */}
          {selectedProduct ? (
            <div>
              <div className="selected-shoe-banner">
                <img
                  src={selectedProduct.primaryImage || '/placeholder-shoe.jpg'}
                  alt={selectedProduct.name}
                  className="selected-shoe-img"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150';
                  }}
                />
                <div className="selected-shoe-details">
                  <div className="selected-shoe-brand">{selectedProduct.brandName}</div>
                  <h4 className="selected-shoe-title">{selectedProduct.name}</h4>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={`selected-shoe-stock-pill ${selectedProduct.totalStock === 0 ? 'out' : selectedProduct.totalStock <= 2 ? 'low' : ''}`}>
                      {selectedProduct.totalStock > 0 ? `Total Store Stock: ${selectedProduct.totalStock} Pairs` : 'Sold Out In Store'}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      SKU: {selectedProduct.sku}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 2: Select Size & Color Variant */}
              <h3 className="pos-section-title">
                <FiZap /> Step 2: Select Size Sold (Real-Time In-Store Stock)
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Tap the exact size customer purchased. Stock will reduce automatically.
              </p>

              <div className="variant-selector-grid">
                {selectedProduct.variants && selectedProduct.variants.length > 0 ? (
                  selectedProduct.variants.map((v) => {
                    const isSelected = selectedVariant && selectedVariant._id === v._id;
                    const isOutOfStock = v.quantity <= 0;
                    return (
                      <button
                        key={v._id}
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => handleSelectVariant(v)}
                        className={`variant-pos-btn ${isSelected ? 'selected' : ''}`}
                      >
                        <span className="variant-pos-size">Size {v.size}</span>
                        <span className="variant-pos-color">{v.color}</span>
                        <span className={`variant-pos-stock ${isOutOfStock ? 'out' : ''}`}>
                          {isOutOfStock ? 'Sold Out' : `${v.quantity} pair${v.quantity > 1 ? 's' : ''}`}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>No size variants found for this shoe.</p>
                )}
              </div>

              {/* Step 3: Billing & Payment */}
              <form onSubmit={handleSubmitSale}>
                <h3 className="pos-section-title" style={{ marginTop: '20px' }}>
                  <FiDollarSign /> Step 3: Price, Quantity & Payment Mode
                </h3>

                <div className="form-grid-3" style={{ marginBottom: '16px' }}>
                  <div className="form-group">
                    <label>Quantity Sold *</label>
                    <input
                      type="number"
                      min="1"
                      max={selectedVariant ? selectedVariant.quantity : 1}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                    />
                    <span className="field-hint">
                      Max available: {selectedVariant ? selectedVariant.quantity : 0}
                    </span>
                  </div>

                  <div className="form-group">
                    <label>Selling Price (₹ / pair) *</label>
                    <input
                      type="number"
                      min="0"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>In-Store Discount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="form-group">
                  <label>Payment Method *</label>
                  <div className="payment-mode-grid">
                    {['UPI / QR', 'Cash', 'Card (POS)', 'Khata / Credit'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={`payment-mode-btn ${paymentMethod === mode ? 'active' : ''}`}
                        onClick={() => setPaymentMethod(mode)}
                      >
                        {mode === 'UPI / QR' && '📱'}
                        {mode === 'Cash' && '💵'}
                        {mode === 'Card (POS)' && '💳'}
                        {mode === 'Khata / Credit' && '📒'}
                        <span>{mode}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Customer Details (Optional) */}
                <div className="form-grid-2" style={{ marginBottom: '16px' }}>
                  <div className="form-group">
                    <label>Customer Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="Walk-in Customer"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Customer Mobile No. (Optional)</label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                </div>

                {/* Live Amount Box */}
                <div className="pos-total-box">
                  <div>
                    <div className="pos-total-label">Total Payable Amount</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {parsedQty} Pair(s) × ₹{unitPrice.toLocaleString('en-IN')}
                      {parsedDiscount > 0 ? ` - ₹${parsedDiscount} Discount` : ''}
                    </div>
                  </div>
                  <div className="pos-total-amount">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !selectedVariant || selectedVariant.quantity <= 0}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '1.05rem', fontWeight: 700 }}
                >
                  {submitting ? 'Recording Sale & Updating Stock...' : '✓ RECORD IN-STORE SALE (MARK SOLD)'}
                </button>
              </form>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>👟</div>
              <h4>No Shoe Selected Yet</h4>
              <p>Type shoe name or brand in the search box above to begin recording a sale.</p>
            </div>
          )}
        </div>

        {/* Right Column: Live Feed of Today's Sales */}
        <div className="pos-card">
          <h3 className="pos-section-title">
            <FiClock /> Today's In-Store Sales Feed
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Live record of shoes sold at the showroom counter today.
          </p>

          {loadingSales ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading sales...</p>
          ) : recentSales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
              <p>No sales recorded yet today.</p>
              <span style={{ fontSize: '0.8rem' }}>Any shoes sold will appear here instantly.</span>
            </div>
          ) : (
            <div className="recent-sales-list">
              {recentSales.map((sale) => (
                <div key={sale._id} className="recent-sale-item">
                  <div className="recent-sale-header">
                    <span>#{sale.invoiceNumber}</span>
                    <span>{new Date(sale.saleDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="recent-sale-shoe">{sale.productName}</div>
                  <div className="recent-sale-meta">
                    <span>
                      Size {sale.size} ({sale.color}) × {sale.quantity}
                    </span>
                    <span className="recent-sale-amount">₹{sale.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <span>Mode: {sale.paymentMethod}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                        title="Print Slip"
                        onClick={() => {
                          setReceiptData(sale);
                          setShowReceiptModal(true);
                        }}
                      >
                        <FiPrinter size={12} /> Slip
                      </button>
                      {sale.syncedToGoogleSheet ? (
                        <span style={{ color: '#16a34a' }}>✓ Synced</span>
                      ) : (
                        <span style={{ color: '#f59e0b' }}>Pending</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <Link
              to="/admin/sales-ledger"
              className="btn btn-outline"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Export Excel & Open Google Sheets <FiArrowRight />
            </Link>
          </div>
        </div>
      </div>

      {/* Printable Thermal Receipt Modal */}
      {showReceiptModal && receiptData && (
        <div className="receipt-modal-backdrop" onClick={() => setShowReceiptModal(false)}>
          <div className="receipt-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0 }}>🖨️ Retail Invoice Slip Preview</h4>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setShowReceiptModal(false)}
              >
                <FiX />
              </button>
            </div>

            {/* Thermal / 3-inch style printable slip */}
            <div className="receipt-slip-printable">
              <div className="receipt-store-title">{storeSettings.shopName || 'STEP HOUSE'}</div>
              <div className="receipt-store-sub">
                {storeSettings.tagline || 'Multi-Brand Footwear Showroom'}
                <br />
                {storeSettings.address}, {storeSettings.city}
                <br />
                Ph: {storeSettings.contactNumber}
              </div>

              <div className="receipt-divider"></div>

              <div className="receipt-meta-row">
                <span>Invoice: #{receiptData.invoiceNumber}</span>
                <span>{new Date(receiptData.saleDate).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="receipt-meta-row">
                <span>Cashier: {receiptData.adminName}</span>
                <span>{new Date(receiptData.saleDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {receiptData.customerName && receiptData.customerName !== 'Walk-in Customer' && (
                <div className="receipt-meta-row">
                  <span>Customer: {receiptData.customerName}</span>
                  {receiptData.customerPhone && <span>{receiptData.customerPhone}</span>}
                </div>
              )}

              <div className="receipt-divider"></div>

              {/* Items row */}
              <div style={{ fontSize: '0.85rem', fontWeight: 700, margin: '6px 0 2px' }}>
                {receiptData.productName}
              </div>
              <div className="receipt-meta-row">
                <span>{receiptData.brandName} • Size {receiptData.size} ({receiptData.color})</span>
                <span>Qty: {receiptData.quantity}</span>
              </div>
              <div className="receipt-meta-row">
                <span>Rate: ₹{receiptData.sellingPrice.toLocaleString('en-IN')}</span>
                <span>₹{(receiptData.sellingPrice * receiptData.quantity).toLocaleString('en-IN')}</span>
              </div>
              {receiptData.discount > 0 && (
                <div className="receipt-meta-row" style={{ color: '#dc2626' }}>
                  <span>In-Store Discount:</span>
                  <span>- ₹{receiptData.discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="receipt-divider"></div>

              <div className="receipt-total-row">
                <span>NET TOTAL PAID:</span>
                <span>₹{receiptData.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="receipt-meta-row" style={{ marginTop: '4px' }}>
                <span>Payment Mode:</span>
                <span style={{ fontWeight: 600 }}>{receiptData.paymentMethod}</span>
              </div>

              <div className="receipt-divider"></div>

              <div className="receipt-footer-msg">
                *** THANK YOU FOR VISITING {storeSettings.shopName || 'STEP HOUSE'}! ***
                <br />
                Exchange within 7 days with original invoice intact.
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowReceiptModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => window.print()}
              >
                <FiPrinter /> Print Receipt Slip (Thermal/A4)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickSell;

