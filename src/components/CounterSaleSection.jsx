import React, { useState } from 'react';
import { 
  ShoppingCart, Search, Zap, Trash2, Printer, Check, DollarSign
} from 'lucide-react';

export default function CounterSaleSection({ catalog = [], onUpdateCatalog, retailers = [], currentUser }) {
  // Catalog State
  const [editableProducts, setEditableProducts] = useState(catalog);

  React.useEffect(() => {
    setEditableProducts(catalog);
  }, [catalog]);

  // Wholesale High-Speed POS Counter State
  const [posCart, setPosCart] = useState([]);
  const [posPaymentMethod, setPosPaymentMethod] = useState('cash'); // 'cash', 'raast', 'ledger', 'card'
  const [posSearchQuery, setPosSearchQuery] = useState('');
  const [posCategoryFilter, setPosCategoryFilter] = useState('ALL');
  const [posCustomerType, setPosCustomerType] = useState('walkin'); // 'walkin' or 'b2b'
  const [posSelectedRetailerId, setPosSelectedRetailerId] = useState('');
  const [posTradeDiscount, setPosTradeDiscount] = useState(0); // 0, 5, 10, 12, 15
  const [posCashTendered, setPosCashTendered] = useState('');
  const [posInvoiceNo, setPosInvoiceNo] = useState(`WMS-POS-${Date.now().toString().slice(-5)}`);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Dynamically compute all unique categories from catalog
  const allCategories = React.useMemo(() => {
    const catSet = new Set(['medicines', 'hygiene', 'baby-care', 'surgical', 'supplements', 'skincare']);
    (editableProducts || []).forEach(p => {
      if (p.category) catSet.add(p.category.toLowerCase().trim());
    });
    return Array.from(catSet);
  }, [editableProducts]);

  // Handle Quick Add to Register
  const handlePosAddToCart = (product, mode = 'pack') => {
    const rawPrice = Number(product.price) || 0;
    const strips = Number(product.stripsPerPack) || 10;
    const rawStripPrice = Number(product.stripPrice) || (rawPrice / strips);
    const unitPrice = mode === 'strip' ? rawStripPrice : rawPrice;

    setPosCart(prev => {
      const existing = prev.find(i => i.id === product.id && i.selectedPackaging === mode);
      if (existing) {
        return prev.map(i => (i.id === product.id && i.selectedPackaging === mode) ? { ...i, quantity: (Number(i.quantity) || 1) + 1 } : i);
      }
      return [...prev, {
        id: product.id,
        code: product.code || 'N/A',
        name: product.name,
        genericName: product.genericName,
        price: rawPrice,
        stripPrice: rawStripPrice,
        unitPrice: unitPrice,
        stripsPerPack: strips,
        packagingMode: product.packagingMode || 'pack',
        selectedPackaging: mode,
        quantity: 1,
        stock: product.stock
      }];
    });
  };

  const handlePosQuantityChange = (id, mode, delta) => {
    setPosCart(prev => {
      return prev.map(item => {
        if (item.id === id && item.selectedPackaging === mode) {
          const newQty = (Number(item.quantity) || 1) + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const handlePosDirectQuantity = (id, mode, val) => {
    const qty = parseInt(val) || 1;
    setPosCart(prev => prev.map(item => {
      if (item.id === id && item.selectedPackaging === mode) {
        return { ...item, quantity: Math.max(1, qty) };
      }
      return item;
    }));
  };

  const handlePosToggleItemPackaging = (id, currentMode) => {
    const nextMode = currentMode === 'pack' ? 'strip' : 'pack';
    setPosCart(prev => prev.map(item => {
      if (item.id === id && item.selectedPackaging === currentMode) {
        const unitPrice = nextMode === 'strip' ? item.stripPrice : item.price;
        return {
          ...item,
          selectedPackaging: nextMode,
          unitPrice: unitPrice
        };
      }
      return item;
    }));
  };

  const handlePosSearchKeyDown = (e, topProduct) => {
    if (e.key === 'Enter' && topProduct) {
      e.preventDefault();
      handlePosAddToCart(topProduct, 'pack');
      setPosSearchQuery('');
    }
  };

  const handleRemovePosCartItem = (id, mode) => {
    setPosCart(prev => prev.filter(item => !(item.id === id && item.selectedPackaging === mode)));
  };

  const handlePrintWholesaleSlip = (saleData) => {
    const slipWin = window.open('', '_blank');
    const selectedRetailer = retailers.find(r => r.id === posSelectedRetailerId || r._id === posSelectedRetailerId);
    const customerTitle = posCustomerType === 'b2b' && selectedRetailer 
      ? `${selectedRetailer.name} (Code: ${selectedRetailer.username} | Lic: ${selectedRetailer.licenseNo || 'N/A'})`
      : 'Walk-In Counter Customer';
    
    slipWin.document.write(`
      <html>
        <head>
          <title>Wholesale Tax Invoice - ${saleData.invoiceNo}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 440px; margin: auto; color: #000; }
            .hdr { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 12px; }
            .hdr h2 { margin: 0; font-size: 1.3rem; }
            .hdr p { margin: 2px 0; font-size: 0.8rem; }
            .meta { font-size: 0.82rem; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; font-size: 0.8rem; margin: 10px 0; }
            th { border-bottom: 1px solid #000; text-align: left; padding: 4px 2px; }
            td { padding: 4px 2px; vertical-align: top; }
            .num { text-align: right; }
            .totals { border-top: 1px dashed #000; padding-top: 8px; font-size: 0.85rem; }
            .tot-row { display: flex; justify-content: space-between; margin: 3px 0; }
            .grand { font-weight: bold; font-size: 1rem; border-top: 1px solid #000; padding-top: 4px; }
            .ftr { text-align: center; margin-top: 20px; font-size: 0.75rem; border-top: 1px dashed #000; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="hdr">
            <h2>WAQAS MEDICAL STORE</h2>
            <p>DRAP Lic # 04-DL-KAR-2024 &bull; Wholesale & Retail</p>
            <p>Main Commercial Branch, Karachi &bull; Tel: +92 300 1234567</p>
            <h4>COUNTER SALE INVOICE</h4>
          </div>
          <div class="meta">
            <div><strong>Invoice #:</strong> ${saleData.invoiceNo}</div>
            <div><strong>Date/Time:</strong> ${new Date().toLocaleString()}</div>
            <div><strong>Customer:</strong> ${customerTitle}</div>
            <div><strong>Cashier:</strong> ${currentUser?.name || 'Dr. Waqas'}</div>
            <div><strong>Payment:</strong> ${saleData.paymentMethod.toUpperCase()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Mode</th>
                <th class="num">Qty</th>
                <th class="num">Rate</th>
                <th class="num">Total</th>
              </tr>
            </thead>
            <tbody>
              ${saleData.items.map(it => `
                <tr>
                  <td>${it.name}</td>
                  <td>${it.selectedPackaging.toUpperCase()}</td>
                  <td class="num">${it.quantity}</td>
                  <td class="num">${it.unitPrice.toFixed(2)}</td>
                  <td class="num">${(it.unitPrice * it.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals">
            <div class="tot-row"><span>Gross Subtotal:</span><span>Rs. ${saleData.subtotal.toFixed(2)}</span></div>
            ${saleData.discountPercent > 0 ? `<div class="tot-row"><span>Trade Discount (${saleData.discountPercent}%):</span><span>- Rs. ${saleData.discountAmount.toFixed(2)}</span></div>` : ''}
            <div class="tot-row grand"><span>NET PAYABLE:</span><span>Rs. ${saleData.netPayable.toFixed(2)}</span></div>
            ${saleData.cashTendered ? `
              <div class="tot-row"><span>Cash Paid:</span><span>Rs. ${parseFloat(saleData.cashTendered).toFixed(2)}</span></div>
              <div class="tot-row"><span>Change Returned:</span><span>Rs. ${saleData.change.toFixed(2)}</span></div>
            ` : ''}
          </div>
          <div class="ftr">
            <p>*** Software Verified Wholesale Slip ***</p>
            <p>Goods once sold can only be returned within 3 days with valid invoice.</p>
            <p>Thank you for your business!</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
  };

  const handleCompletePosSale = (shouldPrint = false) => {
    if (posCart.length === 0) return;

    // Deduct stock
    const updated = editableProducts.map(p => {
      const cartItemsForProduct = posCart.filter(i => i.id === p.id);
      if (cartItemsForProduct.length > 0) {
        let totalUnitsDeducted = 0;
        cartItemsForProduct.forEach(ci => {
          if (ci.selectedPackaging === 'strip') {
            totalUnitsDeducted += Math.ceil(ci.quantity / (p.stripsPerPack || 10));
          } else {
            totalUnitsDeducted += ci.quantity;
          }
        });
        return { ...p, stock: Math.max(0, p.stock - totalUnitsDeducted) };
      }
      return p;
    });

    const posGrossSubtotal = posCart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const posDiscountAmount = Math.round((posGrossSubtotal * (posTradeDiscount / 100)) * 100) / 100;
    const posNetPayable = Math.max(0, Math.round((posGrossSubtotal - posDiscountAmount) * 100) / 100);
    const posCashChange = posCashTendered ? Math.max(0, parseFloat(posCashTendered) - posNetPayable) : 0;

    const saleData = {
      invoiceNo: posInvoiceNo,
      items: [...posCart],
      subtotal: posGrossSubtotal,
      discountPercent: posTradeDiscount,
      discountAmount: posDiscountAmount,
      netPayable: posNetPayable,
      paymentMethod: posPaymentMethod,
      cashTendered: posCashTendered,
      change: posCashChange
    };

    if (shouldPrint) {
      handlePrintWholesaleSlip(saleData);
    }

    setEditableProducts(updated);
    if (onUpdateCatalog) {
      onUpdateCatalog(updated);
    }
    setSaveSuccessMsg(`✅ Counter Invoice #${posInvoiceNo} completed! Inventory auto-deducted.`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);

    // Reset register for next fast sale
    setPosCart([]);
    setPosCashTendered('');
    setPosInvoiceNo(`WMS-POS-${Date.now().toString().slice(-5)}`);
  };

  // Filtered Products for POS Search
  const query = posSearchQuery.trim().toLowerCase();
  const filteredPosProducts = editableProducts.filter(p => {
    const catMatch = posCategoryFilter === 'ALL' || (p.category && p.category.toLowerCase() === posCategoryFilter.toLowerCase());
    const searchMatch = !query || 
      p.name.toLowerCase().includes(query) ||
      (p.code && p.code.toLowerCase().includes(query)) ||
      (p.genericName && p.genericName.toLowerCase().includes(query));
    return catMatch && searchMatch;
  });

  const topMatchProduct = filteredPosProducts.length > 0 ? filteredPosProducts[0] : null;
  const displayedPosProducts = filteredPosProducts.slice(0, 40);

  const posGrossSubtotal = posCart.reduce((sum, item) => sum + ((Number(item.unitPrice) || 0) * (Number(item.quantity) || 1)), 0);
  const posDiscountAmount = Math.round((posGrossSubtotal * (Number(posTradeDiscount) / 100)) * 100) / 100;
  const posNetPayable = Math.max(0, Math.round((posGrossSubtotal - posDiscountAmount) * 100) / 100);
  const tenderedNum = parseFloat(posCashTendered) || 0;
  const posCashChange = tenderedNum >= posNetPayable ? Math.max(0, Math.round((tenderedNum - posNetPayable) * 100) / 100) : 0;
  const totalUnitsCount = posCart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  return (
    <div className="store-ops-container">
      {saveSuccessMsg && (
        <div className="ops-success-banner" style={{ marginBottom: '14px' }}>
          <Check size={16} /> {saveSuccessMsg}
        </div>
      )}

      {/* DEDICATED STANDALONE COUNTER SALE BILLING TERMINAL (NO SUB-TABS) */}
      <div className="wholesale-pos-terminal-container">
        {/* Top Wholesaler / Customer & Terminal Bar */}
        <div className="pos-terminal-topbar">
          <div className="pos-top-left">
            <div className="terminal-badge">
              <Zap size={16} color="#0d9488" />
              <strong>Wholesale Counter Terminal</strong>
            </div>
            <span className="terminal-inventory-stat">
              ⚡ <strong>{editableProducts.length}</strong> Live Medicines Ready
            </span>
          </div>

          <div className="pos-top-right">
            <div className="pos-customer-selector-group">
              <span className="pos-customer-lbl">Billed To:</span>
              <div className="pos-cust-type-toggle">
                <button 
                  type="button" 
                  className={`cust-type-btn ${posCustomerType === 'walkin' ? 'active' : ''}`}
                  onClick={() => { setPosCustomerType('walkin'); setPosSelectedRetailerId(''); }}
                >
                  🛍️ Walk-In Counter
                </button>
                <button 
                  type="button" 
                  className={`cust-type-btn ${posCustomerType === 'b2b' ? 'active' : ''}`}
                  onClick={() => setPosCustomerType('b2b')}
                >
                  🏢 B2B Retailer Account
                </button>
              </div>

              {posCustomerType === 'b2b' && (
                <select 
                  className="pos-retailer-dropdown"
                  value={posSelectedRetailerId}
                  onChange={(e) => setPosSelectedRetailerId(e.target.value)}
                >
                  <option value="">-- Select Registered Pharmacy Partner --</option>
                  {retailers.map(r => (
                    <option key={r.id || r._id} value={r.id || r._id}>
                      {r.name} ({r.username}) - {r.area || 'Karachi'}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Split Screen Workspace */}
        <div className="pos-split-workspace">
          {/* LEFT 55%: Lightning Catalog Search & Rapid Product Picker Table */}
          <div className="pos-catalog-panel">
            {/* Search Bar with Barcode Scanner & Hotkey Hint */}
            <div className="pos-scanner-search-box">
              <Search size={18} color="#0d9488" className="pos-search-icon" />
              <input 
                type="text" 
                className="pos-terminal-search-input"
                placeholder="Scan barcode or type medicine name / item code (Press ENTER to quick-add top item)..."
                value={posSearchQuery}
                onChange={(e) => setPosSearchQuery(e.target.value)}
                onKeyDown={(e) => handlePosSearchKeyDown(e, topMatchProduct)}
                autoFocus
              />
              {posSearchQuery && (
                <button className="btn-clear-pos-term" onClick={() => setPosSearchQuery('')}>×</button>
              )}
              {topMatchProduct && posSearchQuery && (
                <span className="pos-enter-hint">
                  ⏎ Press Enter to Add: <strong>{topMatchProduct.name}</strong>
                </span>
              )}
            </div>

            {/* Category Quick Pills */}
            <div className="pos-category-pills-bar">
              <button 
                className={`pos-cat-pill ${posCategoryFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setPosCategoryFilter('ALL')}
              >
                ALL ({editableProducts.length})
              </button>
              {allCategories.map(cat => (
                <button 
                  key={cat}
                  className={`pos-cat-pill ${posCategoryFilter === cat ? 'active' : ''}`}
                  onClick={() => setPosCategoryFilter(cat)}
                >
                  {cat.toUpperCase().replace('-', ' ')}
                </button>
              ))}
            </div>

            {/* High Density Table for rapid adding */}
            <div className="pos-items-table-wrapper">
              <table className="pos-fast-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Code</th>
                    <th>Medicine Title & Generic Formula</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Stock</th>
                    <th style={{ width: '95px', textAlign: 'right' }}>Trade Rate</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Quick Add</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedPosProducts.length > 0 ? (
                    displayedPosProducts.map(p => (
                      <tr 
                        key={p.id} 
                        className="pos-fast-row"
                        onClick={() => handlePosAddToCart(p)}
                        title="Click row to add to bill"
                      >
                        <td><code className="pos-code-tag">{p.code || 'N/A'}</code></td>
                        <td>
                          <div className="pos-med-info">
                            <strong className="pos-med-name">{p.name}</strong>
                            {p.genericName && <span className="pos-generic-txt">{p.genericName}</span>}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`pos-stock-pill ${p.stock < 10 ? 'stock-low' : 'stock-ok'}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <strong className="pos-price-num">Rs. {p.price.toFixed(2)}</strong>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            type="button" 
                            className="btn-fast-add"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePosAddToCart(p);
                            }}
                          >
                            + Add
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="pos-no-items">
                        No medicines found matching "<strong>{posSearchQuery}</strong>"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT 45%: Wholesale Register & Active Counter Bill */}
          <div className="pos-register-panel">
            {/* Register Header */}
            <div className="register-header-box">
              <div>
                <h3 className="register-title">Counter Invoice</h3>
                <span className="register-inv-code">{posInvoiceNo}</span>
              </div>
              <div className="register-cashier-pill">
                👨‍⚕️ {currentUser?.name || 'Dr. Waqas (Chief Pharmacist)'}
              </div>
            </div>

            {/* Active Billing Items Register Table */}
            <div className="register-lines-table-container">
              {posCart.length > 0 ? (
                <table className="register-lines-table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th style={{ width: '85px', textAlign: 'center' }}>Unit Mode</th>
                      <th style={{ width: '85px', textAlign: 'center' }}>Qty</th>
                      <th style={{ width: '75px', textAlign: 'right' }}>Price</th>
                      <th style={{ width: '85px', textAlign: 'right' }}>Total</th>
                      <th style={{ width: '32px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {posCart.map((item) => (
                      <tr key={`${item.id}-${item.selectedPackaging}`}>
                        <td>
                          <div className="reg-item-name">{item.name}</div>
                          <small className="reg-item-code">Code: {item.code}</small>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            type="button" 
                            className={`btn-toggle-pack-mode ${item.selectedPackaging === 'strip' ? 'is-strip' : 'is-pack'}`}
                            onClick={() => handlePosToggleItemPackaging(item.id, item.selectedPackaging)}
                            title="Click to toggle Pack vs Strip pricing"
                          >
                            {item.selectedPackaging === 'strip' ? '💊 Strip' : '📦 Pack'}
                          </button>
                        </td>
                        <td>
                          <div className="reg-qty-controls">
                            <button 
                              type="button" 
                              className="qty-btn"
                              onClick={() => handlePosQuantityChange(item.id, item.selectedPackaging, -1)}
                            >
                              -
                            </button>
                            <input 
                              type="number" 
                              className="qty-input"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handlePosDirectQuantity(item.id, item.selectedPackaging, e.target.value)}
                            />
                            <button 
                              type="button" 
                              className="qty-btn"
                              onClick={() => handlePosQuantityChange(item.id, item.selectedPackaging, 1)}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="reg-rate">Rs.{item.unitPrice.toFixed(2)}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <strong className="reg-item-total">Rs.{(item.unitPrice * item.quantity).toFixed(2)}</strong>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            type="button" 
                            className="btn-remove-line"
                            onClick={() => handleRemovePosCartItem(item.id, item.selectedPackaging)}
                            title="Remove line item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="register-empty-state">
                  <ShoppingCart size={40} color="#94a3b8" />
                  <h4>Register is Empty</h4>
                  <p>Scan barcode or click items from left catalog to start billing</p>
                </div>
              )}
            </div>

            {/* Financial Summary & Payment Action Footer */}
            <div className="register-financial-footer">
              <div className="fin-summary-box">
                <div className="fin-row">
                  <span>Gross Subtotal ({totalUnitsCount} Units):</span>
                  <strong>Rs. {posGrossSubtotal.toFixed(2)}</strong>
                </div>

                {/* Fast Wholesale Discount Pill Selector */}
                <div className="fin-row discount-row">
                  <span>Wholesale Discount:</span>
                  <div className="discount-pills-wrap">
                    {[0, 5, 10, 12, 15].map(disc => (
                      <button 
                        key={disc}
                        type="button"
                        className={`disc-pill ${posTradeDiscount === disc ? 'active' : ''}`}
                        onClick={() => setPosTradeDiscount(disc)}
                      >
                        {disc}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="fin-row net-payable-row">
                  <span>NET PAYABLE:</span>
                  <strong className="net-payable-num">Rs. {posNetPayable.toFixed(2)}</strong>
                </div>
              </div>

              {/* Payment Method & Cash Tendered */}
              <div className="register-pay-box">
                <div className="pay-method-pills">
                  <button 
                    type="button" 
                    className={`pay-mode-btn ${posPaymentMethod === 'cash' ? 'active' : ''}`}
                    onClick={() => setPosPaymentMethod('cash')}
                  >
                    💵 Cash
                  </button>
                  <button 
                    type="button" 
                    className={`pay-mode-btn ${posPaymentMethod === 'raast' ? 'active' : ''}`}
                    onClick={() => setPosPaymentMethod('raast')}
                  >
                    ⚡ Raast QR
                  </button>
                  <button 
                    type="button" 
                    className={`pay-mode-btn ${posPaymentMethod === 'ledger' ? 'active' : ''}`}
                    onClick={() => setPosPaymentMethod('ledger')}
                  >
                    📖 B2B Ledger
                  </button>
                  <button 
                    type="button" 
                    className={`pay-mode-btn ${posPaymentMethod === 'card' ? 'active' : ''}`}
                    onClick={() => setPosPaymentMethod('card')}
                  >
                    💳 Card POS
                  </button>
                </div>

                {posPaymentMethod === 'cash' && (
                  <div className="cash-calculator-row">
                    <div className="cash-input-field">
                      <label>Cash Received (Rs.):</label>
                      <input 
                        type="number" 
                        placeholder={`e.g. ${Math.ceil(posNetPayable / 100) * 100 || 500}`}
                        value={posCashTendered}
                        onChange={(e) => setPosCashTendered(e.target.value)}
                      />
                    </div>
                    {tenderedNum > 0 && (
                      <div className={`change-return-badge ${tenderedNum >= posNetPayable ? 'ok' : 'short'}`}>
                        {tenderedNum >= posNetPayable ? (
                          <>Change Return: <strong>Rs. {posCashChange.toFixed(2)}</strong></>
                        ) : (
                          <>Short by: <strong>Rs. {(posNetPayable - tenderedNum).toFixed(2)}</strong></>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons: 1-Click Print & Submit */}
                <div className="register-actions-grid">
                  <button 
                    type="button"
                    className="btn-complete-sale"
                    disabled={posCart.length === 0}
                    onClick={() => handleCompletePosSale(false)}
                  >
                    <Check size={16} /> Complete Invoice
                  </button>
                  <button 
                    type="button"
                    className="btn-print-slip"
                    disabled={posCart.length === 0}
                    onClick={() => handleCompletePosSale(true)}
                  >
                    <Printer size={16} /> Complete & Print Slip
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
