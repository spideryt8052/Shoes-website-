import React, { useState, useEffect, useCallback } from 'react';
import { FiUsers, FiPlus, FiTrash2, FiEdit, FiShield, FiKey } from 'react-icons/fi';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './ManageProducts.css';

const AdminUsersManager = () => {
  const { admin: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    isActive: true,
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/users');
      if (res.data.success) {
        setUsers(res.data.admins || []);
      }
    } catch (err) {
      console.error('Error fetching admin users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const resetForm = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      isActive: true,
    });
  };

  const handleEdit = (u) => {
    setIsEditing(true);
    setCurrentId(u._id);
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role || 'staff',
      isActive: u.isActive !== undefined ? u.isActive : true,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, name) => {
    if (id === currentAdmin?._id) {
      alert('You cannot delete your own logged-in admin account.');
      return;
    }

    if (window.confirm(`Delete user account "${name}"?`)) {
      try {
        const res = await api.delete(`/auth/users/${id}`);
        if (res.data.success) {
          setMessage({ type: 'success', text: `User account "${name}" removed.` });
          fetchUsers();
        }
      } catch (err) {
        setMessage({ type: 'error', text: err.response?.data?.message || 'Error deleting user' });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!formData.name.trim() || !formData.email.trim()) {
      return setMessage({ type: 'error', text: 'Name and email are required.' });
    }

    if (!isEditing && (!formData.password || formData.password.length < 6)) {
      return setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
    }

    try {
      if (isEditing) {
        const res = await api.put(`/auth/users/${currentId}`, formData);
        if (res.data.success) {
          setMessage({ type: 'success', text: 'User account updated successfully!' });
          resetForm();
          fetchUsers();
        }
      } else {
        const res = await api.post('/auth/users', formData);
        if (res.data.success) {
          setMessage({ type: 'success', text: 'New staff user account created!' });
          resetForm();
          fetchUsers();
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error saving user' });
    }
  };

  return (
    <div className="admin-users-page">
      <div className="page-header-row">
        <div>
          <h1 className="admin-page-heading">Staff & Administrator Accounts</h1>
          <p className="admin-page-subtext">
            Manage who can log into the inventory portal, audit movements, and adjust prices.
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
        {/* Left: Users List */}
        <div className="form-main-col">
          <div className="admin-table-container">
            {loading ? (
              <div className="admin-loading-state">
                <div className="spinner"></div>
                <p>Loading accounts...</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>Email Address</th>
                    <th>System Role</th>
                    <th>Status</th>
                    <th>Last Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <strong>{u.name}</strong>
                        {u._id === currentAdmin?._id && (
                          <span className="brand-tag-mini" style={{ marginLeft: '0.4rem', color: '#0284c7' }}>
                            You
                          </span>
                        )}
                      </td>

                      <td>
                        <code>{u.email}</code>
                      </td>

                      <td>
                        <span className="brand-tag-mini">{u.role}</span>
                      </td>

                      <td>
                        <span className={`stock-badge ${u.isActive ? 'stock-in' : 'stock-out'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td>
                        <span className="cat-text">
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                        </span>
                      </td>

                      <td>
                        <div className="table-action-btns">
                          <button
                            type="button"
                            className="icon-action-btn edit"
                            onClick={() => handleEdit(u)}
                            title="Edit User"
                          >
                            <FiEdit />
                          </button>
                          {u._id !== currentAdmin?._id && (
                            <button
                              type="button"
                              className="icon-action-btn delete"
                              onClick={() => handleDelete(u._id, u.name)}
                              title="Delete User"
                            >
                              <FiTrash2 />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Add/Edit User Form */}
        <div className="form-side-col">
          <div className="form-card">
            <h3 className="card-section-title">
              {isEditing ? `Edit User: ${formData.name}` : 'Create Staff Account'}
            </h3>
            <p className="card-subtitle">
              Grant staff access to update store stocks and handle physical showroom inventory.
            </p>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  placeholder="staff@stephouse.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Password {isEditing ? '(Leave blank to keep existing password)' : '*'}
                </label>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!isEditing}
                />
              </div>

              <div className="form-group">
                <label>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="staff">Staff (Inventory & Stock Adjustments)</option>
                  <option value="manager">Store Manager (Products & Inventory)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>

              <div className="checkboxes-stack">
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span>Account is Active</span>
                </label>
              </div>

              <div className="modal-actions">
                {isEditing && (
                  <button type="button" className="btn btn-outline" onClick={resetForm}>
                    Cancel Edit
                  </button>
                )}
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Update User' : 'Create User Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersManager;

