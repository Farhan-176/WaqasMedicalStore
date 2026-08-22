import React, { useState } from 'react';
import { Store, ShieldCheck, Key, Lock, Phone, MessageSquare, AlertCircle } from 'lucide-react';

export const DEMO_RETAILERS = [
  { username: 'ali_pharmacy', password: 'retailer123', name: 'Ali Medicos & Pharmacy', licenseNo: '04-DL-1982', area: 'Sector G-9, Islamabad' },
  { username: 'city_clinic', password: 'retailer123', name: 'City Care Clinic & Med', licenseNo: '04-DL-2415', area: 'Sector F-8, Islamabad' },
  { username: 'demo_retailer', password: 'retailer123', name: 'Waqas Partner Retailer', licenseNo: '04-DL-3390', area: 'Rawalpindi / Islamabad' }
];

export default function RetailerLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim().toLowerCase();
    const matched = DEMO_RETAILERS.find(
      r => r.username.toLowerCase() === cleanUser && r.password === password
    );

    if (matched) {
      onLoginSuccess({
        id: `ret-${matched.username}`,
        name: matched.name,
        username: matched.username,
        licenseNo: matched.licenseNo,
        area: matched.area,
        role: 'Verified Retailer'
      });
      onClose();
    } else {
      setError('Invalid retailer credentials. Please check with Dr. Waqas.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container retailer-login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><Store size={20} color="#0d9488" /> Verified Retailer & Clinic Login</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form className="modal-body" onSubmit={handleLogin}>
          <div className="retailer-badge-notice">
            <ShieldCheck size={24} color="#0d9488" />
            <div>
              <strong>B2B Wholesale Pharmacy Access</strong>
              <p>Log in with your admin-assigned account to unlock wholesale trade prices, bulk box offers, and commercial invoicing.</p>
            </div>
          </div>

          {error && (
            <div className="login-error-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label>Retailer Username / Store Code</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. ali_pharmacy or demo_retailer" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              required 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="demo-hint-retailer">
            💡 <span>Demo Retailer Account:</span> Username: <code>demo_retailer</code> | Password: <code>retailer123</code>
          </div>

          <button type="submit" className="btn-retailer-submit">
            <Key size={16} /> Unlock Wholesale Trade Rates
          </button>

          <div className="retailer-whatsapp-help">
            <p>Don't have a retailer account or forgot password?</p>
            <a 
              href="https://wa.me/923000000000?text=Assalam%20o%20Alaikum%20Dr.%20Waqas,%20I%20want%20to%20register%20my%20medical%20store/clinic%20for%20wholesale%20B2B%20rates." 
              target="_blank" 
              rel="noreferrer"
              className="btn-whatsapp-register"
            >
              <MessageSquare size={14} /> Request Retailer Access on WhatsApp
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
