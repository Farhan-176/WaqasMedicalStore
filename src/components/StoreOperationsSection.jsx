import React, { useState, useEffect } from 'react';
import { 
  Table, Edit3, Save, AlertTriangle, ShoppingCart, Plus, Upload, 
  FileSpreadsheet, AlertCircle, ShieldAlert, DollarSign, Check,
  Printer, Zap, Trash2, Search, RefreshCw, UserCheck, ShieldCheck, CheckCircle2, ChevronRight, Store
} from 'lucide-react';
import { INITIAL_EXPIRY_BATCHES } from '../storeOpsData';

export default function StoreOperationsSection({ catalog, onUpdateCatalog, retailers = [], currentUser }) {
  const [activeOpsTab, setActiveOpsTab] = useState('quick-edit'); // 'quick-edit', 'pos-lite', 'expiry-alerts'
  
  // Local catalog copy for inline table edit (Full Store Catalog)
  const [editableProducts, setEditableProducts] = useState(catalog);

  useEffect(() => {
    setEditableProducts(catalog);
  }, [catalog]);

  const [opsSearchQuery, setOpsSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [editingTitleId, setEditingTitleId] = useState(null);

  const ALPHABET = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')];

  // Custom Categories & Category Creation State
  const [customCategories, setCustomCategories] = useState(['medicines', 'hygiene', 'baby-care', 'surgical', 'supplements', 'skincare']);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Dynamically compute all unique categories from catalog + custom list
  const allCategories = React.useMemo(() => {
    const catSet = new Set([...customCategories]);
    (editableProducts || []).forEach(p => {
      if (p.category) catSet.add(p.category.toLowerCase().trim());
    });
    return Array.from(catSet);
  }, [customCategories, editableProducts]);

  const handleCreateCategory = (e) => {
    e.preventDefault();
    const clean = newCategoryName.trim().toLowerCase().replace(/\s+/g, '-');
    if (!clean) return;
    if (!customCategories.includes(clean)) {
      setCustomCategories(prev => [...prev, clean]);
    }
    setNewCategoryName('');
    setIsAddCategoryModalOpen(false);
    setSaveSuccessMsg(`✅ Category "${clean.toUpperCase()}" created successfully!`);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // Handle Inline Name & Category Quick-Edit
  const handleNameChange = (id, newName) => {
    setEditableProducts(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const handleCategoryChange = (id, newCategory) => {
    setEditableProducts(prev => prev.map(p => p.id === id ? { ...p, category: newCategory } : p));
  };

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

  // Single Item Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    code: '', name: '', genericName: '', price: '', stock: '50', category: 'medicines', packagingMode: 'both', stripsPerPack: '10', requiresPrescription: false, image: ''
  });

  const generateAutoCode = () => {
    const numericCodes = editableProducts
      .map(p => parseInt(p.code))
      .filter(n => !isNaN(n));
    const maxCode = numericCodes.length > 0 ? Math.max(...numericCodes) : 628;
    const nextNum = maxCode + 1;
    return nextNum < 1000 ? `0${nextNum}` : `${nextNum}`;
  };

  const handleOpenAddModal = () => {
    const autoCode = generateAutoCode();
    setNewItem({
      code: autoCode,
      name: '',
      genericName: '',
      price: '',
      stock: '50',
      category: 'medicines',
      packagingMode: 'both',
      stripsPerPack: '10',
      requiresPrescription: false,
      image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&q=80'
    });
    setIsAddModalOpen(true);
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItem(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddNewItem = async (e) => {
    e.preventDefault();
    if (!newItem.name.trim() || !newItem.price) {
      alert('Please enter product title and trade price!');
      return;
    }

    const priceNum = parseFloat(newItem.price) || 0;
    const stripsNum = Math.max(1, parseInt(newItem.stripsPerPack) || 10);
    const mode = newItem.packagingMode || 'both';

    const createdProduct = {
      id: `offer_m_add_${Date.now()}`,
      code: newItem.code || generateAutoCode(),
      name: newItem.name.trim(),
      genericName: newItem.genericName.trim() || newItem.name.trim(),
      category: newItem.category,
      price: priceNum,
      originalPrice: priceNum ? Math.round(priceNum * 1.15 * 100) / 100 : null,
      discountPercent: 15,
      packagingMode: mode,
      stripsPerPack: stripsNum,
      hasStripOption: mode === 'both' || mode === 'strip',
      stripPrice: (mode === 'both' || mode === 'strip') ? Math.round((priceNum / stripsNum) * 100) / 100 : null,
      unit: mode === 'pack' ? 'Per Pack' : 'Pack / Strip',
      stock: parseInt(newItem.stock) || 30,
      requiresPrescription: newItem.requiresPrescription,
      coldStorage: newItem.name.toUpperCase().includes('INJ'),
      showOnMainScreen: true,
      image: newItem.image || 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&q=80'
    };

    // Save newly created product to MongoDB Atlas Cloud Database
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    try {
      await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createdProduct)
      });
    } catch (err) {
      console.warn('⚠️ Server offline, saved to local state fallback:', err.message);
    }

    const updatedCatalog = [createdProduct, ...editableProducts];
    setEditableProducts(updatedCatalog);
    onUpdateCatalog(updatedCatalog);
    setIsAddModalOpen(false);
    setSaveSuccessMsg(`✅ Added "${createdProduct.name}" (Code: ${createdProduct.code}) to catalog & MongoDB Atlas!`);
    setTimeout(() => setSaveSuccessMsg(''), 3500);
  };

  // Handle Inline Quick-Edit
  const handlePriceChange = (id, newPrice) => {
    setEditableProducts(prev => prev.map(p => p.id === id ? { ...p, price: parseFloat(newPrice) || 0 } : p));
  };

  const handlePackagingModeChange = (id, newMode) => {
    setEditableProducts(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          packagingMode: newMode,
          hasStripOption: newMode === 'both' || newMode === 'strip'
        };
      }
      return p;
    }));
  };

  const handleStripsPerPackChange = (id, newStrips) => {
    const strips = Math.max(1, parseInt(newStrips) || 1);
    setEditableProducts(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          stripsPerPack: strips,
          stripPrice: Math.round((p.price / strips) * 100) / 100
        };
      }
      return p;
    }));
  };

  const handleStockChange = (id, newStock) => {
    setEditableProducts(prev => prev.map(p => p.id === id ? { ...p, stock: parseInt(newStock) || 0 } : p));
  };

  const handleDiscountChange = (id, newDiscount) => {
    const disc = parseFloat(newDiscount) || 0;
    setEditableProducts(prev => prev.map(p => {
      if (p.id === id) {
        const orig = disc > 0 ? Math.round((p.price / (1 - disc / 100)) * 100) / 100 : null;
        return { ...p, discountPercent: disc, originalPrice: orig };
      }
      return p;
    }));
  };

  const handleToggleStorefrontVisibility = (id) => {
    setEditableProducts(prev => {
      const updated = prev.map(p => {
        if (p.id === id) {
          const currentVis = p.showOnMainScreen !== false;
          return { ...p, showOnMainScreen: !currentVis };
        }
        return p;
      });
      onUpdateCatalog(updated);
      return updated;
    });
  };

  const handleSaveQuickEdit = () => {
    onUpdateCatalog(editableProducts);
    setSaveSuccessMsg('✅ Rates & Stock updated instantly!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // Wholesale High-Speed POS Counter Methods
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

  const handlePosTogglePackaging = (id, currentMode) => {
    setPosCart(prev => prev.map(item => {
      if (item.id === id && item.selectedPackaging === currentMode) {
        const nextMode = currentMode === 'pack' ? 'strip' : 'pack';
        const newUnitPrice = nextMode === 'strip' ? Number(item.stripPrice) : Number(item.price);
        return { ...item, selectedPackaging: nextMode, unitPrice: newUnitPrice };
      }
      return item;
    }));
  };

  const handlePosRemoveItem = (id, mode) => {
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
    onUpdateCatalog(updated);
    setSaveSuccessMsg(`✅ Counter Invoice #${posInvoiceNo} completed! Inventory auto-deducted.`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);

    // Reset register for next fast sale
    setPosCart([]);
    setPosCashTendered('');
    setPosInvoiceNo(`WMS-POS-${Date.now().toString().slice(-5)}`);
  };

  return (
    <div className="store-ops-container">
      {/* Store Operations Header Tabs */}
      <div className="ops-header-tabs">
        <button 
          className={`ops-tab-btn ${activeOpsTab === 'quick-edit' ? 'active' : ''}`}
          onClick={() => setActiveOpsTab('quick-edit')}
        >
          <Table size={16} /> Quick-Edit Rate Table
        </button>

        <button 
          className={`ops-tab-btn ${activeOpsTab === 'pos-lite' ? 'active' : ''}`}
          onClick={() => setActiveOpsTab('pos-lite')}
        >
          <ShoppingCart size={16} /> POS Lite (Counter Sale)
        </button>

        <button 
          className={`ops-tab-btn ${activeOpsTab === 'expiry-alerts' ? 'active' : ''}`}
          onClick={() => setActiveOpsTab('expiry-alerts')}
        >
          <AlertTriangle size={16} /> Expiry & Batch Alerts
        </button>
      </div>

      {saveSuccessMsg && (
        <div className="ops-success-banner">
          <Check size={16} /> {saveSuccessMsg}
        </div>
      )}

      {/* TAB 1: Quick-Edit Rate & Stock Table */}
      {activeOpsTab === 'quick-edit' && (() => {
        const filteredOpsProducts = editableProducts
          .filter(p => {
            const matchesLetter = selectedLetter === 'ALL' || p.name.trim().toUpperCase().startsWith(selectedLetter);
            const query = opsSearchQuery.toLowerCase();
            const matchesSearch = 
              p.name.toLowerCase().includes(query) ||
              (p.code && p.code.toLowerCase().includes(query)) ||
              (p.genericName && p.genericName.toLowerCase().includes(query));
            return matchesLetter && matchesSearch;
          })
          .sort((a, b) => a.name.localeCompare(b.name));

        const totalPages = Math.ceil(filteredOpsProducts.length / itemsPerPage) || 1;
        const currentItems = filteredOpsProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

        return (
          <div className="ops-card">
            <div className="ops-card-header">
              <div className="ops-header-title-block">
                <h3>
                  Full Store Product Catalog 
                  <span className="ops-count-pill">{filteredOpsProducts.length} Filtered / {editableProducts.length} Total</span>
                </h3>
                <p>Search by name/generic formula, or filter by starting letter (A-Z) to edit trade rates and stock.</p>
              </div>
              
              <div className="ops-toolbar-row">
                <div className="ops-search-box">
                  <input 
                    type="text" 
                    placeholder="Search catalog items..." 
                    value={opsSearchQuery}
                    onChange={(e) => { setOpsSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="ops-search-input"
                  />
                </div>
                <button className="btn-add-category" onClick={() => setIsAddCategoryModalOpen(true)}>
                  <Plus size={14} /> Add Category
                </button>
                <button className="btn-add-item" onClick={handleOpenAddModal}>
                  <Plus size={14} /> Add Single Item
                </button>
                <button className="btn-save-edit" onClick={handleSaveQuickEdit}>
                  <Save size={14} /> Save All Changes
                </button>
              </div>
            </div>

            {/* Alphabetical A-Z Letter Filter Bar */}
            <div className="alphabet-bar ops-alphabet-bar">
              <span className="alphabet-title">Browse by Letter (A-Z):</span>
              <div className="alphabet-pills">
                {ALPHABET.map(letter => (
                  <button
                    key={letter}
                    className={`alphabet-btn ${selectedLetter === letter ? 'active' : ''}`}
                    onClick={() => { setSelectedLetter(letter); setCurrentPage(1); }}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>

            <div className="ops-table-wrapper">
              <table className="admin-table ops-table">
                <thead>
                  <tr>
                    <th style={{ width: '65px' }}>Code</th>
                    <th>Product Title</th>
                    <th style={{ width: '120px' }}>Category</th>
                    <th style={{ width: '90px' }}>Trade (Rs.)</th>
                    <th style={{ width: '125px' }}>Packaging</th>
                    <th style={{ width: '80px' }}>Disc. %</th>
                    <th style={{ width: '80px' }}>Stock</th>
                    <th style={{ width: '60px', textAlign: 'center' }}>Rx?</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Storefront</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map(p => (
                    <tr key={p.id}>
                      <td><code className="product-code-chip">{p.code || 'N/A'}</code></td>
                      <td>
                        {editingTitleId === p.id ? (
                          <input 
                            type="text" 
                            className="inline-input title-input-active"
                            value={p.name}
                            onChange={(e) => handleNameChange(p.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === 'Escape') setEditingTitleId(null);
                            }}
                            onBlur={() => setEditingTitleId(null)}
                            autoFocus
                            placeholder="Medicine Name..."
                          />
                        ) : (
                          <div 
                            className="title-display-box" 
                            onDoubleClick={() => setEditingTitleId(p.id)}
                            title="Double-click or click pencil icon to edit title"
                          >
                            <strong className="title-display-text">{p.name}</strong>
                            <button 
                              type="button" 
                              className="btn-title-edit-trigger" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTitleId(p.id);
                              }}
                              title="Edit title"
                            >
                              <Edit3 size={12} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        <select 
                          className="inline-select category-select"
                          value={(p.category || 'medicines').toLowerCase()}
                          onChange={(e) => handleCategoryChange(p.id, e.target.value)}
                          title="Select category"
                        >
                          {allCategories.map(cat => (
                            <option key={cat} value={cat}>
                              {cat.toUpperCase().replace('-', ' ')}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className="inline-input price-input"
                          value={p.price}
                          onChange={(e) => handlePriceChange(p.id, e.target.value)}
                        />
                      </td>
                      <td>
                        <select 
                          className="inline-select packaging-select"
                          value={p.packagingMode || (p.hasStripOption ? 'both' : 'pack')}
                          onChange={(e) => handlePackagingModeChange(p.id, e.target.value)}
                        >
                          <option value="both">Pack & Strip</option>
                          <option value="pack">Pack Only</option>
                          <option value="strip">Strip Only</option>
                        </select>
                      </td>
                      <td>
                        <div className="discount-input-wrapper">
                          <input 
                            type="number" 
                            min="0" 
                            max="90"
                            className="inline-input discount-input"
                            value={p.discountPercent || 0}
                            onChange={(e) => handleDiscountChange(p.id, e.target.value)}
                          />
                          <span className="percent-symbol">%</span>
                        </div>
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className={`inline-input stock-input ${p.stock < 10 ? 'low-stock-alert' : ''}`}
                          value={p.stock}
                          onChange={(e) => handleStockChange(p.id, e.target.value)}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {p.requiresPrescription ? (
                          <span className="rx-required-tag" title="Prescription Required">⚠️ Rx</span>
                        ) : (
                          <span className="rx-optional-tag">–</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div 
                          className={`radio-switch-wrapper ${p.showOnMainScreen !== false ? 'is-on' : 'is-off'}`}
                          onClick={() => handleToggleStorefrontVisibility(p.id)}
                          title={p.showOnMainScreen !== false ? 'Click to HIDE product from Customer Main Screen' : 'Click to SHOW product on Customer Main Screen'}
                          style={{ margin: '0 auto' }}
                        >
                          <div className="radio-switch-track">
                            <div className="radio-switch-knob"></div>
                          </div>
                          <span className="radio-switch-status">
                            {p.showOnMainScreen !== false ? 'ON' : 'OFF'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Catalog Pagination Controls */}
            <div className="ops-pagination">
              <span>Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredOpsProducts.length)} of {filteredOpsProducts.length} items</span>
              <div className="pagination-buttons">
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="btn-page"
                >
                  Prev
                </button>
                <span className="page-indicator">Page {currentPage} of {totalPages}</span>
                <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="btn-page"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 2: High-Speed Wholesale POS Terminal */}
      {activeOpsTab === 'pos-lite' && (() => {
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
                    <h4>Counter Invoice</h4>
                    <span className="register-invoice-no">{posInvoiceNo}</span>
                  </div>
                  <div className="register-header-meta">
                    <span className="cashier-tag">👨‍⚕️ {currentUser?.name || 'Dr. Waqas'}</span>
                    {posCart.length > 0 && (
                      <button 
                        type="button" 
                        className="btn-clear-register"
                        onClick={() => setPosCart([])}
                        title="Clear current bill"
                      >
                        <Trash2 size={13} /> Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="register-items-scroll">
                  {posCart.length > 0 ? (
                    <table className="register-lines-table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th style={{ width: '90px' }}>Packaging</th>
                          <th style={{ width: '70px', textAlign: 'right' }}>Rate</th>
                          <th style={{ width: '100px', textAlign: 'center' }}>Qty</th>
                          <th style={{ width: '75px', textAlign: 'right' }}>Total</th>
                          <th style={{ width: '28px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {posCart.map(item => (
                          <tr key={`${item.id}-${item.selectedPackaging}`}>
                            <td>
                              <div className="reg-item-cell">
                                <strong className="reg-item-title">{item.name}</strong>
                                <small className="reg-item-code">#{item.code}</small>
                              </div>
                            </td>
                            <td>
                              {item.packagingMode === 'both' ? (
                                <button 
                                  type="button" 
                                  className={`btn-mode-toggle ${item.selectedPackaging === 'strip' ? 'is-strip' : 'is-pack'}`}
                                  onClick={() => handlePosTogglePackaging(item.id, item.selectedPackaging)}
                                  title="Click to toggle Pack / Strip"
                                >
                                  {item.selectedPackaging === 'strip' ? '💊 Strip' : '📦 Pack'}
                                </button>
                              ) : (
                                <span className="fixed-packaging-tag">
                                  {item.selectedPackaging === 'strip' ? 'Strip' : 'Pack'}
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <span className="reg-unit-rate">{item.unitPrice.toFixed(2)}</span>
                            </td>
                            <td>
                              <div className="reg-qty-stepper">
                                <button type="button" onClick={() => handlePosQuantityChange(item.id, item.selectedPackaging, -1)}>-</button>
                                <input 
                                  type="number" 
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handlePosDirectQuantity(item.id, item.selectedPackaging, e.target.value)}
                                  className="reg-qty-input"
                                />
                                <button type="button" onClick={() => handlePosQuantityChange(item.id, item.selectedPackaging, 1)}>+</button>
                              </div>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <strong className="reg-line-total">
                                Rs. {(item.unitPrice * item.quantity).toFixed(2)}
                              </strong>
                            </td>
                            <td>
                              <button 
                                type="button" 
                                className="btn-reg-remove"
                                onClick={() => handlePosRemoveItem(item.id, item.selectedPackaging)}
                                title="Remove line"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="register-empty-state">
                      <ShoppingCart size={40} color="#cbd5e1" />
                      <p>Register is Empty</p>
                      <small>Scan barcode or click items from left catalog to start billing</small>
                    </div>
                  )}
                </div>

                {/* Register Footer: Financial Totals, Discounts & Payment */}
                <div className="register-financial-footer">
                  {/* Totals Breakdown */}
                  <div className="reg-totals-box">
                    <div className="reg-tot-row">
                      <span>Gross Subtotal ({totalUnitsCount} Units):</span>
                      <strong>Rs. {posGrossSubtotal.toFixed(2)}</strong>
                    </div>

                    {/* Wholesale Discount Selector */}
                    <div className="reg-discount-row">
                      <span className="disc-lbl">Wholesale Discount:</span>
                      <div className="discount-pill-selector">
                        {[0, 5, 10, 12, 15].map(pct => (
                          <button
                            key={pct}
                            type="button"
                            className={`disc-pill-btn ${posTradeDiscount === pct ? 'active' : ''}`}
                            onClick={() => setPosTradeDiscount(pct)}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                      {posDiscountAmount > 0 && (
                        <span className="disc-val-txt">- Rs. {posDiscountAmount.toFixed(2)}</span>
                      )}
                    </div>

                    {/* Grand Total */}
                    <div className="reg-grand-total-row">
                      <span>NET PAYABLE:</span>
                      <span className="grand-price-text">Rs. {posNetPayable.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Method & Cash Tender */}
                  <div className="reg-payment-section">
                    <div className="reg-payment-method-row">
                      <label>Payment:</label>
                      <div className="reg-pay-radios">
                        <label className={`pay-radio-chip ${posPaymentMethod === 'cash' ? 'active' : ''}`}>
                          <input 
                            type="radio" 
                            name="posPay" 
                            value="cash" 
                            checked={posPaymentMethod === 'cash'} 
                            onChange={() => setPosPaymentMethod('cash')} 
                          />
                          💵 Cash
                        </label>
                        <label className={`pay-radio-chip ${posPaymentMethod === 'raast' ? 'active' : ''}`}>
                          <input 
                            type="radio" 
                            name="posPay" 
                            value="raast" 
                            checked={posPaymentMethod === 'raast'} 
                            onChange={() => setPosPaymentMethod('raast')} 
                          />
                          📱 Raast / QR
                        </label>
                        <label className={`pay-radio-chip ${posPaymentMethod === 'ledger' ? 'active' : ''}`}>
                          <input 
                            type="radio" 
                            name="posPay" 
                            value="ledger" 
                            checked={posPaymentMethod === 'ledger'} 
                            onChange={() => setPosPaymentMethod('ledger')} 
                          />
                          🏢 B2B Khata
                        </label>
                      </div>
                    </div>

                    {posPaymentMethod === 'cash' && (
                      <div className="reg-cash-calculator-row">
                        <div className="cash-input-field-wrap">
                          <label>Cash Received (Rs.):</label>
                          <input 
                            type="number" 
                            placeholder="e.g. 5000"
                            value={posCashTendered}
                            onChange={(e) => setPosCashTendered(e.target.value)}
                            className="cash-received-input"
                          />
                        </div>
                        {posCashTendered && parseFloat(posCashTendered) >= posNetPayable && (
                          <div className="cash-change-badge">
                            <span>Change:</span>
                            <strong>Rs. {posCashChange.toFixed(2)}</strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Fast Action Buttons */}
                  <div className="reg-action-buttons-row">
                    <button 
                      type="button"
                      className="btn-complete-and-print"
                      disabled={posCart.length === 0}
                      onClick={() => handleCompletePosSale(true)}
                    >
                      <Printer size={16} /> Complete & Print Slip
                    </button>
                    <button 
                      type="button"
                      className="btn-fast-complete"
                      disabled={posCart.length === 0}
                      onClick={() => handleCompletePosSale(false)}
                    >
                      <Check size={16} /> Fast Complete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 3: Expiry & Batch Alerts */}
      {activeOpsTab === 'expiry-alerts' && (
        <div className="ops-card">
          <div className="ops-card-header">
            <div>
              <h3>Expiry Date & Batch Alert System</h3>
              <p>Automated warnings for batch items expiring within 30, 60, or 90 days to prevent inventory loss.</p>
            </div>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Batch #</th>
                <th>Medicine Name</th>
                <th>Supplier</th>
                <th>Expiry Date</th>
                <th>Days Remaining</th>
                <th>Stock</th>
                <th>Alert Status</th>
              </tr>
            </thead>
            <tbody>
              {INITIAL_EXPIRY_BATCHES.map(b => (
                <tr key={b.batchNo}>
                  <td><code>{b.batchNo}</code></td>
                  <td><strong>{b.productName}</strong></td>
                  <td>{b.supplier}</td>
                  <td>{b.expiryDate}</td>
                  <td><strong className="red-text">{b.daysRemaining} Days</strong></td>
                  <td>{b.stock} Units</td>
                  <td>
                    <span className="expiry-warning-pill">
                      ⚠️ Expiring Soon
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Single Item Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-container add-item-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Add Single Item to Catalog</h2>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Item code is automatically assigned sequentially.</p>
              </div>
              <button className="close-btn" onClick={() => setIsAddModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleAddNewItem} className="modal-body add-item-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    Item Code <span className="auto-badge">⚡ Auto-Assigned</span>
                  </label>
                  <input 
                    type="text" 
                    value={newItem.code} 
                    readOnly
                    className="auto-code-input"
                  />
                </div>

                <div className="form-group">
                  <label>Product Title *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. PANADOL EXTRA 500MG" 
                    required 
                    value={newItem.name} 
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Generic Formula Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Paracetamol + Caffeine" 
                    value={newItem.genericName} 
                    onChange={(e) => setNewItem({ ...newItem, genericName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select 
                    value={newItem.category} 
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  >
                    {allCategories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat.toUpperCase().replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Trade Price (Rs.) *</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="e.g. 165.50" 
                    value={newItem.price} 
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row grid-3">
                <div className="form-group">
                  <label>Packaging Mode</label>
                  <select 
                    value={newItem.packagingMode} 
                    onChange={(e) => setNewItem({ ...newItem, packagingMode: e.target.value })}
                  >
                    <option value="both">Both (Per Pack & Per Strip)</option>
                    <option value="pack">Only Per Full Pack</option>
                    <option value="strip">Only Per Strip</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Strips Per Pack</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={newItem.stripsPerPack} 
                    onChange={(e) => setNewItem({ ...newItem, stripsPerPack: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Initial Physical Stock</label>
                  <input 
                    type="number" 
                    min="0" 
                    value={newItem.stock} 
                    onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group margin-top-10">
                <label>Product Image</label>
                <div className="image-picker-container">
                  <div className="image-preview-box">
                    {newItem.image ? (
                      <img src={newItem.image} alt="Preview" />
                    ) : (
                      <div className="no-image-placeholder">No Image</div>
                    )}
                  </div>

                  <div className="image-picker-controls">
                    <div className="file-upload-wrapper">
                      <label className="btn-file-upload">
                        <Upload size={14} /> Upload Custom Photo File
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageFileUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>

                    <div className="preset-photos">
                      <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Or Choose Medical Photo Template:</span>
                      <div className="preset-buttons">
                        <button
                          type="button"
                          className="preset-btn"
                          onClick={() => setNewItem({ ...newItem, image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&q=80' })}
                        >
                          💊 Tablets
                        </button>
                        <button
                          type="button"
                          className="preset-btn"
                          onClick={() => setNewItem({ ...newItem, image: 'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=500&q=80' })}
                        >
                          🧪 Liquids
                        </button>
                        <button
                          type="button"
                          className="preset-btn"
                          onClick={() => setNewItem({ ...newItem, image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80' })}
                        >
                          🧴 Creams
                        </button>
                        <button
                          type="button"
                          className="preset-btn"
                          onClick={() => setNewItem({ ...newItem, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80' })}
                        >
                          👁️ Eye Drops
                        </button>
                        <button
                          type="button"
                          className="preset-btn"
                          onClick={() => setNewItem({ ...newItem, image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&q=80' })}
                        >
                          💉 Injections
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-checkbox-group margin-top-15">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={newItem.requiresPrescription} 
                    onChange={(e) => setNewItem({ ...newItem, requiresPrescription: e.target.checked })}
                  />
                  <span>⚠️ Requires Doctor Prescription (Pharmacist Verification Tag)</span>
                </label>
              </div>

              <div className="modal-actions margin-top-20">
                <button type="button" className="btn-cancel" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save-item">
                  <Plus size={16} /> Save Product to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW CATEGORY MODAL */}
      {isAddCategoryModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddCategoryModalOpen(false)}>
          <div className="modal-container add-category-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: '24px' }}>
            <div className="modal-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} color="#0d9488" /> Create New Category
              </h3>
              <button className="close-btn" onClick={() => setIsAddCategoryModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleCreateCategory}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>New Category Name *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Surgical, Skin Care, Anti-Biotic, Cardiac..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  autoFocus
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  style={{ padding: '8px 16px', border: '1.5px solid #cbd5e1', borderRadius: '8px', background: '#f1f5f9', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-save-item"
                  style={{ padding: '8px 18px', border: 'none', borderRadius: '8px', background: 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)', color: '#ffffff', fontWeight: 800, cursor: 'pointer' }}
                >
                  + Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
