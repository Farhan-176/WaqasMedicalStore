const mongoose = require('mongoose');

const RetailerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  area: { type: String, default: 'Islamabad / Rawalpindi', trim: true },
  licenseNo: { type: String, required: true, unique: true, trim: true }, // Pharmacy / Drug Sales License #
  phone: { 
    type: String, 
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^(\+92|0|0092)?(3\d{2}|[1-9]\d{1})[\d\s-]{7,9}$/.test(v.replace(/[\s-]/g, ''));
      },
      message: props => `${props.value} is not a valid Pakistani phone/mobile format!`
    }
  },
  discountTier: { type: String, default: 'Wholesale Trade Price (12-15% OFF)' },
  role: { type: String, default: 'retailer' }
}, { timestamps: true });

module.exports = mongoose.models.Retailer || mongoose.model('Retailer', RetailerSchema);
