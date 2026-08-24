const mongoose = require('mongoose');

const RetailerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  area: { type: String, default: 'Islamabad / Rawalpindi' },
  licenseNo: { type: String, default: 'Verified' },
  discountTier: { type: String, default: 'Wholesale Trade Price (12-15% OFF)' },
  role: { type: String, default: 'retailer' }
}, { timestamps: true });

module.exports = mongoose.models.Retailer || mongoose.model('Retailer', RetailerSchema);
