import React, { useState, Suspense } from 'react';
import Header from './components/Header';
import AppSidebar from './components/AppSidebar';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import PrescriptionModal from './components/PrescriptionModal';
import CheckoutModal from './components/CheckoutModal';
import OrderTrackingModal from './components/OrderTrackingModal';
import TrackOrderModal from './components/TrackOrderModal';
import AdminLoginModal from './components/AdminLoginModal';
import RetailerOrderHistoryModal from './components/RetailerOrderHistoryModal';
import RetailerProfileModal from './components/RetailerProfileModal';
import ErrorBoundary from './components/ErrorBoundary';
import { INITIAL_PRESCRIPTIONS, INITIAL_FULFILLMENT_ORDERS } from './adminMockData';
import { INITIAL_RETAILERS } from './retailersData';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from './mockData';
import { ShieldCheck, Truck, RefreshCw, Package, CheckCircle2, AlertCircle, Store, LogOut, Sparkles, FileText } from 'lucide-react';
import './App.css';

const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [products, setProducts] = useState(MOCK_PRODUCTS);

  // Persistent Orders State (Preserved across browser refreshes)
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('wms_orders');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_FULFILLMENT_ORDERS;
  });

  const [prescriptions, setPrescriptions] = useState(INITIAL_PRESCRIPTIONS);

  // Persistent Retailer Accounts State (Preserved across browser refreshes)
  const [retailers, setRetailers] = useState(() => {
    const saved = localStorage.getItem('wms_retailers');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_RETAILERS;
  });

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLetter, setSelectedLetter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Retailer Auth State with session persistence
  const [retailerUser, setRetailerUser] = useState(() => {
    const saved = localStorage.getItem('wms_retailer_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });
  const [isRetailerHistoryOpen, setIsRetailerHistoryOpen] = useState(false);
  const [isRetailerProfileOpen, setIsRetailerProfileOpen] = useState(false);

  // Order Tracking State
  const [activeOrder, setActiveOrder] = useState(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);

  // Admin / Unified Auth State with session persistence
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem('wms_admin_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Validate Admin Session Token against backend API
  React.useEffect(() => {
    if (adminUser) {
      if (!adminUser.token) {
        setAdminUser(null);
        localStorage.removeItem('wms_admin_user');
        return;
      }
      fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${adminUser.token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (!data || !data.valid) {
          console.warn('Security invalidation: Expired or unverified admin JWT token.');
          setAdminUser(null);
          localStorage.removeItem('wms_admin_user');
        }
      })
      .catch(() => {});
    }

    const handleAuthEviction = () => {
      setAdminUser(null);
      showToast('Session expired. Please sign in again.', 'error');
    };

    window.addEventListener('wms:auth-invalidated', handleAuthEviction);
    return () => window.removeEventListener('wms:auth-invalidated', handleAuthEviction);
  }, [adminUser?.token]);


  // Sync state changes to localStorage
  React.useEffect(() => {
    localStorage.setItem('wms_retailers', JSON.stringify(retailers));
  }, [retailers]);

  React.useEffect(() => {
    localStorage.setItem('wms_orders', JSON.stringify(orders));
  }, [orders]);

  React.useEffect(() => {
    if (retailerUser) {
      localStorage.setItem('wms_retailer_user', JSON.stringify(retailerUser));
    } else {
      localStorage.removeItem('wms_retailer_user');
    }
  }, [retailerUser]);

  React.useEffect(() => {
    if (adminUser) {
      localStorage.setItem('wms_admin_user', JSON.stringify(adminUser));
    } else {
      localStorage.removeItem('wms_admin_user');
    }
  }, [adminUser]);

  // Fetch live cloud data from MongoDB Atlas on mount
  React.useEffect(() => {
    const fetchCloudData = async () => {
      try {
        const prodRes = await fetch('/api/products');
        if (prodRes.ok) {
          const cloudProducts = await prodRes.json();
          if (Array.isArray(cloudProducts) && cloudProducts.length > 0) {
            setProducts(cloudProducts.map(p => ({
              ...p,
              id: p._id || p.id,
              code: p.code || 'N/A'
            })));
          }
        }
      } catch (e) {}

      try {
        const retRes = await fetch('/api/retailers');
        if (retRes.ok) {
          const cloudRetailers = await retRes.json();
          if (Array.isArray(cloudRetailers) && cloudRetailers.length > 0) {
            setRetailers(cloudRetailers.map(r => ({
              id: r._id || r.id,
              _id: r._id,
              name: r.name,
              username: r.username,
              password: r.password,
              area: r.area,
              licenseNo: r.licenseNo,
              discountTier: r.discountTier,
              createdAt: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : 'Recent'
            })));
          }
        }
      } catch (e) {}

      try {
        const ordRes = await fetch('/api/orders');
        if (ordRes.ok) {
          const cloudOrders = await ordRes.json();
          if (Array.isArray(cloudOrders) && cloudOrders.length > 0) {
            setOrders(cloudOrders.map(o => ({
              id: o.orderId || o.id || o._id,
              _id: o._id,
              customerName: o.customerName || o.customer?.name || 'Customer',
              phone: o.phone || o.customer?.phone || '',
              address: o.address || o.customer?.address || 'Local Delivery',
              orderType: o.orderType || (o.customer?.isRetailer ? 'b2b_retailer' : 'b2c_consumer'),
              retailerUsername: o.retailerUsername || '',
              items: o.items || [],
              subtotal: o.subtotal || 0,
              deliveryFee: o.deliveryFee || 0,
              grandTotal: o.grandTotal || 0,
              requiresRx: Boolean(o.requiresRx),
              status: o.status || 'Received',
              createdAt: o.createdAt ? new Date(o.createdAt).toLocaleString() : 'Recent'
            })));
          }
        }
      } catch (e) {}
    };

    fetchCloudData();
  }, []);

  // Auto hide intro splash screen after 2.5 seconds or allow tap to dismiss
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const ALPHABET = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

  // Filter products by main screen visibility toggle, category, letter index, and instant search
  const filteredProducts = products
    .filter(product => {
      const isVisibleOnMain = product.showOnMainScreen !== false;
      const query = searchQuery.trim().toLowerCase();
      const isSearching = query.length > 0;

      const matchesCategory = isSearching || selectedCategory === 'all' || product.category === selectedCategory;
      const matchesLetter = isSearching || selectedLetter === 'ALL' || product.name.trim().toUpperCase().startsWith(selectedLetter);

      if (!isSearching) {
        return isVisibleOnMain && matchesCategory && matchesLetter;
      }

      const name = (product.name || '').toLowerCase();
      const generic = (product.genericName || '').toLowerCase();
      const code = (product.code || '').toLowerCase();
      const category = (product.category || '').toLowerCase();

      const terms = query.split(/\s+/).filter(Boolean);
      const matchesSearch = terms.every(term => 
        name.includes(term) || generic.includes(term) || code.includes(term) || category.includes(term)
      );

      return isVisibleOnMain && matchesCategory && matchesLetter && matchesSearch;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  const handleAddToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    showToast(`Added "${product.name}" to cart! 🛒`);
  };

  const handleUpdateQuantity = (id, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(id);
      return;
    }
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: newQty } : item));
  };

  const handleRemoveItem = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleOrderPlaced = async (newOrder) => {
    setActiveOrder(newOrder);
    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    setIsCheckoutOpen(false);
    setIsTrackingOpen(true);
    showToast(`Order #${newOrder.id} placed successfully! 🎉`, 'success');

    // Real-time Cloud Save to MongoDB Atlas
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });
    } catch (e) {
      console.warn('Saved in offline storage mode');
    }
  };

  const handleAdvanceStatus = (nextStatus) => {
    if (activeOrder) {
      setActiveOrder(prev => ({ ...prev, status: nextStatus }));
      setOrders(prev => prev.map(ord => ord.id === activeOrder.id ? { ...ord, status: nextStatus } : ord));
      showToast(`Order status updated to "${nextStatus}"`, 'info');
    }
  };

  const handleReOrder = (pastItems) => {
    setCart(pastItems.map(item => ({
      ...item,
      id: item.productId || item.id,
      quantity: item.quantity,
      price: item.price
    })));
    setIsCartOpen(true);
    showToast(`Added ${pastItems.length} items to your cart from past order! 🛒`, 'success');
  };

  const handleRetailerLogout = () => {
    setRetailerUser(null);
    setCart([]);
    showToast('Switched back to Consumer Retail pricing.', 'info');
  };

  const handleUpdateRetailerProfile = async (updatedRetailer) => {
    setRetailerUser(updatedRetailer);

    setRetailers(prev => prev.map(ret => 
      (ret.id === updatedRetailer.id || ret.username === updatedRetailer.username)
        ? { ...ret, ...updatedRetailer }
        : ret
    ));

    showToast(`Profile updated & synced with Dr. Waqas Admin Portal! 🛡️`, 'success');

    try {
      const retId = updatedRetailer._id || updatedRetailer.id;
      if (retId) {
        await fetch(`/api/retailers/${retId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedRetailer)
        });
      }
    } catch (e) {
      console.warn('Updated in local storage mode');
    }
  };

  const handleUnifiedLoginSuccess = (user, role) => {
    setIsAdminLoginOpen(false);
    if (role === 'admin') {
      setAdminUser(user);
      showToast(`Welcome back, ${user.name}! Staff Portal active. 🛡️`, 'success');
    } else {
      setRetailerUser(user);
      setCart([]);
      showToast(`Welcome ${user.name}! Wholesale Trade Rates are now ACTIVE on main screen. 🏢`, 'success');
    }
  };

  // If Admin is logged in, show full Admin Dashboard View wrapped in ErrorBoundary & Suspense
  if (adminUser) {
    return (
      <ErrorBoundary fallbackTitle="Admin Dashboard Error">
        <Suspense fallback={
          <div className="admin-loading-spinner">
            <div className="spinner-ring"></div>
            <p>Loading Admin Dashboard Portal...</p>
          </div>
        }>
          <AdminDashboard 
            user={adminUser} 
            products={products}
            onUpdateProducts={setProducts}
            orders={orders}
            onUpdateOrders={setOrders}
            prescriptions={prescriptions}
            onUpdatePrescriptions={setPrescriptions}
            retailers={retailers}
            onUpdateRetailers={setRetailers}
            onLogout={() => setAdminUser(null)} 
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary fallbackTitle="Application Interface Error">
      <div className="app-container">
        {/* Website Intro Splash Screen */}
        {showIntro && (
          <div className="intro-splash-screen" onClick={() => setShowIntro(false)}>
            <div className="intro-splash-content">
              <div className="intro-logo-glow-ring">
                <img 
                  src="/wms-icon.png" 
                  alt="Waqas Medical Store" 
                  className="intro-splash-logo" 
                />
              </div>
              <span className="intro-welcome-text">Welcome To</span>
              <h1 className="intro-title">WAQAS MEDICAL STORE</h1>
              <p className="intro-subtitle">Authentic Healthcare & Medicine Solutions</p>
              <div className="intro-loader-bar">
                <div className="intro-loader-progress"></div>
              </div>
              <span className="intro-tap-hint">Tap anywhere to enter</span>
            </div>
          </div>
        )}

        {/* Top Navbar */}
        <Header 
          cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
          retailerUser={retailerUser}
          onRetailerLogout={handleRetailerLogout}
          onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
          onOpenRetailerHistory={() => setIsRetailerHistoryOpen(true)}
          onOpenRetailerProfile={() => setIsRetailerProfileOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          products={products}
        />

        {/* Active Retailer Wholesale Mode Notification Bar */}
        {retailerUser && (
          <div className="retailer-active-banner">
            <div className="banner-left">
              <Store size={18} color="#10b981" />
              <span>
                <strong>B2B Wholesale Portal Active:</strong> Logged in as <strong>{retailerUser.name}</strong> ({retailerUser.area}). All catalog rates are unlocked at wholesale trade prices.
              </span>
            </div>
          </div>
        )}

        {/* Main Content Body */}
        <main className="main-content-body">
          {/* Healthcare Hero Banner */}
          <section className="hero-banner">
            <div className="banner-content">
              <span className="hero-badge">
                {retailerUser ? '🏢 B2B Wholesale Commercial Pharmacy Portal' : '⚡ Instant Local Pharmacy Delivery'}
              </span>
              <h2>
                {retailerUser 
                  ? 'Wholesale Trade Medicines & Commercial Pharmacy Supply'
                  : 'Authentic Medicines & Daily Essentials Delivered'
                }
              </h2>
              <p>
                {retailerUser
                  ? 'Order bulk medicine packs, cartons, and verified pharmaceutical formulas with authorized commercial invoicing.'
                  : 'Upload your doctor\'s prescription or browse our extensive range of genuine products with generic formula alternatives.'
                }
              </p>
              <div className="hero-features">
                <span><ShieldCheck size={16} /> 100% Genuine Medicines</span>
                <span><Truck size={16} /> Fast Delivery in 45 Mins</span>
                <span><RefreshCw size={16} /> Batch Expire Verified</span>
              </div>
            </div>
          </section>

          {/* Category Pills Navigation Slider */}
          <section className="category-section">
            <div className="category-pills">
              {MOCK_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className={`pill-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Alphabetical A-Z Letter Filter Bar */}
            <div className="alphabet-bar">
              <span className="alphabet-title">Filter by Letter:</span>
              <div className="alphabet-pills">
                {ALPHABET.map(letter => (
                  <button
                    key={letter}
                    className={`alphabet-btn ${selectedLetter === letter ? 'active' : ''}`}
                    onClick={() => setSelectedLetter(letter)}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Product Catalog Grid Section */}
          <section className="catalog-section">
            <div className="catalog-header">
              <h3>
                {selectedCategory === 'all' ? 'All Catalog Products' : selectedCategory.replace('-', ' ').toUpperCase()} 
                <span className="count-tag"> ({filteredProducts.length} items)</span>
              </h3>
              {retailerUser && (
                <span className="wholesale-pricing-active-tag">
                  <Sparkles size={13} /> Wholesale Trade Rates Active
                </span>
              )}
            </div>

            <ErrorBoundary fallbackTitle="Catalog Grid Error">
              {filteredProducts.length === 0 ? (
                <div className="no-results" style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <AlertCircle size={44} style={{ color: '#94a3b8', margin: '0 auto 14px', display: 'block' }} />
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>No products found matching "<strong>{searchQuery}</strong>"</p>
                  <span style={{ fontSize: '0.88rem', color: '#64748b', display: 'block', marginTop: '6px' }}>
                    Try searching for common medicine names like <em>Panadol, Brufen, Disprin, Augmentin, Sensodyne</em>, or formula names like <em>Paracetamol</em>.
                  </span>
                  <div style={{ marginTop: '20px' }}>
                    <button 
                      className="btn-action-view" 
                      onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedLetter('ALL'); }}
                      style={{ cursor: 'pointer', display: 'inline-flex', padding: '10px 22px' }}
                    >
                      Clear Search & View All Products
                    </button>
                  </div>
                </div>
              ) : (
                <div className="products-grid">
                  {filteredProducts.map(product => (
                    <ProductCard 
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      isRetailer={Boolean(retailerUser)}
                    />
                  ))}
                </div>
              )}
            </ErrorBoundary>
          </section>
        </main>

        {/* Modals wrapped in ErrorBoundary */}
        <ErrorBoundary fallbackTitle="Cart Component Error">
          <CartDrawer 
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cartItems={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onProceedCheckout={() => {
              setIsCartOpen(false);
              setIsCheckoutOpen(true);
            }}
            retailerUser={retailerUser}
          />
        </ErrorBoundary>

        <ErrorBoundary fallbackTitle="Prescription Modal Error">
          <PrescriptionModal 
            isOpen={isPrescriptionOpen}
            onClose={() => setIsPrescriptionOpen(false)}
          />
        </ErrorBoundary>

        <ErrorBoundary fallbackTitle="Checkout Modal Error">
          <CheckoutModal 
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            cartItems={cart}
            onOrderPlaced={handleOrderPlaced}
            retailerUser={retailerUser}
          />
        </ErrorBoundary>

        <OrderTrackingModal 
          isOpen={isTrackingOpen}
          onClose={() => setIsTrackingOpen(false)}
          order={activeOrder}
          onAdvanceStatus={handleAdvanceStatus}
        />

        <TrackOrderModal 
          isOpen={isTrackOrderOpen}
          onClose={() => setIsTrackOrderOpen(false)}
          orders={orders}
          activeOrder={activeOrder}
          onAdvanceStatus={handleAdvanceStatus}
        />

        <RetailerOrderHistoryModal 
          isOpen={isRetailerHistoryOpen}
          onClose={() => setIsRetailerHistoryOpen(false)}
          retailerUser={retailerUser}
          orders={orders}
          onReOrder={handleReOrder}
        />

        <RetailerProfileModal 
          isOpen={isRetailerProfileOpen}
          onClose={() => setIsRetailerProfileOpen(false)}
          retailerUser={retailerUser}
          onUpdateProfile={handleUpdateRetailerProfile}
          onLogout={handleRetailerLogout}
        />

        <AdminLoginModal 
          isOpen={isAdminLoginOpen}
          onClose={() => setIsAdminLoginOpen(false)}
          retailers={retailers}
          onLoginSuccess={handleUnifiedLoginSuccess}
        />

        {/* Floating Animated Toast Banner */}
        {toast && (
          <div className={`toast-notification toast-${toast.type}`}>
            {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
