import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiBox,
  FiActivity,
  FiLayers,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiArrowRight,
  FiPlus,
  FiClock,
  FiTrendingUp,
  FiZap,
} from 'react-icons/fi';
import api from '../../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentStockHistory, setRecentStockHistory] = useState([]);
  const [alertProducts, setAlertProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/inventory/dashboard-stats');
        if (res.data.success) {
          setStats(res.data.stats);
          setRecentProducts(res.data.recentProducts || []);
          setRecentStockHistory(res.data.recentStockHistory || []);
          setAlertProducts(res.data.alertProducts || []);
        }
      } catch (err) {
        console.error('Error fetching admin dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="admin-loading-state">
        <div className="spinner"></div>
        <p>Calculating live inventory and showroom KPIs...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      {/* Top Welcome & Quick Actions */}
      <div className="dashboard-top-row">
        <div>
          <h1 className="dashboard-title">Store Overview & Inventory KPIs</h1>
          <p className="dashboard-subtitle">
            Real-time physical showroom metrics backed directly by MongoDB.
          </p>
        </div>
        <div className="dashboard-quick-actions">
          <Link to="/admin/quick-sell" className="btn btn-primary btn-sm">
            <FiZap /> Quick Sell (POS)
          </Link>
          <Link to="/admin/sales-ledger" className="btn btn-outline btn-sm">
            <FiTrendingUp /> Sales & Sheets
          </Link>
          <Link to="/admin/add-product" className="btn btn-outline btn-sm">
            <FiPlus /> Add Shoe
          </Link>
          <Link to="/admin/inventory" className="btn btn-outline btn-sm">
            <FiLayers /> Stock Manager
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="stats-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-blue">
            <FiBox />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Total Shoe Models</span>
            <span className="kpi-value">{stats?.totalProducts || 0}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-purple">
            <FiActivity />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Active Brands</span>
            <span className="kpi-value">{stats?.totalBrands || 0}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-cyan">
            <FiTrendingUp />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Total Stock Pairs</span>
            <span className="kpi-value">{stats?.totalStockUnits || 0}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-green">
            <FiCheckCircle />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">In Stock Models</span>
            <span className="kpi-value">{stats?.inStockProducts || 0}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-amber">
            <FiAlertTriangle />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Low Stock (≤{stats?.lowStockThreshold || 2} pairs)</span>
            <span className="kpi-value">{stats?.lowStockProducts || 0}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap icon-red">
            <FiXCircle />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Out of Stock Models</span>
            <span className="kpi-value">{stats?.outOfStockProducts || 0}</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Low Stock Alerts & Recent Stock Movements */}
      <div className="dashboard-grid-2col">
        {/* Column 1: Low Stock & Attention Needed */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <FiAlertTriangle className="panel-icon amber" />
              <h3>Stock Alerts (Immediate Action Required)</h3>
            </div>
            <Link to="/admin/inventory" className="panel-action-link">
              Restock All <FiArrowRight />
            </Link>
          </div>

          <div className="panel-body">
            {alertProducts.length === 0 ? (
              <div className="empty-panel-msg">
                <FiCheckCircle size={28} className="text-green" />
                <p>All showroom products have healthy inventory levels.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Total Stock</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertProducts.map((prod) => (
                      <tr key={prod._id}>
                        <td>
                          <div className="table-product-cell">
                            <img
                              src={prod.primaryImage || '/placeholder-shoe.jpg'}
                              alt=""
                              className="thumb-mini"
                            />
                            <div>
                              <strong className="cell-name">{prod.name}</strong>
                              <span className="cell-brand">{prod.brandName}</span>
                            </div>
                          </div>
                        </td>
                        <td><code>{prod.sku}</code></td>
                        <td>
                          <strong className={prod.totalStock === 0 ? 'text-red' : 'text-amber'}>
                            {prod.totalStock} pairs
                          </strong>
                        </td>
                        <td>
                          {prod.totalStock === 0 ? (
                            <span className="stock-badge stock-out">Out of Stock</span>
                          ) : (
                            <span className="stock-badge stock-low">Low Stock</span>
                          )}
                        </td>
                        <td>
                          <Link
                            to={`/admin/inventory?search=${encodeURIComponent(prod.sku)}`}
                            className="btn btn-outline btn-sm"
                          >
                            Update Stock
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Recent Stock Movement History */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <div className="panel-title-wrap">
              <FiClock className="panel-icon blue" />
              <h3>Recent Stock Movements Audit</h3>
            </div>
            <Link to="/admin/stock-history" className="panel-action-link">
              Full Audit Trail <FiArrowRight />
            </Link>
          </div>

          <div className="panel-body">
            <div className="activity-stream">
              {recentStockHistory.map((item) => (
                <div key={item._id} className="stream-item">
                  <div className={`stream-bullet ${item.changeType === 'Stock In' ? 'in' : item.changeType === 'Stock Out' ? 'out' : 'adjust'}`}></div>
                  <div className="stream-content">
                    <div className="stream-line-1">
                      <strong>{item.productName}</strong>
                      <span className="stream-variant">({item.color} / {item.size})</span>
                    </div>
                    <div className="stream-line-2">
                      <span className="change-badge">{item.changeType}</span>
                      <span>From {item.previousQuantity} → <strong>{item.newQuantity}</strong> ({item.quantityChanged > 0 ? `+${item.quantityChanged}` : item.quantityChanged})</span>
                      <span className="stream-user">by {item.adminName}</span>
                    </div>
                    {item.remarks && <p className="stream-remarks">"{item.remarks}"</p>}
                    <span className="stream-time">
                      {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recently Added Products Section */}
      <div className="dashboard-panel margin-top">
        <div className="panel-header">
          <div className="panel-title-wrap">
            <FiBox className="panel-icon" />
            <h3>Recently Added Products</h3>
          </div>
          <Link to="/admin/products" className="panel-action-link">
            Manage All Products <FiArrowRight />
          </Link>
        </div>

        <div className="panel-body">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Selling Price</th>
                  <th>Total Units</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="table-product-cell">
                        <img src={p.primaryImage || '/placeholder-shoe.jpg'} alt="" className="thumb-mini" />
                        <div>
                          <strong className="cell-name">{p.name}</strong>
                          <span className="cell-sku">{p.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td>{p.brandName}</td>
                    <td>{p.categoryName}</td>
                    <td><strong>₹{p.sellingPrice.toLocaleString('en-IN')}</strong></td>
                    <td>{p.totalStock} pairs</td>
                    <td>
                      {p.totalStock === 0 ? (
                        <span className="stock-badge stock-out">Out of Stock</span>
                      ) : p.totalStock <= (stats?.lowStockThreshold || 2) ? (
                        <span className="stock-badge stock-low">Low Stock</span>
                      ) : (
                        <span className="stock-badge stock-in">In Stock</span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        <Link to={`/admin/edit-product/${p._id}`} className="action-link">Edit</Link>
                        <Link to={`/shoes/${p._id}`} target="_blank" className="action-link">Preview</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

