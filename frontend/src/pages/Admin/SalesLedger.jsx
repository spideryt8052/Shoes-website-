import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiFileText,
  FiDownload,
  FiShare2,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiCopy,
  FiCheck,
  FiExternalLink,
  FiZap,
} from 'react-icons/fi';
import api from '../../services/api';
import './SalesLedger.css';

const SalesLedger = () => {
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' | 'bulk' | 'sheets'

  // Ledger state
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('today');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalPairs: 0,
    paymentBreakdown: [],
  });

  // Action status state
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Bulk sales form state
  const [products, setProducts] = useState([]);
  const [bulkItems, setBulkItems] = useState([
    {
      productId: '',
      variantId: '',
      quantity: 1,
      sellingPrice: '',
      paymentMethod: 'UPI / QR',
      customerName: '',
      customerPhone: '',
    },
  ]);
  const [bulkRemarks, setBulkRemarks] = useState('End-of-day showroom sales entry');
  const [submittingBulk, setSubmittingBulk] = useState(false);

  // Google Sheets Script state
  const [scriptTemplate, setScriptTemplate] = useState('');
  const [copied, setCopied] = useState(false);

  // Fetch sales records
  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (period !== 'all') params.append('period', period);
      if (paymentFilter !== 'All') params.append('paymentMethod', paymentFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await api.get(`/sales?${params.toString()}`);
      if (res.data.success) {
        setSales(res.data.sales);
        setStats({
          totalRevenue: res.data.totalRevenue,
          totalPairs: res.data.totalPairs,
          paymentBreakdown: res.data.paymentBreakdown || [],
        });
      }
    } catch (err) {
      console.error('Error fetching sales:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products list for bulk entry
  const fetchProducts = async () => {
    try {
      const res = await api.get('/products?limit=100');
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error('Error fetching products for bulk:', err);
    }
  };

  // Fetch Google Apps Script code template
  const fetchScriptTemplate = async () => {
    try {
      const res = await api.get('/sales/google-sheet-script');
      if (res.data.success) {
        setScriptTemplate(res.data.scriptTemplate);
      }
    } catch (err) {
      console.error('Error fetching script template:', err);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [period, paymentFilter]);

  useEffect(() => {
    if (activeTab === 'bulk' && products.length === 0) {
      fetchProducts();
    }
    if (activeTab === 'sheets' && !scriptTemplate) {
      fetchScriptTemplate();
    }
  }, [activeTab]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSales();
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = async () => {
    try {
      setActionLoading(true);
      setMessage({ type: '', text: '' });
      const params = new URLSearchParams();
      if (period !== 'all') params.append('period', period);

      const res = await api.get(`/sales/export-excel?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Step_House_Sales_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      setMessage({ type: 'success', text: 'Excel (.xlsx) file downloaded successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to download Excel file' });
    } finally {
      setActionLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = async () => {
    try {
      setActionLoading(true);
      setMessage({ type: '', text: '' });

      const res = await api.get('/sales/export-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Step_House_Sales_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      setMessage({ type: 'success', text: 'CSV spreadsheet downloaded successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to download CSV' });
    } finally {
      setActionLoading(false);
    }
  };

  // Manual Trigger to Sync with Google Sheets
  const handleSyncGoogleSheets = async () => {
    try {
      setActionLoading(true);
      setMessage({ type: '', text: '' });

      const res = await api.post('/sales/sync-google-sheet', { syncAll: false });
      if (res.data.success) {
        setMessage({ type: 'success', text: res.data.message });
        fetchSales();
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Error syncing with Google Sheets. Please check your Webhook URL in Store Settings.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Copy Google Script Code
  const handleCopyScript = () => {
    if (scriptTemplate) {
      navigator.clipboard.writeText(scriptTemplate);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // --- Bulk Entry Handlers ---
  const handleAddBulkRow = () => {
    setBulkItems((prev) => [
      ...prev,
      {
        productId: '',
        variantId: '',
        quantity: 1,
        sellingPrice: '',
        paymentMethod: 'UPI / QR',
        customerName: '',
        customerPhone: '',
      },
    ]);
  };

  const handleRemoveBulkRow = (index) => {
    if (bulkItems.length === 1) return;
    setBulkItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleBulkChange = (index, field, value) => {
    setBulkItems((prev) => {
      const updated = [...prev];
      updated[index][field] = value;

      // When product changes, reset variant and update price
      if (field === 'productId') {
        const prod = products.find((p) => p._id === value);
        if (prod) {
          updated[index].sellingPrice = prod.sellingPrice;
          const firstInStock = prod.variants.find((v) => v.quantity > 0);
          updated[index].variantId = firstInStock ? firstInStock._id : prod.variants[0]?._id || '';
        } else {
          updated[index].variantId = '';
          updated[index].sellingPrice = '';
        }
      }
      return updated;
    });
  };

  const handleSubmitBulkSales = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validate rows
    const validItems = bulkItems.filter((item) => item.productId && item.variantId && Number(item.quantity) > 0);
    if (validItems.length === 0) {
      setMessage({ type: 'error', text: 'Please fill in at least one shoe sale row with valid size and quantity.' });
      return;
    }

    try {
      setSubmittingBulk(true);
      const res = await api.post('/sales/bulk', {
        items: validItems,
        remarks: bulkRemarks,
      });

      if (res.data.success) {
        setMessage({
          type: 'success',
          text: `Success! ${res.data.salesCount} in-store sales recorded. Showroom stock reduced and live website updated!`,
        });

        // Reset bulk form to 1 blank row
        setBulkItems([
          {
            productId: '',
            variantId: '',
            quantity: 1,
            sellingPrice: '',
            paymentMethod: 'UPI / QR',
            customerName: '',
            customerPhone: '',
          },
        ]);

        // Refresh ledger
        fetchSales();
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Error recording end-of-day sales batch',
      });
    } finally {
      setSubmittingBulk(false);
    }
  };

  // Calculate payment totals for summary cards
  const upiTotal =
    stats.paymentBreakdown?.find((p) => p._id === 'UPI / QR')?.revenue || 0;
  const cashTotal =
    stats.paymentBreakdown?.find((p) => p._id === 'Cash')?.revenue || 0;

  return (
    <div className="sales-ledger-container">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h2>📊 In-Store Sales Ledger & Google Sheets Sync</h2>
          <p className="admin-page-subtitle">
            Track all offline shoes sold, export directly to real Excel (.xlsx), and automatically
            sync sales in real time with your connected Google Sheet.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/admin/quick-sell" className="btn btn-primary">
            <FiZap /> Quick Sell (POS)
          </Link>
        </div>
      </div>

      {/* Action Notification */}
      {message.text && (
        <div
          className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {message.type === 'success' ? <FiCheckCircle size={20} /> : <FiAlertCircle size={20} />}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => setMessage({ type: '', text: '' })}
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Tab Navigation */}
      <div className="sales-tab-nav">
        <button
          type="button"
          className={`sales-tab-btn ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
        >
          <FiFileText /> Daily Sales Ledger & Export
        </button>
        <button
          type="button"
          className={`sales-tab-btn ${activeTab === 'bulk' ? 'active' : ''}`}
          onClick={() => setActiveTab('bulk')}
        >
          <FiCalendar /> End-of-Day Batch Sales Entry (Shop Closing)
        </button>
        <button
          type="button"
          className={`sales-tab-btn ${activeTab === 'sheets' ? 'active' : ''}`}
          onClick={() => setActiveTab('sheets')}
        >
          <FiShare2 /> Google Sheets Automation Setup
        </button>
      </div>

      {/* ================= TAB 1: DAILY SALES LEDGER ================= */}
      {activeTab === 'ledger' && (
        <>
          {/* KPI Summary Cards */}
          <div className="sales-stats-grid">
            <div className="sales-stat-card">
              <div className="stat-icon-wrapper revenue">₹</div>
              <div className="stat-meta-content">
                <div className="stat-title">Total Revenue ({period.toUpperCase()})</div>
                <div className="stat-value">₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="sales-stat-card">
              <div className="stat-icon-wrapper pairs">👟</div>
              <div className="stat-meta-content">
                <div className="stat-title">Pairs Sold ({period.toUpperCase()})</div>
                <div className="stat-value">{stats.totalPairs} Pairs</div>
              </div>
            </div>

            <div className="sales-stat-card">
              <div className="stat-icon-wrapper upi">📱</div>
              <div className="stat-meta-content">
                <div className="stat-title">UPI / QR Revenue</div>
                <div className="stat-value">₹{upiTotal.toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="sales-stat-card">
              <div className="stat-icon-wrapper cash">💵</div>
              <div className="stat-meta-content">
                <div className="stat-title">Cash Revenue</div>
                <div className="stat-value">₹{cashTotal.toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>

          {/* Action Toolbar & Filters */}
          <div className="sales-action-bar">
            {/* Filter Tabs */}
            <div className="sales-action-group">
              <div className="filter-pill-group" style={{ display: 'flex', gap: '6px' }}>
                {['today', 'yesterday', 'all'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setPeriod(p)}
                  >
                    {p === 'today' ? 'Today' : p === 'yesterday' ? 'Yesterday' : 'All Time'}
                  </button>
                ))}
              </div>

              {/* Payment Filter */}
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
              >
                <option value="All">All Payment Modes</option>
                <option value="UPI / QR">UPI / QR</option>
                <option value="Cash">Cash</option>
                <option value="Card (POS)">Card</option>
                <option value="Khata / Credit">Khata</option>
              </select>

              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="Search invoice, shoe, customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    width: '200px',
                  }}
                />
                <button type="submit" className="btn btn-sm btn-outline">
                  <FiSearch />
                </button>
              </form>
            </div>

            {/* Export & Sync Buttons */}
            <div className="sales-action-group">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleExportExcel}
                disabled={actionLoading}
                title="Download formatted Microsoft Excel (.xlsx) file"
              >
                <FiDownload /> Export Excel (.xlsx)
              </button>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleExportCSV}
                disabled={actionLoading}
                title="Download CSV spreadsheet"
              >
                <FiDownload /> Export CSV
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSyncGoogleSheets}
                disabled={actionLoading}
                title="Sync un-synced sales directly to Google Sheets"
              >
                <FiRefreshCw className={actionLoading ? 'spin' : ''} /> Sync to Google Sheet
              </button>
            </div>
          </div>

          {/* Sales History Table */}
          <div className="admin-table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Loading sales records...
              </div>
            ) : sales.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🧾</div>
                <h4>No Sales Recorded For This Period</h4>
                <p>Use Quick Sell (POS) or End-of-Day Batch Entry to log showroom shoe sales.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Date & Time</th>
                    <th>Shoe Model</th>
                    <th>Variant</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Staff / Cashier</th>
                    <th>Google Sheet</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale._id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        #{sale.invoiceNumber}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <div>{new Date(sale.saleDate).toLocaleDateString('en-IN')}</div>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {new Date(sale.saleDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{sale.productName}</div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {sale.brandName} • SKU: {sale.sku}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-neutral" style={{ padding: '2px 6px', fontSize: '0.8rem' }}>
                          Size {sale.size} ({sale.color})
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{sale.quantity}</td>
                      <td>₹{sale.sellingPrice.toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 700, color: '#16a34a' }}>
                        ₹{sale.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem' }}>{sale.paymentMethod}</span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {sale.adminName}
                      </td>
                      <td>
                        {sale.syncedToGoogleSheet ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: '#16a34a',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                            }}
                          >
                            <FiCheckCircle size={14} /> Synced
                          </span>
                        ) : (
                          <span
                            style={{
                              color: '#f59e0b',
                              fontSize: '0.8rem',
                              fontWeight: 500,
                            }}
                          >
                            ⏳ Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ================= TAB 2: END-OF-DAY BATCH ENTRY ================= */}
      {activeTab === 'bulk' && (
        <div className="pos-card">
          <div style={{ marginBottom: '20px' }}>
            <h3 className="pos-section-title">
              <FiCalendar /> End-of-Day Bulk Sales Entry ("Day Khatam Hone Se Pehle")
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              If you didn't record shoe sales in real-time during busy showroom hours, enter all shoes
              sold before closing the shop at night. Every item will automatically reduce from your
              in-store stock and update the public website.
            </p>
          </div>

          <form onSubmit={handleSubmitBulkSales}>
            <div className="bulk-sales-table-wrapper">
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 80px 110px 140px 40px', gap: '12px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <div>Shoe Model *</div>
                <div>Size & Colour Variant *</div>
                <div>Pairs *</div>
                <div>Price (₹) *</div>
                <div>Payment Mode</div>
                <div></div>
              </div>

              {bulkItems.map((item, index) => {
                const currentProduct = products.find((p) => p._id === item.productId);
                return (
                  <div key={index} className="bulk-row-item">
                    {/* Select Shoe */}
                    <select
                      value={item.productId}
                      onChange={(e) => handleBulkChange(index, 'productId', e.target.value)}
                      required
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                    >
                      <option value="">-- Select Shoe Model --</option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.brandName}) - Store Stock: {p.totalStock} pairs
                        </option>
                      ))}
                    </select>

                    {/* Select Variant */}
                    <select
                      value={item.variantId}
                      onChange={(e) => handleBulkChange(index, 'variantId', e.target.value)}
                      disabled={!currentProduct}
                      required
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                    >
                      <option value="">-- Select Size --</option>
                      {currentProduct?.variants?.map((v) => (
                        <option key={v._id} value={v._id}>
                          Size {v.size} ({v.color}) - {v.quantity} in stock
                        </option>
                      ))}
                    </select>

                    {/* Quantity */}
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleBulkChange(index, 'quantity', e.target.value)}
                      required
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                    />

                    {/* Price */}
                    <input
                      type="number"
                      min="0"
                      placeholder="Price"
                      value={item.sellingPrice}
                      onChange={(e) => handleBulkChange(index, 'sellingPrice', e.target.value)}
                      required
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                    />

                    {/* Payment Mode */}
                    <select
                      value={item.paymentMethod}
                      onChange={(e) => handleBulkChange(index, 'paymentMethod', e.target.value)}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                    >
                      <option value="UPI / QR">UPI / QR</option>
                      <option value="Cash">Cash</option>
                      <option value="Card (POS)">Card</option>
                      <option value="Khata / Credit">Khata</option>
                    </select>

                    {/* Remove Row Button */}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => handleRemoveBulkRow(index)}
                      disabled={bulkItems.length === 1}
                      title="Remove Row"
                      style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                );
              })}

              <div style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleAddBulkRow}
                >
                  <FiPlus /> Add Another Shoe Sold
                </button>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label>Closing Shift / Audit Remarks</label>
                <input
                  type="text"
                  value={bulkRemarks}
                  onChange={(e) => setBulkRemarks(e.target.value)}
                  placeholder="e.g. Saturday evening store closing batch entry"
                />
              </div>

              <button
                type="submit"
                disabled={submittingBulk}
                className="btn btn-primary"
                style={{ padding: '14px', fontSize: '1.05rem', fontWeight: 700 }}
              >
                {submittingBulk
                  ? 'Recording Batch Sales & Deducting Stock...'
                  : `✓ SUBMIT ALL (${bulkItems.length}) DAY SALES & UPDATE STORE STOCK`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= TAB 3: GOOGLE SHEETS SETUP GUIDE ================= */}
      {activeTab === 'sheets' && (
        <div className="pos-card">
          <div style={{ marginBottom: '24px' }}>
            <h3 className="pos-section-title">
              <FiShare2 /> Automate Sales Sync with Google Sheets (3-Minute Setup)
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Follow these simple steps so that every single shoe sold in your showroom is instantly
              logged into your personal Google Sheet in real time.
            </p>
          </div>

          {/* Steps */}
          <div className="instruction-step">
            <div className="step-number-circle">1</div>
            <div>
              <h4 style={{ margin: '0 0 4px' }}>Create or Open a Google Sheet</h4>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Go to <a href="https://sheets.new" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'var(--color-primary)' }}>sheets.new</a> and create a new Google Sheet named <strong>"STEP HOUSE In-Store Sales"</strong>.
              </p>
            </div>
          </div>

          <div className="instruction-step">
            <div className="step-number-circle">2</div>
            <div>
              <h4 style={{ margin: '0 0 4px' }}>Open Apps Script Editor</h4>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                In the Google Sheet menu bar, click <strong>Extensions ➔ Apps Script</strong>.
              </p>
            </div>
          </div>

          <div className="instruction-step">
            <div className="step-number-circle">3</div>
            <div>
              <h4 style={{ margin: '0 0 4px' }}>Copy & Paste the Auto-Sync Script</h4>
              <p style={{ margin: '0 0 10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Erase any existing code in the Apps Script editor and paste the template below:
              </p>

              <div className="code-box-wrapper">
                <button
                  type="button"
                  className="code-copy-btn"
                  onClick={handleCopyScript}
                >
                  {copied ? <FiCheck color="#4ade80" /> : <FiCopy />}
                  {copied ? 'Copied to Clipboard!' : 'Copy Script Template'}
                </button>
                <pre>{scriptTemplate || '// Loading Apps Script template...'}</pre>
              </div>
            </div>
          </div>

          <div className="instruction-step">
            <div className="step-number-circle">4</div>
            <div>
              <h4 style={{ margin: '0 0 4px' }}>Deploy as Web App</h4>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Click <strong>Deploy ➔ New deployment</strong>.<br />
                - Select type: <strong>Web app</strong>.<br />
                - Execute as: <strong>Me (your google account)</strong>.<br />
                - Who has access: <strong>Anyone</strong> (so your store server can push sales).<br />
                Click <strong>Deploy</strong> and copy the <strong>Web App URL</strong>.
              </p>
            </div>
          </div>

          <div className="instruction-step">
            <div className="step-number-circle">5</div>
            <div>
              <h4 style={{ margin: '0 0 4px' }}>Paste Web App URL in Store Settings</h4>
              <p style={{ margin: '0 0 10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Go to Store Settings and paste the URL under "Google Sheet Webhook URL", then turn on "Auto Sync".
              </p>
              <Link to="/admin/settings" className="btn btn-outline btn-sm">
                Open Store Settings <FiExternalLink />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesLedger;

