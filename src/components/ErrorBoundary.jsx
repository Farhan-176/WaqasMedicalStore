import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI ErrorBoundary caught an unhandled rendering error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '30px 20px',
          margin: '20px auto',
          maxWidth: '600px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          textAlign: 'center',
          color: '#991b1b',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <AlertTriangle size={42} style={{ color: '#ef4444', margin: '0 auto 12px', display: 'block' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px 0' }}>
            {this.props.fallbackTitle || 'Component Rendering Error'}
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#7f1d1d', marginBottom: '18px', lineHeight: 1.5 }}>
            A temporary issue occurred while rendering this section. The rest of the application remains fully functional.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '9px 18px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.88rem'
            }}
          >
            <RefreshCw size={15} /> Reload Component
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
