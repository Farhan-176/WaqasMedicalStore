import React, { useState, useMemo } from 'react';
import { X, MapPin, Truck, Store, ShieldCheck, ArrowRight, AlertTriangle, Navigation, Info } from 'lucide-react';
import { DELIVERY_ZONES, calculateDistanceDeliveryFee, calculateHaversineDistance, STORE_COORDINATES } from '../deliveryZones';

function roundCurrency(val) {
  return Math.round((Number(val) || 0) * 100) / 100;
}

export default function CheckoutModal({ isOpen, onClose, cartItems, onOrderPlaced, retailerUser }) {
  const [selectedZone, setSelectedZone] = useState(DELIVERY_ZONES[0]);
  const [checkoutType, setCheckoutType] = useState('delivery'); // 'delivery' or 'pickup'
  const [rxRefNumber, setRxRefNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
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

  // Distance-Based Delivery Cost Calculator
  const distanceKm = selectedZone.distanceKm || 5;
  const calculatedDeliveryFee = checkoutType === 'pickup' 
    ? 0 
    : calculateDistanceDeliveryFee(distanceKm);

  const grandTotal = roundCurrency(subtotal + calculatedDeliveryFee);
  const isBelowMinOrder = checkoutType === 'delivery' && subtotal < selectedZone.minOrder;

  // Anti-Hoarding & Quotas Client Pre-Validation
  const hoardingViolation = useMemo(() => {
    const isRetailer = Boolean(retailerUser);
    const maxAllowed = isRetailer ? 500 : 5;
    const minAllowed = isRetailer ? 10 : 1;

    for (const item of cartItems) {
      const q = Number(item.quantity) || 1;
      if (q > maxAllowed) {
        return `Anti-Hoarding Warning: "${item.name}" quantity (${q}) exceeds the maximum quota of ${maxAllowed} ${isRetailer ? 'cartons' : 'packs'} for ${isRetailer ? 'retailers' : 'consumers'}.`;
      }
      if (isRetailer && q < minAllowed) {
        return `B2B Wholesale Warning: "${item.name}" quantity (${q}) is below the minimum wholesale quota of ${minAllowed} packs.`;
      }
    }
    return null;
  }, [cartItems, retailerUser]);

  // B2B Retailers are licensed pharmacies and exempt from consumer prescription upload
  const requiresRx = !retailerUser && cartItems.some(item => item.requiresPrescription);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isBelowMinOrder || hoardingViolation) return;
    setIsSubmitting(true);
    setServerError('');

    const isRetailer = Boolean(retailerUser);

    const recipientDetails = {
      name: formData.name,
      shopName: isRetailer ? retailerUser.name : '',
      phone: formData.phone,
      deliveryAddress: {
        street: formData.address,
        area: selectedZone.name,
        city: 'Karachi',
        coordinates: { lat: selectedZone.lat || STORE_COORDINATES.lat, lng: selectedZone.lng || STORE_COORDINATES.lng }
      }
    };

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
        isRetailer: isRetailer,
        retailerName: isRetailer ? retailerUser.name : null,
        licenseNo: isRetailer ? retailerUser.licenseNo : null,
        notes: rxRefNumber ? `Prescription Ref: ${rxRefNumber}. ${formData.notes}` : formData.notes
      },
      orderType: isRetailer ? 'b2b_retailer' : 'b2c_consumer',
      retailerUsername: isRetailer ? retailerUser.username : '',
      checkoutType,
      zone: selectedZone,
      subtotal,
      deliveryFee: calculatedDeliveryFee,
      grandTotal,
      requiresRx,
      prescriptionId: rxRefNumber || null,
      // Origin Metadata Audit Trail
      orderSource: 'WEB_APP',
      customerType: isRetailer ? 'REGISTERED_RETAILER' : 'ONLINE_CONSUMER',
      recipientDetails
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
          id: savedOrder.orderId || savedOrder.id || ('ORD-' + Math.floor(100000 + Math.random() * 900000)),
          items: cartItems,
          customer: formData,
          checkoutType,
          zone: selectedZone,
          subtotal: savedOrder.subtotal || subtotal,
          deliveryFee: savedOrder.deliveryFee || calculatedDeliveryFee,
          grandTotal: savedOrder.grandTotal || grandTotal,
          requiresRx,
          orderSource: savedOrder.orderSource || 'WEB_APP',
          customerType: savedOrder.customerType || (isRetailer ? 'REGISTERED_RETAILER' : 'ONLINE_CONSUMER'),
          status: savedOrder.status || 'Received',
          createdAt: new Date().toLocaleString()
        });
        return;
      } else {
        const errData = await response.json();
        setServerError(errData.error || 'Order placement failed on server.');
        setIsSubmitting(false);
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
      deliveryFee: calculatedDeliveryFee,
      grandTotal,
      requiresRx,
      orderSource: 'WEB_APP',
      customerType: isRetailer ? 'REGISTERED_RETAILER' : 'ONLINE_CONSUMER',
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
          {/* Server Error Alert */}
          {serverError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '12px' }}>
              ⚠️ {serverError}
            </div>
          )}

          {/* Anti-Hoarding Warning Alert */}
          {hoardingViolation && (
            <div style={{ background: '#fffbe8', border: '1px solid #fde047', color: '#854d0e', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#ca8a04" />
              <span>{hoardingViolation}</span>
            </div>
          )}

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
                  <small>Distance-calculated delivery</small>
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

          {/* Distance-Based Delivery Cost Preview */}
          {checkoutType === 'delivery' && (
            <div className="form-group">
              <label><MapPin size={14} /> Select Delivery Distance Tier *</label>
              <select 
                value={selectedZone.id} 
                onChange={(e) => {
                  const z = DELIVERY_ZONES.find(zone => zone.id === e.target.value);
                  setSelectedZone(z);
                }}
              >
                {DELIVERY_ZONES.map(z => {
                  const fee = calculateDistanceDeliveryFee(z.distanceKm);
                  return (
                    <option key={z.id} value={z.id}>
                      {z.name} - Rs. {fee} Delivery Fee
                    </option>
                  );
                })}
              </select>

              {/* Distance Calculator Preview Breakdown */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '10px 12px', borderRadius: '6px', marginTop: '8px', fontSize: '0.82rem', color: '#334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: '#0284c7', marginBottom: '4px' }}>
                  <Navigation size={14} />
                  <span>Distance-Based Fee Calculator Formula:</span>
                </div>
                <div>
                  Road Distance: <strong>~{distanceKm} km</strong> from Central Store
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                  • Base Fee (0-15 km): Rs. 250
                  {distanceKm > 15 && ` | Extra Distance (${distanceKm - 15} km @ Rs. 30/km): +Rs. ${(distanceKm - 15) * 30}`}
                </div>
              </div>

              {isBelowMinOrder && (
                <div className="min-order-alert" style={{ marginTop: '8px' }}>
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
              <span>Delivery Fee ({distanceKm} km)</span>
              <span>{calculatedDeliveryFee === 0 ? 'FREE' : `Rs. ${calculatedDeliveryFee.toFixed(2)}`}</span>
            </div>
            <div className="calc-row grand-total">
              <span>Grand Total</span>
              <span>Rs. {grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-place-order"
            disabled={isBelowMinOrder || Boolean(hoardingViolation) || isSubmitting}
          >
            {isSubmitting ? 'Processing Order...' : 'Confirm & Place Order'} <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
