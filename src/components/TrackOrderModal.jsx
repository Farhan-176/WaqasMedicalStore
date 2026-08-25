import React, { useState } from 'react';
import { Package, Search, CheckCircle, Clock, Truck, MapPin, X, AlertCircle } from 'lucide-react';

export default function TrackOrderModal({ isOpen, onClose, orders, activeOrder, onAdvanceStatus }) {
  const [searchQuery, setSearchQuery] = useState(activeOrder ? activeOrder.id : '');
  const [searchedOrder, setSearchedOrder] = useState(activeOrder || null);
  const [notFound, setNotFound] = useState(false);

  if (!isOpen) return null;

  const handleSearch = (e) => {
    e.preventDefault();
    setNotFound(false);
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    // Search in orders list or active order
    const allOrders = orders || [];
    if (activeOrder && !allOrders.some(o => o.id === activeOrder.id)) {
      allOrders.unshift(activeOrder);
    }

    const matched = allOrders.find(o => {
      const idMatch = (o.id || '').toLowerCase() === query || (o.orderId || '').toLowerCase() === query;
      const phoneClean = (o.phone || o.customer?.phone || '').replace(/[^0-9]/g, '');
      const queryClean = query.replace(/[^0-9]/g, '');
      const phoneMatch = queryClean.length >= 7 && phoneClean.includes(queryClean);
      return idMatch || phoneMatch;
    });

    if (matched) {
      setSearchedOrder(matched);
      setNotFound(false);
    } else {
      setSearchedOrder(null);
      setNotFound(true);
    }
  };

  const steps = [
    { title: 'Order Received', desc: 'Prescription & Items logged' },
    { title: 'Pharmacist Verified / Packing', desc: 'Batch checked by Dr. Waqas' },
    { title: 'Out for Delivery', desc: 'Rider dispatched to your address' },
    { title: 'Delivered', desc: 'Package delivered to door' }
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case 'Received': return 0;
      case 'Pharmacist Verified / Packing': return 1;
      case 'Out for Delivery': return 2;
      case 'Delivered': return 3;
      default: return 0;
    }
  };

  const currentStep = searchedOrder ? getStepIndex(searchedOrder.status) : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container track-order-lookup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><Package size={20} color="#0284c7" /> Live Order Tracking</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          {/* Search Lookup Bar */}
          <form onSubmit={handleSearch} className="track-search-form">
            <div className="track-input-wrap">
              <Search size={18} className="track-search-icon" />
              <input 
                type="text" 
                placeholder="Enter Order ID (e.g. ORD-938947) or Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn-search-track">Track</button>
            </div>
          </form>

          {notFound && (
            <div className="track-not-found">
              <AlertCircle size={20} color="#ef4444" />
              <div>
                <strong>No Order Found</strong>
                <p>We couldn't find an active order matching "<strong>{searchQuery}</strong>". Please check your Order ID or contact us on WhatsApp.</p>
              </div>
            </div>
          )}

          {/* Searched Order Details */}
          {searchedOrder && (
            <div className="track-result-container">
              <div className="track-order-summary-header">
                <div>
                  <span className="order-tag-code">{searchedOrder.id}</span>
                  <h4>{searchedOrder.customerName || searchedOrder.customer?.name || 'Customer'}</h4>
                  <small className="order-time-label">{searchedOrder.createdAt || 'Recent Order'}</small>
                </div>
                <div className="order-badge-container">
                  <span className={`status-pill status-${searchedOrder.status.toLowerCase().replace(/[^a-z]/g, '')}`}>
                    {searchedOrder.status}
                  </span>
                </div>
              </div>

              {/* Step Progress Stepper */}
              <div className="tracking-timeline-modern">
                {steps.map((step, idx) => (
                  <div key={idx} className={`timeline-item ${idx <= currentStep ? 'completed' : ''} ${idx === currentStep ? 'active' : ''}`}>
                    <div className="timeline-bullet">
                      {idx <= currentStep ? <CheckCircle size={16} /> : <Clock size={16} />}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-title">{step.title}</div>
                      <div className="timeline-desc">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Items & Address Summary */}
              <div className="track-details-accordion">
                <div className="track-info-row">
                  <MapPin size={15} color="#0d9488" />
                  <span><strong>Destination:</strong> {searchedOrder.address || searchedOrder.customer?.address || 'Local Delivery Address'}</span>
                </div>
                <div className="track-info-row">
                  <Truck size={15} color="#0284c7" />
                  <span><strong>Fulfillment:</strong> {searchedOrder.checkoutType === 'pickup' ? 'Store Pickup' : 'Express Home Delivery'}</span>
                </div>
                <div className="track-items-mini">
                  <strong>Items Ordered:</strong>
                  {(searchedOrder.items || []).map((item, i) => (
                    <div key={i} className="track-item-line">
                      <span>{item.name} × {item.quantity}</span>
                      <span>Rs. {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="track-total-line">
                    <span>Total Amount:</span>
                    <strong>Rs. {Number(searchedOrder.grandTotal || 0).toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              {/* Live Order Support Link */}
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <a 
                  href={`https://wa.me/923000000000?text=${encodeURIComponent(`Assalam o Alaikum Dr. Waqas, I am checking the status of my order #${searchedOrder.id}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-wa-order-help"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '8px 18px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 800, textDecoration: 'none' }}
                >
                  Need Help? WhatsApp Dispatch Support
                </a>
              </div>
            </div>
          )}

          {!searchedOrder && !notFound && (
            <div className="track-empty-state">
              <Package size={42} color="#94a3b8" />
              <p>Enter your Order ID (from your confirmation receipt) or Phone Number to check real-time package status.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
