import React, { useState, useEffect, useCallback } from 'react';
import {
  FiUsers,
  FiTrash2,
  FiEdit,
  FiShield,
  FiCheck,
  FiX,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiUserCheck,
} from 'react-icons/fi';
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
    isApproved: true,
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  const isMasterUser = (u) => {
    if (!u) return false;
    return (
      u.isMaster === true ||
      u.role === 'developer' ||
      ['yaseenbrp25@gmail.com', 'yaseen@newmbshoes.com'].includes(u.email?.toLowerCase())
    );
  };

  const isDeveloper = isMasterUser(currentAdmin);

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
      isApproved: true,
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
      isApproved: u.isApproved !== undefined ? u.isApproved : true,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApprove = async (id, name) => {
    try {
      setLoading(true);
      const res = await api.put(`/auth/users/${id}/approve`);
      if (res.data.success) {
        setMessage({ type: 'success', text: `✅ User "${name}" approved successfully! They can now log in.` });
        fetchUsers();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error approving user' });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id, name) => {
    if (window.confirm(`Reject and delete registration for "${name}"?`)) {
      try {
        setLoading(true);
        const res = await api.put(`/auth/users/${id}/reject`);
        if (res.data.success) {
          setMessage({ type: 'success', text: `❌ Registration for "${name}" rejected and removed.` });
          fetchUsers();
        }
      } catch (err) {
        setMessage({ type: 'error', text: err.response?.data?.message || 'Error rejecting user' });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (id, name, userObj) => {
    if (isMasterUser(userObj)) {
      alert('The Master Developer account cannot be deleted.');
      return;
    }

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

    if (!isEditing && !isDeveloper) {
      return setMessage({
        type: 'error',
        text: 'Access denied: Create Pre-Approved Staff Account sirf Master Developer hi kar sakta hai.',
      });
    }

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
          setMessage({ type: 'success', text: 'New staff user account created and approved!' });
          resetForm();
          fetchUsers();
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error saving user' });
    }
  };

  // Separate pending users vs approved users
  const pendingUsers = users.filter((u) => !isMasterUser(u) && u.isApproved === false);
  const approvedUsers = users.filter((u) => isMasterUser(u) || u.isApproved !== false);

  return (
    <div className="admin-users-page">
      <div className="page-header-row">
        <div>
          <h1 className="admin-page-heading">
            <FiShield style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Staff Accounts & Master Developer Approvals
          </h1>
          <p className="admin-page-subtext">
            Security Rule: Koy bhi naya user signup karega toh pehle Developer / Master Admin ke approval ke liye aayega.
          </p>
        </div>
      </div>

      {message.text && (
        <div className={`action-alert-bar ${message.type}`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
        </div>
      )}

      {/* PENDING APPROVALS ALERT BOX (If any users are waiting for Master Developer approval) */}
      {pendingUsers.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>⏳</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#92400e', fontWeight: 800 }}>
                Pending User Approvals ({pendingUsers.length})
              </h3>
            </div>
            <span style={{ background: '#f59e0b', color: '#ffffff', padding: '2px 10px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700 }}>
              Action Required
            </span>
          </div>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: '#78350f' }}>
            Ye users signup page se register huye hain aur login karne ke liye aapke <strong>Master Developer</strong> approval ka intezar kar rahe hain:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pendingUsers.map((pu) => (
              <div
                key={pu._id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{pu.name}</div>
                  <div style={{ color: '#64748b', fontSize: '0.84rem' }}>
                    <code>{pu.email}</code> • Role requested: <strong>{pu.role || 'staff'}</strong> • Registered: {new Date(pu.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {isDeveloper ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleApprove(pu._id, pu.name)}
                      className="btn btn-sm btn-primary"
                      style={{ background: '#16a34a', borderColor: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
                    >
                      <FiCheck /> Approve Login
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(pu._id, pu.name)}
                      className="btn btn-sm btn-outline"
                      style={{ color: '#dc2626', borderColor: '#fca5a5', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FiX /> Reject
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: '#b45309', background: '#fef3c7', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>
                    ⏳ Master Developer Approval Required
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="product-form-grid">
        {/* Left: Active & Approved Users List */}
        <div className="form-main-col">
          <div className="admin-table-container">
            <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                All Authorized Accounts ({approvedUsers.length})
              </h3>
            </div>

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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedUsers.map((u) => {
                    const isMaster = isMasterUser(u);
                    return (
                      <tr key={u._id}>
                        <td>
                          <strong>{u.name}</strong>
                          {isMaster && (
                            <span
                              style={{
                                marginLeft: '0.5rem',
                                background: '#fef3c7',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                              }}
                            >
                              👑 Master Developer
                            </span>
                          )}
                          {u._id === currentAdmin?._id && !isMaster && (
                            <span className="brand-tag-mini" style={{ marginLeft: '0.4rem', color: '#0284c7' }}>
                              You
                            </span>
                          )}
                        </td>

                        <td>
                          <code>{u.email}</code>
                        </td>

                        <td>
                          <span className="brand-tag-mini" style={{ textTransform: 'uppercase', fontWeight: 700 }}>
                            {isMaster ? 'Developer' : u.role}
                          </span>
                        </td>

                        <td>
                          <span className={`stock-badge ${u.isActive ? 'stock-in' : 'stock-out'}`}>
                            {u.isActive ? 'Active & Approved' : 'Inactive'}
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
                            {isDeveloper && !isMaster && u._id !== currentAdmin?._id && (
                              <button
                                type="button"
                                className="icon-action-btn delete"
                                onClick={() => handleDelete(u._id, u.name, u)}
                                title="Delete User"
                              >
                                <FiTrash2 />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Add/Edit User Form */}
        <div className="form-side-col">
          {isEditing || isDeveloper ? (
            <div className="form-card">
              <h3 className="card-section-title">
                {isEditing ? `Edit User: ${formData.name}` : '👑 Create Pre-Approved Staff Account'}
              </h3>
              <p className="card-subtitle">
                {isEditing
                  ? 'Update staff details, role or activation status.'
                  : 'Master Developer yahan se seedhe staff account bana kar approve kar sakte hain.'}
              </p>

              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Counter Staff 1"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    placeholder="staff@newmbshoes.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Password {isEditing ? '(Leave blank to keep current)' : '*'}
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
                    <option value="staff">Billing Staff (POS Quick Sell Only)</option>
                    <option value="manager">Store Manager (Products, Stock & Sales)</option>
                    <option value="admin">Administrator (Full Access)</option>
                  </select>
                </div>

                <div className="checkboxes-stack" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <span>Account is Active</span>
                  </label>
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={formData.isApproved}
                      onChange={(e) => setFormData({ ...formData, isApproved: e.target.checked })}
                    />
                    <span>Approved for Login (Master Authorized)</span>
                  </label>
                </div>

                <div className="modal-actions" style={{ marginTop: '1rem' }}>
                  {isEditing && (
                    <button type="button" className="btn btn-outline" onClick={resetForm}>
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="btn btn-primary">
                    {isEditing ? 'Save Changes' : 'Create & Approve Account'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div
              className="form-card"
              style={{
                textAlign: 'center',
                padding: '36px 20px',
                background: '#f8fafc',
                border: '1.5px dashed #cbd5e1',
                borderRadius: '12px',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#fef3c7',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: '24px',
                }}
              >
                <FiShield />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                Master Developer Only
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5 }}>
                Create Pre-Approved Staff Account ye bss <strong>Master Developer</strong> hee kar sakta hai.
                Naye staff members signup page se register kar sakte hain, aur unhe approve bhi Master Developer hi karega.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsersManager;
