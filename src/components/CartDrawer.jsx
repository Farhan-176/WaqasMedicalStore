import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, MessageSquare, AlertTriangle } from 'lucide-react';

export default function CartDrawer({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, onProceedCheckout }) {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const requiresRx = cartItems.some(item => item.requiresPrescription);

  const generateWhatsAppPayload = () => {
    let message = `*NEW ORDER - WAQAS MEDICAL STORE*\n\n`;
    cartItems.forEach((item, idx) => {
      message += `${idx + 1}. ${item.name} (${item.quantity}x) - Rs. ${item.price * item.quantity}\n`;
    });
    message += `\n*Total Amount:* Rs. ${subtotal}\n`;
    if (requiresRx) {
      message += `\n⚠️ *Note:* Order contains prescription-required items. Prescription will be verified.`;
    }
    return `https://wa.me/923000000000?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <h2>Your Cart ({cartItems.length})</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Prescription Warning if applicable */}
        {requiresRx && (
          <div className="rx-alert-box">
            <AlertTriangle size={18} color="#d97706" />
            <div>
              <strong>Prescription Required</strong>
              <p>One or more items in your cart require a valid doctor prescription. Please upload it during checkout.</p>
            </div>
          </div>
        )}

        {/* Cart Items List */}
        <div className="drawer-body">
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <p>Your cart is empty.</p>
              <span>Add items from the store to proceed.</span>
            </div>
          ) : (
            cartItems.map((item) => (
              <div className="cart-item" key={item.id}>
                <img src={item.image} alt={item.name} />
                <div className="cart-item-info">
                  <h4>{item.name}</h4>
                  <span className="cart-item-price">Rs. {item.price}</span>
                  {item.requiresPrescription && <span className="rx-tag">Rx</span>}
                </div>
                <div className="qty-controls">
                  <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}><Minus size={14} /></button>
                  <span>{item.quantity}</span>
                  <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}><Plus size={14} /></button>
                </div>
                <button className="remove-btn" onClick={() => onRemoveItem(item.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {cartItems.length > 0 && (
          <div className="drawer-footer">
            <div className="subtotal-row">
              <span>Subtotal</span>
              <span className="subtotal-amount">Rs. {subtotal}</span>
            </div>

            <div className="checkout-actions">
              <button className="btn-primary-checkout" onClick={onProceedCheckout}>
                Proceed to Checkout <ArrowRight size={16} />
              </button>

              <a 
                href={generateWhatsAppPayload()} 
                target="_blank" 
                rel="noreferrer" 
                className="btn-whatsapp-fast"
              >
                <MessageSquare size={16} /> Order via WhatsApp Fast
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
