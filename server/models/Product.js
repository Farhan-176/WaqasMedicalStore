const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
  batchNo: { type: String, required: true, trim: true },
  mfgDate: { type: Date },
  expiryDate: { type: Date, required: true },
  purchaseCost: { type: Number, min: 0 },
  sellingPrice: { type: Number, min: 0 },
  stockQuantity: { type: Number, default: 0, min: 0 }
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  code: { type: String, index: true, trim: true },
  name: { type: String, required: true, index: true, trim: true },
  genericName: { type: String, required: true, index: true, trim: true },
  category: { type: String, required: true, index: true, trim: true },
  drapRegNo: { type: String, trim: true, index: true }, // Pakistan DRAP Drug Reg # for recall compliance
  price: { type: Number, required: true, min: 0 }, // Wholesale / Base Trade Price
  originalPrice: { type: Number, min: 0 }, // Consumer MRP
  unit: { type: String, default: 'Pack / Strip' },
  stripsPerPack: { type: Number, default: 10, min: 1 },
  stripPrice: { type: Number, min: 0 },
  packagingMode: { type: String, enum: ['pack', 'strip', 'both'], default: 'pack' },
  stock: { type: Number, default: 0, min: 0 },
  reservedStock: { type: Number, default: 0, min: 0 }, // Lock engine for pending orders
  requiresPrescription: { type: Boolean, default: false, index: true },
  isPrescriptionRequired: { type: Boolean, default: false },
  coldStorage: { type: Boolean, default: false },
  image: { type: String, default: '' },
  itemCode: { type: String, trim: true, index: true },
  showOnMainScreen: { type: Boolean, default: true },
  orderLimits: {
    consumerMin: { type: Number, default: 1 },
    consumerMax: { type: Number, default: 5 },
    retailerMin: { type: Number, default: 10 },
    retailerMax: { type: Number, default: 500 }
  },
  batches: [BatchSchema]
}, { timestamps: true });

// Compound and text indexes for optimal query efficiency (<50ms latency)
ProductSchema.index({ name: 'text', genericName: 'text', itemCode: 1, code: 1 });
ProductSchema.index({ category: 1, price: 1 });
ProductSchema.index({ requiresPrescription: 1, stock: 1 });

module.exports = mongoose.models.Product || mongoose.model('Product', ProductSchema);
