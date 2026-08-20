const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { adminOnly } = require('../middleware/authMiddleware');

// POST /api/orders - Customer Place Order with Stock Reservation Engine
router.post('/', async (req, res) => {
  try {
    const { items, customer, checkoutType, zone, subtotal, deliveryFee, grandTotal, requiresRx } = req.body;
    
    // Stock Locking Engine: Reserve stock immediately
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { reservedStock: item.quantity, stock: -item.quantity }
      });
    }

    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const newOrder = new Order({
      orderId,
      items,
      customer,
      checkoutType,
      zone,
      subtotal,
      deliveryFee,
      grandTotal,
      requiresRx
    });

    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/orders - Admin View All Orders
router.get('/', adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/status - Admin Update Delivery Stepper Status
router.patch('/:id/status', adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    res.json(updatedOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
