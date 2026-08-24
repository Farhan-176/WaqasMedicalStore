const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');

// POST /api/orders - Place Order (B2B Retailer or B2C Consumer)
router.post('/', async (req, res) => {
  try {
    const { 
      id, 
      orderId, 
      customerName, 
      phone, 
      address, 
      orderType, 
      retailerUsername, 
      items, 
      customer, 
      checkoutType, 
      zone, 
      subtotal, 
      deliveryFee, 
      grandTotal, 
      requiresRx,
      paymentMethod,
      status 
    } = req.body;

    const finalOrderId = id || orderId || ('ORD-' + Math.floor(100000 + Math.random() * 900000));

    // Stock Locking (if matching products exist in MongoDB)
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.productId) {
          try {
            await Product.findByIdAndUpdate(item.productId, {
              $inc: { reservedStock: item.quantity, stock: -item.quantity }
            });
          } catch (e) {}
        }
      }
    }

    const newOrder = new Order({
      orderId: finalOrderId,
      id: finalOrderId,
      customerName: customerName || customer?.name || 'Customer',
      phone: phone || customer?.phone || '',
      address: address || customer?.address || '',
      orderType: orderType || (customer?.isRetailer ? 'b2b_retailer' : 'b2c_consumer'),
      retailerUsername: retailerUsername || '',
      items: items || [],
      customer: customer || {
        name: customerName,
        phone,
        address
      },
      checkoutType: checkoutType || 'delivery',
      zone: zone || {},
      subtotal: Number(subtotal || grandTotal || 0),
      deliveryFee: Number(deliveryFee || 0),
      grandTotal: Number(grandTotal || subtotal || 0),
      requiresRx: Boolean(requiresRx),
      status: status || 'Received',
      paymentMethod: paymentMethod || 'cod'
    });

    const saved = await newOrder.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/orders - View All Orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/status - Update Delivery Stepper Status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const orderIdParam = req.params.id;

    // Try finding by MongoDB _id or custom orderId string
    let updatedOrder = null;
    if (orderIdParam.startsWith('ORD-')) {
      updatedOrder = await Order.findOneAndUpdate(
        { $or: [{ orderId: orderIdParam }, { id: orderIdParam }] },
        { status },
        { new: true }
      );
    } else {
      updatedOrder = await Order.findByIdAndUpdate(
        orderIdParam, 
        { status }, 
        { new: true }
      );
    }

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(updatedOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
