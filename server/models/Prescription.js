const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
  prescriptionId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  notes: { type: String, default: '' },
  imageUrl: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
  pharmacistSignOff: {
    staffId: String,
    staffName: String,
    signedAt: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', PrescriptionSchema);
