const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  id: { type: String },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  unit: { type: String, default: 'Per Pack' },
  batchNo: { type: String, default: 'GEN-BATCH-01' },
  expiryDate: { type: Date },
  isWholesale: { type: Boolean, default: false },
  requiresPrescription: { type: Boolean, default: false }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, index: true },
  id: { type: String, index: true }, // alias for frontend matching
  customerName: { type: String, trim: true },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  orderType: { type: String, enum: ['b2c_consumer', 'b2b_retailer'], default: 'b2c_consumer' },
  retailerUsername: { type: String, trim: true, index: true },
  items: [OrderItemSchema],
  customer: {
    name: String,
    phone: String,
    address: String,
    notes: String,
    isRetailer: Boolean,
    retailerName: String,
    licenseNo: String
  },
  checkoutType: { type: String, enum: ['delivery', 'pickup'], default: 'delivery' },
  zone: {
    id: String,
    name: String,
    fee: { type: Number, default: 0, min: 0 }
  },
  subtotal: { type: Number, required: true, min: 0 },
  deliveryFee: { type: Number, default: 0, min: 0 },
  grandTotal: { type: Number, required: true, min: 0 },
  requiresRx: { type: Boolean, default: false },
  prescriptionId: { type: String },
  prescriptionImageUrl: { type: String },
  status: { 
    type: String, 
    enum: ['Received', 'Pharmacist Verified / Packing', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Received',
    index: true
  },
  paymentMethod: { type: String, default: 'cod' }
}, { timestamps: true });

// Compound indexes for fast admin querying and order tracking
OrderSchema.index({ retailerUsername: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ phone: 1, createdAt: -1 });

module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);
