const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  items: [{
    productId: String,
    name: String,
    quantity: Number,
    price: Number,
    requiresPrescription: Boolean
  }],
  customer: {
    name: String,
    phone: String,
    address: String,
    notes: String
  },
  checkoutType: { type: String, enum: ['delivery', 'pickup'], default: 'delivery' },
  zone: {
    id: String,
    name: String,
    fee: Number
  },
  subtotal: Number,
  deliveryFee: Number,
  grandTotal: Number,
  requiresRx: Boolean,
  status: { 
    type: String, 
    enum: ['Received', 'Pharmacist Verified / Packing', 'Out for Delivery', 'Delivered'],
    default: 'Received'
  },
  paymentMethod: { type: String, default: 'cod' }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
