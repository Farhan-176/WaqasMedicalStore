const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  role: { 
    type: String, 
    enum: ['admin', 'Pharmacist Admin', 'Staff Pharmacist', 'Inventory Manager'], 
    default: 'Pharmacist Admin' 
  },
  pharmacistLicenseNo: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true }
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
