import React, { useState, useEffect } from 'react';
import { 
  FileText, CheckCircle, XCircle, Phone, MessageSquare, Printer, 
  Eye, ShieldCheck, Package, Clock, LogOut, Search, Filter, Table, TrendingUp, Store, Plus, Trash2, Key, MapPin, UserCheck, FileCheck,
  ChevronLeft, ChevronRight, Menu, ShoppingCart, Edit, X, Tag, Smartphone, Send, User, Navigation, RefreshCw
} from 'lucide-react';
import { INITIAL_PRESCRIPTIONS, INITIAL_FULFILLMENT_ORDERS } from '../adminMockData';
import { INITIAL_RETAILERS } from '../retailersData';
import { MOCK_PRODUCTS } from '../mockData';
import { INITIAL_AUDIT_LOGS } from '../adminAnalyticsData';
import StoreOperationsSection from './StoreOperationsSection';
import CounterSaleSection from './CounterSaleSection';
import AdminAnalyticsSection from './AdminAnalyticsSection';
import WhatsAppCatalogModal from './WhatsAppCatalogModal';
import CustomerProfileModal from './CustomerProfileModal';
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [prescriptions, setPrescriptions] = useState(propPrescriptions || INITIAL_PRESCRIPTIONS);
  const [orders, setOrders] = useState(propOrders || INITIAL_FULFILLMENT_ORDERS);
  const [retailersList, setRetailersList] = useState(propRetailers || INITIAL_RETAILERS);
  const [catalog, setCatalog] = useState(products || MOCK_PRODUCTS);

  // Orders Filter & Search State
  const [orderQueueFilter, setOrderQueueFilter] = useState('all'); // 'all', 'active', 'delivered', 'b2b', 'b2c'
  const [orderAreaFilter, setOrderAreaFilter] = useState('all'); // 'all', 'Saddar', 'Gulshan', 'DHA', 'North Nazimabad', 'Korangi'
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Modals & Direct WhatsApp Invoice State
  const [isWhatsAppCatalogOpen, setIsWhatsAppCatalogOpen] = useState(false);
  const [selectedCustomerForProfile, setSelectedCustomerForProfile] = useState(null);
  const [sendingWaOrderIds, setSendingWaOrderIds] = useState({});
  const [toastNotification, setToastNotification] = useState(null);

  // Retailer State: New & Edit
  const [newRetailer, setNewRetailer] = useState({
    name: '',
    username: '',
    password: '',
    area: '',
    licenseNo: ''
  });
  const [editingRetailer, setEditingRetailer] = useState(null);
  const [isAddRetailerModalOpen, setIsAddRetailerModalOpen] = useState(false);
  const [loadedPosOrder, setLoadedPosOrder] = useState(null);

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

  const handleOpenEditRetailer = (ret) => {
    setEditingRetailer({
      id: ret.id,
      _id: ret._id,
      name: ret.name || '',
      username: ret.username || '',
      password: ret.password || '',
      area: ret.area || '',
      licenseNo: ret.licenseNo || '',
      discountTier: ret.discountTier || 'Wholesale Trade Price (12-15% OFF)',
      phone: ret.phone || ''
    });
  };

  const handleSaveEditRetailer = async (e) => {
    e.preventDefault();
    if (!editingRetailer || !editingRetailer.name || !editingRetailer.username) return;

    const targetId = editingRetailer._id || editingRetailer.id;
    const updatedData = {
      ...editingRetailer,
      name: editingRetailer.name.trim(),
      username: editingRetailer.username.trim().toLowerCase(),
      password: editingRetailer.password.trim(),
      area: editingRetailer.area.trim(),
      licenseNo: editingRetailer.licenseNo.trim(),
      discountTier: editingRetailer.discountTier || 'Wholesale Trade Price (12-15% OFF)',
      phone: editingRetailer.phone ? editingRetailer.phone.trim() : ''
    };

    // Update remote backend if available
    try {
      await fetch(`${API_BASE_URL}/api/retailers/${targetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify(updatedData)
      });
    } catch (err) {
      console.warn('Updated in local state:', err.message);
    }

    // Update local state
    setRetailersList(prev => {
      const updated = prev.map(r => (r.id === editingRetailer.id || r._id === targetId ? { ...r, ...updatedData } : r));
      if (onUpdateRetailers) onUpdateRetailers(updated);
      return updated;
    });

    handleAddAuditLog({
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: 'Just now',
      staff: user.name,
      actionType: 'RETAILER_UPDATED',
      category: 'Accounts',
      details: `Updated retailer account details for "${updatedData.name}" (Code: ${updatedData.username})`,
      severity: 'info'
    });

    setEditingRetailer(null);
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
    <div className={`admin-portal-container admin-sidebar-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Modern Left Sidebar Navigation */}
      <aside className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <div className="brand-icon-badge" title="Waqas Pharmacy Staff Portal">
              <ShieldCheck size={22} color="#ffffff" />
            </div>
            {!isSidebarCollapsed && (
              <div className="admin-brand-text">
                <h3>WAQAS <span>PHARMACY</span></h3>
                <span className="portal-sub-badge">Clinical Staff Portal</span>
              </div>
            )}
          </div>
          <button 
            type="button" 
            className="btn-toggle-sidebar" 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Close / Collapse Sidebar"}
            aria-label="Toggle Sidebar"
          >
            {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="admin-sidebar-nav">
          {!isSidebarCollapsed && <div className="nav-section-label">OPERATIONS</div>}
          <button 
            className={`admin-side-btn ${activeTab === 'counter-sale' ? 'active' : ''}`}
            onClick={() => setActiveTab('counter-sale')}
            title={isSidebarCollapsed ? "Counter Sale (POS)" : undefined}
          >
            <ShoppingCart size={17} />
            {!isSidebarCollapsed && <span className="btn-label">Counter Sale (POS)</span>}
            <span className="side-count-badge badge-teal">FAST</span>
          </button>

          <button 
            className={`admin-side-btn ${activeTab === 'prescriptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('prescriptions')}
            title={isSidebarCollapsed ? "Rx Verification" : undefined}
          >
            <FileText size={17} />
            {!isSidebarCollapsed && <span className="btn-label">Rx Verification</span>}
            {prescriptions.filter(p => p.status === 'Pending').length > 0 && (
              <span className="side-count-badge badge-red">
                {prescriptions.filter(p => p.status === 'Pending').length}
              </span>
            )}
          </button>

          <button 
            className={`admin-side-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
            title={isSidebarCollapsed ? "Orders Queue" : undefined}
          >
            <Package size={17} />
            {!isSidebarCollapsed && <span className="btn-label">Orders Queue</span>}
            {orders.filter(o => o.status !== 'Delivered').length > 0 && (
              <span className="side-count-badge badge-blue">
                {orders.filter(o => o.status !== 'Delivered').length}
              </span>
            )}
          </button>

          <button 
            className={`admin-side-btn ${activeTab === 'store-ops' ? 'active' : ''}`}
            onClick={() => setActiveTab('store-ops')}
            title={isSidebarCollapsed ? "Store Operations" : undefined}
          >
            <Table size={17} />
            {!isSidebarCollapsed && <span className="btn-label">Store Operations</span>}
            <span className="side-count-badge badge-teal">LIVE</span>
          </button>

          {!isSidebarCollapsed && <div className="nav-section-label">MANAGEMENT & DATA</div>}
          <button 
            className={`admin-side-btn ${activeTab === 'retailers' ? 'active' : ''}`}
            onClick={() => setActiveTab('retailers')}
            title={isSidebarCollapsed ? "Retailer Accounts" : undefined}
          >
            <Store size={17} />
            {!isSidebarCollapsed && <span className="btn-label">Retailer Accounts</span>}
            <span className="side-count-badge badge-green">{retailersList.length}</span>
          </button>

          <button 
            className={`admin-side-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
            title={isSidebarCollapsed ? "Sales & Analytics" : undefined}
          >
            <TrendingUp size={17} />
            {!isSidebarCollapsed && <span className="btn-label">Sales & Analytics</span>}
            <span className="side-count-badge badge-pulse">LIVE</span>
          </button>
        </nav>

        {/* Sidebar Pharmacist Footer */}
        <div className="admin-sidebar-footer">
          <div className="pharmacist-profile-card" title={user.name || 'Dr. Waqas'}>
            <div className="pharmacist-avatar">
              👨‍⚕️
            </div>
            {!isSidebarCollapsed && (
              <div className="pharmacist-info">
                <strong className="pharmacist-name">{user.name || 'Dr. Waqas'}</strong>
                <span className="pharmacist-duty">
                  <span className="duty-dot"></span> On Duty • Chief Pharmacist
                </span>
              </div>
            )}
          </div>
          <button className="btn-sidebar-logout" onClick={onLogout} title="Sign Out of Staff Portal">
            <LogOut size={15} /> {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Admin View Canvas */}
      <main className="admin-main-canvas">
        {/* TOP ADMIN HEADER BAR (Hidden in Counter Sale POS mode for full-screen zero-scroll fit) */}
        {activeTab !== 'counter-sale' && (
          <header className="admin-top-header">
            <div className="header-breadcrumbs-wrap">
              {isSidebarCollapsed && (
                <button 
                  type="button" 
                  className="btn-canvas-toggle-sidebar"
                  onClick={() => setIsSidebarCollapsed(false)}
                  title="Expand Sidebar Navigation"
                >
                  <Menu size={17} />
                  <span>Menu</span>
                </button>
              )}
              <div className="header-breadcrumbs">
                <span className="breadcrumb-root">Staff Hub</span>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-active">
                  {activeTab === 'prescriptions' && 'Rx Verification Inbox'}
                  {activeTab === 'orders' && 'Order Fulfillment Queue'}
                  {activeTab === 'store-ops' && 'Store Operations & Inventory'}
                  {activeTab === 'retailers' && 'B2B Retailer Accounts'}
                  {activeTab === 'analytics' && 'Sales & Audit Intelligence'}
                </span>
              </div>
            </div>

            <div className="header-right-badges" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                type="button"
                className="btn-whatsapp-sheet-trigger"
                onClick={() => setIsWhatsAppCatalogOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(5, 150, 105, 0.2)'
                }}
              >
                <Smartphone size={14} /> Generate WhatsApp Rate Sheet
              </button>
              <span className="session-security-pill">
                <ShieldCheck size={13} color="#10b981" /> DRAP Authorized Session
              </span>
            </div>
          </header>
        )}

        <div className={`admin-body ${activeTab === 'counter-sale' ? 'admin-body-pos-fit' : ''}`}>
        {/* TAB 0: Standalone High-Speed Counter Sale POS */}
        {activeTab === 'counter-sale' && (
          <CounterSaleSection 
            catalog={catalog} 
            retailers={retailersList}
            currentUser={user}
            incomingOrder={loadedPosOrder}
            orders={orders}
            onClearIncomingOrder={() => setLoadedPosOrder(null)}
            onUpdateCatalog={(newCatalog) => {
              setCatalog(newCatalog);
              if (onUpdateProducts) {
                onUpdateProducts(newCatalog);
              }
              handleAddAuditLog({
                id: `LOG-${Date.now().toString().slice(-4)}`,
                timestamp: 'Just now',
                staff: user.name,
                actionType: 'POS_SALE',
                category: 'Counter Sale',
                details: 'Processed high-speed wholesale counter sale via POS billing terminal',
                severity: 'info'
              });
            }} 
          />
        )}

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
                  {prescriptions.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                        <FileCheck size={36} color="#0d9488" style={{ margin: '0 auto 10px', display: 'block' }} />
                        <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>No Prescriptions Pending Review</strong>
                        <p style={{ margin: '6px auto 0', maxWidth: '420px', fontSize: '0.78rem', color: '#94a3b8' }}>
                          Customer prescription uploads requiring pharmacist verification will appear here in real time.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    prescriptions.map(rx => (
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
                    ))
                  )}
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

            // Area/Zone filter
            if (orderAreaFilter !== 'all') {
              const addr = (order.address || order.customer?.address || order.zone?.name || order.recipientDetails?.deliveryAddress?.area || '').toLowerCase();
              if (!addr.includes(orderAreaFilter.toLowerCase())) return false;
            }

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
                <h2>Order Fulfillment Queue & Audit Registry</h2>
                <p>Manage incoming storefront shipments, filter by Karachi delivery zones, inspect B2B retailer lifetime ledgers, and dispatch PDF invoices directly to WhatsApp.</p>
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
                  <strong className="a-stat-val" style={{ color: 'var(--primary)' }}>{activeCount}</strong>
                  <small className="a-stat-sub">Needs packaging / delivery</small>
                </div>
                <div className="a-stat-card delivered-card">
                  <span className="a-stat-label">✅ Past Delivered</span>
                  <strong className="a-stat-val" style={{ color: 'var(--secondary)' }}>{deliveredCount}</strong>
                  <small className="a-stat-sub">Successfully fulfilled</small>
                </div>
                <div className="a-stat-card revenue-card">
                  <span className="a-stat-label">💰 Total Order Value</span>
                  <strong className="a-stat-val" style={{ color: 'var(--primary)' }}>Rs. {totalRevenue.toFixed(2)}</strong>
                  <small className="a-stat-sub">{b2bCount} B2B Wholesale orders</small>
                </div>
              </div>

              {/* Filter Controls & Search Bar */}
              <div className="admin-order-controls-bar" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
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
                      📜 Past Delivered ({deliveredCount})
                    </button>
                    <button 
                      className={`a-filter-pill ${orderQueueFilter === 'b2b' ? 'active' : ''}`}
                      onClick={() => setOrderQueueFilter('b2b')}
                    >
                      🏢 B2B Retailers ({b2bCount})
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Area/Zone Dispatch Filter Dropdown */}
                    <select 
                      value={orderAreaFilter} 
                      onChange={e => setOrderAreaFilter(e.target.value)}
                      style={{ padding: '6px 10px', fontSize: '0.82rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: '600' }}
                    >
                      <option value="all">📍 All Distance Bands</option>
                      <option value="Standard">Standard (Up to 15 km)</option>
                      <option value="Extended">Extended (16 – 20 km)</option>
                      <option value="Outer">Outer (21 – 25 km)</option>
                      <option value="Far">Far (26 – 30 km)</option>
                    </select>
                  </div>
                </div>

                <div className="a-order-search-box" style={{ width: '100%' }}>
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

              {/* VIEW 1: Past Delivered History Table */}
              {orderQueueFilter === 'delivered' ? (
                <div className="admin-table-wrapper">
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Type</th>
                        <th>Customer / Store</th>
                        <th>Phone</th>
                        <th>Delivery Destination</th>
                        <th>Items Count</th>
                        <th>Grand Total</th>
                        <th>Direct WhatsApp</th>
                        <th>Invoice / Slip</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>
                            No delivered past orders found matching your search and filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map(order => {
                          const isRetailerOrder = order.orderType === 'b2b_retailer' || order.customer?.isRetailer;
                          return (
                            <tr key={order.id}>
                              <td><code>{order.id}</code></td>
                              <td>
                                {isRetailerOrder ? (
                                  <span className="order-b2b-tag">🏢 B2B Retailer</span>
                                ) : (
                                  <span className="order-b2c-tag">🛍️ Consumer</span>
                                )}
                              </td>
                              <td>
                                <strong>{order.customerName || order.customer?.name || 'Customer'}</strong>
                                {isRetailerOrder && (
                                  <button 
                                    style={{ background: '#e0f2fe', border: 'none', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem', marginLeft: '6px', fontWeight: '600' }}
                                    onClick={() => setSelectedCustomerForProfile(order)}
                                    title="View B2B Retailer Lifetime Audit & Purchase Ledger"
                                  >
                                    👤 Retailer Ledger
                                  </button>
                                )}
                              </td>
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
                                <button 
                                  style={{ background: '#059669', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
                                  onClick={() => handleSendDirectWhatsAppInvoice(order)}
                                  disabled={sendingWaOrderIds[order.id]}
                                  title="Direct Server-Side PDF Dispatch to Customer Phone"
                                >
                                  <Smartphone size={12} />
                                  {sendingWaOrderIds[order.id] ? 'Sending...' : 'Send Invoice'}
                                </button>
                              </td>
                              <td style={{ display: 'flex', gap: '6px' }}>
                                <button className="btn-print-slip" onClick={() => handlePrintSlip(order)}>
                                  <Printer size={13} /> Slip
                                </button>
                                <button 
                                  className="btn-pos-direct-load" 
                                  onClick={() => {
                                    setLoadedPosOrder(order);
                                    setActiveTab('counter-sale');
                                  }}
                                  title="Open this order in Counter POS"
                                >
                                  <ShoppingCart size={13} /> POS
                                </button>
                              </td>
                            </tr>
                          );
                        })
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
                    filteredOrders.map(order => {
                      const isRetailerOrder = order.orderType === 'b2b_retailer' || order.customer?.isRetailer;
                      return (
                        <div key={order.id} className="order-fulfillment-card">
                          <div className="of-card-header">
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h4>{order.id}</h4>
                                {isRetailerOrder ? (
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
                              <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span><strong>Customer:</strong> {order.customerName || order.customer?.name || 'Customer'}</span>
                                {isRetailerOrder && (
                                  <button 
                                    style={{ background: '#e0f2fe', border: 'none', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}
                                    onClick={() => setSelectedCustomerForProfile(order)}
                                    title="View Retailer Lifetime Ledger"
                                  >
                                    👤 Retailer Ledger
                                  </button>
                                )}
                              </p>
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

                            <div className="of-card-footer" style={{ flexWrap: 'wrap', gap: '6px' }}>
                              <button className="btn-print-slip" onClick={() => handlePrintSlip(order)}>
                                <Printer size={13} /> Print Slip
                              </button>

                              <button 
                                style={{ background: '#059669', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
                                onClick={() => handleSendDirectWhatsAppInvoice(order)}
                                disabled={sendingWaOrderIds[order.id]}
                                title="Direct Server-Side PDF Dispatch to Customer Phone"
                              >
                                <Smartphone size={13} />
                                {sendingWaOrderIds[order.id] ? 'Sending PDF...' : 'Direct WA Invoice'}
                              </button>

                              <button 
                                className="btn-pos-direct-load" 
                                onClick={() => {
                                  setLoadedPosOrder(order);
                                  setActiveTab('counter-sale');
                                }}
                                title="Open and process this order directly in Counter Sale POS register"
                              >
                                <ShoppingCart size={13} /> Open POS
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
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
            retailers={retailersList}
            currentUser={user}
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
            catalog={catalog}
            orders={orders}
            auditLogs={auditLogs}
            onAddAuditLog={handleAddAuditLog}
          />
        )}

        {/* TAB 5: B2B Retailer Accounts Management */}
        {activeTab === 'retailers' && (
          <section className="admin-section">
            <div className="ops-card">
              <div className="ops-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div className="ops-header-title-block">
                  <h3>
                    Verified B2B Pharmacy Accounts 
                    <span className="ops-count-pill">{retailersList.length} Active Partners</span>
                  </h3>
                  <p>Manage B2B pharmacy wholesale accounts. Registered retailers log in to unlock wholesale trade prices.</p>
                </div>
                <button 
                  type="button" 
                  className="btn-action-primary" 
                  style={{ background: '#059669', color: '#fff', padding: '10px 18px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)' }}
                  onClick={() => setIsAddRetailerModalOpen(true)}
                >
                  <Plus size={18} /> Add Retailer
                </button>
              </div>

              {/* Active Retailers Table (Main Focus) */}
              <div className="ops-table-wrapper" style={{ marginTop: '16px' }}>
                <table className="admin-table ops-table">
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
                          <strong className="retailer-row-name" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0f172a' }}>
                            <Store size={14} color="#0d9488" /> {ret.name}
                          </strong>
                        </td>
                        <td>
                          <code style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem', color: '#0f766e', fontWeight: 700 }}>{ret.username}</code>
                        </td>
                        <td>
                          <span className="pwd-mask" style={{ background: '#f8fafc', padding: '3px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569' }}>{ret.password}</span>
                        </td>
                        <td>{ret.area || 'Karachi'}</td>
                        <td><small className="license-tag" style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.74rem' }}>{ret.licenseNo || '04-DL-VERIFIED'}</small></td>
                        <td>
                          <span className="badge-trade-pill" style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: '12px', fontWeight: 800, fontSize: '0.74rem' }}>
                            {ret.discountTier || 'Wholesale Trade (12-15% OFF)'}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                            <button 
                              type="button"
                              className="btn-edit-retailer" 
                              onClick={() => handleOpenEditRetailer(ret)}
                              title="Edit retailer account details & discount tier"
                              style={{ background: '#f0fdfa', color: '#0d9488', border: '1px solid #99f6e4', padding: '4px 10px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s ease' }}
                            >
                              <Edit size={13} /> Edit
                            </button>
                            <button 
                              type="button"
                              className="btn-delete-retailer" 
                              onClick={() => handleDeleteRetailer(ret.id, ret.name, ret)}
                              title="Revoke retailer wholesale access"
                              style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '4px 10px', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s ease' }}
                            >
                              <Trash2 size={13} /> Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
        </div>
      </main>

      {/* Add New Retailer Modal Popup */}
      {isAddRetailerModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddRetailerModalOpen(false)}>
          <div 
            className="modal-container" 
            style={{ maxWidth: '580px', width: '100%', background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 45px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0' }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#ecfdf5', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={20} color="#059669" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: '800' }}>Register New B2B Pharmacy Partner</h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Assign Store Code / Username and Password for wholesale access</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAddRetailerModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={(e) => {
              handleCreateRetailer(e);
              setIsAddRetailerModalOpen(false);
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group-compact">
                  <label style={{ fontWeight: '700', fontSize: '0.82rem', color: '#334155', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Store size={14} color="#0d9488" /> Store / Clinic Name *
                  </label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Shifa Pharmacy & Clinic"
                    value={newRetailer.name}
                    onChange={(e) => setNewRetailer(prev => ({ ...prev, name: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group-compact">
                    <label style={{ fontWeight: '700', fontSize: '0.82rem', color: '#334155', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <UserCheck size={14} color="#0d9488" /> Store Code / Username *
                    </label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. shifa_pharmacy"
                      value={newRetailer.username}
                      onChange={(e) => setNewRetailer(prev => ({ ...prev, username: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                    />
                  </div>

                  <div className="form-group-compact">
                    <label style={{ fontWeight: '700', fontSize: '0.82rem', color: '#334155', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Key size={14} color="#0d9488" /> Login Password *
                    </label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. pass123"
                      value={newRetailer.password}
                      onChange={(e) => setNewRetailer(prev => ({ ...prev, password: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group-compact">
                    <label style={{ fontWeight: '700', fontSize: '0.82rem', color: '#334155', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} color="#0d9488" /> Sector / Area (Karachi)
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Saddar / Clifton, Karachi"
                      value={newRetailer.area}
                      onChange={(e) => setNewRetailer(prev => ({ ...prev, area: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                    />
                  </div>

                  <div className="form-group-compact">
                    <label style={{ fontWeight: '700', fontSize: '0.82rem', color: '#334155', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileCheck size={14} color="#0d9488" /> Drug License # (Optional)
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. 04-DL-9823"
                      value={newRetailer.licenseNo}
                      onChange={(e) => setNewRetailer(prev => ({ ...prev, licenseNo: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsAddRetailerModalOpen(false)}
                  style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '9px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '9px 20px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Save & Grant Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Retailer Details Modal */}
      {editingRetailer && (
        <div className="modal-overlay" onClick={() => setEditingRetailer(null)}>
          <div 
            className="modal-container" 
            style={{ maxWidth: '580px', width: '100%', background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 45px rgba(15, 23, 42, 0.25)', border: '1px solid #e2e8f0' }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#f0fdfa', border: '1px solid #ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Store size={20} color="#0d9488" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Edit Retailer Details</h3>
                  <small style={{ color: '#64748b' }}>Update account information, password, or discount tier</small>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingRetailer(null)} 
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditRetailer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group-compact">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    <Store size={13} /> Store / Clinic Name *
                  </label>
                  <input 
                    type="text" 
                    required 
                    style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem', outline: 'none' }}
                    value={editingRetailer.name}
                    onChange={(e) => setEditingRetailer(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="form-group-compact">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    <UserCheck size={13} /> Store Code (Username) *
                  </label>
                  <input 
                    type="text" 
                    required 
                    style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem', outline: 'none' }}
                    value={editingRetailer.username}
                    onChange={(e) => setEditingRetailer(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group-compact">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    <Key size={13} /> Login Password *
                  </label>
                  <input 
                    type="text" 
                    required 
                    style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem', outline: 'none' }}
                    value={editingRetailer.password}
                    onChange={(e) => setEditingRetailer(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>

                <div className="form-group-compact">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    <MapPin size={13} /> Sector / Area (Location)
                  </label>
                  <input 
                    type="text" 
                    style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem', outline: 'none' }}
                    value={editingRetailer.area}
                    onChange={(e) => setEditingRetailer(prev => ({ ...prev, area: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group-compact">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    <FileCheck size={13} /> Drug License #
                  </label>
                  <input 
                    type="text" 
                    style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem', outline: 'none' }}
                    value={editingRetailer.licenseNo}
                    onChange={(e) => setEditingRetailer(prev => ({ ...prev, licenseNo: e.target.value }))}
                  />
                </div>

                <div className="form-group-compact">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    <Tag size={13} /> Discount Tier
                  </label>
                  <select 
                    style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem', outline: 'none', background: '#ffffff' }}
                    value={editingRetailer.discountTier}
                    onChange={(e) => setEditingRetailer(prev => ({ ...prev, discountTier: e.target.value }))}
                  >
                    <option value="Wholesale Trade Price (12-15% OFF)">Wholesale Trade Price (12-15% OFF)</option>
                    <option value="VIP Clinic Partner (18% OFF)">VIP Clinic Partner (18% OFF)</option>
                    <option value="Tier 1 Standard (10% OFF)">Tier 1 Standard (10% OFF)</option>
                    <option value="Special Distributor (20% OFF)">Special Distributor (20% OFF)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                <button 
                  type="button" 
                  onClick={() => setEditingRetailer(null)}
                  style={{ padding: '8px 18px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.84rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ padding: '8px 22px', background: 'var(--hero-gradient)', border: 'none', borderRadius: '8px', fontSize: '0.84rem', fontWeight: 800, color: '#ffffff', cursor: 'pointer', boxShadow: '0 2px 8px rgba(6, 78, 59, 0.25)' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* WhatsApp Rate Sheet Broadcast Generator Modal */}
      <WhatsAppCatalogModal 
        isOpen={isWhatsAppCatalogOpen} 
        onClose={() => setIsWhatsAppCatalogOpen(false)} 
        products={catalog} 
      />

      {/* Customer Lifetime Profile & Audit Ledger Modal */}
      <CustomerProfileModal 
        isOpen={Boolean(selectedCustomerForProfile)} 
        onClose={() => setSelectedCustomerForProfile(null)} 
        customerInfo={selectedCustomerForProfile} 
        orders={orders} 
      />

      {/* Direct Toast Notification Banner */}
      {toastNotification && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#0f172a',
          color: '#38bdf8',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
          zIndex: 9999,
          fontSize: '0.88rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          border: '1px solid #0284c7'
        }}>
          <Smartphone size={18} color="#38bdf8" />
          <span>{toastNotification}</span>
        </div>
      )}
    </div>
  );
}

