import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  FiSave,
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiUploadCloud,
  FiImage,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';
import api from '../../services/api';
import { useStore } from '../../context/StoreContext';
import './AddEditProduct.css';

const DEFAULT_SIZES = ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'];

const AddEditProduct = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { brands, categories, fetchBrands } = useStore();

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    gender: 'Men',
    category: '',
    subcategory: '',
    occasion: 'Casual',
    sku: '',
    description: '',
    sellingPrice: '',
    originalPrice: '',
    images: [''],
    isFeatured: false,
    isPopular: false,
    isNewArrival: true,
  });

  // Custom Brand Support State
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [customBrandName, setCustomBrandName] = useState('');
  const [customBrandDesc, setCustomBrandDesc] = useState('');
  const [savingBrand, setSavingBrand] = useState(false);

  // Variant Matrix: each variant is { size, color, quantity, sku }
  const [variants, setVariants] = useState([
    { size: 'UK 7', color: 'Black', quantity: 3, sku: '' },
    { size: 'UK 8', color: 'Black', quantity: 4, sku: '' },
    { size: 'UK 9', color: 'Black', quantity: 2, sku: '' },
    { size: 'UK 10', color: 'Black', quantity: 0, sku: '' },
  ]);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(isEditMode);
  const [message, setMessage] = useState({ type: '', text: '' });

  // If in edit mode, fetch existing product data
  useEffect(() => {
    if (isEditMode) {
      const loadProduct = async () => {
        try {
          setFetchingProduct(true);
          const res = await api.get(`/products/${id}`);
          if (res.data.success && res.data.product) {
            const p = res.data.product;
            setFormData({
              name: p.name,
              brand: p.brand?._id || p.brand || '',
              gender: p.gender,
              category: p.category?._id || p.category || '',
              subcategory: p.subcategory || '',
              occasion: p.occasion || 'Casual',
              sku: p.sku,
              description: p.description,
              sellingPrice: p.sellingPrice,
              originalPrice: p.originalPrice || '',
              images: p.images && p.images.length > 0 ? p.images : [''],
              isFeatured: Boolean(p.isFeatured),
              isPopular: Boolean(p.isPopular),
              isNewArrival: Boolean(p.isNewArrival),
            });
            if (p.variants && p.variants.length > 0) {
              setVariants(
                p.variants.map((v) => ({
                  _id: v._id,
                  size: v.size,
                  color: v.color,
                  quantity: v.quantity,
                  sku: v.sku || '',
                }))
              );
            }
          }
        } catch (err) {
          setMessage({
            type: 'error',
            text: err.response?.data?.message || 'Failed to load product details for editing',
          });
        } finally {
          setFetchingProduct(false);
        }
      };
      loadProduct();
    } else {
      // Set default category and brand if available
      if (brands.length > 0 && !formData.brand) {
        setFormData((prev) => ({ ...prev, brand: brands[0]._id }));
      }
      if (categories.length > 0 && !formData.category) {
        setFormData((prev) => ({ ...prev, category: categories[0]._id }));
      }
    }
  }, [id, isEditMode, brands, categories]);

  // Handle standard input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Image URL management
  const handleImageUrlChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData((prev) => ({ ...prev, images: newImages }));
  };

  const addImageUrlField = () => {
    setFormData((prev) => ({ ...prev, images: [...prev.images, ''] }));
  };

  const removeImageUrlField = (index) => {
    if (formData.images.length > 1) {
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
    }
  };

  // File upload to backend multer endpoint
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const data = new FormData();
    for (let i = 0; i < files.length; i++) {
      data.append('images', files[i]);
    }

    try {
      setUploadingImage(true);
      const res = await api.post('/products/upload-images', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success && res.data.imageUrls) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images.filter((img) => img.trim() !== ''), ...res.data.imageUrls],
        }));
        setMessage({ type: 'success', text: 'Images uploaded successfully!' });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Error uploading images',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Variant Matrix Handlers
  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = field === 'quantity' ? Math.max(0, parseInt(value, 10) || 0) : value;
    setVariants(newVariants);
  };

  const addVariantRow = () => {
    const lastColor = variants.length > 0 ? variants[variants.length - 1].color : 'Black';
    setVariants((prev) => [
      ...prev,
      { size: 'UK 8', color: lastColor, quantity: 1, sku: '' },
    ]);
  };

  const removeVariantRow = (index) => {
    if (variants.length > 1) {
      setVariants((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Batch generate size variants for a specific color
  const generateSizeMatrixForColor = (colorName) => {
    if (!colorName) return;
    const newBatch = DEFAULT_SIZES.map((sz) => ({
      size: sz,
      color: colorName,
      quantity: 2, // default 2 pairs
      sku: '',
    }));
    setVariants((prev) => [...prev, ...newBatch]);
  };

  // Calculate total stock units currently in variant builder
  const computedTotalStock = variants.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

  // Quick Create Custom Brand Handler
  const handleCreateCustomBrand = async () => {
    if (!customBrandName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a brand name' });
      return;
    }
    try {
      setSavingBrand(true);
      setMessage({ type: '', text: '' });
      const res = await api.post('/brands', {
        name: customBrandName.trim(),
        description: customBrandDesc.trim(),
        isActive: true,
      });
      if (res.data.success && res.data.brand) {
        await fetchBrands();
        setFormData((prev) => ({ ...prev, brand: res.data.brand._id }));
        setIsCustomBrand(false);
        setCustomBrandName('');
        setCustomBrandDesc('');
        setMessage({
          type: 'success',
          text: `Custom Brand "${res.data.brand.name}" created and selected!`,
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Error creating custom brand',
      });
    } finally {
      setSavingBrand(false);
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validate
    if (!formData.name.trim()) return setMessage({ type: 'error', text: 'Product name is required' });
    if (isCustomBrand) {
      if (!customBrandName.trim()) {
        return setMessage({ type: 'error', text: 'Please enter a custom brand name or switch back to select an existing brand' });
      }
    } else {
      if (!formData.brand) return setMessage({ type: 'error', text: 'Please select a Brand' });
    }
    if (!formData.category) return setMessage({ type: 'error', text: 'Please select a Category' });
    if (!formData.sku.trim()) return setMessage({ type: 'error', text: 'Product SKU is required' });
    if (!formData.sellingPrice || Number(formData.sellingPrice) <= 0) {
      return setMessage({ type: 'error', text: 'Please enter a valid Selling Price' });
    }
    if (variants.length === 0) {
      return setMessage({ type: 'error', text: 'At least one variant size & color is required' });
    }

    const cleanImages = formData.images.filter((img) => img.trim() !== '');
    if (cleanImages.length === 0) {
      cleanImages.push('https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=80');
    }

    const payload = {
      ...formData,
      brand: isCustomBrand ? undefined : formData.brand,
      customBrandName: isCustomBrand ? customBrandName.trim() : undefined,
      sellingPrice: Number(formData.sellingPrice),
      originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
      images: cleanImages,
      variants,
    };

    try {
      setLoading(true);
      if (isEditMode) {
        const res = await api.put(`/products/${id}`, payload);
        if (res.data.success) {
          setMessage({ type: 'success', text: 'Product updated successfully!' });
          setTimeout(() => navigate('/admin/products'), 1200);
        }
      } else {
        const res = await api.post('/products', payload);
        if (res.data.success) {
          setMessage({ type: 'success', text: 'Product created successfully with live inventory data!' });
          setTimeout(() => navigate('/admin/products'), 1200);
        }
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Error saving product. Please check fields.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProduct) {
    return (
      <div className="admin-loading-state">
        <div className="spinner"></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  return (
    <div className="add-edit-product-page">
      <div className="page-header-row">
        <div>
          <Link to="/admin/products" className="back-link">
            <FiArrowLeft /> Back to Products List
          </Link>
          <h1 className="admin-page-heading">
            {isEditMode ? `Edit Product: ${formData.name}` : 'Add New Shoe Model'}
          </h1>
          <p className="admin-page-subtext">
            Configure product catalog information, pricing, images, and live size/colour inventory quantities.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="btn btn-primary btn-lg"
          disabled={loading}
        >
          <FiSave /> {loading ? 'Saving to Database...' : isEditMode ? 'Update Product' : 'Save Product & Inventory'}
        </button>
      </div>

      {message.text && (
        <div className={`action-alert-bar ${message.type}`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="product-form-grid">
        {/* Left Column: Basic Details & Media */}
        <div className="form-main-col">
          {/* 1. Basic Info Card */}
          <div className="form-card">
            <h3 className="card-section-title">1. Shoe Brand & Nomenclature</h3>

            <div className="form-grid-2">
              <div className="form-group full-width">
                <label>Product Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Nike Revolution 7 Running Shoes"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ margin: 0 }}>Brand *</label>
                  <button
                    type="button"
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--color-primary)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontWeight: 600,
                    }}
                    onClick={() => {
                      setIsCustomBrand(!isCustomBrand);
                      if (!isCustomBrand) {
                        setFormData((prev) => ({ ...prev, brand: '' }));
                      }
                    }}
                  >
                    {isCustomBrand ? '← Choose Existing Brand' : '➕ Add Custom Brand'}
                  </button>
                </div>

                {!isCustomBrand ? (
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setIsCustomBrand(true);
                        setFormData((prev) => ({ ...prev, brand: '' }));
                      } else {
                        handleChange(e);
                      }
                    }}
                    required={!isCustomBrand}
                  >
                    <option value="">Select Brand</option>
                    <option value="__add_new__" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      ➕ + Add New Custom Brand...
                    </option>
                    {brands.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div
                    style={{
                      background: 'var(--bg-neutral)',
                      padding: '14px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                        Custom Brand Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Crocs, Under Armour, Columbus, Local Brand..."
                        value={customBrandName}
                        onChange={(e) => setCustomBrandName(e.target.value)}
                        required={isCustomBrand}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                        Brand Description / Tagline (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Lightweight EVA Clogs, Made in India..."
                        value={customBrandDesc}
                        onChange={(e) => setCustomBrandDesc(e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={handleCreateCustomBrand}
                        disabled={savingBrand || !customBrandName.trim()}
                      >
                        {savingBrand ? 'Creating Brand...' : '✓ Save & Select Brand Now'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => {
                          setIsCustomBrand(false);
                          setCustomBrandName('');
                        }}
                      >
                        Cancel
                      </button>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        (Or just continue filling form, it will auto-save on submit)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>SKU (Stock Keeping Unit) *</label>
                <input
                  type="text"
                  name="sku"
                  placeholder="e.g. NK-REV7-BLK"
                  value={formData.sku}
                  onChange={handleChange}
                  required
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            </div>
          </div>

          {/* 2. Categorization & Occasion */}
          <div className="form-card">
            <h3 className="card-section-title">2. Category & Department</h3>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Department (Gender) *</label>
                <select name="gender" value={formData.gender} onChange={handleChange} required>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Kids">Kids</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select name="category" value={formData.category} onChange={handleChange} required>
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Subcategory / Style</label>
                <input
                  type="text"
                  name="subcategory"
                  placeholder="e.g. Road Running, Chunky Sneakers, Oxfords"
                  value={formData.subcategory}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Occasion / Use</label>
                <select name="occasion" value={formData.occasion} onChange={handleChange}>
                  <option value="Sports">Sports</option>
                  <option value="Casual">Casual</option>
                  <option value="Formal">Formal</option>
                  <option value="Daily">Daily</option>
                  <option value="School">School</option>
                  <option value="Outdoor">Outdoor</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Pricing */}
          <div className="form-card">
            <h3 className="card-section-title">3. Showroom Pricing</h3>

            <div className="form-grid-2">
              <div className="form-group">
                <label>Selling Price (₹) *</label>
                <input
                  type="number"
                  name="sellingPrice"
                  placeholder="3499"
                  value={formData.sellingPrice}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Original MRP (₹) (Optional - for discount badge)</label>
                <input
                  type="number"
                  name="originalPrice"
                  placeholder="4999"
                  value={formData.originalPrice}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* 4. Description */}
          <div className="form-card">
            <h3 className="card-section-title">4. Shoe Description</h3>
            <div className="form-group full-width">
              <label>Description & Features</label>
              <textarea
                name="description"
                rows="4"
                placeholder="Describe material, sole cushioning, insole tech, comfort level..."
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* 5. Variant Matrix (Size & Color Inventory) */}
          <div className="form-card variant-matrix-card">
            <div className="matrix-header-row">
              <div>
                <h3 className="card-section-title">5. Size & Colour Inventory Matrix</h3>
                <p className="card-subtitle">
                  Configure live pairs available for each colour and size combination.
                </p>
              </div>

              <div className="matrix-quick-tools">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => generateSizeMatrixForColor(variants[0]?.color || 'Black')}
                >
                  + Add Full Size Run (UK 6-11)
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={addVariantRow}
                >
                  <FiPlus /> Add Single Variant
                </button>
              </div>
            </div>

            <div className="matrix-table-wrap">
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th>Colourway</th>
                    <th>Shoe Size</th>
                    <th>In-Store Pairs (Stock)</th>
                    <th>Status</th>
                    <th>Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          type="text"
                          value={v.color}
                          placeholder="e.g. Black, White, Navy"
                          onChange={(e) => handleVariantChange(idx, 'color', e.target.value)}
                          className="matrix-input"
                          required
                        />
                      </td>

                      <td>
                        <input
                          type="text"
                          value={v.size}
                          placeholder="e.g. UK 8"
                          onChange={(e) => handleVariantChange(idx, 'size', e.target.value)}
                          className="matrix-input"
                          required
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          value={v.quantity}
                          min="0"
                          onChange={(e) => handleVariantChange(idx, 'quantity', e.target.value)}
                          className="matrix-input qty-input"
                          required
                        />
                      </td>

                      <td>
                        {v.quantity === 0 ? (
                          <span className="stock-badge stock-out">Out of Stock</span>
                        ) : v.quantity <= 2 ? (
                          <span className="stock-badge stock-low">Low ({v.quantity})</span>
                        ) : (
                          <span className="stock-badge stock-in">In Stock ({v.quantity})</span>
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="icon-action-btn delete"
                          onClick={() => removeVariantRow(idx)}
                          disabled={variants.length <= 1}
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="matrix-summary-row">
              <span>Total Variants Defined: <strong>{variants.length}</strong></span>
              <span>Total Inventory Count: <strong>{computedTotalStock} pairs</strong></span>
              <span className={`status-indicator ${computedTotalStock > 0 ? 'good' : 'zero'}`}>
                Catalogue Status: {computedTotalStock > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Images & Visibility Badges */}
        <div className="form-side-col">
          {/* Product Images */}
          <div className="form-card">
            <h3 className="card-section-title">Product Photography</h3>
            <p className="card-subtitle">
              Upload local image files or provide high-resolution shoe photo URLs.
            </p>

            {/* Local File Upload */}
            <div className="upload-drop-area">
              <label htmlFor="image-file-input" className="file-drop-label">
                <FiUploadCloud size={32} />
                <span>Upload Shoe Images from Computer</span>
                <span className="file-specs">JPG, PNG, WEBP (Max 5MB)</span>
                <input
                  id="image-file-input"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
              {uploadingImage && <span className="upload-spinner">Uploading...</span>}
            </div>

            {/* Image URLs Input list */}
            <div className="image-urls-list">
              <label>Image URLs:</label>
              {formData.images.map((imgUrl, idx) => (
                <div key={idx} className="image-url-row">
                  <input
                    type="text"
                    placeholder="https://..."
                    value={imgUrl}
                    onChange={(e) => handleImageUrlChange(idx, e.target.value)}
                  />
                  <button
                    type="button"
                    className="icon-action-btn delete"
                    onClick={() => removeImageUrlField(idx)}
                    disabled={formData.images.length <= 1}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-outline btn-sm add-url-btn"
                onClick={addImageUrlField}
              >
                + Add Another Image URL
              </button>
            </div>

            {/* Image Previews */}
            {formData.images.filter((img) => img.trim() !== '').length > 0 && (
              <div className="image-previews-grid">
                <label className="preview-label">Live Previews:</label>
                <div className="previews-wrap">
                  {formData.images
                    .filter((img) => img.trim() !== '')
                    .map((url, i) => (
                      <div key={i} className="preview-thumb">
                        <img src={url} alt={`preview ${i}`} />
                        {i === 0 && <span className="primary-pill">Primary</span>}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Visibility Badges */}
          <div className="form-card">
            <h3 className="card-section-title">Showroom Highlighting</h3>

            <div className="checkboxes-stack">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  name="isNewArrival"
                  checked={formData.isNewArrival}
                  onChange={handleChange}
                />
                <div>
                  <strong>Mark as New Arrival</strong>
                  <p>Displays in the "New Arrivals In-Store" section on homepage</p>
                </div>
              </label>

              <label className="checkbox-item">
                <input
                  type="checkbox"
                  name="isPopular"
                  checked={formData.isPopular}
                  onChange={handleChange}
                />
                <div>
                  <strong>Showroom Bestseller / Popular</strong>
                  <p>Featured in popular collections and top customer queries</p>
                </div>
              </label>

              <label className="checkbox-item">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                />
                <div>
                  <strong>Featured Collection</strong>
                  <p>Highlighted at top of search results and brand listings</p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddEditProduct;

