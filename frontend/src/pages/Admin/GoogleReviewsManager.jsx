import React, { useState, useEffect, useCallback } from 'react';
import { FiStar, FiPlus, FiTrash2, FiEdit, FiCheckCircle } from 'react-icons/fi';
import api from '../../services/api';
import './ManageProducts.css';

const GoogleReviewsManager = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    authorName: '',
    authorAvatar: '',
    rating: 5,
    reviewText: '',
    relativeTime: 'Recent in-store visit',
    shoesPurchased: '',
    source: 'Google Reviews',
    isApproved: true,
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/reviews/admin');
      if (res.data.success) {
        setReviews(res.data.reviews || []);
      }
    } catch (err) {
      console.error('Error fetching admin reviews:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const resetForm = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      authorName: '',
      authorAvatar: '',
      rating: 5,
      reviewText: '',
      relativeTime: 'Recent in-store visit',
      shoesPurchased: '',
      source: 'Google Reviews',
      isApproved: true,
    });
  };

  const handleEdit = (rev) => {
    setIsEditing(true);
    setCurrentId(rev._id);
    setFormData({
      authorName: rev.authorName,
      authorAvatar: rev.authorAvatar || '',
      rating: rev.rating || 5,
      reviewText: rev.reviewText,
      relativeTime: rev.relativeTime || '',
      shoesPurchased: rev.shoesPurchased || '',
      source: rev.source || 'Google Reviews',
      isApproved: rev.isApproved !== undefined ? rev.isApproved : true,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, author) => {
    if (window.confirm(`Delete review from "${author}"?`)) {
      try {
        const res = await api.delete(`/reviews/${id}`);
        if (res.data.success) {
          setMessage({ type: 'success', text: 'Review removed successfully.' });
          fetchReviews();
        }
      } catch (err) {
        setMessage({ type: 'error', text: err.response?.data?.message || 'Error deleting review' });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!formData.authorName.trim() || !formData.reviewText.trim()) {
      return setMessage({ type: 'error', text: 'Reviewer name and review text are required.' });
    }

    try {
      if (isEditing) {
        const res = await api.put(`/reviews/${currentId}`, formData);
        if (res.data.success) {
          setMessage({ type: 'success', text: 'Review updated successfully!' });
          resetForm();
          fetchReviews();
        }
      } else {
        const res = await api.post('/reviews', formData);
        if (res.data.success) {
          setMessage({ type: 'success', text: 'New review added successfully!' });
          resetForm();
          fetchReviews();
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error saving review' });
    }
  };

  return (
    <div className="manage-reviews-page">
      <div className="page-header-row">
        <div>
          <h1 className="admin-page-heading">Google Customer Reviews Management</h1>
          <p className="admin-page-subtext">
            Manage customer feedback, testimonials, and verified in-store trial reviews displayed on the website.
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
        {/* Left: Reviews List */}
        <div className="form-main-col">
          <div className="admin-table-container">
            {loading ? (
              <div className="admin-loading-state">
                <div className="spinner"></div>
                <p>Loading customer reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="empty-panel-msg">
                <p>No customer reviews recorded yet.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Rating</th>
                    <th>Review Snippet</th>
                    <th>Shoe Model</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <strong>{r.authorName}</strong>
                        <span className="cat-text">{r.relativeTime}</span>
                      </td>

                      <td>
                        <span className="star-gold">{'★'.repeat(r.rating)}</span>
                      </td>

                      <td>
                        <span className="remarks-text">"{r.reviewText}"</span>
                      </td>

                      <td>
                        <span className="brand-tag-mini">{r.shoesPurchased || 'In-Store Trial'}</span>
                      </td>

                      <td>
                        <span className={`stock-badge ${r.isApproved ? 'stock-in' : 'stock-out'}`}>
                          {r.isApproved ? 'Approved' : 'Hidden'}
                        </span>
                      </td>

                      <td>
                        <div className="table-action-btns">
                          <button
                            type="button"
                            className="icon-action-btn edit"
                            onClick={() => handleEdit(r)}
                            title="Edit Review"
                          >
                            <FiEdit />
                          </button>
                          <button
                            type="button"
                            className="icon-action-btn delete"
                            onClick={() => handleDelete(r._id, r.authorName)}
                            title="Delete Review"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Add/Edit Review Form */}
        <div className="form-side-col">
          <div className="form-card">
            <h3 className="card-section-title">
              {isEditing ? `Edit Review: ${formData.authorName}` : 'Add In-Store Customer Review'}
            </h3>
            <p className="card-subtitle">
              Add genuine review snippets from your physical shop's Google Business Profile.
            </p>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label>Reviewer / Customer Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Verma"
                  value={formData.authorName}
                  onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Rating (1 to 5 Stars) *</label>
                <select
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                >
                  <option value={5}>★★★★★ (5 Stars - Exceptional)</option>
                  <option value={4}>★★★★☆ (4 Stars - Very Good)</option>
                  <option value={3}>★★★☆☆ (3 Stars - Average)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Shoe Purchased / Tried On</label>
                <input
                  type="text"
                  placeholder="e.g. Nike Revolution 7 (Size UK 9)"
                  value={formData.shoesPurchased}
                  onChange={(e) => setFormData({ ...formData, shoesPurchased: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Review Text *</label>
                <textarea
                  rows="4"
                  placeholder="Customer feedback on physical showroom trial, fitting, and footwear quality..."
                  value={formData.reviewText}
                  onChange={(e) => setFormData({ ...formData, reviewText: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Relative Time Description</label>
                <input
                  type="text"
                  placeholder="e.g. 2 weeks ago, 1 month ago"
                  value={formData.relativeTime}
                  onChange={(e) => setFormData({ ...formData, relativeTime: e.target.value })}
                />
              </div>

              <div className="checkboxes-stack">
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.isApproved}
                    onChange={(e) => setFormData({ ...formData, isApproved: e.target.checked })}
                  />
                  <span>Approve & Display on Customer Website</span>
                </label>
              </div>

              <div className="modal-actions">
                {isEditing && (
                  <button type="button" className="btn btn-outline" onClick={resetForm}>
                    Cancel Edit
                  </button>
                )}
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Update Review' : 'Add Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleReviewsManager;

