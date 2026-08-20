const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { adminOnly } = require('../middleware/authMiddleware');

// GET /api/products - Public Product Search & List
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let filter = {};
    if (category && category !== 'all') filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } }
      ];
    }
    const products = await Product.find(filter).limit(100);
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products - Admin Add Product
router.post('/', adminOnly, async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/products/bulk-pricing - Admin Bulk Price Update
router.put('/bulk-pricing', adminOnly, async (req, res) => {
  try {
    const { category, percentage, type } = req.body;
    const factor = type === 'increase' ? (1 + percentage / 100) : (1 - percentage / 100);
    const filter = category === 'all' ? {} : { category };
    
    await Product.updateMany(filter, [{ $set: { price: { $multiply: ["$price", factor] } } }]);
    res.json({ message: 'Bulk pricing updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
