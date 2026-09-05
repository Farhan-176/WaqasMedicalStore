import React, { useState, useMemo } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Smartphone, 
  Printer, 
  Eye, 
  Search, 
  RotateCcw, 
  Download,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';

const ALPHABET = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), '#'];

export default function WhatsAppCatalogModal({ isOpen, onClose, products = [] }) {
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('ALL');
  const [shopName, setShopName] = useState(() => localStorage.getItem('wms_offer_shop_name') || '');
  const [quantities, setQuantities] = useState({});
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  // Today's formatted date
  const dateStr = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/');
  }, []);

  const handleShopNameChange = (val) => {
    setShopName(val);
    try {
      localStorage.setItem('wms_offer_shop_name', val);
    } catch (e) {}
  };

  // 1. In-stock products
  const inStockItems = useMemo(() => {
    if (!products || products.length === 0) return [];
    return products.filter(p => (Number(p.stock) > 0 || p.stock === undefined));
  }, [products]);

  // 2. Filter products by search and letter
  const filteredProducts = useMemo(() => {
    let list = inStockItems;

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) || 
        (p.code && String(p.code).toLowerCase().includes(q)) ||
        (p.genericName && p.genericName.toLowerCase().includes(q)) ||
        (p.offerDiscount && String(p.offerDiscount).toLowerCase().includes(q))
      );
    }

    if (selectedLetter !== 'ALL') {
      list = list.filter(p => {
        const first = (p.name || '').trim().charAt(0).toUpperCase();
        if (selectedLetter === '#') return !first.match(/[A-Z]/);
        return first === selectedLetter;
      });
    }

    return list;
  }, [inStockItems, searchFilter, selectedLetter]);

  // 3. Group by first letter (A, B, C...)
  const groupedByLetter = useMemo(() => {
    const map = {};
    filteredProducts.forEach(item => {
      const first = (item.name || '').trim().charAt(0).toUpperCase();
      const letter = first.match(/[A-Z]/) ? first : '#';
      if (!map[letter]) map[letter] = [];
      map[letter].push(item);
    });

    Object.keys(map).forEach(l => {
      map[l].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    });

    return map;
  }, [filteredProducts]);

  const availableLetters = useMemo(() => {
    return Object.keys(groupedByLetter).sort((a, b) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b);
    });
  }, [groupedByLetter]);

  // Live Qty Change Handlers
  const handleQuantityChange = (key, rawVal) => {
    const numeric = rawVal.replace(/[^0-9]/g, '');
    setQuantities(prev => {
      const next = { ...prev };
      if (!numeric || Number(numeric) === 0) {
        delete next[key];
      } else {
        next[key] = Number(numeric);
      }
      return next;
    });
  };

  const handleClearQuantities = () => {
    setQuantities({});
  };

  // Selected Order Items
  const selectedOrderItems = useMemo(() => {
    return inStockItems.filter(p => {
      const key = p.id || p._id || p.code;
      return Number(quantities[key]) > 0;
    }).map(p => {
      const key = p.id || p._id || p.code;
      const qty = Number(quantities[key]);
      const price = Number(p.price) || 0;
      let discPercent = 0;
      if (p.offerDiscount) {
        discPercent = parseFloat(p.offerDiscount) || 0;
      } else if (p.originalPrice && p.originalPrice > p.price) {
        discPercent = ((p.originalPrice - p.price) / p.originalPrice) * 100;
      }
      const lineSubtotal = qty * price * (1 - discPercent / 100);

      return {
        ...p,
        orderQty: qty,
        discPercent,
        lineSubtotal
      };
    });
  }, [inStockItems, quantities]);

  const totalOrderUnits = useMemo(() => {
    return selectedOrderItems.reduce((sum, item) => sum + item.orderQty, 0);
  }, [selectedOrderItems]);

  const totalOrderAmount = useMemo(() => {
    return selectedOrderItems.reduce((sum, item) => sum + item.lineSubtotal, 0);
  }, [selectedOrderItems]);

  // Format Order for WhatsApp
  const buildWhatsAppOrderMessage = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    let lines = [];
    lines.push('*🏥 WAQAS MEDICAL STORE — WHOLESALE PURCHASE ORDER*');
    lines.push(`🏪 *Shop Name:* ${shopName.trim() || 'Retail Pharmacy Customer'}`);
    lines.push(`📅 *Date:* ${dateStr} | ${timeStr}`);
    lines.push('📍 *Denso Hall, Medicine Market, Saddar, Karachi*');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('*📋 ORDERED MEDICINES:*');

    if (selectedOrderItems.length > 0) {
      selectedOrderItems.forEach((item, index) => {
        const code = item.code || item.itemCode || '';
        const codeStr = code ? `[${code}] ` : '';
        const unitRate = (Number(item.price) || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 });
        const subtotal = item.lineSubtotal.toLocaleString('en-PK', { minimumFractionDigits: 2 });
        const discStr = item.discPercent > 0 ? ` (Disc: ${item.discPercent.toFixed(1)}%)` : '';
        lines.push(`${index + 1}. *${codeStr}${item.name.toUpperCase()}*`);
        lines.push(`   ↳ Qty: *${item.orderQty}* × Rs. ${unitRate}${discStr} = *Rs. ${subtotal}*`);
      });

      lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      lines.push(`📦 *Total Line Items:* ${selectedOrderItems.length}`);
      lines.push(`🔢 *Total Quantity Units:* ${totalOrderUnits}`);
      lines.push(`💰 *ESTIMATED PAYABLE TOTAL: Rs. ${totalOrderAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}*`);
    } else {
      lines.push('*(No quantities selected yet. Sharing full wholesale rate sheet)*');
      lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      // A-Z list
      availableLetters.forEach(l => {
        lines.push(`\n*🔴 ── ${l} ──*`);
        (groupedByLetter[l] || []).slice(0, 15).forEach(prod => {
          const code = prod.code || prod.itemCode || '';
          const codeStr = code ? `[${code}] ` : '';
          const pVal = (Number(prod.price) || 0).toFixed(2);
          const disc = prod.offerDiscount || '10%';
          lines.push(`• *${codeStr}${prod.name}* — Rs. ${pVal} (Disc: ${disc})`);
        });
      });
    }

    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('📞 *Orders Hotline:* 0300-1234567 | 021-32724455');
    return lines.join('\n');
  };

  // Actions
  const handleOpenWhatsApp = () => {
    const textToSend = buildWhatsAppOrderMessage();
    const encoded = encodeURIComponent(textToSend);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleCopyOrder = () => {
    const textToCopy = buildWhatsAppOrderMessage();
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrintOrPdf = () => {
    window.print();
  };

  // Export standalone HTML file (exact replica of desktop Offer list m.HTM.html)
  const handleExportStandaloneHTML = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OFFER LIST - WAQAS MEDICAL STORE</title>
  <style>
    body { background: #dcdcdc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 15px; }
    .doc-container { max-width: 900px; margin: 0 auto; background: #e5e5e5; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .bismillah { font-size: 28px; color: #15803d; font-weight: bold; text-align: center; margin-bottom: 6px; }
    .location { font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 8px; text-transform: uppercase; }
    .instructions { text-align: center; font-size: 13px; color: #1e293b; line-height: 1.4; margin-bottom: 15px; }
    .title { font-size: 32px; font-weight: 900; text-align: center; margin: 10px 0; }
    .meta { display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin-bottom: 15px; }
    .search-box { text-align: center; margin: 15px 0; }
    .search-input { width: 90%; max-width: 500px; padding: 10px 18px; font-size: 16px; border-radius: 20px; border: 1.5px solid #d97706; text-align: center; outline: none; }
    .table-header { background: #c84b4b; border-radius: 12px 12px 0 0; display: grid; grid-template-columns: 80px 1fr 100px 110px 85px 95px; padding: 10px 14px; font-weight: bold; font-size: 15px; align-items: center; }
    .letter-banner { background: #c84b4b; color: #fff; font-weight: bold; font-size: 17px; text-align: center; padding: 5px; border-radius: 15px; margin: 12px auto 6px auto; width: 96%; }
    .row { display: grid; grid-template-columns: 80px 1fr 100px 110px 85px 95px; align-items: center; padding: 6px 12px; border-bottom: 1px solid #cbd5e1; font-size: 14px; background: #f0f0f0; }
    .row:nth-child(even) { background: #e8e8e8; }
    .qty-box { display: inline-flex; align-items: center; background: #fff; border: 1.5px solid #475569; border-radius: 16px; padding: 1px 6px; width: 85px; }
    .qty-box input { border: none; outline: none; width: 100%; font-weight: bold; font-size: 15px; text-align: center; background: transparent; }
    .bottom-panel { margin-top: 20px; background: #d1d5db; border: 2px solid #9ca3af; border-radius: 8px; padding: 15px; }
    .shop-input { width: 100%; padding: 8px 12px; font-size: 15px; font-weight: bold; border-radius: 4px; border: 1.5px solid #475569; margin: 8px 0 14px 0; box-sizing: border-box; }
    .btn-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .btn { padding: 10px; font-weight: bold; font-size: 13px; text-align: center; border-radius: 4px; border: 1px solid #64748b; background: #cbd5e1; cursor: pointer; }
    .btn-wa { background: #25D366; color: #fff; border-color: #1eb956; }
    .footer { text-align: center; margin-top: 12px; font-size: 12px; font-weight: bold; color: #334155; }
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
      <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">Type Your Search e.g. Item Code, Name, Offer Rate...</div>
      <input type="text" class="search-input" id="search" placeholder="Search your product(s)" oninput="filterItems()">
    </div>
    <div class="table-header">
      <div>Code</div>
      <div>Item Name</div>
      <div style="text-align: right;">T.P.</div>
      <div style="text-align: center;">ORDER QTY</div>
      <div style="text-align: right;">Offer</div>
      <div style="text-align: center;">Bonus</div>
    </div>
    <div id="product-list">
      ${inStockItems.map(p => {
        const code = p.code || p.itemCode || '0000';
        const price = (Number(p.price) || 0).toFixed(2);
        const disc = p.offerDiscount || '10.00%';
        const bonus = p.bonusText || (p.unit || 'NET');
        return `<div class="row item-row" data-name="${p.name.toLowerCase()}" data-code="${code.toLowerCase()}">
          <div style="font-weight:bold; font-family: monospace;">${code}</div>
          <div style="font-weight:bold; text-transform: uppercase;">${p.name}</div>
          <div style="text-align:right; font-weight:bold;">${price}</div>
          <div style="text-align:center;">
            <div class="qty-box">
              <span style="font-size:11px; font-weight:bold; color:#64748b; margin-right:3px;">Qty</span>
              <input type="number" min="0" class="qty-input" data-name="${p.name}" data-price="${price}" data-code="${code}" data-disc="${disc}">
            </div>
          </div>
          <div style="text-align:right; font-weight:bold;">${disc}</div>
          <div style="text-align:center; font-weight:bold; color:#b91c1c;">${bonus}</div>
        </div>`;
      }).join('\n')}
    </div>
    <div class="bottom-panel">
      <label style="font-weight:bold; font-size:14px;">ENTER YOUR SHOP NAME :</label>
      <input type="text" id="shop-name" class="shop-input" placeholder="Enter Your Shop Name">
      <div class="btn-grid">
        <button class="btn" onclick="previewOrder()">Preview Order</button>
        <button class="btn" onclick="copyOrder()">Share / Copy</button>
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
        const name = row.getAttribute('data-name');
        const code = row.getAttribute('data-code');
        row.style.display = (name.includes(q) || code.includes(q)) ? 'grid' : 'none';
      });
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
        msg += '*(No quantities specified - Inquiring regarding wholesale rate sheet)*\\n';
      }
      msg += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n📍 Denso Hall, Saddar, Karachi';
      window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
    }
    function copyOrder() {
      alert('Order prepared for WhatsApp!');
      sendWhatsApp();
    }
    function previewOrder() {
      sendWhatsApp();
    }
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Waqas_Medical_Store_Offer_List_${dateStr.replace(/\//g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="offer-doc-modal-container"
        onClick={e => e.stopPropagation()}
      >
        {/* TOP MODAL HEADER BAR */}
        <div className="offer-doc-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileSpreadsheet size={20} color="#38bdf8" />
            <span style={{ fontWeight: '800', fontSize: '1.1rem', letterSpacing: '0.5px' }}>
              OFFER LIST (INTERACTIVE WHOLESALE ORDER SHEET)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleExportStandaloneHTML}
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Download standalone offline HTML file to send over WhatsApp"
            >
              <Download size={14} /> Download Shareable .HTML File
            </button>

            <button 
              className="close-btn" 
              style={{ color: '#ffffff', background: 'transparent', border: 'none', cursor: 'pointer' }} 
              onClick={onClose}
              title="Close Offer List"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* SCROLLABLE INTERACTIVE DOCUMENT BODY */}
        <div className="offer-doc-scroll-body">
          <div className="offer-doc-page">
            
            {/* 1. GREEN BISMILLAH CALLIGRAPHY */}
            <div className="offer-doc-bismillah">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>

            {/* 2. LOCATION */}
            <div className="offer-doc-location">
              DENSO HALL, KARACHI
            </div>

            {/* 3. INSTRUCTIONS BOX */}
            <div className="offer-doc-instructions">
              <strong>MUST</strong> open/use Google Chrome for order making (Android Phone)<br />
              <strong>MUST</strong> open/use Microsoft Edge Browser for order making (Apple iPhone)
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.95rem', fontWeight: '700', color: '#111827', margin: '8px 0' }}>
              You can Search the products by Name, Discount offer,
            </div>

            {/* 4. MAIN TITLE & METADATA */}
            <div className="offer-doc-main-title">
              OFFER LIST
            </div>

            <div className="offer-doc-meta-row">
              <span>List No : 000381</span>
              <span>List Date : {dateStr}</span>
            </div>

            {/* 5. SEARCH BOX */}
            <div className="offer-doc-search-section">
              <span className="offer-doc-search-label">
                Type Your Search e.g. Item Code, Name, Offer Rate...
              </span>
              <input 
                type="text"
                className="offer-doc-search-input"
                placeholder="Search your product(s)"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                autoFocus
              />
            </div>

            {/* 6. ALPHABET JUMP BAR */}
            <div className="offer-doc-alphabet-bar">
              <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#1e293b', alignSelf: 'center', marginRight: '4px' }}>
                A-Z JUMP:
              </span>
              {ALPHABET.map(letter => (
                <button
                  key={letter}
                  className={`offer-doc-alpha-btn ${selectedLetter === letter ? 'active' : ''}`}
                  onClick={() => setSelectedLetter(letter)}
                >
                  {letter}
                </button>
              ))}
            </div>

            {/* LIVE ORDER FLOATING SUMMARY (If quantities typed) */}
            {selectedOrderItems.length > 0 && (
              <div className="offer-doc-floating-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1rem', fontWeight: '800', color: '#38bdf8' }}>
                    🛒 {selectedOrderItems.length} Products Selected ({totalOrderUnits} Units)
                  </span>
                  <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#4ade80' }}>
                    Rs. {totalOrderAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <button 
                  onClick={handleClearQuantities}
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RotateCcw size={12} /> Clear All
                </button>
              </div>
            )}

            {/* 7. TABLE HEADER (RED ROUNDED TOP) */}
            <div className="offer-doc-table-header">
              <div>Code</div>
              <div>Item Name</div>
              <div style={{ textAlign: 'right', paddingRight: '12px' }}>T.P.</div>
              <div style={{ textAlign: 'center' }}>ORDER QTY</div>
              <div style={{ textAlign: 'right', paddingRight: '8px' }}>Offer</div>
              <div style={{ textAlign: 'center' }}>Bonus</div>
            </div>

            {/* 8. PRODUCTS LIST CATEGORIZED BY A, B, C... WITH EDITABLE INPUTS */}
            <div>
              {availableLetters.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 10px', color: '#64748b', background: '#f8fafc' }}>
                  <Search size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                  <div style={{ fontWeight: '800', color: '#111827' }}>No products found matching "{searchFilter}"</div>
                </div>
              ) : (
                availableLetters.map(letter => {
                  const items = groupedByLetter[letter] || [];
                  return (
                    <div key={letter} id={`letter-sec-${letter}`}>
                      {/* Red Letter Section Pill (A, B, C...) */}
                      <div className="offer-doc-letter-pill">
                        {letter}
                      </div>

                      {/* Item Rows with LIVE EDITABLE QUANTITY BOXES */}
                      {items.map(prod => {
                        const itemKey = prod.id || prod._id || prod.code;
                        const code = prod.code || prod.itemCode || String(itemKey).slice(-4).toUpperCase();
                        const price = (Number(prod.price) || 0).toFixed(2);
                        
                        let discFormatted = '10.00%';
                        if (prod.offerDiscount) {
                          discFormatted = prod.offerDiscount;
                        } else if (prod.originalPrice && prod.originalPrice > prod.price) {
                          const disc = ((prod.originalPrice - prod.price) / prod.originalPrice) * 100;
                          discFormatted = `${disc.toFixed(2)}%`;
                        }

                        const bonusText = prod.bonusText || (prod.unit && prod.unit !== 'Pack / Strip' ? prod.unit : 'NET');
                        const hasQty = Number(quantities[itemKey]) > 0;

                        return (
                          <div 
                            key={itemKey} 
                            className={`offer-doc-item-row ${hasQty ? 'is-selected' : ''}`}
                          >
                            <span className="offer-doc-col-code">{code}</span>
                            
                            <span className="offer-doc-col-name" title={prod.name}>
                              {prod.name.toUpperCase()}
                            </span>

                            <span className="offer-doc-col-tp">{price}</span>

                            {/* LIVE EDITABLE INPUT BOX (Qty [ 1 ]) */}
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              <div className="offer-doc-qty-box">
                                <span className="offer-doc-qty-prefix">Qty</span>
                                <input 
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  className="offer-doc-qty-input"
                                  value={quantities[itemKey] || ''}
                                  onChange={e => handleQuantityChange(itemKey, e.target.value)}
                                  placeholder=""
                                />
                              </div>
                            </div>

                            <span className="offer-doc-col-offer">{discFormatted}</span>

                            <span className="offer-doc-col-bonus">{bonusText}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            {/* 9. BOTTOM CONTROLS & SHOP NAME (EXACT MATCH TO SCREENSHOT) */}
            <div className="offer-doc-bottom-section">
              <div className="offer-doc-shop-row">
                <label className="offer-doc-shop-label">ENTER YOUR SHOP NAME :</label>
                <input 
                  type="text"
                  className="offer-doc-shop-input"
                  placeholder="Enter Your Shop Name"
                  value={shopName}
                  onChange={e => handleShopNameChange(e.target.value)}
                />
              </div>

              {/* 4 ACTION BUTTONS */}
              <div className="offer-doc-actions-grid">
                <button 
                  className="offer-doc-btn"
                  onClick={() => setShowReceiptPreview(true)}
                  title="Preview order calculations"
                >
                  <Eye size={16} /> Preview on Android/iPhone
                </button>

                <button 
                  className="offer-doc-btn"
                  onClick={handleCopyOrder}
                  title="Copy formatted order to clipboard"
                >
                  {copied ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
                  {copied ? 'Copied to Clipboard!' : 'Share on iPhone'}
                </button>

                <button 
                  className="offer-doc-btn offer-doc-btn-whatsapp"
                  onClick={handleOpenWhatsApp}
                  title="Send compiled order with quantities to WhatsApp"
                >
                  <Smartphone size={17} /> Text To Whatsapp
                </button>

                <button 
                  className="offer-doc-btn"
                  onClick={handlePrintOrPdf}
                  title="Print or export as PDF"
                >
                  <Printer size={16} /> Generate PDF file (Android)
                </button>
              </div>

              {/* FOOTER */}
              <div className="offer-doc-footer-box">
                <div className="offer-doc-footer-title">
                  POWERED BY: WAQAS MEDICAL STORE (DENSO HALL, SADDAR, KARACHI)
                </div>
                <div className="offer-doc-footer-info">
                  For More Information... 📞 +92 300 1234567 | WhatsApp: +92 300 1234567
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ORDER RECEIPT PREVIEW POPUP */}
        {showReceiptPreview && (
          <div className="offer-order-receipt-overlay" onClick={() => setShowReceiptPreview(false)}>
            <div className="offer-order-receipt-card" onClick={e => e.stopPropagation()}>
              <div className="offer-receipt-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt size={18} />
                  <h4 style={{ margin: 0, fontSize: '1rem', color: '#ffffff' }}>Order Bill Summary Preview</h4>
                </div>
                <button 
                  onClick={() => setShowReceiptPreview(false)}
                  style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="offer-receipt-body">
                <div style={{ borderBottom: '1px dashed #cbd5e1', paddingBottom: '10px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>WAQAS MEDICAL STORE</div>
                  <div style={{ fontSize: '0.82rem', color: '#475569' }}>Denso Hall, Saddar, Karachi</div>
                  <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                    <strong>Shop Name:</strong> {shopName.trim() || 'Retail Pharmacy Customer'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    <strong>Date:</strong> {dateStr}
                  </div>
                </div>

                {selectedOrderItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 10px', color: '#64748b' }}>
                    <p style={{ margin: '0 0 6px 0', fontWeight: '700' }}>No quantities entered yet.</p>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>
                      Click on the <strong>Qty [ ]</strong> box for any medicine and type the quantity (e.g. 1, 10, 50).
                    </p>
                  </div>
                ) : (
                  <>
                    <table className="offer-receipt-table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th style={{ textAlign: 'center' }}>Qty</th>
                          <th style={{ textAlign: 'right' }}>Rate</th>
                          <th style={{ textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrderItems.map(item => (
                          <tr key={item.id || item._id || item.code}>
                            <td>
                              <div style={{ fontWeight: '700', color: '#0f172a' }}>{item.name}</div>
                              {item.discPercent > 0 && (
                                <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '600' }}>
                                  Disc: {item.discPercent.toFixed(1)}%
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: '800' }}>{item.orderQty}</td>
                            <td style={{ textAlign: 'right' }}>{(Number(item.price) || 0).toFixed(2)}</td>
                            <td style={{ textAlign: 'right', fontWeight: '700' }}>{item.lineSubtotal.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div style={{ borderTop: '2px solid #0f172a', marginTop: '12px', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '4px' }}>
                        <span>Total Units:</span>
                        <strong>{totalOrderUnits}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: '800', color: '#059669' }}>
                        <span>Grand Total:</span>
                        <span>Rs. {totalOrderAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
                  <button 
                    className="btn"
                    onClick={() => setShowReceiptPreview(false)}
                    style={{ flex: 1, background: '#f1f5f9', color: '#334155', fontWeight: '600' }}
                  >
                    Close
                  </button>
                  {selectedOrderItems.length > 0 && (
                    <button 
                      className="btn"
                      onClick={handleOpenWhatsApp}
                      style={{ flex: 1.5, background: '#25D366', color: '#ffffff', fontWeight: '700', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Smartphone size={16} /> Send via WhatsApp
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
