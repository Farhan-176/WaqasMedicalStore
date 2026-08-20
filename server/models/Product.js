const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  code: { type: String, index: true },
  name: { type: String, required: true, index: true },
  genericName: { type: String, required: true, index: true },
  category: { type: String, required: true, index: true },
  price: { type: Number, required: true },
  unit: { type: String, default: 'Pack / Strip' },
  stock: { type: Number, default: 0 },
  reservedStock: { type: Number, default: 0 }, // Lock engine for pending orders
  requiresPrescription: { type: Boolean, default: false },
  coldStorage: { type: Boolean, default: false },
  image: { type: String, default: '' },
  batches: [{
    batchNo: String,
    mfgDate: Date,
    expiryDate: Date,
    purchaseCost: Number,
    sellingPrice: Number,
    stockQuantity: Number
  }]
}, { timestamps: true });

// Text index for fast instant search queries across name and generic formula
ProductSchema.index({ name: 'text', genericName: 'text', code: 'text' });
ProductSchema.index({ category: 1, price: 1 });

module.exports = mongoose.model('Product', ProductSchema);
