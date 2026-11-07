import React, { useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiActivity, FiStar } from 'react-icons/fi';
import api from '../../services/api';
import { useStore } from '../../context/StoreContext';
import './ManageProducts.css';

const ManageBrands = () => {
  const { brands, fetchBrands } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    description: '',
    isFeatured: false,
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const resetForm = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      name: '',
      logoUrl: '',
      description: '',
      isFeatured: false,
      isActive: true,
    });
  };

  const handleEdit = (brand) => {
    setIsEditing(true);
    setCurrentId(brand._id);
    setFormData({
      name: brand.name,
      logoUrl: brand.logoUrl || '',
      description: brand.description || '',
      isFeatured: Boolean(brand.isFeatured),
      isActive: Boolean(brand.isActive),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete brand "${name}"? Note: Brands containing active products cannot be removed.`)) {
      try {
        const res = await api.delete(`/brands/${id}`);
        if (res.data.success) {
          setMessage({ type: 'success', text: `Brand "${name}" removed successfully.` });
          fetchBrands();
        }
      } catch (err) {
        setMessage({ type: 'error', text: err.response?.data?.message || 'Error deleting brand' });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!formData.name.trim()) {
      return setMessage({ type: 'error', text: 'Brand name is required' });
    }

    try {
      setLoading(true);
      if (isEditing) {
        const res = await api.put(`/brands/${currentId}`, formData);
        if (res.data.success) {
          setMessage({ type: 'success', text: `Brand "${formData.name}" updated successfully!` });
          resetForm();
          fetchBrands();
        }
      } else {
        const res = await api.post('/brands', formData);
        if (res.data.success) {
          setMessage({ type: 'success', text: `Brand "${formData.name}" added to showroom catalogue!` });
          resetForm();
          fetchBrands();
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error saving brand' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manage-brands-page">
      <div className="page-header-row">
        <div>
          <h1 className="admin-page-heading">Dynamic Brands Management</h1>
          <p className="admin-page-subtext">
            Add any global or local shoe manufacturer dynamically. Brands immediately integrate into filters and navigation.
          </p>
        </div>
      </div>

      {message.text && (
        <div className={`action-alert-bar ${message.type}`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
        </div>
      )}

      <div className="product-form-grid">
        {/* Left: Brands List */}
        <div className="form-main-col">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Brand Name</th>
                  <th>Models in Showroom</th>
                  <th>Total Physical Units</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <strong className="cell-name">{b.name}</strong>
                      {b.description && <span className="cat-text">{b.description}</span>}
                    </td>
                    <td>
                      <strong>{b.productCount || 0} models</strong>
                    </td>
                    <td>{b.totalStockUnits || 0} pairs</td>
                    <td>
                      <span className={`stock-badge ${b.isActive ? 'stock-in' : 'stock-out'}`}>
                        {b.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td>
                      {b.isFeatured ? (
                        <span className="featured-tag">★ Featured</span>
                      ) : (
                        <span className="cat-text">Standard</span>
                      )}
                    </td>
                    <td>
                      <div className="table-action-btns">
                        <button
                          type="button"
                          className="icon-action-btn edit"
                          onClick={() => handleEdit(b)}
                          title="Edit Brand"
                        >
                          <FiEdit />
                        </button>
                        <button
                          type="button"
                          className="icon-action-btn delete"
                          onClick={() => handleDelete(b._id, b.name)}
                          title="Delete Brand"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Add/Edit Brand Form */}
        <div className="form-side-col">
          <div className="form-card">
            <h3 className="card-section-title">
              {isEditing ? `Edit Brand: ${formData.name}` : 'Add New Dynamic Brand'}
            </h3>
            <p className="card-subtitle">
              Dynamic addition allows adding Nike, Adidas, Sparx, Asics, Red Chief, or any brand.
            </p>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label>Brand Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Asics, Woodland, Clarks"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Brand Logo URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://.../logo.png"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Brand Overview / Heritage</label>
                <textarea
                  rows="3"
                  placeholder="e.g. World leading Japanese running and athletic footwear brand..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="checkboxes-stack">
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  />
                  <span>Feature in Homepage Brands Banner</span>
                </label>

                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span>Brand is Active in Showroom</span>
                </label>
              </div>

              <div className="modal-actions">
                {isEditing && (
                  <button type="button" className="btn btn-outline" onClick={resetForm}>
                    Cancel Edit
                  </button>
                )}
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : isEditing ? 'Update Brand' : 'Add Brand to Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageBrands;

