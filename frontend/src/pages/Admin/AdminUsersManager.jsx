import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
  const isAdmin = currentAdmin?.role === 'admin' || isDeveloper;
  const isStaff = !isAdmin;

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

    if (!isEditing && !isDeveloper && !isAdmin) {
      return setMessage({
        type: 'error',
        text: 'Access denied: Staff accounts user create nahi kar sakte.',
      });
    }

    if (!formData.name.trim() || !formData.email.trim()) {
      return setMessage({ type: 'error', text: 'Name and email are required.' });
    }

    if (!isEditing && (!formData.password || formData.password.length < 6)) {
      return setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
    }

    try {
      const payload = {
        ...formData,
        role: isDeveloper ? formData.role : 'staff', // Regular admin can ONLY create staff
      };

      if (isEditing) {
        const res = await api.put(`/auth/users/${currentId}`, payload);
        if (res.data.success) {
          setMessage({ type: 'success', text: 'User account updated successfully!' });
          resetForm();
          fetchUsers();
        }
      } else {
        const res = await api.post('/auth/users', payload);
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

  // If staff accesses /admin/users, block with informative restricted card
  if (isStaff) {
    return (
      <div className="manage-products-page">
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            marginTop: '2rem',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '28px',
            }}
          >
            <FiShield />
          </div>
          <h2 style={{ color: '#0f172a', margin: '0 0 8px' }}>Staff Access Restricted</h2>
          <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '24px' }}>
            Admin User Management option sirf <strong>Developer</strong> aur <strong>Admin</strong> ke liye uplabdh hai. Staff accounts ko user management ka access nahi hai.
          </p>
          <Link to="/admin/inventory" className="btn btn-primary">
            Go to Footwear Inventory
          </Link>
        </div>
      </div>
    );
  }

  // Developer sees all accounts; Store Admin sees ONLY staff accounts
  const visibleUsers = isDeveloper ? users : users.filter((u) => u.role === 'staff');
  const pendingUsers = visibleUsers.filter((u) => !isMasterUser(u) && u.isApproved === false);
  const approvedUsers = visibleUsers.filter((u) => isMasterUser(u) || u.isApproved !== false);

  return (
    <div className="admin-users-page">
      <div className="page-header-row">
        <div>
          <h1 className="admin-page-heading">
            <FiShield style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            {isDeveloper ? 'All System Accounts & Approvals' : 'Staff Accounts Management'}
          </h1>
          <p className="admin-page-subtext">
            {isDeveloper
              ? 'Master Developer view: Yahan Developer, Store Admin aur Staff sabhi accounts visible hain.'
              : 'Store Admin view: Yahan sirf Counter & Inventory Staff accounts dikhayi de rahe hain.'}
          </p>
        </div>
      </div>

      {message.text && (
        <div className={`action-alert-bar ${message.type}`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
        </div>
      )}

      {/* PENDING APPROVALS ALERT BOX */}
      {pendingUsers.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiClock style={{ color: '#d97706', fontSize: '1.2rem' }} />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#92400e' }}>
                Pending Registration Approvals ({pendingUsers.length})
              </h3>
            </div>
            <span style={{ background: '#f59e0b', color: '#ffffff', padding: '2px 10px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 700 }}>
              Action Required
            </span>
          </div>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: '#78350f' }}>
            Ye users signup page se register huye hain aur login karne ke liye approval ka intezar kar rahe hain:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pendingUsers.map((pu) => {
              const canApproveThis = isDeveloper || (isAdmin && pu.role === 'staff');

              return (
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

                  {canApproveThis ? (
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
              );
            })}
          </div>
        </div>
      )}

      <div className="product-form-grid">
        {/* Left: Active & Approved Users List */}
        <div className="form-main-col">
          <div className="admin-table-container">
            <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                {isDeveloper ? `All Authorized Accounts (${approvedUsers.length})` : `Staff Team Accounts (${approvedUsers.length})`}
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
                    const canDeleteThis =
                      (isDeveloper || (isAdmin && u.role === 'staff')) &&
                      !isMaster &&
                      u._id !== currentAdmin?._id;

                    return (
                      <tr key={u._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: isMaster ? '#fef3c7' : '#e0e7ff',
                                color: isMaster ? '#b45309' : '#4338ca',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                              }}
                            >
                              {u.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <span style={{ fontWeight: 600, color: '#0f172a' }}>{u.name}</span>
                              {isMaster && (
                                <span
                                  style={{
                                    marginLeft: '6px',
                                    background: '#fef3c7',
                                    color: '#b45309',
                                    fontSize: '0.72rem',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    fontWeight: 700,
                                  }}
                                >
                                  👑 Master
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span style={{ color: '#475569', fontSize: '0.88rem' }}>{u.email}</span>
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
                            {canDeleteThis && (
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
          <div className="form-card">
            <h3 className="card-section-title">
              {isEditing
                ? `Edit User: ${formData.name}`
                : isDeveloper
                ? '👑 Create Pre-Approved User Account'
                : '➕ Create Staff Account'}
            </h3>
            <p className="card-subtitle">
              {isEditing
                ? 'Update staff details, role or activation status.'
                : isDeveloper
                ? 'Developer yahan se kisi bhi role ka account bana kar approve kar sakte hain.'
                : 'Store Admin yahan se seedhe staff account bana kar approve kar sakte hain.'}
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
                {isDeveloper ? (
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="staff">Billing Staff (POS Quick Sell & Inventory)</option>
                    <option value="manager">Store Manager (Products, Stock & Sales)</option>
                    <option value="admin">Administrator (Store Admin)</option>
                    <option value="developer">Master Developer</option>
                  </select>
                ) : (
                  <div>
                    <input
                      type="text"
                      value="Billing & Inventory Staff"
                      disabled
                      style={{ background: '#f8fafc', color: '#475569', cursor: 'not-allowed' }}
                    />
                    <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                      Admin sirf staff accounts bana sakta hai.
                    </span>
                  </div>
                )}
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
                  <span>Approved for Login</span>
                </label>
              </div>

              <div className="modal-actions" style={{ marginTop: '1rem' }}>
                {isEditing && (
                  <button type="button" className="btn btn-outline" onClick={resetForm}>
                    Cancel
                  </button>
                )}
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Save Changes' : isDeveloper ? 'Create & Approve Account' : 'Create Staff Account'}
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
