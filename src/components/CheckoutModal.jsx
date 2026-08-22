import React, { useState } from 'react';
import { X, MapPin, Truck, Store, CreditCard, ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';
import { DELIVERY_ZONES } from '../deliveryZones';

export default function CheckoutModal({ isOpen, onClose, cartItems, onOrderPlaced, retailerUser }) {
  const [selectedZone, setSelectedZone] = useState(DELIVERY_ZONES[0]);
  const [checkoutType, setCheckoutType] = useState('delivery'); // 'delivery' or 'pickup'
  const [formData, setFormData] = useState({
    name: retailerUser ? retailerUser.name : '',
    phone: '',
    address: retailerUser ? (retailerUser.area || '') : '',
    notes: '',
    paymentMethod: 'cod'
  });

  // Keep form data synced if retailer logs in
  React.useEffect(() => {
    if (retailerUser) {
      setFormData(prev => ({
        ...prev,
        name: retailerUser.name,
        address: prev.address || retailerUser.area || ''
      }));
    }
  }, [retailerUser]);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = checkoutType === 'pickup' ? 0 : selectedZone.fee;
  const grandTotal = subtotal + deliveryFee;
  const isBelowMinOrder = checkoutType === 'delivery' && subtotal < selectedZone.minOrder;
  const requiresRx = cartItems.some(item => item.requiresPrescription);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isBelowMinOrder) return;

    const payload = {
      items: cartItems.map(item => ({
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        requiresPrescription: item.requiresPrescription
      })),
      customer: {
        ...formData,
        isRetailer: Boolean(retailerUser),
        retailerName: retailerUser ? retailerUser.name : null,
        licenseNo: retailerUser ? retailerUser.licenseNo : null
      },
      orderType: retailerUser ? 'b2b_retailer' : 'b2c_consumer',
      checkoutType,
      zone: selectedZone,
      subtotal,
      deliveryFee,
      grandTotal,
      requiresRx
    };

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const savedOrder = await response.json();
        onOrderPlaced({
          id: savedOrder.orderId || ('ORD-' + Math.floor(100000 + Math.random() * 900000)),
          items: cartItems,
          customer: formData,
          checkoutType,
          zone: selectedZone,
          subtotal,
          deliveryFee,
          grandTotal,
          requiresRx,
          status: savedOrder.status || 'Received',
          createdAt: new Date().toLocaleString()
        });
        return;
      }
    } catch (err) {
      console.warn('⚠️ Server offline or connection issue. Using local order placement fallback:', err.message);
    }

    const fallbackOrder = {
      id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
      items: cartItems,
      customer: formData,
      checkoutType,
      zone: selectedZone,
      subtotal,
      deliveryFee,
      grandTotal,
      requiresRx,
      status: 'Received',
      createdAt: new Date().toLocaleString()
    };

    onOrderPlaced(fallbackOrder);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container checkout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Standard Checkout</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          {/* Order Summary Box */}
          <div className="checkout-summary-box">
            <h4>Order Summary ({cartItems.length} items)</h4>
            <div className="summary-items">
              {cartItems.map(item => (
                <div key={item.id} className="summary-item-row">
                  <span>{item.name} (x{item.quantity})</span>
                  <span>Rs. {item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            {requiresRx && (
              <div className="rx-alert-mini">
                <AlertTriangle size={14} color="#d97706" />
                <span>Order contains prescription medicines. Verification required.</span>
              </div>
            )}
          </div>

          {/* Delivery Option Segment */}
          <div className="form-group">
            <label>Fulfillment Option</label>
            <div className="option-grid">
              <button 
                type="button" 
                className={`opt-card ${checkoutType === 'delivery' ? 'active' : ''}`}
                onClick={() => setCheckoutType('delivery')}
              >
                <Truck size={18} />
                <div>
                  <strong>Home Delivery</strong>
                  <small>Deliver to door</small>
                </div>
              </button>
              <button 
                type="button" 
                className={`opt-card ${checkoutType === 'pickup' ? 'active' : ''}`}
                onClick={() => setCheckoutType('pickup')}
              >
                <Store size={18} />
                <div>
                  <strong>Store Pickup</strong>
                  <small>Click & Collect (Free)</small>
                </div>
              </button>
            </div>
          </div>

          {/* Delivery Radius / Zone Dropdown */}
          {checkoutType === 'delivery' && (
            <div className="form-group">
              <label><MapPin size={14} /> Select Delivery Zone / Locality *</label>
              <select 
                value={selectedZone.id} 
                onChange={(e) => {
                  const z = DELIVERY_ZONES.find(zone => zone.id === e.target.value);
                  setSelectedZone(z);
                }}
              >
                {DELIVERY_ZONES.map(z => (
                  <option key={z.id} value={z.id}>
                    {z.name} - {z.fee === 0 ? 'Free Delivery' : `Rs. ${z.fee} Delivery Fee`} {z.minOrder > 0 ? `(Min. Order Rs. ${z.minOrder})` : ''}
                  </option>
                ))}
              </select>

              {isBelowMinOrder && (
                <div className="min-order-alert">
                  ⚠️ Subtotal must be at least Rs. {selectedZone.minOrder} for {selectedZone.name}.
                </div>
              )}
            </div>
          )}

          {/* Customer Info Form */}
          <div className="form-group">
            <label>Full Name *</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. Usman Khan" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Phone / WhatsApp Number *</label>
            <input 
              type="tel" 
              required 
              placeholder="e.g. 0300 1234567" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          {checkoutType === 'delivery' && (
            <div className="form-group">
              <label>Delivery Address *</label>
              <textarea 
                required 
                placeholder="House #, Street #, Neighborhood/Sector details" 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
          )}

          {/* Total Breakdown */}
          <div className="total-calculation-box">
            <div className="calc-row">
              <span>Subtotal</span>
              <span>Rs. {subtotal}</span>
            </div>
            <div className="calc-row">
              <span>Delivery Fee</span>
              <span>{deliveryFee === 0 ? 'FREE' : `Rs. ${deliveryFee}`}</span>
            </div>
            <div className="calc-row grand-total">
              <span>Grand Total</span>
              <span>Rs. {grandTotal}</span>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-place-order"
            disabled={isBelowMinOrder}
          >
            Confirm & Place Order <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
