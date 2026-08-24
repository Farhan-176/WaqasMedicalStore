const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  id: { type: String }, // alias for frontend matching
  customerName: { type: String },
  phone: { type: String },
  address: { type: String },
  orderType: { type: String, default: 'b2c_consumer' }, // 'b2c_consumer' or 'b2b_retailer'
  retailerUsername: { type: String },
  items: [{
    productId: String,
    id: String,
    name: String,
    quantity: Number,
    price: Number,
    unit: String,
    isWholesale: Boolean,
    requiresPrescription: Boolean
  }],
  customer: {
    name: String,
    phone: String,
    address: String,
    notes: String,
    isRetailer: Boolean,
    retailerName: String
  },
  checkoutType: { type: String, default: 'delivery' },
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

module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);
