import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FiZap,
  FiSearch,
  FiCheckCircle,
  FiAlertCircle,
  FiShoppingBag,
  FiArrowRight,
  FiClock,
  FiUser,
  FiPhone,
  FiFileText,
  FiPrinter,
  FiX,
  FiShare2,
  FiCopy,
  FiCheck,
  FiMessageCircle,
  FiDollarSign,
} from 'react-icons/fi';
import api from '../../services/api';
import { useStore } from '../../context/StoreContext';
import './QuickSell.css';

// Showroom Branches Directory across Bhagalpur
export const SHOWROOM_BRANCHES = [
  {
    id: 'shah-market',
    name: 'NEW MB SHOES (Shah Market Main Flagship)',
    shortName: 'Shah Market (Main Flagship)',
    address: 'D.N. Singh Road, Shah Market (Near Titan World), Khalifabagh Chowk, Bhagalpur',
    phone: '+91 94312 14500',
    tagline: 'Main Flagship Footwear Showroom • Khalifabagh',
    badge: 'Flagship Showroom',
  },
  {
    id: 'tatarpur',
    name: 'MB SHOES (Tatarpur Showroom)',
    shortName: 'Tatarpur Showroom',
    address: 'Tatarpur Main Market Road, Near Chowk, Bhagalpur',
    phone: '+91 94312 14501',
    tagline: 'Casual, Sports & Formal Footwear Hub',
    badge: 'Branch 2',
  },
  {
    id: 'tilkamanjhi',
    name: 'MB SHOES (Tilkamanjhi 3rd Showroom)',
    shortName: 'Tilkamanjhi 3rd Showroom',
    address: 'Tilkamanjhi Main Road / Chowk, Bhagalpur',
    phone: '+91 94312 14502',
    tagline: 'Premium Family Footwear Destination',
    badge: 'Branch 3',
  },
];

// Helper function to format AI Digital WhatsApp Bill
export const formatAiWhatsAppBill = (sale, storeSettings, activeBranch) => {
  const storeName = sale.storeBranch || activeBranch?.name || storeSettings?.shopName || 'NEW MB SHOES';
  const storeAddress = sale.storeAddress || activeBranch?.address || storeSettings?.address || 'D.N. Singh Road, Shah Market (Near Titan World), Bhagalpur';
  const contactNo = sale.storePhone || activeBranch?.phone || storeSettings?.contactNumber || '+91 94312 14500';
  const reviewUrl = storeSettings?.googleReviewUrl || 'https://maps.app.goo.gl/vF32PqqHXmZ6mKTx6';

  const saleDate = new Date(sale.saleDate || Date.now());
  const dateStr = saleDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = saleDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const greeting = sale.customerName && sale.customerName !== 'Walk-in Customer'
    ? `Dear *${sale.customerName}*,`
    : 'Dear Valued Customer,';

  return `🏪 *${storeName.toUpperCase()}*
📍 _${storeAddress}_
📞 Showroom Helpline: ${contactNo}
───────────────────────
🧾 *OFFICIAL DIGITAL INVOICE & RECEIPT*
Invoice No: *#${sale.invoiceNumber}*
Date: ${dateStr} | Time: ${timeStr}
Cashier: ${sale.adminName || 'Counter POS'}
───────────────────────
${greeting}
Thank you for visiting *NEW MB SHOES Bhagalpur*! Here is your verified digital bill:

👟 *PURCHASED ITEM*:
• *${sale.productName}*
  Brand: *${sale.brandName}*
  Size: *UK ${sale.size}* | Color: *${sale.color}*
  Quantity: *${sale.quantity} Pair(s)*
  Rate: ₹${Number(sale.sellingPrice).toLocaleString('en-IN')}
${sale.discount > 0 ? `  Showroom Discount: -₹${Number(sale.discount).toLocaleString('en-IN')}\n` : ''}
💰 *TOTAL AMOUNT PAID: ₹${Number(sale.totalAmount).toLocaleString('en-IN')}*
💳 Payment Method: *${sale.paymentMethod}*
───────────────────────
📄 *DOWNLOAD OFFICIAL PDF BILL & TAX INVOICE*:
https://shoes-website-yaseenbrp25-6387.vercel.app/api/sales/invoice/${sale.invoiceNumber}/pdf
───────────────────────
🛡️ *7-DAY SIZE EXCHANGE POLICY*:
• Fit/size exchange is available within 7 days across our 3 Bhagalpur branches (Shah Market, Tatarpur, Tilkamanjhi) with this WhatsApp bill.
• Shoes must be unworn and in original box packaging.

⭐ *Rate your in-store trial experience*:
${reviewUrl}

✨ *Visit NEW MB SHOES again for fresh branded footwear arrivals!* ✨`;
};

const QuickSell = () => {
  const { storeSettings } = useStore();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchWrapperRef = useRef(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Showroom Branch Selection State (Persisted in localStorage)
  const [selectedBranchId, setSelectedBranchId] = useState(
    () => localStorage.getItem('mb_pos_selected_branch_id') || 'shah-market'
  );
  const [isBranchLocked, setIsBranchLocked] = useState(
    () => localStorage.getItem('mb_pos_branch_locked') === 'true'
  );

  const activeBranch = SHOWROOM_BRANCHES.find((b) => b.id === selectedBranchId) || SHOWROOM_BRANCHES[0];

  const handleLockBranch = (branchId) => {
    const bId = branchId || selectedBranchId;
    setSelectedBranchId(bId);
    setIsBranchLocked(true);
    localStorage.setItem('mb_pos_selected_branch_id', bId);
    localStorage.setItem('mb_pos_branch_locked', 'true');
  };

  const handleUnlockBranch = () => {
    setIsBranchLocked(false);
    localStorage.setItem('mb_pos_branch_locked', 'false');
  };

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

  // POS Automation Toggles (Persisted in localStorage)
  const [autoPrintThermal, setAutoPrintThermal] = useState(
    () => localStorage.getItem('mb_auto_print') === 'true'
  );
  const [autoWhatsApp, setAutoWhatsApp] = useState(
    () => localStorage.getItem('mb_auto_whatsapp') !== 'false'
  );

  // Receipt Modal State
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // WhatsApp Modal State
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppModalData, setWhatsAppModalData] = useState(null);
  const [copiedBill, setCopiedBill] = useState(false);

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
    const term = searchTerm.toLowerCase().trim();
    const nameMatch = p.name ? p.name.toLowerCase().includes(term) : false;
    const brandMatch = p.brandName
      ? p.brandName.toLowerCase().includes(term)
      : (p.brand?.name ? p.brand.name.toLowerCase().includes(term) : false);
    const skuMatch = p.sku ? p.sku.toLowerCase().includes(term) : false;
    const categoryMatch = p.categoryName ? p.categoryName.toLowerCase().includes(term) : false;
    return nameMatch || brandMatch || skuMatch || categoryMatch;
  });

  const getProductStock = (p) => {
    if (!p) return 0;
    if (typeof p.totalStock === 'number') return p.totalStock;
    if (Array.isArray(p.variants)) {
      return p.variants.reduce((acc, v) => acc + (Number(v.quantity) || 0), 0);
    }
    return 0;
  };

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

  const handleDeselectProduct = () => {
    setSelectedProduct(null);
    setSelectedVariant(null);
    setSearchTerm('');
    setDropdownOpen(false);
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

  // 1-Click Send WhatsApp Digital Bill
  const sendWhatsAppBill = (sale) => {
    const rawPhone = sale.customerPhone || customerPhone;
    const cleanPhone = rawPhone ? rawPhone.replace(/\D/g, '') : '';
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const billText = formatAiWhatsAppBill(sale, storeSettings, activeBranch);
    const url = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodeURIComponent(billText)}`;
    window.open(url, '_blank');
  };

  // 1-Click Print Thermal Receipt Slip
  const handlePrintDirect = (sale) => {
    setReceiptData(sale);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // 1-Click Download Official Branded PDF Invoice
  const handleDownloadPdf = (sale) => {
    const url = `/api/sales/invoice/${sale.invoiceNumber}/pdf`;
    window.open(url, '_blank');
  };

  // Open WhatsApp Preview Modal
  const openWhatsAppModal = (sale) => {
    setWhatsAppModalData(sale);
    setCopiedBill(false);
    setShowWhatsAppModal(true);
  };

  // Copy Bill to Clipboard
  const copyBillText = (sale) => {
    const text = formatAiWhatsAppBill(sale, storeSettings, activeBranch);
    navigator.clipboard.writeText(text);
    setCopiedBill(true);
    setTimeout(() => setCopiedBill(false), 2000);
  };

  // Submit In-Store Quick Sale
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
        storeBranch: activeBranch.name,
        storeAddress: activeBranch.address,
        storePhone: activeBranch.phone,
      };

      const res = await api.post('/sales', payload);
      if (res.data.success) {
        const createdSale = res.data.sale;
        setSaleResult(res.data);
        setReceiptData(createdSale);

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

        // AUTOMATION 1: 1-Click Auto-Print Thermal Receipt (If toggle enabled)
        if (autoPrintThermal) {
          setTimeout(() => {
            window.print();
          }, 300);
        }

        // AUTOMATION 2: 1-Click Auto-Send WhatsApp Digital Bill (If toggle enabled and phone entered)
        if (autoWhatsApp && createdSale.customerPhone) {
          setTimeout(() => {
            sendWhatsAppBill(createdSale);
          }, 600);
        }

        // Reset customer inputs for next customer
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
            Instantly record shoe sales, automatically dispatch digital WhatsApp bills to customer phones,
            and 1-click auto-print 58mm/80mm thermal receipts.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/admin/sales-ledger" className="btn btn-outline">
            <FiFileText /> View Sales Ledger & Google Sheets
          </Link>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SHOWROOM DUKAN BRANCH SELECTOR (SET ONCE & DONE)                */}
      {/* ============================================================== */}
      <div className={`pos-branch-panel ${isBranchLocked ? 'locked' : ''}`}>
        <div className="pos-branch-header">
          <div className="pos-branch-title-group">
            <span className="pos-branch-icon">{isBranchLocked ? '🏪' : '🏬'}</span>
            <div>
              <h4 className="pos-branch-title">
                {isBranchLocked ? (
                  <span style={{ color: '#047857' }}>
                    🟢 Active Billing Showroom: {activeBranch.shortName}
                  </span>
                ) : (
                  '🏬 Dukan Select Karein (Select Billing Showroom)'
                )}
              </h4>
              <p className="pos-branch-subtitle">
                {isBranchLocked ? (
                  <span>
                    📍 <strong>{activeBranch.address}</strong> | 📞 Helpline: <strong>{activeBranch.phone}</strong>
                  </span>
                ) : (
                  'Select which showroom counter this POS terminal is billing from. All Invoices, WhatsApp bills, and Thermal Slips will automatically print this showroom\'s details.'
                )}
              </p>
            </div>
          </div>

          <div>
            {isBranchLocked ? (
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={handleUnlockBranch}
                title="Click to switch billing showroom counter"
                style={{ fontSize: '0.82rem', padding: '6px 12px' }}
              >
                🔄 Dukan Badlein / Change Shop
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => handleLockBranch(selectedBranchId)}
                style={{ background: '#059669', borderColor: '#059669', fontWeight: 700 }}
              >
                ✅ Set Kar Ke Done Karein
              </button>
            )}
          </div>
        </div>

        {!isBranchLocked && (
          <>
            <div className="branch-cards-grid">
              {SHOWROOM_BRANCHES.map((branch) => {
                const isSelected = selectedBranchId === branch.id;
                return (
                  <button
                    key={branch.id}
                    type="button"
                    className={`branch-choice-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedBranchId(branch.id)}
                  >
                    <div className="branch-badge">{branch.badge}</div>
                    <div className="branch-card-name">{branch.name}</div>
                    <div className="branch-card-addr">📍 {branch.address}</div>
                    <div className="branch-card-phone">📞 Helpline: {branch.phone}</div>
                  </button>
                );
              })}
            </div>

            <div className="branch-confirm-row">
              <span style={{ fontSize: '0.84rem', color: '#475569' }}>
                Selected Shop: <strong style={{ color: '#0f172a' }}>{activeBranch.name}</strong>
              </span>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => handleLockBranch(selectedBranchId)}
                style={{
                  background: '#059669',
                  borderColor: '#059669',
                  padding: '9px 20px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                ✅ Set Dukan & Done (Isi Dukan Se Bill Banayein)
              </button>
            </div>
          </>
        )}
      </div>

      {/* Sale Success Notification with 1-Click Actions */}
      {saleResult && (
        <div
          className="alert alert-success"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            padding: '14px 18px',
            borderRadius: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FiCheckCircle size={26} color="#16a34a" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '1rem', color: '#065f46' }}>
                🎉 In-Store Sale Confirmed! (Invoice #{saleResult.sale.invoiceNumber})
              </strong>
              <div style={{ fontSize: '0.85rem', color: '#047857', marginTop: '2px' }}>
                {saleResult.message} Website inventory updated in real-time.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* 1-Click Thermal Print Button */}
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => handlePrintDirect(saleResult.sale)}
              title="Prints 58mm/80mm Thermal Slip immediately"
            >
              <FiPrinter /> 1-Click Thermal Print
            </button>

            {/* 1-Click WhatsApp Send Button */}
            {saleResult.sale.customerPhone && (
              <button
                type="button"
                className="btn btn-sm btn-whatsapp"
                onClick={() => sendWhatsAppBill(saleResult.sale)}
                title="Send official digital e-bill to customer WhatsApp"
              >
                <FiMessageCircle /> Send WhatsApp Bill
              </button>
            )}

            {/* 1-Click PDF Bill Download Button */}
            <button
              type="button"
              className="btn btn-sm btn-outline"
              style={{ borderColor: '#ef4444', color: '#b91c1c', fontWeight: 600 }}
              onClick={() => handleDownloadPdf(saleResult.sale)}
              title="Download Official Tax Invoice PDF"
            >
              <FiFileText /> Download PDF Bill
            </button>

            {/* AI Bill Preview Button */}
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => openWhatsAppModal(saleResult.sale)}
              title="Preview AI formatted bill & copy"
            >
              <FiShare2 /> AI Bill Preview
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => setSaleResult(null)}
            >
              <FiX /> Dismiss
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
          <div className="shoe-search-wrapper" ref={searchWrapperRef}>
            <FiSearch className="search-icon-pos" size={18} />
            <input
              type="text"
              className="shoe-search-input"
              placeholder="Search shoe name, brand (e.g. Nike, Campus, Puma, Adidas) or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearchTerm('');
              }}
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                <FiX size={16} />
              </button>
            )}
          </div>

          {/* Selected Shoe Detail & Variant Selector */}
          {selectedProduct ? (
            <div>
              {/* If user types in search bar while a shoe is already selected, allow switching shoes */}
              {searchTerm.trim() && (
                <div className="pos-search-feed-box" style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                      🔍 Switch Shoe: Results for "{searchTerm}" ({filteredProducts.length})
                    </div>
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="btn btn-outline"
                      style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                    >
                      Keep Current Shoe
                    </button>
                  </div>
                  {filteredProducts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '0.9rem' }}>
                      No shoes found matching "{searchTerm}".
                    </div>
                  ) : (
                    <div className="pos-search-grid">
                      {filteredProducts.slice(0, 4).map((p) => {
                        const firstImg =
                          p.primaryImage ||
                          (p.images && p.images.length > 0 ? p.images[0] : '/placeholder-shoe.png');
                        const stockCount = getProductStock(p);
                        return (
                          <div
                            key={p._id}
                            className="pos-search-card-item"
                            onClick={() => handleSelectProduct(p)}
                          >
                            <img src={firstImg} alt={p.name} className="pos-search-card-img" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                                {p.brandName}
                              </div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {p.name}
                              </div>
                              <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', marginTop: '2px' }}>
                                <span style={{ fontWeight: 700 }}>₹{p.sellingPrice.toLocaleString('en-IN')}</span>
                                <span style={{ color: stockCount > 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                                  {stockCount > 0 ? `${stockCount} in stock` : 'Out of stock'}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem', flexShrink: 0 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectProduct(p);
                              }}
                            >
                              Switch →
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="selected-shoe-banner">
                <img
                  src={
                    selectedProduct.primaryImage ||
                    (selectedProduct.images && selectedProduct.images.length > 0
                      ? selectedProduct.images[0]
                      : '/placeholder-shoe.png')
                  }
                  alt={selectedProduct.name}
                  className="selected-shoe-img"
                />
                <div className="selected-shoe-details">
                  <div className="selected-shoe-brand">{selectedProduct.brandName}</div>
                  <h4 style={{ margin: '2px 0 6px 0', fontSize: '1.1rem' }}>{selectedProduct.name}</h4>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span>SKU: {selectedProduct.sku}</span>
                    <span>•</span>
                    <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>
                      Showroom MRP: ₹{selectedProduct.sellingPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDeselectProduct}
                  className="btn btn-outline"
                  style={{ padding: '6px 12px', fontSize: '0.82rem', marginLeft: 'auto', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Choose a different shoe"
                >
                  <FiX size={14} /> Change Shoe
                </button>
              </div>

              {/* Step 2: Choose Size / Variant */}
              <h3 className="pos-section-title" style={{ marginTop: '20px' }}>
                <FiZap /> Step 2: Select Customer Size & Confirm Stock
              </h3>

              <div className="variant-pills-grid">
                {selectedProduct.variants.map((v) => {
                  const isSelected = selectedVariant && selectedVariant._id === v._id;
                  const isOutOfStock = v.quantity <= 0;

                  return (
                    <button
                      key={v._id}
                      type="button"
                      disabled={isOutOfStock}
                      className={`variant-pill-pos ${isSelected ? 'selected' : ''} ${
                        isOutOfStock ? 'out-of-stock' : ''
                      }`}
                      onClick={() => handleSelectVariant(v)}
                    >
                      <div className="variant-pill-size">Size {v.size}</div>
                      <div className="variant-pill-color">{v.color}</div>
                      <div className="variant-pill-stock">
                        {isOutOfStock ? 'Sold Out' : `${v.quantity} in store`}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Step 3: Billing Form */}
              <form onSubmit={handleSubmitSale} style={{ marginTop: '24px' }}>
                <h3 className="pos-section-title">
                  <FiDollarSign /> Step 3: Customer Details & POS Automation
                </h3>

                <div className="form-grid-3" style={{ marginBottom: '16px' }}>
                  <div className="form-group">
                    <label>Quantity to Sell (Pairs) *</label>
                    <input
                      type="number"
                      min="1"
                      max={selectedVariant ? selectedVariant.quantity : 1}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
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

                {/* Customer Details */}
                <div className="form-grid-2" style={{ marginBottom: '14px' }}>
                  <div className="form-group">
                    <label>Customer Name</label>
                    <div className="input-with-icon" style={{ position: 'relative' }}>
                      <FiUser style={{ position: 'absolute', left: '10px', top: '12px', color: '#94a3b8' }} />
                      <input
                        type="text"
                        placeholder="e.g. Rahul Kumar (or Walk-in Customer)"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        style={{ paddingLeft: '32px' }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Customer Mobile No. (For WhatsApp Bill)</label>
                    <div className="input-with-icon" style={{ position: 'relative' }}>
                      <FiPhone style={{ position: 'absolute', left: '10px', top: '12px', color: '#25D366' }} />
                      <input
                        type="tel"
                        placeholder="10-digit Mobile No. (e.g. 9431214500)"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                        maxLength={10}
                        style={{ paddingLeft: '32px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Automation Controls (Persisted) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    margin: '0 0 16px 0',
                    background: '#f8fafc',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      margin: 0,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={autoWhatsApp}
                      onChange={(e) => {
                        setAutoWhatsApp(e.target.checked);
                        localStorage.setItem('mb_auto_whatsapp', e.target.checked);
                      }}
                      style={{ width: '16px', height: '16px', accentColor: '#25D366' }}
                    />
                    <span>📲 Auto-Send WhatsApp Bill</span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      margin: 0,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={autoPrintThermal}
                      onChange={(e) => {
                        setAutoPrintThermal(e.target.checked);
                        localStorage.setItem('mb_auto_print', e.target.checked);
                      }}
                      style={{ width: '16px', height: '16px', accentColor: '#0f172a' }}
                    />
                    <span>🖨️ Auto-Print Thermal Receipt</span>
                  </label>
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
                  <div className="pos-total-amount">₹{totalAmount.toLocaleString('en-IN')}</div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !selectedVariant || selectedVariant.quantity <= 0}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    letterSpacing: '0.3px',
                  }}
                >
                  {submitting
                    ? 'Processing Sale, Bill & Print...'
                    : '⚡ COMPLETE SALE & GENERATE BILL (1-CLICK)'}
                </button>
              </form>
            </div>
          ) : searchTerm.trim() ? (
            <div className="pos-search-feed-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                  🔍 Matching Shoes for "{searchTerm}" ({filteredProducts.length} found)
                </div>
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="btn btn-outline"
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                >
                  Clear Search
                </button>
              </div>

              {filteredProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 10px', color: '#64748b' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>👟</div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', color: '#0f172a' }}>No Shoes Found</h4>
                  <p style={{ margin: 0, fontSize: '0.88rem' }}>
                    "{searchTerm}" se milta julta koi shoe nahi mila. Please try searching by brand (Nike, Campus, Puma) or check spelling.
                  </p>
                </div>
              ) : (
                <div className="pos-search-grid">
                  {filteredProducts.slice(0, 8).map((p) => {
                    const firstImg =
                      p.primaryImage ||
                      (p.images && p.images.length > 0 ? p.images[0] : '/placeholder-shoe.png');
                    const stockCount = getProductStock(p);

                    return (
                      <div
                        key={p._id}
                        className="pos-search-card-item"
                        onClick={() => handleSelectProduct(p)}
                      >
                        <img src={firstImg} alt={p.name} className="pos-search-card-img" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                            {p.brandName}
                          </div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.name}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', fontSize: '0.82rem', marginTop: '2px' }}>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>
                              ₹{p.sellingPrice.toLocaleString('en-IN')}
                            </span>
                            <span style={{ color: stockCount > 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                              {stockCount > 0 ? `${stockCount} in store` : 'Out of stock'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: '6px 14px', fontSize: '0.82rem', flexShrink: 0, fontWeight: 700 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectProduct(p);
                          }}
                        >
                          Select →
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="no-shoe-selected-box">
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>👟</div>
              <h4>No Shoe Selected Yet</h4>
              <p style={{ maxWidth: '440px', margin: '0 auto 16px auto', color: '#64748b', lineHeight: 1.5 }}>
                Type shoe name, brand (e.g. Nike, Campus, Puma, Adidas) or SKU in the search box above to begin recording a sale.
              </p>

              {/* Quick Pick - Available Showroom Stock */}
              {products && products.length > 0 && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                    ⚡ Available Showroom Stock (Click to Select):
                  </div>
                  <div className="pos-search-grid">
                    {products.slice(0, 4).map((p) => {
                      const firstImg =
                        p.primaryImage ||
                        (p.images && p.images.length > 0 ? p.images[0] : '/placeholder-shoe.png');
                      const stockCount = getProductStock(p);

                      return (
                        <div
                          key={p._id}
                          className="pos-search-card-item"
                          onClick={() => handleSelectProduct(p)}
                        >
                          <img src={firstImg} alt={p.name} className="pos-search-card-img" />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                              {p.brandName}
                            </div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.name}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', marginTop: '2px' }}>
                              <span style={{ fontWeight: 700, color: '#0f172a' }}>
                                ₹{p.sellingPrice.toLocaleString('en-IN')}
                              </span>
                              <span style={{ color: stockCount > 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                                {stockCount > 0 ? `${stockCount} in store` : 'Out of stock'}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', flexShrink: 0, fontWeight: 700 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectProduct(p);
                            }}
                          >
                            Select →
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
                    <span style={{ fontWeight: 700 }}>#{sale.invoiceNumber}</span>
                    <span>
                      {new Date(sale.saleDate).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="recent-sale-shoe">{sale.productName}</div>
                  <div className="recent-sale-meta">
                    <span>
                      Size {sale.size} ({sale.color}) × {sale.quantity}
                    </span>
                    <span className="recent-sale-amount">₹{sale.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      marginTop: '6px',
                      flexWrap: 'wrap',
                      gap: '4px',
                    }}
                  >
                    <span>
                      {sale.customerName && sale.customerName !== 'Walk-in Customer'
                        ? sale.customerName
                        : sale.paymentMethod}
                    </span>

                    {/* Quick 1-Click Action Buttons for each sale */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {/* 1-Click Thermal Print */}
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        style={{ padding: '3px 6px', fontSize: '0.72rem' }}
                        title="1-Click Print Thermal Slip"
                        onClick={() => handlePrintDirect(sale)}
                      >
                        <FiPrinter size={12} /> Print
                      </button>

                      {/* 1-Click PDF Download */}
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        style={{ padding: '3px 6px', fontSize: '0.72rem', color: '#b91c1c', borderColor: '#fca5a5' }}
                        title="Download Official Tax Invoice PDF"
                        onClick={() => handleDownloadPdf(sale)}
                      >
                        <FiFileText size={12} /> PDF
                      </button>

                      {/* 1-Click WhatsApp Direct Send */}
                      {sale.customerPhone && (
                        <button
                          type="button"
                          className="btn btn-sm btn-whatsapp"
                          style={{ padding: '3px 6px', fontSize: '0.72rem' }}
                          title={`Send bill to ${sale.customerPhone}`}
                          onClick={() => sendWhatsAppBill(sale)}
                        >
                          <FiMessageCircle size={12} /> WhatsApp
                        </button>
                      )}

                      {/* AI Bill Preview & Copy */}
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        style={{ padding: '3px 5px', fontSize: '0.72rem' }}
                        title="View AI Bill Text"
                        onClick={() => openWhatsAppModal(sale)}
                      >
                        <FiShare2 size={11} />
                      </button>
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

      {/* ============================================================== */}
      {/* 1-CLICK THERMAL RECEIPT PRINT AREA (58mm / 80mm EXACT ROLL)    */}
      {/* ============================================================== */}
      {receiptData && (
        <div id="thermal-print-slip" className="thermal-print-area">
          <div className="receipt-store-title">
            {receiptData.storeBranch || activeBranch.name || storeSettings.shopName || 'NEW MB SHOES'}
          </div>
          <div className="receipt-store-sub">
            {activeBranch.tagline || storeSettings.tagline || 'Multi-Brand Footwear Showroom | Bhagalpur'}
            <br />
            {receiptData.storeAddress || activeBranch.address || storeSettings.address}
            <br />
            Ph: {receiptData.storePhone || activeBranch.phone || storeSettings.contactNumber || '+91 94312 14500'}
          </div>

          <div className="receipt-divider"></div>

          <div className="receipt-meta-row">
            <span>Invoice: #{receiptData.invoiceNumber}</span>
            <span>{new Date(receiptData.saleDate || Date.now()).toLocaleDateString('en-IN')}</span>
          </div>
          <div className="receipt-meta-row">
            <span>Cashier: {receiptData.adminName || 'Store Counter'}</span>
            <span>
              {new Date(receiptData.saleDate || Date.now()).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          {receiptData.customerName && receiptData.customerName !== 'Walk-in Customer' && (
            <div className="receipt-meta-row">
              <span>Customer: {receiptData.customerName}</span>
              {receiptData.customerPhone && <span>{receiptData.customerPhone}</span>}
            </div>
          )}

          <div className="receipt-divider"></div>

          <div style={{ fontSize: '0.85rem', fontWeight: 700, margin: '6px 0 2px' }}>
            {receiptData.productName}
          </div>
          <div className="receipt-meta-row">
            <span>
              {receiptData.brandName} • Size {receiptData.size} ({receiptData.color})
            </span>
            <span>Qty: {receiptData.quantity}</span>
          </div>
          <div className="receipt-meta-row">
            <span>Rate: ₹{Number(receiptData.sellingPrice).toLocaleString('en-IN')}</span>
            <span>₹{(receiptData.sellingPrice * receiptData.quantity).toLocaleString('en-IN')}</span>
          </div>
          {receiptData.discount > 0 && (
            <div className="receipt-meta-row" style={{ color: '#dc2626' }}>
              <span>In-Store Discount:</span>
              <span>- ₹{Number(receiptData.discount).toLocaleString('en-IN')}</span>
            </div>
          )}

          <div className="receipt-divider"></div>

          <div className="receipt-total-row">
            <span>NET TOTAL PAID:</span>
            <span>₹{Number(receiptData.totalAmount).toLocaleString('en-IN')}</span>
          </div>
          <div className="receipt-meta-row" style={{ marginTop: '4px' }}>
            <span>Payment Mode:</span>
            <span style={{ fontWeight: 600 }}>{receiptData.paymentMethod}</span>
          </div>

          <div className="receipt-divider"></div>

          <div className="receipt-footer-msg">
            *** THANK YOU FOR VISITING {receiptData.storeBranch || activeBranch.shortName || storeSettings.shopName || 'NEW MB SHOES'}! ***
            <br />
            7-Day Size Exchange at all 3 Bhagalpur Branches.
            <br />
            (Shah Market • Tatarpur • Tilkamanjhi)
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* WHATSAPP AI DIGITAL BILL PREVIEW MODAL                          */}
      {/* ============================================================== */}
      {showWhatsAppModal && whatsAppModalData && (
        <div className="receipt-modal-backdrop" onClick={() => setShowWhatsAppModal(false)}>
          <div className="receipt-modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>📱</span>
                <h4 style={{ margin: 0 }}>WhatsApp Digital Bill Preview</h4>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setShowWhatsAppModal(false)}
              >
                <FiX />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 12px 0' }}>
              This AI-formatted digital tax invoice will be sent to the customer's WhatsApp with store branding & warranty policy.
            </p>

            {/* Chat Bubble Preview */}
            <div className="whatsapp-chat-bubble">
              {formatAiWhatsAppBill(whatsAppModalData, storeSettings, activeBranch)}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => copyBillText(whatsAppModalData)}
                >
                  {copiedBill ? <FiCheck color="#16a34a" /> : <FiCopy />} {copiedBill ? 'Copied!' : 'Copy Bill'}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  style={{ borderColor: '#ef4444', color: '#b91c1c', fontWeight: 600 }}
                  onClick={() => handleDownloadPdf(whatsAppModalData)}
                >
                  <FiFileText /> Download PDF
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => setShowWhatsAppModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-whatsapp"
                  onClick={() => sendWhatsAppBill(whatsAppModalData)}
                >
                  <FiMessageCircle /> Open in WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickSell;
