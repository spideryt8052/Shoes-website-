import React, { useState, useEffect, useCallback } from 'react';
import {
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAlertCircle,
  FiUser,
  FiPackage,
  FiShield,
  FiCheck,
  FiX,
  FiRefreshCw,
} from 'react-icons/fi';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './ManageProducts.css';

const RemovalRequestsManager = () => {
  const { admin: currentAdmin } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dailyStatus, setDailyStatus] = useState({ requestsToday: 0, maxDaily: 5, remainingToday: 5 });
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

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await api.get(`/removal-requests?${params.toString()}`);
      if (res.data.success) {
        setRequests(res.data.requests || []);
        setDailyStatus({
          requestsToday: res.data.requestsToday || 0,
          maxDaily: res.data.maxDaily || 5,
          remainingToday: res.data.remainingToday !== undefined ? res.data.remainingToday : 5,
        });
      }
    } catch (err) {
      console.error('Error fetching removal requests:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (reqId, itemName) => {
    if (!window.confirm(`Kya aap confirm karte hain ki "${itemName || 'Item'}" ko permanently remove/delete karna hai?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.put(`/removal-requests/${reqId}/approve`);
      if (res.data.success) {
        setMessage({
          type: 'success',
          text: res.data.message || `Request approved and item deleted!`,
        });
        fetchRequests();
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Error approving removal request',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reqId, itemName) => {
    const reason = window.prompt(`Reject karne ka karan likhein (Optional):`, 'Not approved by store management');
    if (reason === null) return; // cancelled

    try {
      setActionLoading(true);
      const res = await api.put(`/removal-requests/${reqId}/reject`, { rejectionReason: reason });
      if (res.data.success) {
        setMessage({
          type: 'success',
          text: `Removal request for "${itemName || 'Item'}" rejected.`,
        });
        fetchRequests();
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Error rejecting removal request',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const pendingList = requests.filter((r) => r.status === 'pending');

  return (
    <div className="manage-products-page">
      <div className="page-header-row">
        <div>
          <h1 className="admin-page-heading">
            {isAdmin ? 'Item & Order Removal Requests' : 'My Item Removal Requests'}
          </h1>
          <p className="admin-page-subtext">
            {isAdmin
              ? 'Staff members dwara bheji gayi item/order removal requests ko review aur approve karein.'
              : 'Staff direct item delete nahi kar sakte. Aapki bheji gayi removal requests yahan show hoti hain (Max 5 per day).'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={fetchRequests}
            title="Refresh list"
            disabled={loading}
          >
            <FiRefreshCw className={loading ? 'spin-icon' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Quota Banner for Staff */}
      {isStaff && (
        <div
          style={{
            background: dailyStatus.remainingToday > 0 ? '#eff6ff' : '#fef2f2',
            border: `1.5px solid ${dailyStatus.remainingToday > 0 ? '#bfdbfe' : '#fecaca'}`,
            borderRadius: '10px',
            padding: '14px 20px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: dailyStatus.remainingToday > 0 ? '#3b82f6' : '#ef4444',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
              }}
            >
              <FiClock />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                Daily Removal Quota (Ek Din Me Max 5 Requests)
              </div>
              <div style={{ color: '#475569', fontSize: '0.84rem' }}>
                Aapne aaj <strong>{dailyStatus.requestsToday}</strong> requests bhej chuke hain. Remaining: <strong>{dailyStatus.remainingToday} / {dailyStatus.maxDaily}</strong>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: '0.85rem',
              background: dailyStatus.remainingToday > 0 ? '#dbeafe' : '#fee2e2',
              color: dailyStatus.remainingToday > 0 ? '#1e40af' : '#b91c1c',
            }}
          >
            {dailyStatus.remainingToday > 0 ? `${dailyStatus.remainingToday} Requests Left Today` : 'Daily Limit Reached'}
          </div>
        </div>
      )}

      {/* Alert bar */}
      {message.text && (
        <div className={`action-alert-bar ${message.type}`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'All Requests' },
          { key: 'pending', label: `Pending (${pendingList.length})` },
          { key: 'approved', label: 'Approved & Deleted' },
          { key: 'rejected', label: 'Rejected' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: statusFilter === tab.key ? '2px solid #2563eb' : '1px solid #cbd5e1',
              background: statusFilter === tab.key ? '#eff6ff' : '#ffffff',
              color: statusFilter === tab.key ? '#1d4ed8' : '#475569',
              fontWeight: statusFilter === tab.key ? 700 : 500,
              cursor: 'pointer',
              fontSize: '0.88rem',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests Table / Cards */}
      <div className="admin-table-container">
        {loading ? (
          <div className="admin-loading-state">
            <div className="spinner"></div>
            <p>Loading removal requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
            <FiCheckCircle size={40} style={{ color: '#10b981', marginBottom: '12px' }} />
            <h3 style={{ margin: '0 0 6px', color: '#0f172a' }}>Koyi Removal Request Nahi Hai</h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              {statusFilter === 'pending'
                ? 'Abhi koyi pending request nahi hai. Sabhi items processed hain.'
                : 'Yahan abhi tak koyi removal request submit nahi hui.'}
            </p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Item / Product</th>
                <th>Requested By</th>
                <th>Reason</th>
                <th>Date</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const isPending = r.status === 'pending';
                const isApproved = r.status === 'approved';
                const isRejected = r.status === 'rejected';

                return (
                  <tr key={r._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {r.productImage ? (
                          <img
                            src={r.productImage}
                            alt=""
                            style={{
                              width: '44px',
                              height: '44px',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '6px',
                              background: '#f1f5f9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#64748b',
                            }}
                          >
                            <FiPackage size={20} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>
                            {r.productName || r.invoiceNumber || 'Inventory Item'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            {r.productSku && <span>SKU: {r.productSku} • </span>}
                            {r.variantSize && <span>Size: {r.variantSize} • </span>}
                            <span style={{ textTransform: 'capitalize' }}>Type: {r.itemType?.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{r.requesterName}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        <code>{r.requesterEmail}</code> ({r.requesterRole || 'staff'})
                      </div>
                    </td>

                    <td style={{ maxWidth: '240px' }}>
                      <div style={{ fontSize: '0.88rem', color: '#334155', fontStyle: 'italic' }}>
                        "{r.reason}"
                      </div>
                      {r.rejectionReason && (
                        <div style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '4px' }}>
                          Rejection note: {r.rejectionReason}
                        </div>
                      )}
                    </td>

                    <td>
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        {new Date(r.createdAt).toLocaleDateString()} {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>

                    <td>
                      {isPending && (
                        <span
                          style={{
                            background: '#fef3c7',
                            color: '#b45309',
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <FiClock /> Pending Approval
                        </span>
                      )}
                      {isApproved && (
                        <span
                          style={{
                            background: '#dcfce7',
                            color: '#15803d',
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <FiCheckCircle /> Approved & Deleted
                        </span>
                      )}
                      {isRejected && (
                        <span
                          style={{
                            background: '#fee2e2',
                            color: '#b91c1c',
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <FiXCircle /> Rejected
                        </span>
                      )}
                    </td>

                    {isAdmin && (
                      <td>
                        {isPending ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleApprove(r._id, r.productName)}
                              disabled={actionLoading}
                              className="btn btn-sm btn-primary"
                              style={{
                                background: '#16a34a',
                                borderColor: '#16a34a',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 700,
                              }}
                              title="Approve removal & permanently delete item"
                            >
                              <FiCheck /> Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(r._id, r.productName)}
                              disabled={actionLoading}
                              className="btn btn-sm btn-outline"
                              style={{
                                color: '#dc2626',
                                borderColor: '#fca5a5',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              title="Reject removal"
                            >
                              <FiX /> Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                            Processed by {r.reviewerName || 'Management'}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RemovalRequestsManager;

