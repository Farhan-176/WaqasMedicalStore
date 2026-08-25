import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Search, Phone, ShieldCheck, Store, Package, LogOut, FileText, User, ArrowRight, Pill, Sparkles, ChevronDown } from 'lucide-react';

export default function Header({ 
  cartCount, 
  onOpenCart, 
  onOpenAdminLogin,
  retailerUser,
  onRetailerLogout,
  onOpenTrackOrder,
  onOpenRetailerHistory,
  onOpenRetailerProfile,
  searchQuery, 
  setSearchQuery,
  products = []
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isRetailerDropdownOpen, setIsRetailerDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);
  const retailerDropdownRef = useRef(null);

  // Filter top 6 suggestions based on current search input
  const suggestions = React.useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q || q.length < 1) return [];

    const terms = q.split(/\s+/).filter(Boolean);
    return products.filter(p => {
      if (p.showOnMainScreen === false) return false;
      const name = (p.name || '').toLowerCase();
      const generic = (p.genericName || '').toLowerCase();
      const code = (p.code || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      return terms.every(t => name.includes(t) || generic.includes(t) || code.includes(t) || cat.includes(t));
    }).slice(0, 6);
  }, [searchQuery, products]);

  // Close suggestions and retailer dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
      if (retailerDropdownRef.current && !retailerDropdownRef.current.contains(e.target)) {
        setIsRetailerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSuggestion = (productName) => {
    setSearchQuery(productName);
    setShowSuggestions(false);
  };

  return (
    <header className="header-container main-app-navbar">
      {/* Main Navbar Row */}
      <div className="navbar-main-row">
        {/* Brand Logo */}
        <div className="brand-wrapper cursor-pointer">
          <img 
            src="/logo-full.svg" 
            alt="Waqas Medical Store" 
            className="navbar-brand-logo desktop-logo" 
          />
          <img 
            src="/wms-icon.png" 
            alt="Waqas Medical Store" 
            className="navbar-brand-logo mobile-logo" 
          />
        </div>

        {/* Instant Search Bar with Live Suggestions Dropdown */}
        <div className="search-box navbar-search" ref={searchContainerRef}>
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="Search medicine brand or generic formula (e.g. Panadol, Brufen)..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => {
              if (searchQuery.trim().length > 0) setShowSuggestions(true);
            }}
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => { setSearchQuery(''); setShowSuggestions(false); }}>×</button>
          )}

          {/* Live Search Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="search-suggestions-dropdown">
              <div className="suggestions-header">
                <span>Matching Medicines ({suggestions.length})</span>
                <small>Click to view</small>
              </div>
              <div className="suggestions-list">
                {suggestions.map(item => (
                  <div 
                    key={item.id} 
                    className="suggestion-item"
                    onClick={() => handleSelectSuggestion(item.name)}
                  >
                    <img 
                      src={item.image || "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80"} 
                      alt={item.name} 
                      className="suggestion-thumb"
                    />
                    <div className="suggestion-info">
                      <strong className="suggestion-name">{item.name}</strong>
                      <span className="suggestion-generic">{item.genericName}</span>
                    </div>
                    <div className="suggestion-meta">
                      <span className="suggestion-price">
                        Rs. {retailerUser ? (item.tradePrice || item.price) : item.price}
                      </span>
                      <span className="suggestion-cat">{item.category?.replace('-', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="suggestions-footer" onClick={() => setShowSuggestions(false)}>
                <span>View all search results in catalog &rarr;</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="header-actions">
          {/* Order Tracking Button (Only for consumer guests; retailers have My Orders) */}
          {!retailerUser && (
            <button className="navbar-track-btn" onClick={onOpenTrackOrder} title="Track your medicine delivery">
              <Package size={15} />
              <span>Track Order</span>
            </button>
          )}

          {/* Direct WhatsApp Support */}
          <a href="https://wa.me/923000000000" target="_blank" rel="noreferrer" className="navbar-whatsapp-link">
            <Phone size={15} />
            <span>WhatsApp</span>
          </a>

          {/* If Logged in as Retailer: My Orders Button */}
          {retailerUser && (
            <button 
              className="navbar-retailer-history-btn" 
              onClick={onOpenRetailerHistory}
              title="View your past wholesale orders, invoices, and delivery status"
            >
              <FileText size={15} />
              <span>My Orders</span>
            </button>
          )}

          {/* Staff Login Button (Only for guests) */}
          {!retailerUser && (
            <button className="navbar-staff-btn" onClick={onOpenAdminLogin} title="Staff & Retailer Login">
              <ShieldCheck size={15} />
              <span>Staff Login</span>
            </button>
          )}

          {/* Cart Counter Button */}
          <button className="btn-cart" onClick={onOpenCart}>
            <ShoppingBag size={18} />
            <span className="cart-label">Cart</span>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>

          {/* Logged-in Retailer Profile Dropdown Menu at the FAR RIGHT */}
          {retailerUser && (
            <div className="retailer-profile-dropdown-wrapper" ref={retailerDropdownRef}>
              <button 
                className={`navbar-retailer-profile-pill ${isRetailerDropdownOpen ? 'active' : ''}`}
                onClick={() => setIsRetailerDropdownOpen(!isRetailerDropdownOpen)}
                title="Account Settings, Profile & Logout"
              >
                <div className="retailer-pill-avatar">
                  <Store size={14} color="#ffffff" />
                  <span className="pill-online-dot"></span>
                </div>
                <div className="retailer-pill-text">
                  <strong className="retailer-pill-name">{retailerUser.name}</strong>
                  <small className="retailer-pill-sub">Wholesale Active</small>
                </div>
                <ChevronDown size={14} className={`retailer-pill-arrow ${isRetailerDropdownOpen ? 'rotate' : ''}`} />
              </button>

              {/* Dropdown Menu Overlay */}
              {isRetailerDropdownOpen && (
                <div className="retailer-nav-dropdown-menu">
                  <div className="r-dropdown-header">
                    <div className="r-dropdown-avatar">
                      <Store size={18} color="#0d9488" />
                    </div>
                    <div className="r-dropdown-store-info">
                      <strong className="r-dropdown-name">{retailerUser.name}</strong>
                      <span className="r-dropdown-area">{retailerUser.area || 'Denso Hall / Saddar, Karachi'}</span>
                      <span className="r-dropdown-status-chip">
                        <Sparkles size={11} /> Wholesale Rates Active
                      </span>
                    </div>
                  </div>

                  <div className="r-dropdown-divider"></div>

                  <div className="r-dropdown-menu-list">
                    <button 
                      type="button"
                      className="r-dropdown-item"
                      onClick={() => {
                        setIsRetailerDropdownOpen(false);
                        onOpenRetailerProfile();
                      }}
                    >
                      <div className="r-item-icon-box teal">
                        <User size={15} />
                      </div>
                      <div className="r-item-text">
                        <span className="r-item-title">Pharmacy Profile</span>
                        <small className="r-item-desc">Edit store info, phone & password</small>
                      </div>
                    </button>

                    <button 
                      type="button"
                      className="r-dropdown-item"
                      onClick={() => {
                        setIsRetailerDropdownOpen(false);
                        onOpenRetailerHistory();
                      }}
                    >
                      <div className="r-item-icon-box blue">
                        <FileText size={15} />
                      </div>
                      <div className="r-item-text">
                        <span className="r-item-title">My Orders & Invoices</span>
                        <small className="r-item-desc">View past wholesale slips</small>
                      </div>
                    </button>
                  </div>

                  <div className="r-dropdown-divider"></div>

                  <div className="r-dropdown-footer">
                    <button 
                      type="button"
                      className="r-dropdown-logout-btn"
                      onClick={() => {
                        setIsRetailerDropdownOpen(false);
                        onRetailerLogout();
                      }}
                    >
                      <LogOut size={15} />
                      <span>Log Out & Exit Wholesale</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
