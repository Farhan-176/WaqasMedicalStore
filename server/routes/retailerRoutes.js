const express = require('express');
const router = express.Router();
const Retailer = require('../models/Retailer');

// GET /api/retailers - Fetch all registered retailers
router.get('/', async (req, res) => {
  try {
    const retailers = await Retailer.find().sort({ createdAt: -1 });
    res.json(retailers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch retailers from database', details: err.message });
  }
});

// POST /api/retailers - Create a new retailer
router.post('/', async (req, res) => {
  try {
    const { name, username, password, area, licenseNo, discountTier } = req.body;
    if (!name || !username || !password) {
      return res.status(400).json({ error: 'Name, username, and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await Retailer.findOne({ username: cleanUsername });
    if (existing) {
      return res.status(400).json({ error: 'A retailer with this Store Code/Username already exists' });
    }

    const newRetailer = new Retailer({
      name: name.trim(),
      username: cleanUsername,
      password: password.trim(),
      area: area?.trim() || 'Islamabad / Rawalpindi',
      licenseNo: licenseNo?.trim() || 'Verified',
      discountTier: discountTier || 'Wholesale Trade Price (12-15% OFF)'
    });

    const saved = await newRetailer.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save retailer to database', details: err.message });
  }
});

// DELETE /api/retailers/:id - Remove a retailer
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Retailer.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Retailer not found' });
    }
    res.json({ message: 'Retailer account successfully deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete retailer', details: err.message });
  }
});

module.exports = router;
