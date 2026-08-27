const mongoose = require('mongoose');

const PrescriptionAuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // 'Uploaded', 'Verified', 'Rejected', 'Dispensed'
  timestamp: { type: Date, default: Date.now },
  staffId: { type: String },
  staffName: { type: String },
  pharmacistLicenseNo: { type: String },
  notes: { type: String }
}, { _id: false });

const PrescriptionSchema = new mongoose.Schema({
  prescriptionId: { type: String, required: true, unique: true, index: true },
  customerName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  notes: { type: String, default: '' },
  imageUrl: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Verified', 'Rejected', 'Dispensed'], 
    default: 'Pending',
    index: true 
  },
  pharmacistSignOff: {
    staffId: String,
    staffName: String,
    licenseNo: String,
    signedAt: Date,
    notes: String
  },
  auditLogs: [PrescriptionAuditLogSchema],
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

PrescriptionSchema.index({ status: 1, createdAt: -1 });
PrescriptionSchema.index({ phone: 1, createdAt: -1 });

module.exports = mongoose.models.Prescription || mongoose.model('Prescription', PrescriptionSchema);
