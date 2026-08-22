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
import RetailerLoginModal from './components/RetailerLoginModal';
import { INITIAL_PRESCRIPTIONS, INITIAL_FULFILLMENT_ORDERS } from './adminMockData';
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from './mockData';
import { ShieldCheck, Truck, RefreshCw, Package, CheckCircle2, AlertCircle, Store, LogOut, Sparkles } from 'lucide-react';
import './App.css';

const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [orders, setOrders] = useState(INITIAL_FULFILLMENT_ORDERS);
  const [prescriptions, setPrescriptions] = useState(INITIAL_PRESCRIPTIONS);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLetter, setSelectedLetter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Retailer Auth State (B2B wholesale pricing)
  const [retailerUser, setRetailerUser] = useState(null);
  const [isRetailerLoginOpen, setIsRetailerLoginOpen] = useState(false);

  // Order Tracking State
  const [activeOrder, setActiveOrder] = useState(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);

  // Admin Auth State
  const [adminUser, setAdminUser] = useState(null);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Auto hide intro splash screen after 2.5 seconds or allow tap to dismiss
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const ALPHABET = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

  // Filter products by main screen visibility toggle, category, letter index, and instant search, aligned alphabetically (A-Z)
  const filteredProducts = products
    .filter(product => {
      const isVisibleOnMain = product.showOnMainScreen !== false;
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesLetter = selectedLetter === 'ALL' || product.name.trim().toUpperCase().startsWith(selectedLetter);
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        product.name.toLowerCase().includes(query) || 
        (product.genericName && product.genericName.toLowerCase().includes(query));
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

  const handleOrderPlaced = (newOrder) => {
    setActiveOrder(newOrder);
    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    setIsCheckoutOpen(false);
    setIsTrackingOpen(true);
    showToast(`Order #${newOrder.id} placed successfully! 🎉`, 'success');
  };

  const handleAdvanceStatus = (nextStatus) => {
    if (activeOrder) {
      setActiveOrder(prev => ({ ...prev, status: nextStatus }));
      setOrders(prev => prev.map(ord => ord.id === activeOrder.id ? { ...ord, status: nextStatus } : ord));
      showToast(`Order status updated to "${nextStatus}"`, 'info');
    }
  };

  const handleRetailerLoginSuccess = (user) => {
    setRetailerUser(user);
    setCart([]); // Reset cart so items recalculate with wholesale rates
    showToast(`Welcome ${user.name}! Wholesale Trade Rates are now ACTIVE 🏢`, 'success');
  };

  const handleRetailerLogout = () => {
    setRetailerUser(null);
    setCart([]);
    showToast('Switched back to Consumer Retail pricing.', 'info');
  };

  // If Admin is logged in, show full Admin Dashboard View wrapped in Suspense for code splitting
  if (adminUser) {
    return (
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
          onLogout={() => setAdminUser(null)} 
        />
      </Suspense>
    );
  }

  return (
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
        onOpenPrescription={() => setIsPrescriptionOpen(true)}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        retailerUser={retailerUser}
        onOpenRetailerLogin={() => setIsRetailerLoginOpen(true)}
        onRetailerLogout={handleRetailerLogout}
        onOpenTrackOrder={() => setIsTrackOrderOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
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
          <button className="btn-exit-retailer" onClick={handleRetailerLogout}>
            <LogOut size={13} /> Exit Wholesale Mode
          </button>
        </div>
      )}

      {/* Main Content Body */}
      <main className="main-content-body">
        {/* Pure Healthcare Hero Banner */}
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

          {filteredProducts.length === 0 ? (
            <div className="no-results">
              <p>No products found matching "<strong>{searchQuery}</strong>"</p>
              <span>Try searching for generic names like Paracetamol, Amoxicillin, or Ibuprofen.</span>
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
        </section>
      </main>

      {/* Cart Slide-out Drawer */}
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
      />

      {/* Prescription Upload Modal */}
      <PrescriptionModal 
        isOpen={isPrescriptionOpen}
        onClose={() => setIsPrescriptionOpen(false)}
      />

      {/* Standard Checkout Modal */}
      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cart}
        onOrderPlaced={handleOrderPlaced}
        retailerUser={retailerUser}
      />

      {/* Post-Checkout Live Order Tracking Confirmation Modal */}
      <OrderTrackingModal 
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        order={activeOrder}
        onAdvanceStatus={handleAdvanceStatus}
      />

      {/* On-Demand Navbar Track Order Lookup Modal */}
      <TrackOrderModal 
        isOpen={isTrackOrderOpen}
        onClose={() => setIsTrackOrderOpen(false)}
        orders={orders}
        activeOrder={activeOrder}
        onAdvanceStatus={handleAdvanceStatus}
      />

      {/* B2B Retailer Login Modal */}
      <RetailerLoginModal 
        isOpen={isRetailerLoginOpen}
        onClose={() => setIsRetailerLoginOpen(false)}
        onLoginSuccess={handleRetailerLoginSuccess}
      />

      {/* Staff / Admin Login Modal */}
      <AdminLoginModal 
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={(loggedInUser) => {
          setAdminUser(loggedInUser);
          setIsAdminLoginOpen(false);
          showToast(`Logged in as ${loggedInUser.name}`, 'success');
        }}
      />

      {/* Floating Animated Toast Banner */}
      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
