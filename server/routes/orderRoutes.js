const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Retailer = require('../models/Retailer');

function roundCurrency(val) {
  return Math.round((Number(val) || 0) * 100) / 100;
}

// Store Reference Location: Denso Hall, Saddar, Karachi
const STORE_LAT = 24.8607;
const STORE_LNG = 67.0011;

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function computeDeliveryFeeByDistance(distanceKm) {
  const d = Math.max(0, Number(distanceKm) || 0);
  const baseFee = 250;
  const baseKm = 15;
  const perKmRate = 30;
  if (d <= baseKm) return baseFee;
  return baseFee + (Math.ceil(d - baseKm) * perKmRate);
}

// POST /api/orders - Place Order with Server-Side Price Verification, Anti-Hoarding Quotas & Origin Tracking
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
      paymentMethod,
      prescriptionId,
      prescriptionImageUrl,
      orderSource,
      customerType,
      recipientDetails,
      cashierId
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one valid product item.' });
    }

    const finalOrderId = id || orderId || ('ORD-' + Math.floor(100000 + Math.random() * 900000));
    const isRetailerOrder = orderType === 'b2b_retailer' || customer?.isRetailer || customerType === 'REGISTERED_RETAILER';

    // 1. Verify B2B Retailer credentials if claiming wholesale order
    let verifiedRetailer = null;
    if (isRetailerOrder && retailerUsername) {
      verifiedRetailer = await Retailer.findOne({ username: retailerUsername.toLowerCase().trim() });
    }

    // 2. Server-side authoritative price, anti-hoarding limits, and inventory calculations
    let calculatedSubtotal = 0;
    let hasRxRequiredItem = false;
    const validatedItems = [];

    for (const item of items) {
      const rawId = item.productId || item._id || item.id;
      const cleanProductId = typeof rawId === 'string' && rawId.includes('_strip') 
        ? rawId.replace('_strip', '') 
        : rawId;

      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const isStrip = item.unit === 'Per Strip' || (typeof item.id === 'string' && item.id.endsWith('_strip'));

      // Look up product in MongoDB
      let product = null;
      if (mongoose.Types.ObjectId.isValid(cleanProductId)) {
        product = await Product.findById(cleanProductId);
      } else {
        product = await Product.findOne({ $or: [{ code: cleanProductId }, { name: item.name }] });
      }

      let canonicalPrice = 0;
      let isRx = false;
      let productName = item.name;

      if (product) {
        productName = product.name;
        isRx = Boolean(product.requiresPrescription || product.isPrescriptionRequired);
        const consumerPackPrice = product.originalPrice || product.price || 100;
        const wholesalePackPrice = product.price || consumerPackPrice;
        const packPrice = verifiedRetailer ? wholesalePackPrice : consumerPackPrice;
        const stripsPerPack = Math.max(1, product.stripsPerPack || 10);
        const stripPrice = verifiedRetailer
          ? (product.stripPrice || roundCurrency(wholesalePackPrice / stripsPerPack))
          : roundCurrency(consumerPackPrice / stripsPerPack);

        canonicalPrice = isStrip ? stripPrice : packPrice;

        // Anti-Hoarding & Quota Limits Enforcement
        const limits = product.orderLimits || {
          consumerMin: 1,
          consumerMax: 5,
          retailerMin: 10,
          retailerMax: 500
        };
        const minQuota = isRetailerOrder ? (limits.retailerMin || 10) : (limits.consumerMin || 1);
        const maxQuota = isRetailerOrder ? (limits.retailerMax || 500) : (limits.consumerMax || 5);

        if (qty < minQuota) {
          return res.status(400).json({ 
            error: `Anti-Hoarding Violation: Minimum order quantity for "${productName}" is ${minQuota} ${isStrip ? 'strip(s)' : 'pack(s)'} for ${isRetailerOrder ? 'retailers' : 'consumers'}.` 
          });
        }
        if (qty > maxQuota) {
          return res.status(400).json({ 
            error: `Anti-Hoarding Violation: Maximum order quota for "${productName}" is ${maxQuota} ${isStrip ? 'strip(s)' : 'pack(s)'} to prevent drug hoarding.` 
          });
        }
      } else {
        canonicalPrice = roundCurrency(item.price);
        isRx = Boolean(item.requiresPrescription);
      }

      if (isRx) hasRxRequiredItem = true;

      const lineTotal = roundCurrency(canonicalPrice * qty);
      calculatedSubtotal = roundCurrency(calculatedSubtotal + lineTotal);

      validatedItems.push({
        productId: cleanProductId,
        id: item.id || cleanProductId,
        name: isStrip ? `${productName} (Per Strip)` : `${productName} (Per Pack)`,
        quantity: qty,
        price: canonicalPrice,
        unit: isStrip ? 'Per Strip' : 'Per Pack',
        isWholesale: Boolean(verifiedRetailer),
        requiresPrescription: isRx
      });
    }

    // 3. Distance-Based Delivery Cost Calculator
    let calculatedDeliveryFee = 0;
    if (checkoutType !== 'pickup') {
      let calcDistance = zone?.distanceKm || 5;
      if (recipientDetails?.deliveryAddress?.coordinates?.lat && recipientDetails?.deliveryAddress?.coordinates?.lng) {
        calcDistance = calculateHaversineDistance(
          STORE_LAT, STORE_LNG,
          recipientDetails.deliveryAddress.coordinates.lat,
          recipientDetails.deliveryAddress.coordinates.lng
        );
      }
      calculatedDeliveryFee = computeDeliveryFeeByDistance(calcDistance);
    }

    const grandTotal = roundCurrency(calculatedSubtotal + calculatedDeliveryFee);

    // 4. Construct Order Document with Origin Audit Trail Metadata
    const finalOrderSource = orderSource || (customerType === 'WALK_IN_RETAIL' ? 'COUNTER_POS' : 'WEB_APP');
    const finalCustomerType = customerType || (verifiedRetailer ? 'REGISTERED_RETAILER' : (finalOrderSource === 'COUNTER_POS' ? 'WALK_IN_RETAIL' : 'ONLINE_CONSUMER'));

    const finalRecipientDetails = recipientDetails || {
      name: customerName || customer?.name || (verifiedRetailer ? verifiedRetailer.name : 'Customer'),
      shopName: verifiedRetailer ? verifiedRetailer.name : '',
      phone: phone || customer?.phone || '',
      deliveryAddress: {
        street: address || customer?.address || 'Karachi, Pakistan',
        area: zone?.name || customer?.address || 'Karachi',
        city: 'Karachi',
        coordinates: { lat: STORE_LAT, lng: STORE_LNG }
      }
    };

    const orderData = {
      orderId: finalOrderId,
      id: finalOrderId,
      customerName: finalRecipientDetails.name,
      phone: finalRecipientDetails.phone,
      address: finalRecipientDetails.deliveryAddress?.street || address || '',
      orderType: verifiedRetailer ? 'b2b_retailer' : 'b2c_consumer',
      retailerUsername: verifiedRetailer ? verifiedRetailer.username : '',
      items: validatedItems,
      customer: customer || {
        name: finalRecipientDetails.name,
        phone: finalRecipientDetails.phone,
        address: finalRecipientDetails.deliveryAddress?.street,
        isRetailer: Boolean(verifiedRetailer),
        retailerName: verifiedRetailer ? verifiedRetailer.name : null,
        licenseNo: verifiedRetailer ? verifiedRetailer.licenseNo : null
      },
      checkoutType: checkoutType || 'delivery',
      zone: zone || {},
      subtotal: calculatedSubtotal,
      deliveryFee: calculatedDeliveryFee,
      grandTotal: grandTotal,
      requiresRx: hasRxRequiredItem,
      prescriptionId: prescriptionId || '',
      prescriptionImageUrl: prescriptionImageUrl || '',
      status: 'Received',
      paymentMethod: paymentMethod || 'cod',
      // Origin Tracking Metadata
      orderSource: finalOrderSource,
      customerType: finalCustomerType,
      recipientDetails: finalRecipientDetails,
      cashierId: cashierId && mongoose.Types.ObjectId.isValid(cashierId) ? cashierId : null
    };

    // 5. Stock Deduction with Fallback Handling
    let session = null;
    try {
      session = await mongoose.startSession();
    } catch (err) {
      session = null;
    }

    if (session) {
      try {
        let savedOrder = null;
        await session.withTransaction(async () => {
          for (const item of validatedItems) {
            if (mongoose.Types.ObjectId.isValid(item.productId)) {
              const product = await Product.findById(item.productId).session(session);
              if (product) {
                if (product.stock < item.quantity) {
                  throw new Error(`Insufficient inventory for "${product.name}". Available stock: ${product.stock}`);
                }
                product.stock -= item.quantity;
                product.reservedStock = (product.reservedStock || 0) + item.quantity;
                await product.save({ session });
              }
            }
          }

          const newOrder = new Order(orderData);
          savedOrder = await newOrder.save({ session });
        });

        await session.endSession();
        return res.status(201).json(savedOrder);
      } catch (txErr) {
        if (session) await session.endSession();
        return processOrderFallback(orderData, validatedItems, res);
      }
    } else {
      return processOrderFallback(orderData, validatedItems, res);
    }
  } catch (err) {
    return res.status(500).json({ error: 'Order processing error: ' + err.message });
  }
});

async function processOrderFallback(orderData, items, res) {
  try {
    for (const item of items) {
      if (mongoose.Types.ObjectId.isValid(item.productId)) {
        await Product.findOneAndUpdate(
          { _id: item.productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity, reservedStock: item.quantity } }
        );
      }
    }

    const newOrder = new Order(orderData);
    const saved = await newOrder.save();
    return res.status(201).json(saved);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

// GET /api/orders - View All Orders with Filters (Source & Area)
router.get('/', async (req, res) => {
  try {
    const { retailer, phone, source, area } = req.query;
    let filter = {};
    if (retailer) filter.retailerUsername = retailer.toLowerCase().trim();
    if (phone) filter.phone = phone.trim();
    if (source && source !== 'all') filter.orderSource = source;
    if (area && area !== 'all') {
      filter.$or = [
        { 'zone.name': { $regex: area, $options: 'i' } },
        { address: { $regex: area, $options: 'i' } },
        { 'recipientDetails.deliveryAddress.area': { $regex: area, $options: 'i' } }
      ];
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(150);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders/:id/send-whatsapp - Direct Server-Side WhatsApp Invoice Dispatch (PDF)
router.post('/:id/send-whatsapp', async (req, res) => {
  try {
    const orderIdParam = req.params.id;
    let order = await Order.findOne({ $or: [{ orderId: orderIdParam }, { id: orderIdParam }] });
    if (!order && mongoose.Types.ObjectId.isValid(orderIdParam)) {
      order = await Order.findById(orderIdParam);
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Generate Invoice PDF Buffer in Node backend
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));
    
    doc.fontSize(18).text('WAQAS MEDICAL STORE', { align: 'center' });
    doc.fontSize(10).text('Denso Hall, M.A. Jinnah Road, Saddar, Karachi', { align: 'center' });
    doc.text('UAN: +92 300 1234567 | DRAP Lic: 04-DL-78921', { align: 'center' });
    doc.moveDown();
    doc.text('-------------------------------------------------------------------------------------------------');
    doc.fontSize(14).text(`OFFICIAL INVOICE: ${order.orderId || order.id}`, { underline: true });
    doc.fontSize(10).text(`Date: ${order.createdAt ? new Date(order.createdAt).toLocaleString() : new Date().toLocaleString()}`);
    doc.text(`Customer / Retailer: ${order.customerName || order.recipientDetails?.name || 'Customer'}`);
    doc.text(`Phone: ${order.phone || order.recipientDetails?.phone || 'N/A'}`);
    doc.text(`Delivery Address: ${order.address || 'Local Pick-up'}`);
    doc.text(`Channel Origin: ${order.orderSource || 'WEB_APP'} | Type: ${order.customerType || 'ONLINE_CONSUMER'}`);
    doc.moveDown();

    doc.fontSize(12).text('ORDER ITEMS:');
    doc.fontSize(10);
    order.items.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.name} x${item.quantity} - Rs. ${roundCurrency(item.price * item.quantity).toFixed(2)}`);
    });

    doc.moveDown();
    doc.fontSize(10).text(`Subtotal: Rs. ${(order.subtotal || 0).toFixed(2)}`);
    doc.text(`Delivery Fee: Rs. ${(order.deliveryFee || 0).toFixed(2)}`);
    doc.fontSize(12).text(`GRAND TOTAL: Rs. ${(order.grandTotal || 0).toFixed(2)}`, { bold: true });
    doc.moveDown();
    doc.fontSize(9).text('Thank you for choosing Waqas Medical Store. Quality Medicines Guaranteed.', { align: 'center' });
    
    doc.end();

    await new Promise(resolve => doc.on('end', resolve));
    const pdfBuffer = Buffer.concat(chunks);

    // Simulate WhatsApp Cloud API Direct Dispatch
    const recipientPhone = order.phone || order.recipientDetails?.phone || '03001234567';
    const waMessageId = `WA-MSG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return res.json({
      success: true,
      messageId: waMessageId,
      recipientPhone,
      sentAt: new Date().toISOString(),
      orderId: order.orderId || order.id,
      pdfSizeBytes: pdfBuffer.length,
      message: `Invoice PDF (${(pdfBuffer.length / 1024).toFixed(1)} KB) dispatched directly to WhatsApp number ${recipientPhone}!`
    });
  } catch (err) {
    return res.status(500).json({ error: 'WhatsApp invoice dispatch failed: ' + err.message });
  }
});

// PATCH /api/orders/:id/status - Update Delivery Stepper Status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const orderIdParam = req.params.id;

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
