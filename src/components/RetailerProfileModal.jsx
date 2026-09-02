import React, { useState } from 'react';
import { Store, User, Phone, MapPin, FileCheck, Lock, Eye, EyeOff, Save, X, CheckCircle, ShieldCheck, LogOut, Sparkles, Building2, BadgeCheck } from 'lucide-react';

export default function RetailerProfileModal({ 
  isOpen, 
  onClose, 
  retailerUser, 
  onUpdateProfile,
  onLogout 
}) {
  const [formData, setFormData] = useState({
    name: retailerUser?.name || '',
    phone: retailerUser?.phone || '',
    area: retailerUser?.area || '',
    licenseNo: retailerUser?.licenseNo || '',
    username: retailerUser?.username || '',
    password: retailerUser?.password || ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Sync state whenever modal opens or retailerUser changes
  React.useEffect(() => {
    if (retailerUser) {
      setFormData({
        name: retailerUser.name || '',
        phone: retailerUser.phone || '',
        area: retailerUser.area || '',
        licenseNo: retailerUser.licenseNo || '',
        username: retailerUser.username || '',
        password: retailerUser.password || ''
      });
      setIsSaved(false);
    }
  }, [retailerUser, isOpen]);

  if (!isOpen || !retailerUser) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.password.trim()) {
      alert('Pharmacy Name and Password are required.');
      return;
    }

    const updated = {
      ...retailerUser,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      area: formData.area.trim(),
      licenseNo: formData.licenseNo.trim(),
      username: formData.username.trim(),
      password: formData.password.trim()
    };

    onUpdateProfile(updated);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container retailer-profile-modal-v2" onClick={(e) => e.stopPropagation()}>
        {/* Premium Gradient Header with Top-Right Quick Logout & Close */}
        <div className="rp-header-v2">
          <div className="rp-header-top-row">
            <div className="rp-badge-wholesale">
              <Sparkles size={13} />
              <span>B2B Verified Pharmacy Account</span>
            </div>

            <div className="rp-header-actions-group">
              <button className="rp-close-btn-v2" onClick={onClose} title="Close (ESC)">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="rp-profile-banner-info">
            <div className="rp-avatar-box">
              <Building2 size={24} color="#ffffff" />
              <span className="rp-online-dot"></span>
            </div>
            <div className="rp-store-text">
              <h2>{formData.name || retailerUser.name}</h2>
              <p>
                <BadgeCheck size={14} className="badge-icon" /> 
                <span>Active Commercial Partner &bull; {formData.area || retailerUser.area || 'Denso Hall / Saddar, Karachi'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Live Cloud Sync Banner */}
        <div className="rp-sync-pill-banner">
          <ShieldCheck size={16} className="sync-icon" />
          <span>
            <strong>Cloud Synced with Admin:</strong> Updates here are auto-saved to Dr. Waqas's Admin Portal.
          </span>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="rp-form-scroll-container">
          <div className="rp-form-body-v2">
            {/* Card 1: Store & Contact Information */}
            <div className="rp-card-section">
              <div className="rp-section-title">
                <Store size={15} />
                <span>Pharmacy & Contact Information</span>
              </div>

              <div className="rp-field-group">
                <label>Pharmacy / Clinic Name *</label>
                <div className="rp-input-icon-wrap">
                  <Store size={15} className="input-icon" />
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Waqas Partner Retailer / Al-Shifa Pharmacy"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="rp-grid-2col">
                <div className="rp-field-group">
                  <label>Contact / WhatsApp Number</label>
                  <div className="rp-input-icon-wrap">
                    <Phone size={15} className="input-icon" />
                    <input 
                      type="tel" 
                      placeholder="e.g. 0300-1234567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="rp-field-group">
                  <label>Commercial Delivery Locality in Karachi</label>
                  <div className="rp-input-icon-wrap">
                    <MapPin size={15} className="input-icon" />
                    <input 
                      type="text" 
                      placeholder="e.g. Saddar / Clifton / Gulshan, Karachi"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Security & Account Credentials */}
            <div className="rp-card-section">
              <div className="rp-section-title">
                <Lock size={15} />
                <span>Compliance & Login Credentials</span>
              </div>

              <div className="rp-field-group">
                <label>Drug Sale License / NTN Number</label>
                <div className="rp-input-icon-wrap">
                  <FileCheck size={15} className="input-icon" />
                  <input 
                    type="text" 
                    placeholder="e.g. 04-DL-3390"
                    value={formData.licenseNo}
                    onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value })}
                  />
                </div>
              </div>

              <div className="rp-grid-2col">
                <div className="rp-field-group">
                  <label>Login Username</label>
                  <div className="rp-input-icon-wrap">
                    <User size={15} className="input-icon" />
                    <input 
                      type="text" 
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Username"
                    />
                  </div>
                </div>

                <div className="rp-field-group">
                  <label>Login Password *</label>
                  <div className="rp-input-icon-wrap">
                    <Lock size={15} className="input-icon" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Password"
                    />
                    <button 
                      type="button" 
                      className="rp-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "Hide Password" : "Show Password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Actions Bar with Integrated Logout */}
          <div className="rp-modal-footer-v2">
            <button 
              type="button" 
              className="rp-btn-logout-integrated"
              onClick={handleLogoutClick}
              title="Log out and switch back to consumer retail rates"
            >
              <LogOut size={15} />
              <span>Log Out & Exit</span>
            </button>

            <div className="rp-footer-right-actions">
              <button type="button" className="rp-btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="rp-btn-save-v2" disabled={isSaved}>
                {isSaved ? (
                  <>
                    <CheckCircle size={16} /> Updated & Synced!
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save & Sync with Admin
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
