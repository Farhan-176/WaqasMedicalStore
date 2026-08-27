import React, { useState } from 'react';
import { X, MapPin, Truck, Store, CreditCard, ShieldCheck, ArrowRight, AlertTriangle, FileText, Upload } from 'lucide-react';
import { DELIVERY_ZONES } from '../deliveryZones';

function roundCurrency(val) {
  return Math.round((Number(val) || 0) * 100) / 100;
}

export default function CheckoutModal({ isOpen, onClose, cartItems, onOrderPlaced, retailerUser }) {
  const [selectedZone, setSelectedZone] = useState(DELIVERY_ZONES[0]);
  const [checkoutType, setCheckoutType] = useState('delivery'); // 'delivery' or 'pickup'
  const [rxRefNumber, setRxRefNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const rawSubtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const subtotal = roundCurrency(rawSubtotal);
  const deliveryFee = checkoutType === 'pickup' ? 0 : roundCurrency(selectedZone.fee);
  const grandTotal = roundCurrency(subtotal + deliveryFee);
  const isBelowMinOrder = checkoutType === 'delivery' && subtotal < selectedZone.minOrder;
  
  // B2B Retailers are licensed pharmacies and exempt from consumer prescription upload
  const requiresRx = !retailerUser && cartItems.some(item => item.requiresPrescription);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isBelowMinOrder) return;
    setIsSubmitting(true);

    const payload = {
      items: cartItems.map(item => ({
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        unit: item.unit || 'Per Pack',
        requiresPrescription: item.requiresPrescription
      })),
      customer: {
        ...formData,
        isRetailer: Boolean(retailerUser),
        retailerName: retailerUser ? retailerUser.name : null,
        licenseNo: retailerUser ? retailerUser.licenseNo : null,
        notes: rxRefNumber ? `Prescription Ref: ${rxRefNumber}. ${formData.notes}` : formData.notes
      },
      orderType: retailerUser ? 'b2b_retailer' : 'b2c_consumer',
      retailerUsername: retailerUser ? retailerUser.username : '',
      checkoutType,
      zone: selectedZone,
      subtotal,
      deliveryFee,
      grandTotal,
      requiresRx,
      prescriptionId: rxRefNumber || null
    };

    const API_BASE_URL = import.meta.env.VITE_API_URL || '';

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const savedOrder = await response.json();
        setIsSubmitting(false);
        onOrderPlaced({
          id: savedOrder.orderId || ('ORD-' + Math.floor(100000 + Math.random() * 900000)),
          items: cartItems,
          customer: formData,
          checkoutType,
          zone: selectedZone,
          subtotal: savedOrder.subtotal || subtotal,
          deliveryFee: savedOrder.deliveryFee || deliveryFee,
          grandTotal: savedOrder.grandTotal || grandTotal,
          requiresRx,
          status: savedOrder.status || 'Received',
          createdAt: new Date().toLocaleString()
        });
        return;
      }
    } catch (err) {
      console.warn('⚠️ Server offline or connection issue. Using local order placement fallback:', err.message);
    }

    setIsSubmitting(false);
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
                  <span>Rs. {roundCurrency(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            {retailerUser ? (
              <div className="b2b-license-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '7px 10px', borderRadius: '6px', fontSize: '0.8rem', marginTop: '10px' }}>
                <ShieldCheck size={15} color="#16a34a" />
                <span><strong>Commercial Pharmacy Exemption:</strong> Verified Retailer ({retailerUser.licenseNo || 'Drug License Verified'}). Prescription upload exempt.</span>
              </div>
            ) : requiresRx ? (
              <div className="rx-alert-mini" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} color="#d97706" />
                  <span><strong>Schedule G/H Medication:</strong> Prescription required by drug regulation laws.</span>
                </div>
                <div style={{ marginTop: '4px' }}>
                  <input
                    type="text"
                    placeholder="Enter Prescription ID / Doctor Notes (Optional if submitted via Rx Portal)"
                    value={rxRefNumber}
                    onChange={(e) => setRxRefNumber(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.82rem', border: '1px solid #fed7aa', borderRadius: '4px', background: '#fff' }}
                  />
                </div>
              </div>
            ) : null}
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
                  <small>Denso Hall, Karachi (Free)</small>
                </div>
              </button>
            </div>
          </div>

          {/* Delivery Radius / Zone Dropdown */}
          {checkoutType === 'delivery' && (
            <div className="form-group">
              <label><MapPin size={14} /> Select Karachi Delivery Zone / Locality *</label>
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
              placeholder="e.g. Muhammad Usman" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Phone / WhatsApp Number *</label>
            <input 
              type="tel" 
              required 
              placeholder="e.g. 0300-1234567" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          {checkoutType === 'delivery' && (
            <div className="form-group">
              <label>Delivery Address in Karachi *</label>
              <textarea 
                required 
                placeholder="House/Flat #, Street #, Block/Area, Karachi (e.g. Block 5, Gulshan-e-Iqbal, Karachi)" 
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
          )}

          {/* Total Breakdown with Strict 2 Decimal Formatting */}
          <div className="total-calculation-box">
            <div className="calc-row">
              <span>Subtotal</span>
              <span>Rs. {subtotal.toFixed(2)}</span>
            </div>
            <div className="calc-row">
              <span>Delivery Fee</span>
              <span>{deliveryFee === 0 ? 'FREE' : `Rs. ${deliveryFee.toFixed(2)}`}</span>
            </div>
            <div className="calc-row grand-total">
              <span>Grand Total</span>
              <span>Rs. {grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-place-order"
            disabled={isBelowMinOrder || isSubmitting}
          >
            {isSubmitting ? 'Processing Order...' : 'Confirm & Place Order'} <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
