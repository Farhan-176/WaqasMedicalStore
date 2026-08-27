const express = require('express');
const router = express.Router();
const multer = require('multer');
const Prescription = require('../models/Prescription');
const { adminOnly } = require('../middleware/authMiddleware');

const storage = multer.memoryStorage();

const imageFileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Security restriction: Only JPG, JPEG, PNG, and WEBP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: imageFileFilter
});

/**
 * Validates actual binary buffer magic bytes to prevent file extension spoofing
 */
function isValidImageMagicNumber(buffer) {
  if (!buffer || buffer.length < 12) return false;

  // JPEG magic bytes: FF D8 FF
  const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;

  // PNG magic bytes: 89 50 4E 47 (\x89PNG)
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;

  // WebP magic bytes: RIFF .... WEBP
  const isRiff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
  const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;

  return isJpeg || isPng || (isRiff && isWebp);
}

// POST /api/prescriptions/upload - Customer Upload Rx Photo
router.post('/upload', upload.single('prescriptionImage'), async (req, res) => {
  try {
    const { customerName, phone, address, notes } = req.body;

    if (req.file) {
      const isValidBinary = isValidImageMagicNumber(req.file.buffer);
      if (!isValidBinary) {
        return res.status(400).json({ 
          error: 'Security failure: Binary magic-number inspection failed. File content does not match a valid image format.' 
        });
      }
    }

    const prescriptionId = 'RX-' + Math.floor(1000 + Math.random() * 9000);
    const mockCloudinaryUrl = req.file 
      ? `https://res.cloudinary.com/waqasmedical/image/upload/rx_${Date.now()}.jpg` 
      : 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80';

    const newRx = new Prescription({
      prescriptionId,
      customerName: customerName || 'Anonymous Customer',
      phone: phone || '',
      address: address || '',
      notes: notes || '',
      imageUrl: mockCloudinaryUrl
    });

    await newRx.save();
    res.status(201).json(newRx);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/prescriptions - Admin Review Inbox (Strict Admin Authorization Required)
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
