import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const StorePanel = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');
  const [loading, setLoading] = useState(true);

  // States for store parameters
  const [analytics, setAnalytics] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [carts, setCarts] = useState([]);
  const [claims, setClaims] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [settings, setSettings] = useState([]);
  const [alertReceivers, setAlertReceivers] = useState([]);

  // Modals & form state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'product' or 'credit' or 'password'
  const [selectedUser, setSelectedUser] = useState(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);

  const [productForm, setProductForm] = useState({
    name: '', sku: '', description: '', price: '', stock_quantity: 0,
    category: 'Microcontrollers', stock_type: 'in_stock', outsource_days: 0,
    cost_price: 0, technical_specs: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const loadAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/store/analytics', { headers });
      if (res.ok) setAnalytics(await res.json());
    } catch (err) { console.error(err); }
  };

  const loadProducts = async () => {
    try {
      // Pull catalog from public list endpoint
      const res = await fetch('/api/store/products?limit=100');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) { console.error(err); }
  };

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/admin/store/orders', { headers });
      if (res.ok) setOrders(await res.json());
    } catch (err) { console.error(err); }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/store/users', { headers });
      if (res.ok) setUsers(await res.json());
    } catch (err) { console.error(err); }
  };

  const loadAudits = async () => {
    try {
      const resTx = await fetch('/api/admin/store/wallet/transactions', { headers });
      if (resTx.ok) setTransactions(await resTx.json());

      const resCart = await fetch('/api/admin/store/carts', { headers });
      if (resCart.ok) setCarts(await resCart.json());

      const resClaims = await fetch('/api/admin/store/social-claims', { headers });
      if (resClaims.ok) setClaims(await resClaims.json());
    } catch (err) { console.error(err); }
  };

  const loadSettings = async () => {
    try {
      const resSet = await fetch('/api/admin/store/settings', { headers });
      if (resSet.ok) setSettings(await resSet.json());

      const resRec = await fetch('/api/admin/store/notification-receivers', { headers });
      if (resRec.ok) setAlertReceivers(await resRec.json());
    } catch (err) { console.error(err); }
  };

  const loadReviews = async () => {
    try {
      const res = await fetch('/api/admin/store/reviews', { headers });
      if (res.ok) setReviews(await res.json());
    } catch (err) { console.error(err); }
  };

  // Effect to load relevant tab data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      setSuccess('');
      if (activeTab === 'analytics') await loadAnalytics();
      if (activeTab === 'catalog') await loadProducts();
      if (activeTab === 'orders') await loadOrders();
      if (activeTab === 'users') await loadUsers();
      if (activeTab === 'audits') await loadAudits();
      if (activeTab === 'settings') await loadSettings();
      if (activeTab === 'reviews') await loadReviews();
      setLoading(false);
    };
    fetchData();
  }, [activeTab]);

  // Product Actions CRUD
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const url = editingProduct ? `/api/admin/store/products/${editingProduct.id}` : '/api/admin/store/products';
    const method = editingProduct ? 'PUT' : 'POST';

    try {
      let specs = {};
      if (productForm.technical_specs) {
        specs = JSON.parse(productForm.technical_specs);
      }

      const payload = {
        ...productForm,
        price: parseFloat(productForm.price),
        cost_price: parseFloat(productForm.cost_price || 0),
        technical_specs: specs
      };

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccess(editingProduct ? 'Component details modified.' : 'Component added to catalog.');
        setShowModal(false);
        setEditingProduct(null);
        loadProducts();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit catalog item.');
      }
    } catch (err) {
      setError('JSON specs format is invalid. Ensure proper double quotes e.g. {"pin_count": 8}');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete catalog item permanently?')) return;
    try {
      const res = await fetch(`/api/admin/store/products/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        setSuccess('Component removed.');
        loadProducts();
      }
    } catch (err) { console.error(err); }
  };

  // Order status transitions
  const handleUpdateOrderStatus = async (id, status, payment_status) => {
    try {
      const res = await fetch(`/api/admin/store/orders/${id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status, payment_status })
      });
      if (res.ok) {
        setSuccess('Order details updated.');
        loadOrders();
      }
    } catch (err) { console.error(err); }
  };

  // User manual credit deposits
  const handleManualCredit = async (e) => {
    e.preventDefault();
    if (!selectedUser || !creditAmount || isNaN(creditAmount)) return;

    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/store/users/${selectedUser.id}/credit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ amount: parseFloat(creditAmount) })
      });
      if (res.ok) {
        setSuccess(`Credited Rs. ${parseFloat(creditAmount).toFixed(2)} to ${selectedUser.email}.`);
        setShowModal(false);
        setCreditAmount('');
        loadUsers();
      } else {
        const data = await res.json();
        setError(data.error || 'Deposit adjustment failed.');
      }
    } catch (err) { setError('Deposit query failed.'); }
  };

  // User credentials adjustments
  const handleUserPasswordReset = async (e) => {
    e.preventDefault();
    if (!selectedUser || !resetPasswordVal) return;

    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/admin/store/users/${selectedUser.id}/password`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ password: resetPasswordVal })
      });
      if (res.ok) {
        setSuccess(`Password for ${selectedUser.email} reset successfully.`);
        setShowModal(false);
        setResetPasswordVal('');
      } else {
        setError('Reset request declined.');
      }
    } catch (err) { setError('Password reset failure.'); }
  };

  const handleToggleUserRole = async (u) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Switch role of ${u.email} to ${newRole}?`)) return;
    try {
      const res = await fetch(`/api/admin/store/users/${u.id}/role`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setSuccess('Privilege settings updated.');
        loadUsers();
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete user profile completely?')) return;
    try {
      const res = await fetch(`/api/admin/store/users/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        setSuccess('User profile removed.');
        loadUsers();
      }
    } catch (err) { console.error(err); }
  };

  // Reviews deleting
  const handleDeleteReview = async (id) => {
    if (!window.confirm('Delete customer review?')) return;
    try {
      const res = await fetch(`/api/admin/store/reviews/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        setSuccess('Review deleted.');
        loadReviews();
      }
    } catch (err) { console.error(err); }
  };

  // Systems Parameter updates
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/store/settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ settings })
      });
      if (res.ok) {
        setSuccess('System configuration parameters saved.');
        loadSettings();
      } else {
        setError('Declined to save settings.');
      }
    } catch (err) { setError('Settings update request failed.'); }
  };

  return (
    <div>
      {/* Alert Banners */}
      {success && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px', fontSize: '13px', marginBottom: '20px' }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', fontSize: '13px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Sidebar / Topbar Tab menus */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '30px', gap: '8px', flexWrap: 'wrap' }}>
        <button className={`btn-secondary ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')} style={{ borderBottom: activeTab === 'analytics' ? '2px solid var(--accent-gold)' : 'none' }}>
          Analytics Overview
        </button>
        <button className={`btn-secondary ${activeTab === 'catalog' ? 'active' : ''}`} onClick={() => setActiveTab('catalog')} style={{ borderBottom: activeTab === 'catalog' ? '2px solid var(--accent-gold)' : 'none' }}>
          Catalog Inventory
        </button>
        <button className={`btn-secondary ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')} style={{ borderBottom: activeTab === 'orders' ? '2px solid var(--accent-gold)' : 'none' }}>
          Orders Desk
        </button>
        <button className={`btn-secondary ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')} style={{ borderBottom: activeTab === 'users' ? '2px solid var(--accent-gold)' : 'none' }}>
          Users & Credit
        </button>
        <button className={`btn-secondary ${activeTab === 'audits' ? 'active' : ''}`} onClick={() => setActiveTab('audits')} style={{ borderBottom: activeTab === 'audits' ? '2px solid var(--accent-gold)' : 'none' }}>
          Ledgers & Audits
        </button>
        <button className={`btn-secondary ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')} style={{ borderBottom: activeTab === 'reviews' ? '2px solid var(--accent-gold)' : 'none' }}>
          Reviews Mod
        </button>
        <button className={`btn-secondary ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')} style={{ borderBottom: activeTab === 'settings' ? '2px solid var(--accent-gold)' : 'none' }}>
          Settings & Alerts
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>Syncing parameters...</div>
      ) : (
        <>
          {/* TAB 1: ANALYTICS */}
          {activeTab === 'analytics' && analytics && (
            <div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-info">
                    <h3>Total Sales Revenue</h3>
                    <div className="stat-value">Rs. {analytics.revenue.toFixed(2)}</div>
                  </div>
                  <div className="stat-icon"><i className="fa-light fa-sharp fa-money-bill-wave"></i></div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <h3>Average Order Value</h3>
                    <div className="stat-value">Rs. {analytics.averageOrderValue.toFixed(2)}</div>
                  </div>
                  <div className="stat-icon"><i className="fa-light fa-sharp fa-calculator"></i></div>
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="admin-card">
                  <div className="admin-card-header"><h3>Top Sourced Components</h3></div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {analytics.topProducts?.map((p, idx) => (
                      <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span><b>{p.name}</b> (SKU: {p.sku})</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-gold)' }}>{p.units_sold} units</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="admin-card">
                  <div className="admin-card-header"><h3>Category Stock Levels</h3></div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {analytics.categories?.map((c, idx) => (
                      <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span><b>{c.category || 'General'}</b> ({c.count} items)</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{c.total_stock} in stock</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CATALOG INVENTORY */}
          {activeTab === 'catalog' && (
            <div className="admin-card">
              <div className="admin-card-header">
                <h3>Store Component Inventory</h3>
                <button onClick={() => {
                  setEditingProduct(null);
                  setProductForm({
                    name: '', sku: '', description: '', price: '', stock_quantity: 0,
                    category: 'Microcontrollers', stock_type: 'in_stock', outsource_days: 0,
                    cost_price: 0, technical_specs: ''
                  });
                  setModalType('product');
                  setShowModal(true);
                }}>Add Component</button>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Part Name</th>
                      <th>Category</th>
                      <th>Cost Price</th>
                      <th>Sell Price</th>
                      <th>Qty</th>
                      <th>Type</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{p.sku}</td>
                        <td><b>{p.name}</b></td>
                        <td>{p.category}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>Rs. {parseFloat(p.cost_price).toFixed(2)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>Rs. {parseFloat(p.price).toFixed(2)}</td>
                        <td>{p.stock_quantity}</td>
                        <td style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 600 }}>{p.stock_type}</td>
                        <td>
                          <div className="admin-actions">
                            <button onClick={() => {
                              setEditingProduct(p);
                              setProductForm({
                                ...p,
                                technical_specs: typeof p.technical_specs === 'string' ? p.technical_specs : JSON.stringify(p.technical_specs)
                              });
                              setModalType('product');
                              setShowModal(true);
                            }}>Edit</button>
                            <button onClick={() => handleDeleteProduct(p.id)} style={{ backgroundColor: '#ef4444', color: '#fff', borderColor: '#ef4444' }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS DESK */}
          {activeTab === 'orders' && (
            <div className="admin-card">
              <div className="admin-card-header"><h3>E-Commerce Order Dispatches</h3></div>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Recipient</th>
                      <th>Location GPS</th>
                      <th>Totals</th>
                      <th>Payment Method</th>
                      <th>Payment Status</th>
                      <th>Dispatch Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-gold)' }}>
                          {o.tracking_code}
                        </td>
                        <td>
                          <div><b>{o.shipping_address?.fullName}</b></div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{o.shipping_address?.phone}</div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                          {o.shipping_address?.receivingLocation}
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                            ({o.shipping_address?.distanceKm} Km, Rs. {o.shipping_address?.shippingFee} fee)
                          </div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>Rs. {parseFloat(o.total_amount).toFixed(2)}</td>
                        <td style={{ textTransform: 'uppercase', fontSize: '11px' }}>{o.payment_method}</td>
                        <td>
                          <select
                            value={o.payment_status}
                            onChange={(e) => handleUpdateOrderStatus(o.id, o.status, e.target.value)}
                            style={{ padding: '4px', fontSize: '12px', width: '90px' }}
                          >
                            <option value="unpaid">Unpaid</option>
                            <option value="paid">Paid</option>
                          </select>
                        </td>
                        <td>
                          <select
                            value={o.status}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value, o.payment_status)}
                            style={{ padding: '4px', fontSize: '12px', width: '120px' }}
                          >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: USERS & CREDIT */}
          {activeTab === 'users' && (
            <div className="admin-card">
              <div className="admin-card-header"><h3>Customer Ledger Accounts</h3></div>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Email Account</th>
                      <th>Referral Code</th>
                      <th>Role</th>
                      <th>Wallet Balance</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td><b>{u.email}</b></td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{u.referral_code}</td>
                        <td>
                          <span className={`badge ${u.role === 'admin' ? 'warning' : ''}`} style={{ cursor: 'pointer' }} onClick={() => handleToggleUserRole(u)}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>Rs. {parseFloat(u.wallet_balance).toFixed(2)}</td>
                        <td>
                          <div className="admin-actions">
                            <button onClick={() => { setSelectedUser(u); setModalType('credit'); setShowModal(true); }}>
                              Deposit Credit
                            </button>
                            <button onClick={() => { setSelectedUser(u); setModalType('password'); setShowModal(true); }} className="btn-secondary">
                              Reset Password
                            </button>
                            <button onClick={() => handleDeleteUser(u.id)} style={{ backgroundColor: '#ef4444', color: '#fff', borderColor: '#ef4444' }}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: LEDGERS & AUDITS */}
          {activeTab === 'audits' && (
            <div>
              {/* Transactions Ledger */}
              <div className="admin-card">
                <div className="admin-card-header"><h3>System Wallet Ledgers (All)</h3></div>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>User Account</th>
                        <th>Type</th>
                        <th>Ref Code</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(tx => (
                        <tr key={tx.id}>
                          <td style={{ fontSize: '12px' }}>{new Date(tx.created_at).toLocaleString()}</td>
                          <td>{tx.email}</td>
                          <td style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 600 }}>{tx.type}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{tx.reference_id}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'right', fontWeight: 600, color: parseFloat(tx.amount) > 0 ? '#10b981' : '#ef4444' }}>
                            {parseFloat(tx.amount) > 0 ? '+' : ''}Rs. {parseFloat(tx.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="admin-form-grid">
                {/* Active Carts Audits */}
                <div className="admin-card">
                  <div className="admin-card-header"><h3>Active Shopping Carts</h3></div>
                  <div className="admin-table-wrapper">
                    <table className="admin-table" style={{ fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Part Item</th>
                          <th>Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {carts.map(c => (
                          <tr key={c.id}>
                            <td>{c.email}</td>
                            <td>{c.product_name}</td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{c.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Social claims */}
                <div className="admin-card">
                  <div className="admin-card-header"><h3>Incentives Social Claims</h3></div>
                  <div className="admin-table-wrapper">
                    <table className="admin-table" style={{ fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Platform</th>
                          <th>Claimed Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {claims.map((cl, i) => (
                          <tr key={i}>
                            <td>{cl.email}</td>
                            <td style={{ textTransform: 'uppercase' }}>{cl.platform}</td>
                            <td style={{ fontSize: '12px' }}>{new Date(cl.claimed_at).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: REVIEWS MODERATION */}
          {activeTab === 'reviews' && (
            <div className="admin-card">
              <div className="admin-card-header"><h3>Customer Ratings & Reviews Moderation</h3></div>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Product</th>
                      <th>Rating</th>
                      <th>Comment</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map(r => (
                      <tr key={r.id}>
                        <td>{r.email}</td>
                        <td><b>{r.product_name}</b></td>
                        <td style={{ color: 'var(--accent-gold)' }}>{r.rating} / 5</td>
                        <td>{r.comment}</td>
                        <td style={{ fontSize: '12px' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                        <td>
                          <button onClick={() => handleDeleteReview(r.id)} style={{ backgroundColor: '#ef4444', color: '#fff', borderColor: '#ef4444', padding: '6px 12px', fontSize: '12px' }}>
                            Delete Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: SETTINGS & ALERTS */}
          {activeTab === 'settings' && (
            <div>
              <div className="admin-card">
                <div className="admin-card-header"><h3>Store Operational Parameters</h3></div>
                <form onSubmit={handleSaveSettings}>
                  <div className="admin-form-grid">
                    {settings.map((s, idx) => (
                      <div className="admin-form-group" key={s.key_name}>
                        <label style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{s.key_name}</label>
                        <input
                          type="text"
                          defaultValue={s.key_value}
                          onChange={(e) => {
                            const updated = [...settings];
                            updated[idx].key_value = e.target.value;
                            setSettings(updated);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <button type="submit" style={{ marginTop: '20px' }}>Save Parameters</button>
                </form>
              </div>

              <div className="admin-card">
                <div className="admin-card-header"><h3>Notification Email Receivers</h3></div>
                <div className="admin-table-wrapper">
                  <table className="admin-table" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>Email Address</th>
                        <th>Alert on Orders</th>
                        <th>Alert on Low Stock</th>
                        <th>Alert on Signups</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alertReceivers.map(rec => (
                        <tr key={rec.id}>
                          <td><b>{rec.email_address}</b></td>
                          <td>{rec.notify_on_order_placed ? 'Yes' : 'No'}</td>
                          <td>{rec.notify_on_low_stock ? 'Yes' : 'No'}</td>
                          <td>{rec.notify_on_user_registered ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* POPUP MODALS OVERLAYS */}
      {showModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3>
                {modalType === 'product' && (editingProduct ? 'Edit Component specs' : 'Add Component Catalog')}
                {modalType === 'credit' && 'Manually Deposit Credit'}
                {modalType === 'password' && 'Reset Password'}
              </h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>
                <i className="fa-light fa-sharp fa-times" style={{ fontSize: '20px' }}></i>
              </button>
            </div>

            <div className="admin-modal-body">
              {/* Product Modal Form */}
              {modalType === 'product' && (
                <form onSubmit={handleProductSubmit} className="admin-form-grid">
                  <div className="admin-form-group">
                    <label>Component Name</label>
                    <input type="text" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required />
                  </div>
                  <div className="admin-form-group">
                    <label>Part SKU</label>
                    <input type="text" value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} required style={{ fontFamily: 'var(--font-mono)' }} />
                  </div>
                  <div className="admin-form-group full-width">
                    <label>Description Details</label>
                    <textarea value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} />
                  </div>
                  <div className="admin-form-group">
                    <label>Sell Price (Rs.)</label>
                    <input type="text" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} required />
                  </div>
                  <div className="admin-form-group">
                    <label>Cost Price (Rs.)</label>
                    <input type="text" value={productForm.cost_price} onChange={e => setProductForm({ ...productForm, cost_price: e.target.value })} />
                  </div>
                  <div className="admin-form-group">
                    <label>Stock Qty</label>
                    <input type="number" value={productForm.stock_quantity} onChange={e => setProductForm({ ...productForm, stock_quantity: parseInt(e.target.value) })} required />
                  </div>
                  <div className="admin-form-group">
                    <label>Category</label>
                    <input type="text" value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} />
                  </div>
                  <div className="admin-form-group">
                    <label>Stock Mode</label>
                    <select value={productForm.stock_type} onChange={e => setProductForm({ ...productForm, stock_type: e.target.value })}>
                      <option value="in_stock">In Stock</option>
                      <option value="outsourced">Outsourced</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label>Outsource days (ETA)</label>
                    <input type="number" value={productForm.outsource_days} onChange={e => setProductForm({ ...productForm, outsource_days: parseInt(e.target.value) })} />
                  </div>
                  <div className="admin-form-group full-width">
                    <label>Technical Specs (JSON string format e.g. {"{}"})</label>
                    <textarea value={productForm.technical_specs} onChange={e => setProductForm({ ...productForm, technical_specs: e.target.value })} style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }} placeholder='{"pin_count": 8, "frequency": "16MHz"}' />
                  </div>
                  <div className="admin-form-group full-width">
                    <button type="submit">Save Component</button>
                  </div>
                </form>
              )}

              {/* Credit Modal Form */}
              {modalType === 'credit' && selectedUser && (
                <form onSubmit={handleManualCredit}>
                  <p style={{ fontSize: '14px', marginBottom: '20px' }}>
                    Credit manual deposit to: <b>{selectedUser.email}</b>
                  </p>
                  <div className="admin-form-group">
                    <label>Amount (Rs.)</label>
                    <input type="text" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} placeholder="0.00" required />
                  </div>
                  <button type="submit" style={{ marginTop: '20px', width: '100%' }}>
                    Deduct or Credit Deposit
                  </button>
                </form>
              )}

              {/* Reset Password Modal Form */}
              {modalType === 'password' && selectedUser && (
                <form onSubmit={handleUserPasswordReset}>
                  <p style={{ fontSize: '14px', marginBottom: '20px' }}>
                    Reset credentials password for: <b>{selectedUser.email}</b>
                  </p>
                  <div className="admin-form-group">
                    <label>New Password</label>
                    <input type="password" value={resetPasswordVal} onChange={e => setResetPasswordVal(e.target.value)} placeholder="••••••••" required />
                  </div>
                  <button type="submit" style={{ marginTop: '20px', width: '100%' }}>
                    Reset Password
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorePanel;
