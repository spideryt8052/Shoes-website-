import React, { useEffect, useState, useCallback } from 'react';
import {
  FiClock,
  FiSearch,
  FiFilter,
  FiArrowUp,
  FiArrowDown,
  FiRotateCw,
  FiFileText,
} from 'react-icons/fi';
import api from '../../services/api';
import './StockHistoryView.css';

const StockHistoryView = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [changeType, setChangeType] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (changeType !== 'All') params.append('changeType', changeType);
      params.append('page', page);
      params.append('limit', 20);

      const res = await api.get(`/stock-history?${params.toString()}`);
      if (res.data.success) {
        setHistory(res.data.history);
        setTotalPages(res.data.totalPages);
        setTotalRecords(res.data.total);
      }
    } catch (err) {
      console.error('Error fetching stock history:', err);
    } finally {
      setLoading(false);
    }
  }, [search, changeType, page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="stock-history-page">
      <div className="page-header-row">
        <div>
          <h1 className="admin-page-heading">Inventory Movement Audit Trail</h1>
          <p className="admin-page-subtext">
            Permanent, immutable ledger of all stock changes, in-store sales, restocks, and quantity adjustments.
          </p>
        </div>

        <button className="btn btn-outline btn-sm" onClick={fetchHistory} disabled={loading}>
          <FiRotateCw /> Refresh Ledger
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-filters-bar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by shoe name, admin staff name, or remarks..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="filter-dropdowns">
          <select
            value={changeType}
            onChange={(e) => {
              setChangeType(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">All Movement Types</option>
            <option value="Stock In">Stock In (Restock)</option>
            <option value="Stock Out">Stock Out (In-Store Sale)</option>
            <option value="Manual Adjustment">Manual Adjustment</option>
            <option value="Initial Stock">Initial Stock</option>
            <option value="Damaged / Removed">Damaged / Removed</option>
            <option value="Bulk Restock">Bulk Restock</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="admin-table-container">
        {loading ? (
          <div className="admin-loading-state">
            <div className="spinner"></div>
            <p>Loading stock movement records...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="empty-panel-msg">
            <FiFileText size={32} />
            <p>No stock movement logs found for current filters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Shoe Product</th>
                  <th>Variant (Colour & Size)</th>
                  <th>Movement Type</th>
                  <th>Quantity Shift</th>
                  <th>Stock Balance</th>
                  <th>Staff Responsible</th>
                  <th>Audit Remarks</th>
                </tr>
              </thead>
              <tbody>
                {history.map((log) => {
                  const isPositive = log.quantityChanged > 0;
                  const isZeroChange = log.quantityChanged === 0;

                  return (
                    <tr key={log._id}>
                      <td>
                        <div className="date-time-cell">
                          <strong>{new Date(log.createdAt).toLocaleDateString()}</strong>
                          <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                      </td>

                      <td>
                        <strong className="cell-name">{log.productName}</strong>
                      </td>

                      <td>
                        <span className="brand-tag-mini">{log.color} / {log.size}</span>
                      </td>

                      <td>
                        <span
                          className={`movement-badge ${
                            log.changeType === 'Stock In'
                              ? 'in'
                              : log.changeType === 'Stock Out'
                              ? 'out'
                              : 'adjust'
                          }`}
                        >
                          {log.changeType}
                        </span>
                      </td>

                      <td>
                        <span className={`diff-num ${isPositive ? 'plus' : isZeroChange ? 'zero' : 'minus'}`}>
                          {isPositive ? `+${log.quantityChanged}` : log.quantityChanged}
                        </span>
                      </td>

                      <td>
                        <span className="balance-text">
                          {log.previousQuantity} → <strong>{log.newQuantity}</strong> pairs
                        </span>
                      </td>

                      <td>
                        <span className="admin-user-cell">{log.adminName || 'Store Staff'}</span>
                      </td>

                      <td>
                        <span className="remarks-text">{log.remarks || '—'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-bar">
          <button
            className="pagination-btn"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Previous
          </button>
          <span className="page-indicator">
            Page {page} of {totalPages} ({totalRecords} audit entries)
          </span>
          <button
            className="pagination-btn"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default StockHistoryView;

