import React, { useState } from 'react';
import { Lock, ShieldCheck, Key, Store, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { INITIAL_RETAILERS } from '../retailersData';

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess, retailers = INITIAL_RETAILERS }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const cleanUsername = username.trim().toLowerCase();

    // 1. Check if backend API is online
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password })
      });
      const data = await response.json();
      if (response.ok) {
        const userRole = data.user?.role === 'retailer' ? 'retailer' : 'admin';
        onLoginSuccess({
          ...data.user,
          token: data.token
        }, userRole);
        return;
      }
    } catch (err) {
      // Backend not running, seamlessly proceed to local auth check
    }

    // 2. Check Admin Credentials
    if (cleanUsername === 'admin' && password === 'admin123') {
      onLoginSuccess({
        id: 'staff-01',
        name: 'Dr. Waqas (Chief Pharmacist)',
        username: 'admin',
        role: 'Pharmacist Admin',
        token: 'mock-jwt-token-xyz789'
      }, 'admin');
      return;
    }

    // 3. Check Retailer Credentials (from admin-assigned retailers list)
    const matchedRetailer = (retailers || INITIAL_RETAILERS).find(
      r => r.username.toLowerCase() === cleanUsername && r.password === password
    );

    if (matchedRetailer) {
      onLoginSuccess({
        id: matchedRetailer.id || `ret-${matchedRetailer.username}`,
        name: matchedRetailer.name,
        username: matchedRetailer.username,
        licenseNo: matchedRetailer.licenseNo,
        area: matchedRetailer.area,
        role: 'Verified Retailer'
      }, 'retailer');
      return;
    }

    setError('Invalid username or password. Please check your credentials.');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container admin-login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><Lock size={18} color="#0284c7" /> Staff & Retailer Portal Login</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form className="modal-body" onSubmit={handleLogin}>
          {error && (
            <div className="login-error-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. admin or demo_retailer or ali_pharmacy" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? 'text' : 'password'} 
                required 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button" 
                className="btn-toggle-password" 
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="demo-hint" style={{ lineHeight: 1.5 }}>
            💡 <strong>Demo Accounts:</strong><br />
            • <strong>Staff Admin:</strong> <code>admin</code> / <code>admin123</code> (Opens Admin Portal)<br />
            • <strong>Partner Retailer:</strong> <code>demo_retailer</code> / <code>retailer123</code> (Unlocks Wholesale Rates)
          </div>

          <button type="submit" className="btn-admin-submit">
            <Key size={16} /> Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
