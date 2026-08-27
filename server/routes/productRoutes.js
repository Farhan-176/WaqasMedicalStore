const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { adminOnly } = require('../middleware/authMiddleware');

/**
 * Escapes special regex characters to prevent Regular Expression Denial of Service (ReDoS)
 */
function escapeRegex(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// GET /api/products - Public Product Search & List
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let filter = {};
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const sanitizedQuery = escapeRegex(search.trim());
      filter.$or = [
        { name: { $regex: sanitizedQuery, $options: 'i' } },
        { genericName: { $regex: sanitizedQuery, $options: 'i' } },
        { code: { $regex: sanitizedQuery, $options: 'i' } }
      ];
    }

    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 0;
    let query = Product.find(filter).sort({ name: 1 });
    if (limit > 0) {
      query = query.limit(limit);
    }
    const products = await query;
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
    if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
      return res.status(400).json({ error: 'Percentage must be a valid number between 0 and 100.' });
    }

    const factor = type === 'increase' ? (1 + percentage / 100) : (1 - percentage / 100);
    const filter = category === 'all' ? {} : { category };
    
    await Product.updateMany(filter, [{ $set: { price: { $round: [{ $multiply: ["$price", factor] }, 2] } } }]);
    res.json({ message: 'Bulk pricing updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
