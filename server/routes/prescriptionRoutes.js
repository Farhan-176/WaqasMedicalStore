const express = require('express');
const router = express.Router();
const multer = require('multer');
const Prescription = require('../models/Prescription');
const { adminOnly } = require('../middleware/authMiddleware');

// Storage configuration for prescription uploads
const storage = multer.memoryStorage();

// Strict File Filter: Only allow legitimate image files
const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Security error: Only PNG, JPG, JPEG, and WEBP prescription image files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB limit
  fileFilter: imageFileFilter
});

// POST /api/prescriptions/upload - Customer Upload Rx Photo
router.post('/upload', upload.single('prescriptionImage'), async (req, res) => {
  try {
    const { customerName, phone, address, notes } = req.body;
    const prescriptionId = 'RX-' + Math.floor(100 + Math.random() * 900);
    
    const mockCloudinaryUrl = req.file ? `https://res.cloudinary.com/waqasmedical/image/upload/rx_${Date.now()}.jpg` : 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80';

    const newRx = new Prescription({
      prescriptionId,
      customerName,
      phone,
      address,
      notes,
      imageUrl: mockCloudinaryUrl
    });

    await newRx.save();
    res.status(201).json(newRx);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/prescriptions - Admin Review Inbox
router.get('/', adminOnly, async (req, res) => {
  try {
    const prescriptions = await Prescription.find().sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/prescriptions/:id/sign-off - Pharmacist Approval / Rejection Log
router.patch('/:id/sign-off', adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const rx = await Prescription.findByIdAndUpdate(req.params.id, {
      status,
      pharmacistSignOff: {
        staffId: req.user.id,
        staffName: req.user.name,
        signedAt: new Date()
      }
    }, { new: true });
    res.json(rx);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
