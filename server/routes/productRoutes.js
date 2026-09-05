const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
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

// GET /api/products/offer-list-pdf - Generate Wholesale Offer List PDF Document (A-Z Categorized)
router.get('/offer-list-pdf', async (req, res) => {
  try {
    const { letter = 'ALL', shopName = '', search = '' } = req.query;

    let filter = {};
    if (search && search.trim()) {
      const sanitized = escapeRegex(search.trim());
      filter.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { code: { $regex: sanitized, $options: 'i' } },
        { genericName: { $regex: sanitized, $options: 'i' } }
      ];
    }

    let products = await Product.find(filter).sort({ name: 1 });

    if (letter && letter !== 'ALL') {
      products = products.filter(p => {
        const first = (p.name || '').trim().charAt(0).toUpperCase();
        if (letter === '#') return !first.match(/[A-Z]/);
        return first === letter;
      });
    }

    const doc = new PDFDocument({ margin: 25, size: 'A4', bufferPages: true });
    
    // Response headers for PDF streaming
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="Waqas_Medical_Store_Offer_List${letter !== 'ALL' ? '_' + letter : ''}.pdf"`);
    res.removeHeader('X-Frame-Options');
    doc.pipe(res);

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const drawHeader = () => {
      doc.fillColor('#065f46').fontSize(16).text('WAQAS MEDICAL STORE', 25, 25, { align: 'center', bold: true });
      doc.fillColor('#334155').fontSize(9).text('DENSO HALL, M.A. JINNAH ROAD, SADDAR, KARACHI | UAN: 0300-1234567', { align: 'center' });
      doc.fillColor('#0f172a').fontSize(11).text('WHOLESALE OFFER LIST / ORDER SHEET', { align: 'center', bold: true });
      
      const subInfo = shopName ? `Date: ${dateStr} | Customer / Retailer: ${shopName}` : `List Date: ${dateStr} | ${timeStr}`;
      doc.fillColor('#64748b').fontSize(8).text(subInfo, { align: 'center' });
      doc.moveDown(0.4);

      // Table Column Headers
      const y = doc.y;
      doc.rect(25, y, 545, 16).fill('#e2e8f0');
      doc.fillColor('#1e293b').fontSize(8);
      doc.text('CODE', 30, y + 4, { width: 45 });
      doc.text('PRODUCT NAME', 75, y + 4, { width: 220 });
      doc.text('T.P. (Rs)', 300, y + 4, { width: 60, align: 'right' });
      doc.text('ORDER QTY', 365, y + 4, { width: 60, align: 'center' });
      doc.text('OFFER %', 430, y + 4, { width: 55, align: 'right' });
      doc.text('BONUS / UNIT', 490, y + 4, { width: 75, align: 'center' });
      doc.y = y + 20;
    };

    drawHeader();

    // Group by first letter (A, B, C...)
    const grouped = {};
    products.forEach(p => {
      const first = (p.name || '').trim().charAt(0).toUpperCase();
      const l = first.match(/[A-Z]/) ? first : '#';
      if (!grouped[l]) grouped[l] = [];
      grouped[l].push(p);
    });

    const sortedLetters = Object.keys(grouped).sort((a, b) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b);
    });

    if (sortedLetters.length === 0) {
      doc.moveDown(2);
      doc.fillColor('#64748b').fontSize(10).text('No products found matching the criteria.', { align: 'center' });
    } else {
      sortedLetters.forEach(l => {
        // Ensure space for banner + 2 rows
        if (doc.y > doc.page.height - 75) {
          doc.addPage();
          drawHeader();
        }

        // Red Banner for Letter Section (A, B, C...)
        const bannerY = doc.y;
        doc.roundedRect(25, bannerY, 545, 18, 9).fill('#c83232');
        doc.fillColor('#ffffff').fontSize(10).text(l, 25, bannerY + 4, { align: 'center', width: 545, bold: true });
        doc.y = bannerY + 22;

        grouped[l].forEach((prod, idx) => {
          if (doc.y > doc.page.height - 40) {
            doc.addPage();
            drawHeader();
          }

          const rowY = doc.y;
          if (idx % 2 === 1) {
            doc.rect(25, rowY, 545, 15).fill('#f8fafc');
          }

          const code = prod.code || prod.itemCode || String(prod._id || '').slice(-4).toUpperCase();
          const name = (prod.name || '').toUpperCase().slice(0, 42);
          const price = (Number(prod.price) || 0).toFixed(2);
          const disc = prod.offerDiscount || (prod.originalPrice > prod.price ? `${(((prod.originalPrice - prod.price)/prod.originalPrice)*100).toFixed(0)}%` : '10.00%');
          const bonus = prod.bonusText || (prod.unit && prod.unit !== 'Pack / Strip' ? prod.unit : 'NET');

          doc.fillColor('#475569').fontSize(8).text(code, 30, rowY + 3, { width: 45 });
          doc.fillColor('#0f172a').fontSize(8).text(name, 75, rowY + 3, { width: 220, ellipsis: true });
          doc.fillColor('#0f172a').fontSize(8).text(price, 300, rowY + 3, { width: 60, align: 'right' });

          // Qty pill box for writing/ordering
          doc.roundedRect(375, rowY + 1, 40, 12, 3).strokeColor('#94a3b8').stroke();
          doc.fillColor('#64748b').fontSize(6).text('Qty', 377, rowY + 3);

          doc.fillColor('#1e293b').fontSize(8).text(disc, 430, rowY + 3, { width: 55, align: 'right' });
          doc.fillColor('#b91c1c').fontSize(7).text(bonus, 490, rowY + 3, { width: 75, align: 'center' });

          doc.y = rowY + 16;
        });

        doc.y += 4;
      });
    }

    // Footers on all pages
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fillColor('#64748b').fontSize(7).text(
        `Page ${i + 1} of ${range.count} | Waqas Medical Store, Denso Hall Saddar Karachi | WhatsApp Orders: 0300-1234567`,
        25,
        doc.page.height - 20,
        { align: 'center', width: 545 }
      );
    }

    doc.end();
  } catch (err) {
    console.error('PDF Generation Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate Offer List PDF: ' + err.message });
    }
  }
});

module.exports = router;

