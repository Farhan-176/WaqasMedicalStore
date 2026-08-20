import React, { useState, useEffect } from 'react';
import { 
  FileText, CheckCircle, XCircle, Phone, MessageSquare, Printer, 
  Eye, ShieldCheck, Package, Clock, LogOut, Search, Filter, Table, TrendingUp
} from 'lucide-react';
import { INITIAL_PRESCRIPTIONS, INITIAL_FULFILLMENT_ORDERS } from '../adminMockData';
import { MOCK_PRODUCTS } from '../mockData';
import { INITIAL_AUDIT_LOGS } from '../adminAnalyticsData';
import StoreOperationsSection from './StoreOperationsSection';
import AdminAnalyticsSection from './AdminAnalyticsSection';
import '../App.css';

export default function AdminDashboard({ user, products, onUpdateProducts, onLogout }) {
  const [activeTab, setActiveTab] = useState('prescriptions'); // 'prescriptions', 'orders', 'store-ops', 'analytics'
  const [prescriptions, setPrescriptions] = useState(INITIAL_PRESCRIPTIONS);
  const [orders, setOrders] = useState(INITIAL_FULFILLMENT_ORDERS);
  const [catalog, setCatalog] = useState(products || MOCK_PRODUCTS);

  useEffect(() => {
    if (products) {
      setCatalog(products);
    }
  }, [products]);

  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [selectedRx, setSelectedRx] = useState(null); // Image Viewer Modal

  // Audit Logger Helper
  const handleAddAuditLog = (newLog) => {
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Rx Actions
  const handleVerifyRx = (rxId) => {
    setPrescriptions(prev => prev.map(rx => {
      if (rx.id === rxId) {
        const updated = {
          ...rx,
          status: 'Verified',
          verifiedBy: `${user.name} (${new Date().toLocaleTimeString()})`
        };
        // Audit log
        handleAddAuditLog({
          id: `LOG-${Date.now().toString().slice(-4)}`,
          timestamp: 'Just now',
          staff: user.name,
          actionType: 'RX_VERIFIED',
          category: 'Prescription',
          details: `Approved prescription ${rxId} for customer ${rx.customerName}`,
          severity: 'success'
        });
        return updated;
      }
      return rx;
    }));
    setSelectedRx(null);
  };

  const handleRejectRx = (rxId) => {
    setPrescriptions(prev => prev.map(rx => {
      if (rx.id === rxId) {
        const updated = { 
          ...rx, 
          status: 'Rejected', 
          verifiedBy: `${user.name} (${new Date().toLocaleTimeString()})` 
        };
        // Audit log
        handleAddAuditLog({
          id: `LOG-${Date.now().toString().slice(-4)}`,
          timestamp: 'Just now',
          staff: user.name,
          actionType: 'RX_REJECTED',
          category: 'Prescription',
          details: `Rejected prescription ${rxId} for customer ${rx.customerName}`,
          severity: 'warning'
        });
        return updated;
      }
      return rx;
    }));
    setSelectedRx(null);
  };

  // Order Status Queue Actions
  const handleUpdateOrderStatus = (orderId, newStatus) => {
    setOrders(prev => prev.map(ord => {
      if (ord.id === orderId) {
        handleAddAuditLog({
          id: `LOG-${Date.now().toString().slice(-4)}`,
          timestamp: 'Just now',
          staff: user.name,
          actionType: 'ORDER_STAGE',
          category: 'Fulfillment',
          details: `Updated order status for ${orderId} to "${newStatus}"`,
          severity: 'info'
        });
        return { ...ord, status: newStatus };
      }
      return ord;
    }));
  };

  const handlePrintSlip = (order) => {
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
          <p><strong>Customer:</strong> ${order.customerName} (${order.phone})</p>
          <p><strong>Address:</strong> ${order.address}</p>
          <hr />
          <h4>ITEMS:</h4>
          ${order.items.map(i => `<div class="row"><span>${i.name} (x${i.quantity})</span><span>Rs. ${i.price * i.quantity}</span></div>`).join('')}
          <hr />
          <div class="row total"><span>GRAND TOTAL</span><span>Rs. ${order.grandTotal}</span></div>
          <p style="text-align: center; margin-top: 30px;">Thank you for shopping with us!</p>
          <script>window.print();</script>
        </body>
      </html>
    `);
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

        {/* TAB 2: Order Fulfillment Queue */}
        {activeTab === 'orders' && (
          <section className="admin-section">
            <div className="section-header">
              <h2>Order Fulfillment Queue</h2>
              <p>Manage incoming storefront orders, update delivery status stages, and print invoices.</p>
            </div>

            <div className="orders-grid">
              {orders.map(order => (
                <div key={order.id} className="order-fulfillment-card">
                  <div className="of-card-header">
                    <div>
                      <h4>{order.id}</h4>
                      <small>{order.createdAt}</small>
                    </div>
                    <span className={`status-pill status-${order.status.toLowerCase().replace(/[^a-z]/g, '')}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="of-card-body-compact">
                    <div className="of-customer-info">
                      <p><strong>Customer:</strong> {order.customerName}</p>
                      <p><strong>Phone:</strong> {order.phone}</p>
                      <p><strong>Address:</strong> {order.address}</p>
                    </div>

                    <div className="of-items-list">
                      <h5>Ordered Items ({order.items.length}):</h5>
                      {order.items.map((it, idx) => (
                        <div key={idx} className="of-item-row">
                          <span className="of-item-name">{it.name} (x{it.quantity})</span>
                          <span className="of-item-price">Rs. {it.price * it.quantity}</span>
                        </div>
                      ))}
                      <div className="of-total-row">
                        <span>Grand Total:</span>
                        <strong className="price-tag">Rs. {order.grandTotal}</strong>
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
                        href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn-wa-direct"
                      >
                        <MessageSquare size={13} /> Contact
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

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

