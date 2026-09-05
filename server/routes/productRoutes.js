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

// GET /api/products/offer-list-html - Download Standalone Interactive HTML Offer List Document
router.get('/offer-list-html', async (req, res) => {
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

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/');

    // Group by letter
    const grouped = {};
    products.forEach(p => {
      const first = (p.name || '').trim().charAt(0).toUpperCase();
      const l = first.match(/[A-Z]/) ? first : '#';
      if (!grouped[l]) grouped[l] = [];
      grouped[l].push(p);
    });

    const letters = Object.keys(grouped).sort();

    let productRowsHtml = '';
    letters.forEach(l => {
      productRowsHtml += `<div class="letter-banner">${l}</div>\n`;
      grouped[l].forEach(prod => {
        const code = prod.code || prod.itemCode || String(prod._id || '').slice(-4).toUpperCase();
        const price = (Number(prod.price) || 0).toFixed(2);
        const disc = prod.offerDiscount || (prod.originalPrice > prod.price ? `${(((prod.originalPrice - prod.price)/prod.originalPrice)*100).toFixed(0)}%` : '10.00%');
        const bonus = prod.bonusText || (prod.unit && prod.unit !== 'Pack / Strip' ? prod.unit : 'NET');

        productRowsHtml += `
        <div class="row item-row" data-name="${(prod.name || '').toLowerCase()}" data-code="${code.toLowerCase()}">
          <div class="col-code">${code}</div>
          <div class="col-name">${(prod.name || '').toUpperCase()}</div>
          <div class="col-price">${price}</div>
          <div class="col-qty">
            <div class="qty-box">
              <span class="qty-lbl">Qty</span>
              <input type="number" min="0" class="qty-input" data-name="${prod.name}" data-price="${price}" data-code="${code}" data-disc="${disc}" oninput="calculateTotal()">
            </div>
          </div>
          <div class="col-disc">${disc}</div>
          <div class="col-bonus">${bonus}</div>
        </div>`;
      });
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OFFER LIST - WAQAS MEDICAL STORE</title>
  <style>
    body { background: #dcdcdc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 15px; }
    .doc-container { max-width: 920px; margin: 0 auto; background: #e5e5e5; padding: 20px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); }
    .bismillah { font-size: 30px; color: #15803d; font-weight: bold; text-align: center; margin-bottom: 6px; font-family: 'Amiri', serif; }
    .location { font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 8px; text-transform: uppercase; color: #111827; }
    .instructions { text-align: center; font-size: 13px; color: #1e293b; line-height: 1.4; margin-bottom: 12px; }
    .title { font-size: 32px; font-weight: 900; text-align: center; margin: 10px 0; color: #111827; }
    .meta { display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin-bottom: 15px; padding: 0 10px; color: #111827; }
    .search-box { text-align: center; margin: 15px 0; }
    .search-input { width: 90%; max-width: 500px; padding: 10px 18px; font-size: 16px; border-radius: 20px; border: 1.5px solid #d97706; text-align: center; outline: none; background: #fff; }
    .summary-bar { background: #0f172a; color: #fff; padding: 10px 16px; border-radius: 6px; margin: 12px 0; display: none; justify-content: space-between; align-items: center; }
    .table-header { background: #c84b4b; border-radius: 12px 12px 0 0; display: grid; grid-template-columns: 75px 1fr 95px 105px 80px 90px; padding: 10px 12px; font-weight: bold; font-size: 14px; align-items: center; color: #000; }
    .letter-banner { background: #c84b4b; color: #fff; font-weight: bold; font-size: 16px; text-align: center; padding: 5px; border-radius: 15px; margin: 12px auto 6px auto; width: 96%; }
    .row { display: grid; grid-template-columns: 75px 1fr 95px 105px 80px 90px; align-items: center; padding: 6px 10px; border-bottom: 1px solid #cbd5e1; font-size: 14px; background: #f0f0f0; }
    .row:nth-child(even) { background: #e8e8e8; }
    .col-code { font-weight: bold; font-family: monospace; color: #000; }
    .col-name { font-weight: bold; text-transform: uppercase; color: #000; }
    .col-price { text-align: right; font-weight: bold; padding-right: 8px; color: #000; }
    .col-qty { text-align: center; }
    .qty-box { display: inline-flex; align-items: center; background: #fff; border: 1.5px solid #475569; border-radius: 16px; padding: 1px 6px; width: 85px; }
    .qty-lbl { font-size: 11px; font-weight: bold; color: #64748b; margin-right: 3px; }
    .qty-input { border: none; outline: none; width: 100%; font-weight: bold; font-size: 15px; text-align: center; background: transparent; }
    .col-disc { text-align: right; font-weight: bold; padding-right: 8px; color: #000; }
    .col-bonus { text-align: center; font-weight: bold; color: #b91c1c; }
    .bottom-panel { margin-top: 20px; background: #d1d5db; border: 2px solid #9ca3af; border-radius: 8px; padding: 15px; }
    .shop-input { width: 100%; padding: 8px 12px; font-size: 15px; font-weight: bold; border-radius: 4px; border: 1.5px solid #475569; margin: 8px 0 14px 0; box-sizing: border-box; background: #fff; }
    .btn-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .btn { padding: 10px; font-weight: bold; font-size: 13px; text-align: center; border-radius: 4px; border: 1px solid #64748b; background: #cbd5e1; cursor: pointer; }
    .btn-wa { background: #25D366; color: #fff; border-color: #1eb956; font-size: 14px; }
    .footer { text-align: center; margin-top: 12px; font-size: 12px; font-weight: bold; color: #334155; }
    @media (max-width: 650px) {
      .table-header, .row { grid-template-columns: 50px 1fr 70px 80px 60px; }
      .col-bonus, .table-header > div:nth-child(6) { display: none; }
      .btn-grid { grid-template-columns: 1fr 1fr; }
    }
  </style>
</head>
<body>
  <div class="doc-container">
    <div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
    <div class="location">DENSO HALL, KARACHI</div>
    <div class="instructions">
      <strong>MUST</strong> open/use Google Chrome for order making (Android Phone)<br>
      <strong>MUST</strong> open/use Microsoft Edge Browser for order making (Apple iPhone)
    </div>
    <div class="title">OFFER LIST</div>
    <div class="meta">
      <span>List No : 000381</span>
      <span>List Date : ${dateStr}</span>
    </div>
    <div class="search-box">
      <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px; color: #111827;">Type Your Search e.g. Item Code, Name, Offer Rate...</div>
      <input type="text" class="search-input" id="search" placeholder="Search your product(s)" oninput="filterItems()">
    </div>
    <div id="summary-bar" class="summary-bar">
      <span id="summary-text" style="font-weight: bold; font-size: 15px; color: #38bdf8;"></span>
      <button onclick="clearAll()" style="background:#ef4444; color:#fff; border:none; border-radius:4px; padding:4px 8px; font-weight:bold; cursor:pointer;">Clear All</button>
    </div>
    <div class="table-header">
      <div>Code</div>
      <div>Item Name</div>
      <div style="text-align: right; padding-right:8px;">T.P.</div>
      <div style="text-align: center;">ORDER QTY</div>
      <div style="text-align: right; padding-right:8px;">Offer</div>
      <div style="text-align: center;">Bonus</div>
    </div>
    <div id="product-list">
      ${productRowsHtml}
    </div>
    <div class="bottom-panel">
      <label style="font-weight:bold; font-size:14px; color:#111827;">ENTER YOUR SHOP NAME :</label>
      <input type="text" id="shop-name" class="shop-input" placeholder="Enter Your Shop Name" value="${shopName}">
      <div class="btn-grid">
        <button class="btn" onclick="previewOrder()">Preview Order</button>
        <button class="btn" onclick="copyOrder()">Share on iPhone</button>
        <button class="btn btn-wa" onclick="sendWhatsApp()">Text To Whatsapp</button>
        <button class="btn" onclick="window.print()">Generate PDF file</button>
      </div>
      <div class="footer">
        POWERED BY: WAQAS MEDICAL STORE (DENSO HALL, SADDAR, KARACHI)<br>
        For More Information... 📞 +92 300 1234567 | WhatsApp: +92 300 1234567
      </div>
    </div>
  </div>
  <script>
    function filterItems() {
      const q = document.getElementById('search').value.toLowerCase();
      document.querySelectorAll('.item-row').forEach(row => {
        const name = row.getAttribute('data-name') || '';
        const code = row.getAttribute('data-code') || '';
        row.style.display = (name.includes(q) || code.includes(q)) ? 'grid' : 'none';
      });
    }
    function calculateTotal() {
      const inputs = document.querySelectorAll('.qty-input');
      let count = 0, units = 0, total = 0;
      inputs.forEach(inp => {
        const q = parseInt(inp.value, 10);
        if (q > 0) {
          count++;
          units += q;
          const p = parseFloat(inp.getAttribute('data-price')) || 0;
          total += (q * p);
        }
      });
      const bar = document.getElementById('summary-bar');
      const txt = document.getElementById('summary-text');
      if (count > 0) {
        bar.style.display = 'flex';
        txt.innerText = '🛒 ' + count + ' Products (' + units + ' Units) = Rs. ' + total.toLocaleString('en-PK', {minimumFractionDigits:2});
      } else {
        bar.style.display = 'none';
      }
    }
    function clearAll() {
      document.querySelectorAll('.qty-input').forEach(inp => inp.value = '');
      calculateTotal();
    }
    function sendWhatsApp() {
      const shop = document.getElementById('shop-name').value || 'Retail Pharmacy';
      const inputs = document.querySelectorAll('.qty-input');
      let orderLines = [];
      let total = 0;
      inputs.forEach(inp => {
        const qty = parseInt(inp.value, 10);
        if (qty > 0) {
          const name = inp.getAttribute('data-name');
          const code = inp.getAttribute('data-code');
          const price = parseFloat(inp.getAttribute('data-price'));
          const sub = qty * price;
          total += sub;
          orderLines.push('• [' + code + '] ' + name.toUpperCase() + ' x ' + qty + ' = Rs. ' + sub.toFixed(2));
        }
      });
      let msg = '*🏥 WAQAS MEDICAL STORE — WHOLESALE PURCHASE ORDER*\\n';
      msg += '*🏪 Shop Name:* ' + shop + '\\n';
      msg += '*📅 Date:* ${dateStr}\\n';
      msg += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n';
      if (orderLines.length > 0) {
        msg += '*ORDER ITEMS:*\\n' + orderLines.join('\\n') + '\\n';
        msg += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n';
        msg += '*💰 ESTIMATED TOTAL: Rs. ' + total.toFixed(2) + '*\\n';
      } else {
        msg += '*(Inquiring regarding wholesale offer list)*\\n';
      }
      msg += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n📍 Denso Hall, Saddar, Karachi';
      window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
    }
    function copyOrder() {
      sendWhatsApp();
    }
    function previewOrder() {
      sendWhatsApp();
    }
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Waqas_Medical_Store_Offer_List${letter !== 'ALL' ? '_' + letter : ''}.html"`);
    res.send(html);
  } catch (err) {
    console.error('HTML Export Error:', err);
    res.status(500).send('Error generating HTML: ' + err.message);
  }
});

module.exports = router;

