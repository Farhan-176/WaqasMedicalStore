import React from 'react';
import { ShoppingBag, Upload, Search, Phone, ShieldCheck, Clock, MapPin, Store, Package, LogOut } from 'lucide-react';

export default function Header({ 
  cartCount, 
  onOpenCart, 
  onOpenPrescription, 
  onOpenAdminLogin,
  retailerUser,
  onOpenRetailerLogin,
  onRetailerLogout,
  onOpenTrackOrder,
  searchQuery, 
  setSearchQuery
}) {
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

        {/* Instant Search Bar */}
        <div className="search-box navbar-search">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="Search medicine brand or generic name (e.g. Paracetamol)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="header-actions">
          {/* Order Tracking Button */}
          <button className="navbar-track-btn" onClick={onOpenTrackOrder} title="Track your medicine delivery">
            <Package size={15} />
            <span>Track Order</span>
          </button>

          {/* Direct WhatsApp Ordering / Support */}
          <a href="https://wa.me/923000000000" target="_blank" rel="noreferrer" className="navbar-whatsapp-link">
            <Phone size={15} />
            <span>WhatsApp</span>
          </a>

          {/* B2B Retailer Portal Login / Active Indicator */}
          {retailerUser ? (
            <div className="navbar-retailer-active-badge">
              <Store size={15} color="#0d9488" />
              <div className="retailer-name-compact">
                <strong>{retailerUser.name}</strong>
                <small>B2B Wholesale</small>
              </div>
              <button className="btn-retailer-logout-mini" onClick={onRetailerLogout} title="Switch to Consumer retail pricing">
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button className="navbar-retailer-btn" onClick={onOpenRetailerLogin} title="Login for Wholesale Trade Rates">
              <Store size={15} />
              <span>Retailer Login</span>
            </button>
          )}

          {/* Staff Login for Dr. Waqas */}
          <button className="navbar-staff-btn" onClick={onOpenAdminLogin} title="Staff & Pharmacist Dashboard">
            <ShieldCheck size={15} />
            <span>Staff Login</span>
          </button>

          {/* Cart Counter Button */}
          <button className="btn-cart" onClick={onOpenCart}>
            <ShoppingBag size={18} />
            <span className="cart-label">Cart</span>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
