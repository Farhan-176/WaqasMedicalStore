import React from 'react';
import { X, CheckCircle, Package, Truck, ShieldCheck, MapPin, Phone, Clock, MessageSquare, Heart, Sparkles } from 'lucide-react';

const TRACKING_STEPS = [
  { id: 'Received', label: 'Order Received', desc: 'Order received by pharmacy counter' },
  { id: 'Pharmacist Verified / Packing', label: 'Pharmacist Verified', desc: 'Rx verified & items packed' },
  { id: 'Out for Delivery', label: 'Out for Delivery', desc: 'Rider dispatched to your address' },
  { id: 'Delivered', label: 'Delivered', desc: 'Successfully handed over' }
];

export default function OrderTrackingModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  // Determine current step index
  const currentStepIndex = TRACKING_STEPS.findIndex(s => s.id === order.status);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container tracking-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Order Tracking ({order.id})</h2>
            <small className="order-time">Placed at: {order.createdAt}</small>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          {/* Visual Stepper Bar */}
          <div className="tracking-stepper">
            {TRACKING_STEPS.map((step, idx) => {
              const isCompleted = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div key={step.id} className={`stepper-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                  <div className="stepper-icon-box">
                    {isCompleted ? <CheckCircle size={18} /> : <span>{idx + 1}</span>}
                  </div>
                  <div className="stepper-content">
                    <strong className="step-label">{step.label}</strong>
                    <small className="step-desc">{step.desc}</small>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Customer & Fulfillment Info Card */}
          <div className="order-details-card">
            <h4>Fulfillment Details</h4>
            <div className="info-row">
              <span>Customer:</span> <strong>{order.customer.name} ({order.customer.phone})</strong>
            </div>
            <div className="info-row">
              <span>Type:</span> <strong>{order.checkoutType === 'pickup' ? 'Store Pickup (Denso Hall, Karachi)' : 'Home Delivery (Karachi)'}</strong>
            </div>
            {order.checkoutType === 'delivery' && (
              <div className="info-row">
                <span>Address:</span> <strong>{order.customer.address} {order.zone?.name ? `(${order.zone.name})` : ''}</strong>
              </div>
            )}
            <div className="info-row">
              <span>Total Amount:</span> <strong className="highlight-price">Rs. {order.grandTotal}</strong>
            </div>
          </div>

          {/* Warm Thank You & Health Care Card */}
          <div className="tracking-thankyou-card">
            <div className="thankyou-card-header">
              <Heart size={18} className="thankyou-heart-icon" />
              <strong>Thank You for Choosing Waqas Medical Store!</strong>
            </div>
            <p className="thankyou-card-text">
              We truly appreciate your order and trust in us. Our pharmacy team is preparing your authentic healthcare essentials with the utmost care and quality standards. Wishing you and your family good health!
            </p>
            <div className="thankyou-card-action">
              <a 
                href={`https://wa.me/923000000000?text=${encodeURIComponent(`Assalam o Alaikum Dr. Waqas, regarding my Order #${order.id} for ${order.customer.name}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="btn-thankyou-wa"
              >
                <MessageSquare size={15} /> Need Help? Chat with Us on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
