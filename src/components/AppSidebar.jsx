import React from 'react';
import { 
  LayoutGrid, Pill, Baby, Sparkles, HeartPulse, ShoppingBag, 
  Upload, Clock, Phone, ShieldCheck 
} from 'lucide-react';

const ICON_MAP = {
  LayoutGrid: LayoutGrid,
  Pill: Pill,
  Baby: Baby,
  Sparkles: Sparkles,
  HeartPulse: HeartPulse,
  ShoppingBag: ShoppingBag
};

export default function AppSidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  onOpenPrescription,
  onOpenAdminLogin,
  isMobileOpen,
  onCloseMobile
}) {
  return (
    <aside className={`app-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand Identity */}
      <div className="sidebar-brand">
        <img src="/logo-full.svg" alt="Waqas Medical Store" className="sidebar-logo" />
        <span className="sidebar-badge">Pure Health</span>
      </div>

      {/* Prescription Upload Card Widget */}
      <div className="sidebar-rx-card">
        <div className="rx-card-icon">
          <Upload size={20} />
        </div>
        <div className="rx-card-content">
          <h4>Order with Rx</h4>
          <p>Upload doctor's prescription for instant review</p>
          <button className="rx-upload-btn" onClick={onOpenPrescription}>
            Upload Doctor Rx
          </button>
        </div>
      </div>

      {/* Main Categories Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-group-title">CATEGORIES</div>
        <ul className="nav-list">
          {categories.map((cat) => {
            const IconComponent = ICON_MAP[cat.icon] || LayoutGrid;
            const isActive = selectedCategory === cat.id;
            return (
              <li key={cat.id}>
                <button
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    onSelectCategory(cat.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                >
                  <IconComponent size={18} className="nav-icon" />
                  <span className="nav-label">{cat.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sidebar Footer Info */}
      <div className="sidebar-footer">
        <div className="store-status">
          <Clock size={14} />
          <span>Open Daily: 8 AM - 11:30 PM</span>
        </div>
        <a href="https://wa.me/923000000000" target="_blank" rel="noreferrer" className="whatsapp-help-btn">
          <Phone size={14} /> WhatsApp Support
        </a>
        <button className="staff-login-btn" onClick={onOpenAdminLogin}>
          <ShieldCheck size={14} /> Staff Portal
        </button>
      </div>
    </aside>
  );
}
