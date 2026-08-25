import React, { useState, useEffect } from 'react';
import { 
  FileText, CheckCircle, XCircle, Phone, MessageSquare, Printer, 
  Eye, ShieldCheck, Package, Clock, LogOut, Search, Filter, Table, TrendingUp, Store, Plus, Trash2, Key
} from 'lucide-react';
import { INITIAL_PRESCRIPTIONS, INITIAL_FULFILLMENT_ORDERS } from '../adminMockData';
import { INITIAL_RETAILERS } from '../retailersData';
import { MOCK_PRODUCTS } from '../mockData';
import { INITIAL_AUDIT_LOGS } from '../adminAnalyticsData';
import StoreOperationsSection from './StoreOperationsSection';
import AdminAnalyticsSection from './AdminAnalyticsSection';
import '../App.css';

export default function AdminDashboard({ 
  user, 
  products, 
  onUpdateProducts, 
  orders: propOrders, 
  onUpdateOrders,
  prescriptions: propPrescriptions,
  onUpdatePrescriptions,
  retailers: propRetailers,
  onUpdateRetailers,
  onLogout 
}) {
  const [activeTab, setActiveTab] = useState('prescriptions'); // 'prescriptions', 'orders', 'store-ops', 'analytics', 'retailers'
  const [prescriptions, setPrescriptions] = useState(propPrescriptions || INITIAL_PRESCRIPTIONS);
  const [orders, setOrders] = useState(propOrders || INITIAL_FULFILLMENT_ORDERS);
  const [retailersList, setRetailersList] = useState(propRetailers || INITIAL_RETAILERS);
  const [catalog, setCatalog] = useState(products || MOCK_PRODUCTS);

  // Orders Filter & Search State
  const [orderQueueFilter, setOrderQueueFilter] = useState('all'); // 'all', 'active', 'delivered', 'b2b', 'b2c'
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // New Retailer Form State
  const [newRetailer, setNewRetailer] = useState({
    name: '',
    username: '',
    password: '',
    area: '',
    licenseNo: ''
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (products) {
      setCatalog(products);
    }
  }, [products]);

  useEffect(() => {
    if (propOrders) {
      setOrders(propOrders);
    }
  }, [propOrders]);

  useEffect(() => {
    if (propPrescriptions) {
      setPrescriptions(propPrescriptions);
    }
  }, [propPrescriptions]);

  useEffect(() => {
    if (propRetailers) {
      setRetailersList(propRetailers);
    }
  }, [propRetailers]);

  useEffect(() => {
    if (propOrders) {
      setOrders(propOrders);
    }
  }, [propOrders]);

  useEffect(() => {
    if (propPrescriptions) {
      setPrescriptions(propPrescriptions);
    }
  }, [propPrescriptions]);

  // Fetch live orders & prescriptions from MongoDB Atlas on mount
  useEffect(() => {
    const fetchLiveAdminData = async () => {
      try {
        const token = user?.token;
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        // 1. Fetch live orders
        const ordersRes = await fetch(`${API_BASE_URL}/api/orders`, { headers });
        if (ordersRes.ok) {
          const dbOrders = await ordersRes.json();
          if (Array.isArray(dbOrders) && dbOrders.length > 0) {
            const formatted = dbOrders.map(o => ({
              id: o.orderId || o._id,
              _id: o._id,
              customerName: o.customer?.name || o.customerName || 'Online Customer',
              phone: o.customer?.phone || o.phone || 'N/A',
              address: o.customer?.address || o.address || 'Local Delivery',
              items: o.items || [],
              subtotal: o.subtotal || 0,
              deliveryFee: o.deliveryFee || 0,
              grandTotal: o.grandTotal || 0,
              requiresRx: Boolean(o.requiresRx),
              status: o.status || 'Received',
              createdAt: o.createdAt ? new Date(o.createdAt).toLocaleString() : 'Recent'
            }));
            
            // Merge database orders with local state
            setOrders(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const newItems = formatted.filter(f => !existingIds.has(f.id));
              const merged = [...newItems, ...prev];
              if (onUpdateOrders) onUpdateOrders(merged);
              return merged;
            });
          }
        }

        // 2. Fetch live prescriptions
        const rxRes = await fetch(`${API_BASE_URL}/api/prescriptions`, { headers });
        if (rxRes.ok) {
          const dbRx = await rxRes.json();
          if (Array.isArray(dbRx) && dbRx.length > 0) {
            const formattedRx = dbRx.map(r => ({
              id: r.prescriptionId || r._id,
              _id: r._id,
              customerName: r.customerName || 'Customer Rx',
              phone: r.phone || 'N/A',
              address: r.address || 'Local Address',
              notes: r.notes || '',
              image: r.imageUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80',
              status: r.status || 'Pending',
              uploadedAt: r.createdAt ? new Date(r.createdAt).toLocaleString() : 'Today',
              verifiedBy: r.pharmacistSignOff?.staffName || null
            }));
            setPrescriptions(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const newItems = formattedRx.filter(f => !existingIds.has(f.id));
              const merged = [...newItems, ...prev];
              if (onUpdatePrescriptions) onUpdatePrescriptions(merged);
              return merged;
            });
          }
        }

        // 3. Fetch live retailers from MongoDB Atlas
        const retRes = await fetch(`${API_BASE_URL}/api/retailers`, { headers });
        if (retRes.ok) {
          const dbRetailers = await retRes.json();
          if (Array.isArray(dbRetailers) && dbRetailers.length > 0) {
            const formattedRet = dbRetailers.map(r => ({
              id: r._id || r.id,
              _id: r._id,
              name: r.name,
              username: r.username,
              password: r.password,
              area: r.area,
              licenseNo: r.licenseNo,
              discountTier: r.discountTier || 'Wholesale Trade Price (12-15% OFF)',
              createdAt: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : 'Recent'
            }));
            setRetailersList(prev => {
              const existingUsernames = new Set(prev.map(p => p.username));
              const newItems = formattedRet.filter(f => !existingUsernames.has(f.username));
              const merged = [...newItems, ...prev];
              if (onUpdateRetailers) onUpdateRetailers(merged);
              return merged;
            });
          }
        }
      } catch (err) {
        console.warn('⚠️ Server offline or connection issue. Using local admin data fallback:', err.message);
      }
    };

    fetchLiveAdminData();
  }, [user]);

  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [selectedRx, setSelectedRx] = useState(null); // Image Viewer Modal

  // Audit Logger Helper
  const handleAddAuditLog = (newLog) => {
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Rx Actions
  const handleVerifyRx = async (rxId) => {
    const rxItem = prescriptions.find(r => r.id === rxId);
    if (rxItem && rxItem._id) {
      try {
        await fetch(`${API_BASE_URL}/api/prescriptions/${rxItem._id}/sign-off`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.token}`
          },
          body: JSON.stringify({ status: 'Verified' })
        });
      } catch (e) {
        console.warn('Fallback local sign-off:', e.message);
      }
    }

    setPrescriptions(prev => {
      const updatedList = prev.map(rx => {
        if (rx.id === rxId) {
          return {
            ...rx,
            status: 'Verified',
            verifiedBy: `${user.name} (${new Date().toLocaleTimeString()})`
          };
        }
        return rx;
      });
      if (onUpdatePrescriptions) onUpdatePrescriptions(updatedList);
      return updatedList;
    });

    handleAddAuditLog({
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: 'Just now',
      staff: user.name,
      actionType: 'RX_VERIFIED',
      category: 'Prescription',
      details: `Approved prescription ${rxId} for customer ${rxItem?.customerName || 'Customer'}`,
      severity: 'success'
    });
    setSelectedRx(null);
  };

  const handleRejectRx = async (rxId) => {
    const rxItem = prescriptions.find(r => r.id === rxId);
    if (rxItem && rxItem._id) {
      try {
        await fetch(`${API_BASE_URL}/api/prescriptions/${rxItem._id}/sign-off`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.token}`
          },
          body: JSON.stringify({ status: 'Rejected' })
        });
      } catch (e) {
        console.warn('Fallback local rejection:', e.message);
      }
    }

    setPrescriptions(prev => {
      const updatedList = prev.map(rx => {
        if (rx.id === rxId) {
          return {
            ...rx,
            status: 'Rejected',
            verifiedBy: `${user.name} (${new Date().toLocaleTimeString()})`
          };
        }
        return rx;
      });
      if (onUpdatePrescriptions) onUpdatePrescriptions(updatedList);
      return updatedList;
    });

    handleAddAuditLog({
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: 'Just now',
      staff: user.name,
      actionType: 'RX_REJECTED',
      category: 'Prescription',
      details: `Rejected prescription ${rxId} for customer ${rxItem?.customerName || 'Customer'}`,
      severity: 'warning'
    });
    setSelectedRx(null);
  };

  // Order Status Queue Actions
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (targetOrder) {
      const targetId = targetOrder._id || orderId;
      try {
        await fetch(`${API_BASE_URL}/api/orders/${targetId}/status`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.token}`
          },
          body: JSON.stringify({ status: newStatus })
        });
      } catch (e) {
        console.warn('Fallback local status update:', e.message);
      }
    }

    setOrders(prev => {
      const updatedList = prev.map(ord => {
        if (ord.id === orderId) {
          return { ...ord, status: newStatus };
        }
        return ord;
      });
      if (onUpdateOrders) onUpdateOrders(updatedList);
      return updatedList;
    });

    handleAddAuditLog({
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: 'Just now',
      staff: user.name,
      actionType: 'ORDER_STAGE',
      category: 'Fulfillment',
      details: `Updated order status for ${orderId} to "${newStatus}"`,
      severity: 'info'
    });
  };

  const handlePrintSlip = (order) => {
    const customerName = order.customerName || order.customer?.name || 'Customer';
    const customerPhone = order.phone || order.customer?.phone || 'N/A';
    const customerAddress = order.address || order.customer?.address || 'Local Delivery';
    const orderItems = order.items || [];

    const slipWindow = window.open('', '_blank');
    slipWindow.document.write(`
      <html>
        <head>
          <title>Delivery Slip - ${order.id}</title>
          <style>
            body { font-family: monospace; padding: 20px; max-width: 400px; margin: auto; }
            h2 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .row { display: flex; justify-content: space-between; margin: 6px 0; }
            .total { font-weight: bold; border-top: 1px dashed #000; padding-top: 6px; }
          </style>
        </head>
        <body>
          <h2>WAQAS MEDICAL STORE</h2>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Customer:</strong> ${customerName} (${customerPhone})</p>
          <p><strong>Address:</strong> ${customerAddress}</p>
          <hr />
          <h4>ITEMS:</h4>
          ${orderItems.map(i => `<div class="row"><span>${i.name} (x${i.quantity})</span><span>Rs. ${(i.price * i.quantity).toFixed(2)}</span></div>`).join('')}
          <hr />
          <div class="row total"><span>GRAND TOTAL</span><span>Rs. ${Number(order.grandTotal).toFixed(2)}</span></div>
          <p style="text-align: center; margin-top: 30px;">Thank you for shopping with us!</p>
          <script>window.print();</script>
        </body>
      </html>
    `);
  };

  // Retailer Account Actions
  const handleCreateRetailer = async (e) => {
    e.preventDefault();
    if (!newRetailer.name || !newRetailer.username || !newRetailer.password) return;

    let created = {
      id: `ret-${Date.now().toString().slice(-4)}`,
      name: newRetailer.name.trim(),
      username: newRetailer.username.trim().toLowerCase(),
      password: newRetailer.password.trim(),
      area: newRetailer.area.trim() || 'Local Sector',
      licenseNo: newRetailer.licenseNo.trim() || 'N/A',
      discountTier: 'Wholesale Trade Price (12-15% OFF)',
      createdAt: new Date().toISOString().split('T')[0]
    };

    // Save directly to MongoDB Atlas Cloud Database
    try {
      const res = await fetch(`${API_BASE_URL}/api/retailers`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify(created)
      });
      if (res.ok) {
        const savedDb = await res.json();
        created = {
          ...created,
          _id: savedDb._id,
          id: savedDb._id || created.id
        };
      }
    } catch (err) {
      console.warn('Saved in local cache');
    }

    setRetailersList(prev => {
      const updated = [created, ...prev];
      if (onUpdateRetailers) onUpdateRetailers(updated);
      return updated;
    });

    handleAddAuditLog({
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: 'Just now',
      staff: user.name,
      actionType: 'RETAILER_CREATED',
      category: 'Accounts',
      details: `Created B2B retailer account "${created.name}" (Code: ${created.username})`,
      severity: 'success'
    });

    setNewRetailer({ name: '', username: '', password: '', area: '', licenseNo: '' });
  };

  const handleDeleteRetailer = async (id, name, retailerItem) => {
    if (window.confirm(`Are you sure you want to remove retailer "${name}"?`)) {
      const deleteId = retailerItem?._id || id;
      try {
        await fetch(`${API_BASE_URL}/api/retailers/${deleteId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${user?.token}` }
        });
      } catch (err) {}

      setRetailersList(prev => {
        const updated = prev.filter(r => r.id !== id && r._id !== deleteId);
        if (onUpdateRetailers) onUpdateRetailers(updated);
        return updated;
      });

      handleAddAuditLog({
        id: `LOG-${Date.now().toString().slice(-4)}`,
        timestamp: 'Just now',
        staff: user.name,
        actionType: 'RETAILER_REMOVED',
        category: 'Accounts',
        details: `Removed retailer account "${name}"`,
        severity: 'warning'
      });
    }
  };

  return (
    <div className="admin-portal-container">
      {/* Admin Top Navigation Bar */}
      <header className="admin-nav">
        <div className="admin-brand">
          <div className="brand-icon-badge">
            <ShieldCheck size={20} color="#ffffff" />
          </div>
          <div>
            <h3>WAQAS <span>STAFF PORTAL</span></h3>
            <span className="user-role-tag">{user.name}</span>
          </div>
        </div>

        <div className="admin-nav-tabs">
          <button 
            className={`admin-tab-btn ${activeTab === 'prescriptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('prescriptions')}
          >
            <FileText size={15} />
            <span>Rx Verification</span>
            <span className="count-badge red">
              {prescriptions.filter(p => p.status === 'Pending').length}
            </span>
          </button>

          <button 
            className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <Package size={15} />
            <span>Orders Queue</span>
            <span className="count-badge blue">{orders.length}</span>
          </button>

          <button 
            className={`admin-tab-btn ${activeTab === 'store-ops' ? 'active' : ''}`}
            onClick={() => setActiveTab('store-ops')}
          >
            <Table size={15} />
            <span>Store Operations</span>
          </button>

          <button 
            className={`admin-tab-btn ${activeTab === 'retailers' ? 'active' : ''}`}
            onClick={() => setActiveTab('retailers')}
          >
            <Store size={15} />
            <span>Retailer Accounts</span>
            <span className="count-badge green">{retailersList.length}</span>
          </button>

          <button 
            className={`admin-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <TrendingUp size={15} />
            <span>Sales & Analytics</span>
            <span className="count-badge green">LIVE</span>
          </button>
        </div>

        <div className="admin-nav-right">
          <button className="btn-logout" onClick={onLogout}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </header>

      {/* Main Admin View Content */}
      <div className="admin-body">
        {/* TAB 1: Prescription Review Inbox */}
        {activeTab === 'prescriptions' && (
          <section className="admin-section">
            <div className="section-header">
              <h2>Prescription Verification Inbox</h2>
              <p>Review customer submitted prescription photos, verify validity, and record pharmacist sign-off logs.</p>
            </div>

            <div className="prescriptions-table-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Rx ID</th>
                    <th>Customer Name</th>
                    <th>Phone / WhatsApp</th>
                    <th>Uploaded Date</th>
                    <th>Status</th>
                    <th>Pharmacist Log</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map(rx => (
                    <tr key={rx.id} className={rx.status === 'Pending' ? 'row-pending' : ''}>
                      <td><strong>{rx.id}</strong></td>
                      <td>{rx.customerName}</td>
                      <td>
                        <a 
                          href={`https://wa.me/${rx.phone.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="wa-contact-link"
                        >
                          <MessageSquare size={13} /> {rx.phone}
                        </a>
                      </td>
                      <td>{rx.uploadedAt}</td>
                      <td>
                        <span className={`status-pill status-${rx.status.toLowerCase()}`}>
                          {rx.status}
                        </span>
                      </td>
                      <td><small>{rx.verifiedBy || 'Awaiting sign-off'}</small></td>
                      <td>
                        <div className="action-cell">
                          <button className="btn-action-view" onClick={() => setSelectedRx(rx)}>
                            <Eye size={14} /> Inspect Rx
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 2: Order Fulfillment Queue & Past Orders History */}
        {activeTab === 'orders' && (() => {
          const totalRevenue = orders.reduce((sum, o) => sum + Number(o.grandTotal || 0), 0);
          const activeCount = orders.filter(o => o.status !== 'Delivered').length;
          const deliveredCount = orders.filter(o => o.status === 'Delivered').length;
          const b2bCount = orders.filter(o => o.orderType === 'b2b_retailer' || o.customer?.isRetailer).length;

          // Filter logic
          const filteredOrders = orders.filter(order => {
            // Tab filter
            if (orderQueueFilter === 'active' && order.status === 'Delivered') return false;
            if (orderQueueFilter === 'delivered' && order.status !== 'Delivered') return false;
            if (orderQueueFilter === 'b2b' && !(order.orderType === 'b2b_retailer' || order.customer?.isRetailer)) return false;
            if (orderQueueFilter === 'b2c' && (order.orderType === 'b2b_retailer' || order.customer?.isRetailer)) return false;

            // Search query
            if (orderSearchQuery.trim()) {
              const q = orderSearchQuery.toLowerCase();
              const matchId = (order.id || '').toLowerCase().includes(q);
              const matchName = (order.customerName || order.customer?.name || '').toLowerCase().includes(q);
              const matchPhone = (order.phone || order.customer?.phone || '').includes(q);
              return matchId || matchName || matchPhone;
            }
            return true;
          });

          return (
            <section className="admin-section">
              <div className="section-header">
                <h2>Order Fulfillment Queue & Past Orders</h2>
                <p>Manage incoming storefront shipments, update delivery stages, and inspect historical B2B & Consumer invoices.</p>
              </div>

              {/* Order Stats Summary Bar */}
              <div className="admin-order-stats-grid">
                <div className="a-stat-card">
                  <span className="a-stat-label">Total Orders</span>
                  <strong className="a-stat-val">{orders.length}</strong>
                  <small className="a-stat-sub">Lifetime orders logged</small>
                </div>
                <div className="a-stat-card active-card">
                  <span className="a-stat-label">⚡ In-Progress Queue</span>
                  <strong className="a-stat-val" style={{ color: '#0284c7' }}>{activeCount}</strong>
                  <small className="a-stat-sub">Needs packaging / delivery</small>
                </div>
                <div className="a-stat-card delivered-card">
                  <span className="a-stat-label">✅ Past Delivered</span>
                  <strong className="a-stat-val" style={{ color: '#059669' }}>{deliveredCount}</strong>
                  <small className="a-stat-sub">Successfully fulfilled</small>
                </div>
                <div className="a-stat-card revenue-card">
                  <span className="a-stat-label">💰 Total Order Value</span>
                  <strong className="a-stat-val" style={{ color: '#0f766e' }}>Rs. {totalRevenue.toFixed(2)}</strong>
                  <small className="a-stat-sub">{b2bCount} B2B Wholesale orders</small>
                </div>
              </div>

              {/* Filter Controls & Search Bar */}
              <div className="admin-order-controls-bar">
                <div className="a-order-tabs">
                  <button 
                    className={`a-filter-pill ${orderQueueFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setOrderQueueFilter('all')}
                  >
                    All Orders ({orders.length})
                  </button>
                  <button 
                    className={`a-filter-pill ${orderQueueFilter === 'active' ? 'active' : ''}`}
                    onClick={() => setOrderQueueFilter('active')}
                  >
                    ⚡ Active Queue ({activeCount})
                  </button>
                  <button 
                    className={`a-filter-pill ${orderQueueFilter === 'delivered' ? 'active' : ''}`}
                    onClick={() => setOrderQueueFilter('delivered')}
                  >
                    📜 Past Delivered History ({deliveredCount})
                  </button>
                  <button 
                    className={`a-filter-pill ${orderQueueFilter === 'b2b' ? 'active' : ''}`}
                    onClick={() => setOrderQueueFilter('b2b')}
                  >
                    🏢 B2B Retailers ({b2bCount})
                  </button>
                  <button 
                    className={`a-filter-pill ${orderQueueFilter === 'b2c' ? 'active' : ''}`}
                    onClick={() => setOrderQueueFilter('b2c')}
                  >
                    🛍️ Consumers ({orders.length - b2bCount})
                  </button>
                </div>

                <div className="a-order-search-box">
                  <Search size={15} color="#64748b" />
                  <input 
                    type="text" 
                    placeholder="Search by Order ID, customer name, or phone..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                  />
                  {orderSearchQuery && (
                    <button className="clear-btn" onClick={() => setOrderSearchQuery('')}>×</button>
                  )}
                </div>
              </div>

              {/* VIEW 1: Past Delivered History Table (When 'delivered' filter is active) */}
              {orderQueueFilter === 'delivered' ? (
                <div className="admin-table-wrapper">
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Date & Time</th>
                        <th>Order Type</th>
                        <th>Customer / Store</th>
                        <th>Phone</th>
                        <th>Delivery Destination</th>
                        <th>Items Count</th>
                        <th>Grand Total</th>
                        <th>Status</th>
                        <th>Invoice / Slip</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan="10" style={{ textAlign: 'center', padding: '30px' }}>
                            No delivered past orders found matching your search.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map(order => (
                          <tr key={order.id}>
                            <td><code>{order.id}</code></td>
                            <td><small>{order.createdAt}</small></td>
                            <td>
                              {(order.orderType === 'b2b_retailer' || order.customer?.isRetailer) ? (
                                <span className="order-b2b-tag">🏢 B2B Retailer</span>
                              ) : (
                                <span className="order-b2c-tag">🛍️ Consumer</span>
                              )}
                            </td>
                            <td><strong>{order.customerName || order.customer?.name || 'Customer'}</strong></td>
                            <td>
                              <a 
                                href={`https://wa.me/${(order.phone || order.customer?.phone || '').replace(/[^0-9]/g, '')}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="wa-contact-link"
                              >
                                <MessageSquare size={12} /> {order.phone || order.customer?.phone || 'N/A'}
                              </a>
                            </td>
                            <td><small>{order.address || order.customer?.address || 'Local Delivery'}</small></td>
                            <td style={{ textAlign: 'center' }}>{(order.items || []).reduce((sum, it) => sum + it.quantity, 0)} Units</td>
                            <td><strong style={{ color: '#0f766e' }}>Rs. {Number(order.grandTotal || 0).toFixed(2)}</strong></td>
                            <td>
                              <span className="status-pill status-delivered">
                                Delivered
                              </span>
                            </td>
                            <td>
                              <button className="btn-print-slip" onClick={() => handlePrintSlip(order)}>
                                <Printer size={13} /> Invoice Slip
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* VIEW 2: Order Fulfillment Interactive Grid Cards */
                <div className="orders-grid">
                  {filteredOrders.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      <Package size={40} color="#94a3b8" />
                      <p>No orders found matching this filter criteria.</p>
                    </div>
                  ) : (
                    filteredOrders.map(order => (
                      <div key={order.id} className="order-fulfillment-card">
                        <div className="of-card-header">
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <h4>{order.id}</h4>
                              {(order.orderType === 'b2b_retailer' || order.customer?.isRetailer) ? (
                                <span className="order-b2b-tag">🏢 B2B Retailer</span>
                              ) : (
                                <span className="order-b2c-tag">🛍️ Consumer</span>
                              )}
                            </div>
                            <small>{order.createdAt}</small>
                          </div>
                          <span className={`status-pill status-${order.status.toLowerCase().replace(/[^a-z]/g, '')}`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="of-card-body-compact">
                          <div className="of-customer-info">
                            <p><strong>Customer:</strong> {order.customerName || order.customer?.name || 'Customer'}</p>
                            <p><strong>Phone:</strong> {order.phone || order.customer?.phone || 'N/A'}</p>
                            <p><strong>Address:</strong> {order.address || order.customer?.address || 'Local Delivery'}</p>
                          </div>

                          <div className="of-items-list">
                            <h5>Ordered Items ({(order.items || []).length}):</h5>
                            {(order.items || []).map((it, idx) => (
                              <div key={idx} className="of-item-row">
                                <span className="of-item-name">{it.name} (x{it.quantity})</span>
                                <span className="of-item-price">Rs. {(it.price * it.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                            <div className="of-total-row">
                              <span>Grand Total:</span>
                              <strong className="price-tag">Rs. {Number(order.grandTotal || 0).toFixed(2)}</strong>
                            </div>
                          </div>

                          <div className="of-status-updater">
                            <label>Update Stage:</label>
                            <select 
                              value={order.status} 
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            >
                              <option value="Received">Received</option>
                              <option value="Pharmacist Verified / Packing">Pharmacist Verified / Packing</option>
                              <option value="Out for Delivery">Out for Delivery</option>
                              <option value="Delivered">Delivered</option>
                            </select>
                          </div>

                          <div className="of-card-footer">
                            <button className="btn-print-slip" onClick={() => handlePrintSlip(order)}>
                              <Printer size={13} /> Print Slip
                            </button>
                            <a 
                              href={`https://wa.me/${(order.phone || order.customer?.phone || '').replace(/[^0-9]/g, '')}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="btn-wa-direct"
                            >
                              <MessageSquare size={13} /> Contact
                            </a>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </section>
          );
        })()}

        {/* TAB 3: Back-of-House Store Operations */}
        {activeTab === 'store-ops' && (
          <StoreOperationsSection 
            catalog={catalog} 
            onUpdateCatalog={(newCatalog) => {
              setCatalog(newCatalog);
              if (onUpdateProducts) {
                onUpdateProducts(newCatalog);
              }
              handleAddAuditLog({
                id: `LOG-${Date.now().toString().slice(-4)}`,
                timestamp: 'Just now',
                staff: user.name,
                actionType: 'PRICE_EDIT',
                category: 'Inventory',
                details: 'Updated product price/stock in full catalog table',
                severity: 'warning'
              });
            }} 
          />
        )}

        {/* TAB 4: Sales & Financial Analytics */}
        {activeTab === 'analytics' && (
          <AdminAnalyticsSection 
            auditLogs={auditLogs}
            onAddAuditLog={handleAddAuditLog}
          />
        )}

        {/* TAB 5: B2B Retailer Accounts Management */}
        {activeTab === 'retailers' && (
          <section className="admin-section">
            <div className="section-header">
              <h2>Verified B2B Retailer Accounts</h2>
              <p>Create and manage pharmacy/clinic credentials. Registered retailers log in via the main <strong>Staff Login</strong> button to unlock wholesale trade prices.</p>
            </div>

            {/* Create New Retailer Form */}
            <div className="admin-retailer-create-box">
              <div className="arc-header">
                <h4><Plus size={16} /> Register New Partner Retailer</h4>
                <span>Assign a Store Code / Username and Password</span>
              </div>
              <form className="arc-form-grid" onSubmit={handleCreateRetailer}>
                <div className="form-group-compact">
                  <label>Store / Clinic Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Shifa Pharmacy & Clinic"
                    value={newRetailer.name}
                    onChange={(e) => setNewRetailer(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="form-group-compact">
                  <label>Store Code / Username *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. shifa_pharmacy"
                    value={newRetailer.username}
                    onChange={(e) => setNewRetailer(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>

                <div className="form-group-compact">
                  <label>Login Password *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. pass123"
                    value={newRetailer.password}
                    onChange={(e) => setNewRetailer(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>

                <div className="form-group-compact">
                  <label>Sector / Area</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Saddar / Clifton, Karachi"
                    value={newRetailer.area}
                    onChange={(e) => setNewRetailer(prev => ({ ...prev, area: e.target.value }))}
                  />
                </div>

                <div className="form-group-compact">
                  <label>Drug License # (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 04-DL-9823"
                    value={newRetailer.licenseNo}
                    onChange={(e) => setNewRetailer(prev => ({ ...prev, licenseNo: e.target.value }))}
                  />
                </div>

                <div className="form-group-compact arc-submit-wrap">
                  <label>&nbsp;</label>
                  <button type="submit" className="btn-add-retailer">
                    <Plus size={15} /> Save & Grant Access
                  </button>
                </div>
              </form>
            </div>

            {/* Active Retailers Table */}
            <div className="admin-table-wrapper">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Store / Clinic Name</th>
                    <th>Store Code (Username)</th>
                    <th>Password</th>
                    <th>Area / Location</th>
                    <th>License #</th>
                    <th>Discount Tier</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {retailersList.map(ret => (
                    <tr key={ret.id}>
                      <td>
                        <strong className="retailer-row-name"><Store size={14} color="#0d9488" /> {ret.name}</strong>
                      </td>
                      <td>
                        <code>{ret.username}</code>
                      </td>
                      <td>
                        <span className="pwd-mask">{ret.password}</span>
                      </td>
                      <td>{ret.area}</td>
                      <td><small className="license-tag">{ret.licenseNo || 'Verified'}</small></td>
                      <td>
                        <span className="badge-trade-pill">Wholesale Trade (12-15%)</span>
                      </td>
                      <td>
                        <button 
                          className="btn-delete-retailer" 
                          onClick={() => handleDeleteRetailer(ret.id, ret.name, ret)}
                          title="Revoke retailer wholesale access"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* Clickable Prescription Image Inspector Modal */}
      {selectedRx && (
        <div className="modal-overlay" onClick={() => setSelectedRx(null)}>
          <div className="modal-container rx-inspector-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Prescription Inspector ({selectedRx.id})</h2>
              <button className="close-btn" onClick={() => setSelectedRx(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="inspector-layout">
                {/* Photo Viewer */}
                <div className="rx-photo-box">
                  <img src={selectedRx.image} alt="Prescription" />
                </div>

                {/* Info & Action Panel */}
                <div className="rx-info-panel">
                  <h4>Customer Information</h4>
                  <p><strong>Name:</strong> {selectedRx.customerName}</p>
                  <p><strong>Phone:</strong> {selectedRx.phone}</p>
                  <p><strong>Address:</strong> {selectedRx.address}</p>
                  {selectedRx.notes && <p className="notes-box"><strong>Doctor Notes:</strong> {selectedRx.notes}</p>}

                  <div className="pharmacist-signoff-box">
                    <span>Pharmacist Sign-Off Status:</span>
                    <strong>{selectedRx.status}</strong>
                    {selectedRx.verifiedBy && <small>{selectedRx.verifiedBy}</small>}
                  </div>

                  {selectedRx.status === 'Pending' && (
                    <div className="inspector-actions">
                      <button className="btn-approve-rx" onClick={() => handleVerifyRx(selectedRx.id)}>
                        <CheckCircle size={16} /> Verify & Approve Rx
                      </button>
                      <button className="btn-reject-rx" onClick={() => handleRejectRx(selectedRx.id)}>
                        <XCircle size={16} /> Reject Prescription
                      </button>
                    </div>
                  )}

                  <a 
                    href={`https://wa.me/${selectedRx.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${selectedRx.customerName}, regarding your prescription (${selectedRx.id}) submitted to Waqas Medical Store...`)}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn-wa-call"
                  >
                    <MessageSquare size={16} /> WhatsApp Customer Directly
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

