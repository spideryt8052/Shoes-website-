import React, { useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiTag, FiCheckCircle } from 'react-icons/fi';
import api from '../../services/api';
import { useStore } from '../../context/StoreContext';
import './ManageProducts.css';

const ManageCategories = () => {
  const { categories, fetchCategories } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    targetAudience: ['Unisex'],
    occasion: 'Casual',
    description: '',
    subcategories: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const resetForm = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      name: '',
      targetAudience: ['Unisex'],
      occasion: 'Casual',
      description: '',
      subcategories: '',
    });
  };

  const handleEdit = (cat) => {
    setIsEditing(true);
    setCurrentId(cat._id);
    setFormData({
      name: cat.name,
      targetAudience: cat.targetAudience || ['Unisex'],
      occasion: cat.occasion || 'Casual',
      description: cat.description || '',
      subcategories: (cat.subcategories || []).join(', '),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      try {
        const res = await api.delete(`/categories/${id}`);
        if (res.data.success) {
          setMessage({ type: 'success', text: `Category "${name}" deleted successfully.` });
          fetchCategories();
        }
      } catch (err) {
        setMessage({ type: 'error', text: err.response?.data?.message || 'Error deleting category' });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!formData.name.trim()) {
      return setMessage({ type: 'error', text: 'Category name is required' });
    }

    const payload = {
      ...formData,
      subcategories: formData.subcategories
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    };

    try {
      setLoading(true);
      if (isEditing) {
        const res = await api.put(`/categories/${currentId}`, payload);
        if (res.data.success) {
          setMessage({ type: 'success', text: 'Category updated successfully!' });
          resetForm();
          fetchCategories();
        }
      } else {
        const res = await api.post('/categories', payload);
        if (res.data.success) {
          setMessage({ type: 'success', text: 'New category created successfully!' });
          resetForm();
          fetchCategories();
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error saving category' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manage-categories-page">
      <div className="page-header-row">
        <div>
          <h1 className="admin-page-heading">Footwear Categories & Occasions</h1>
          <p className="admin-page-subtext">
            Organize catalog shoes by category (Running, Sneakers, Formal, Boots, Sandals) and subcategories.
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
        {/* Left: Categories List */}
        <div className="form-main-col">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Department</th>
                  <th>Occasion</th>
                  <th>Models in Stock</th>
                  <th>Subcategories</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td>
                      <span className="brand-tag-mini">{(c.targetAudience || []).join(', ')}</span>
                    </td>
                    <td>{c.occasion}</td>
                    <td>
                      <strong>{c.productCount || 0} shoes</strong>
                    </td>
                    <td>
                      <span className="cat-text">{(c.subcategories || []).join(', ') || 'General'}</span>
                    </td>
                    <td>
                      <div className="table-action-btns">
                        <button
                          type="button"
                          className="icon-action-btn edit"
                          onClick={() => handleEdit(c)}
                          title="Edit Category"
                        >
                          <FiEdit />
                        </button>
                        <button
                          type="button"
                          className="icon-action-btn delete"
                          onClick={() => handleDelete(c._id, c.name)}
                          title="Delete Category"
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

        {/* Right: Add/Edit Category Form */}
        <div className="form-side-col">
          <div className="form-card">
            <h3 className="card-section-title">
              {isEditing ? `Edit Category: ${formData.name}` : 'Add New Category'}
            </h3>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label>Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Walking Shoes, Chelsea Boots"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Occasion / Use *</label>
                <select
                  value={formData.occasion}
                  onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                >
                  <option value="Sports">Sports</option>
                  <option value="Casual">Casual</option>
                  <option value="Formal">Formal</option>
                  <option value="Daily">Daily</option>
                  <option value="School">School</option>
                  <option value="Outdoor">Outdoor</option>
                </select>
              </div>

              <div className="form-group">
                <label>Subcategories (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Road Running, Trail, Marathon"
                  value={formData.subcategories}
                  onChange={(e) => setFormData({ ...formData, subcategories: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  rows="3"
                  placeholder="Brief description of this footwear category..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                {isEditing && (
                  <button type="button" className="btn btn-outline" onClick={resetForm}>
                    Cancel Edit
                  </button>
                )}
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : isEditing ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageCategories;

