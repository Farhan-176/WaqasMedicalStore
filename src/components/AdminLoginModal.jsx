import React, { useState } from 'react';
import { Lock, ShieldCheck, Key, UserCheck, AlertCircle } from 'lucide-react';

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok) {
        onLoginSuccess({
          ...data.user,
          token: data.token
        });
        return;
      } else {
        setError(data.error || 'Authentication failed.');
        return;
      }
    } catch (err) {
      // Offline fallback demo mode if Express API server is not currently running
      if (username === 'admin' && password === 'admin123') {
        onLoginSuccess({
          id: 'staff-01',
          name: 'Dr. Waqas (Chief Pharmacist)',
          role: 'Pharmacist Admin',
          token: 'mock-jwt-token-xyz789'
        });
        return;
      }
      setError('Connection error or invalid credentials. (Demo: admin / admin123)');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container admin-login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><Lock size={18} color="#0284c7" /> Staff & Pharmacist Login</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form className="modal-body" onSubmit={handleLogin}>
          <div className="admin-badge-notice">
            <ShieldCheck size={20} color="#0d9488" />
            <div>
              <strong>Protected Staff Portal</strong>
              <p>Sign in to access Prescription Verification Inbox and Order Fulfillment Queue.</p>
            </div>
          </div>

          {error && (
            <div className="login-error-alert">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label>Username / Staff ID</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. admin" 
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

          <div className="demo-hint">
            💡 <span>Demo Credentials:</span> Username: <code>admin</code> | Password: <code>admin123</code>
          </div>

          <button type="submit" className="btn-admin-submit">
            <Key size={16} /> Sign In to Admin Portal
          </button>
        </form>
      </div>
    </div>
  );
}
