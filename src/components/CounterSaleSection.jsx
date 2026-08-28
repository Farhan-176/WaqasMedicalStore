import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Printer, Share2, Plus, Minus, Trash2, Check, AlertTriangle, 
  RotateCcw, Sparkles, User, Building2, Clock, ShieldCheck, ChevronDown,
  Package, DollarSign, ArrowRight, Zap, TrendingUp, Layers, HelpCircle,
  FileText, CreditCard, CheckCircle2, AlertCircle
} from 'lucide-react';

export default function CounterSaleSection({ catalog = [], onUpdateCatalog, retailers = [], currentUser }) {
  // Digital Live Clock
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Enrich catalog with rich pharmacy ERP metadata
  const enrichProduct = (p) => {
    const code = (p.code || p.id || '1001').toString();
    let hash = 0;
    for (let i = 0; i < code.length; i++) hash = ((hash << 5) - hash) + code.charCodeAt(i);
    
    const companies = ['MENDOZA LABS', 'GSK PAKISTAN', 'ABBOTT HEALTHCARE', 'SEARLE PHARMA', 'GETZ PHARMA', 'HILTON PHARMA', 'SAMI PHARMACEUTICALS', 'MARTIN DOW'];
    const company = p.company || companies[Math.abs(hash) % companies.length];
    
    const packings = ['120ML Bottle', '60ML Bottle', '10x10 Tablets', '2x10 Tablets', '1x14 Tablets', '100ML Syrup', '30GM Cream', '10 Ampoules'];
    const packing = p.packing || packings[Math.abs(hash) % packings.length];
    
    const godownStock = Math.abs(hash % 180) + 30;
    const stripsPerPack = Number(p.stripsPerPack) || 10;
    const retailPrice = Number(p.price) || 200;
    const tradePrice = Math.round(retailPrice * 0.85 * 100) / 100; // Wholesale Trade Price
    const costPrice = Math.round(tradePrice * 0.88 * 100) / 100; // Purchase Cost
    
    const batchNum = Math.abs(hash % 900) + 100;
    const batchPrefix = ['B', 'S', 'A', 'Y', 'K', 'M'][Math.abs(hash) % 6];
    const expMonth = ((Math.abs(hash) % 12) + 1).toString().padStart(2, '0');
    const expYear = 2026 + (Math.abs(hash) % 3);
    
    return {
      ...p,
      code: p.code || (Math.abs(hash % 9000) + 1000).toString(),
      company,
      packing,
      godownStock,
      stripsPerPack,
      retailPrice,
      tradePrice,
      costPrice,
      batchNo: p.batchNo || `${batchPrefix}${batchNum}`,
      expiryDate: p.expiryDate || `${expMonth}/${expYear}`
    };
  };

  const enrichedCatalog = useMemo(() => {
    return (catalog || []).map(enrichProduct);
  }, [catalog]);

  // Pricing Mode: 'WHOLESALE' (TP Rate) or 'RETAIL' (MRP Rate)
  const [pricingMode, setPricingMode] = useState('WHOLESALE');
  
  // Customer & Invoice Details
  const [invoiceNo, setInvoiceNo] = useState('028078');
  const [invDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [selectedCustomerId, setSelectedCustomerId] = useState('ret-3'); // Default to Waqas Partner
  const [customerOldBalance, setCustomerOldBalance] = useState(2138.00); // Khata balance
  const [salesmanCode] = useState('COUNTER');
  const [gstPercent] = useState(0.00);
  const [offerPercent] = useState(0.00);

  // Active Billing Rows
  const [billRows, setBillRows] = useState([
    {
      id: 'row-1',
      code: '6555',
      name: 'PROVATE LOTION 20ML',
      company: 'MENDOZA LABS',
      packing: '20ML Bottle',
      batchNo: 'B09',
      expiryDate: '08/27',
      fullQty: 2,
      pcsQty: 0,
      stripsPerPack: 1,
      discPercent: 5.00,
      rate: 127.50,
      shopStock: 87,
      godownStock: 140,
      costPrice: 110.00
    },
    {
      id: 'row-2',
      code: '6559',
      name: 'PROVATE-S LOTION',
      company: 'MENDOZA LABS',
      packing: '20ML Bottle',
      batchNo: 'B14',
      expiryDate: '09/27',
      fullQty: 1,
      pcsQty: 0,
      stripsPerPack: 1,
      discPercent: 5.00,
      rate: 174.23,
      shopStock: 45,
      godownStock: 80,
      costPrice: 152.00
    },
    {
      id: 'row-3',
      code: 'B158',
      name: 'RE-PLAT SYP 120ML',
      company: 'SEARLE PHARMA',
      packing: '120ML Syrup',
      batchNo: 'RP02',
      expiryDate: '04/27',
      fullQty: 1,
      pcsQty: 0,
      stripsPerPack: 1,
      discPercent: 4.00,
      rate: 388.98,
      shopStock: 30,
      godownStock: 60,
      costPrice: 340.00
    },
    {
      id: 'row-4',
      code: 'A856',
      name: 'IBERET FOLIC 500 TAB (200s)',
      company: 'ABBOTT HEALTHCARE',
      packing: '10x20 Tablets',
      batchNo: 'IB88',
      expiryDate: '12/26',
      fullQty: 1,
      pcsQty: 0,
      stripsPerPack: 20,
      discPercent: -2.00,
      rate: 323.00,
      shopStock: 62,
      godownStock: 110,
      costPrice: 290.00
    },
    {
      id: 'row-5',
      code: 'Y616',
      name: 'LEPRIDE 25MG TABLET',
      company: 'GETZ PHARMA',
      packing: '2x10 Tablets',
      batchNo: 'LP19',
      expiryDate: '06/27',
      fullQty: 1,
      pcsQty: 0,
      stripsPerPack: 2,
      discPercent: 10.00,
      rate: 280.50,
      shopStock: 18,
      godownStock: 40,
      costPrice: 245.00
    },
    {
      id: 'row-6',
      code: '178',
      name: 'ADVANTAN CREAM LARGE 10GM',
      company: 'BAYER PHARMA',
      packing: '10GM Tube',
      batchNo: 'AD44',
      expiryDate: '10/26',
      fullQty: 1,
      pcsQty: 0,
      stripsPerPack: 1,
      discPercent: 0.00,
      rate: 317.90,
      shopStock: 9,
      godownStock: 25,
      costPrice: 285.00
    },
    {
      id: 'row-7',
      code: '6910',
      name: 'RISEK (SACHET) 20MG',
      company: 'GETZ PHARMA',
      packing: '10 Sachets',
      batchNo: 'RS09',
      expiryDate: '03/27',
      fullQty: 2,
      pcsQty: 0,
      stripsPerPack: 10,
      discPercent: -2.00,
      rate: 207.48,
      shopStock: 55,
      godownStock: 90,
      costPrice: 182.00
    },
    {
      id: 'row-8',
      code: '9225',
      name: 'HYDRILIN SYRUP 120ML',
      company: 'SEARLE PHARMA',
      packing: '120ML Bottle',
      batchNo: 'HD71',
      expiryDate: '11/26',
      fullQty: 2,
      pcsQty: 0,
      stripsPerPack: 1,
      discPercent: 6.00,
      rate: 148.76,
      shopStock: 74,
      godownStock: 150,
      costPrice: 128.00
    },
    {
      id: 'row-9',
      code: '7414',
      name: 'SIROLINE SYRUP 120ML',
      company: 'MENDOZA LABS',
      packing: '120ML Bottle',
      batchNo: 'S12',
      expiryDate: '11/26',
      fullQty: 3,
      pcsQty: 0,
      stripsPerPack: 1,
      discPercent: 10.00,
      rate: 131.75,
      shopStock: 87,
      godownStock: 140,
      costPrice: 115.00
    }
  ]);

  // Selected Active Row for Inspector HUD
  const [selectedRowIndex, setSelectedRowIndex] = useState(8);
  
  // Search & Autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchInputRef = useRef(null);
  const cashInputRef = useRef(null);

  // Settlement Inputs
  const [cashReceived, setCashReceived] = useState('7000.00');
  const [saveBannerMsg, setSaveBannerMsg] = useState('');

  // Selected Customer details
  const currentCustomer = useMemo(() => {
    const found = retailers.find(r => r.id === selectedCustomerId || r._id === selectedCustomerId);
    if (found) return found;
    return {
      id: 'cust-7',
      name: 'WAQAS MEDICAL STORE',
      username: '7',
      area: 'Main Wholesale Bazar, Karachi',
      licenseNo: '04-DL-KAR-2024'
    };
  }, [retailers, selectedCustomerId]);

  // Compute Line Net Amount
  const computeRowNet = (row) => {
    const full = Number(row.fullQty) || 0;
    const pcs = Number(row.pcsQty) || 0;
    const strips = Number(row.stripsPerPack) || 1;
    const boxRate = Number(row.rate) || 0;
    const pcsRate = boxRate / strips;
    const gross = (full * boxRate) + (pcs * pcsRate);
    const disc = Number(row.discPercent) || 0;
    const net = gross * (1 - (disc / 100));
    return Math.round(net * 100) / 100;
  };

  // Compute Financial Totals
  const billTotal = useMemo(() => {
    return billRows.reduce((sum, row) => sum + computeRowNet(row), 0);
  }, [billRows]);

  const totalDue = Math.round((billTotal + customerOldBalance) * 100) / 100;
  const cashRecvNum = parseFloat(cashReceived) || 0;
  const netBalance = Math.round((totalDue - cashRecvNum) * 100) / 100;
  const totalItemsCount = billRows.reduce((sum, r) => sum + (Number(r.fullQty) || 0) + (Number(r.pcsQty) || 0), 0);

  // Currently Selected Row Inspector Details
  const activeInspectorItem = useMemo(() => {
    if (billRows.length === 0) return null;
    const idx = Math.min(Math.max(0, selectedRowIndex), billRows.length - 1);
    return billRows[idx];
  }, [billRows, selectedRowIndex]);

  // Margin calculation for selected item
  const activeItemMargin = useMemo(() => {
    if (!activeInspectorItem) return '0.0%';
    const rate = activeInspectorItem.rate || 1;
    const cost = activeInspectorItem.costPrice || (rate * 0.88);
    const margin = ((rate - cost) / rate) * 100;
    return `${margin.toFixed(1)}%`;
  }, [activeInspectorItem]);

  // Filtered search list
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return enrichedCatalog.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.code.toLowerCase().includes(q) ||
      (p.genericName && p.genericName.toLowerCase().includes(q)) ||
      (p.company && p.company.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [enrichedCatalog, searchQuery]);

  // Add Item to Bill
  const handleAddProductToBill = (product) => {
    const rate = pricingMode === 'WHOLESALE' ? product.tradePrice : product.retailPrice;
    const newRow = {
      id: `row-${Date.now()}`,
      code: product.code,
      name: product.name,
      company: product.company,
      packing: product.packing,
      batchNo: product.batchNo,
      expiryDate: product.expiryDate,
      fullQty: 1,
      pcsQty: 0,
      stripsPerPack: product.stripsPerPack,
      discPercent: pricingMode === 'WHOLESALE' ? 5.00 : 0.00,
      rate: rate,
      shopStock: product.stock || 50,
      godownStock: product.godownStock || 120,
      costPrice: product.costPrice
    };

    setBillRows(prev => [...prev, newRow]);
    setSelectedRowIndex(billRows.length);
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  // Update In-Row Quantity / Discount / Rate
  const handleUpdateRowField = (index, field, value) => {
    setBillRows(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
  };

  // Adjust Qty with Stepper Buttons (+ / -)
  const handleStepQty = (index, field, delta) => {
    setBillRows(prev => {
      const updated = [...prev];
      const current = Number(updated[index][field]) || 0;
      const next = Math.max(0, current + delta);
      updated[index] = {
        ...updated[index],
        [field]: next
      };
      return updated;
    });
  };

  // Remove Row
  const handleRemoveRow = (index) => {
    setBillRows(prev => prev.filter((_, i) => i !== index));
    if (selectedRowIndex >= index && selectedRowIndex > 0) {
      setSelectedRowIndex(selectedRowIndex - 1);
    }
  };

  // New Sale Reset
  const handleNewSale = () => {
    setBillRows([]);
    setInvoiceNo(Math.floor(10000 + Math.random() * 90000).toString());
    setCashReceived('0.00');
    setSaveBannerMsg('✨ New Invoice Initialized');
    setTimeout(() => setSaveBannerMsg(''), 2500);
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  // Toggle Pricing Mode
  const handleTogglePricingMode = (mode) => {
    const nextMode = mode || (pricingMode === 'WHOLESALE' ? 'RETAIL' : 'WHOLESALE');
    setPricingMode(nextMode);
    setBillRows(prev => prev.map(row => {
      const catMatch = enrichedCatalog.find(c => c.code === row.code || c.name === row.name);
      if (catMatch) {
        return {
          ...row,
          rate: nextMode === 'WHOLESALE' ? catMatch.tradePrice : catMatch.retailPrice
        };
      }
      return row;
    }));
  };

  // 80mm Thermal Print
  const handlePrint80mm = () => {
    const slipWin = window.open('', '_blank');
    slipWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales Invoice - #${invoiceNo}</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body { font-family: 'Courier New', Courier, monospace; width: 340px; margin: 0 auto; padding: 10px; color: #000; font-size: 11px; }
            .hdr { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 6px; }
            .hdr h2 { margin: 0; font-size: 16px; font-weight: bold; }
            .hdr p { margin: 1px 0; font-size: 9px; }
            .meta { margin: 6px 0; font-size: 10px; }
            .meta-table, .item-table, .tot-table { width: 100%; border-collapse: collapse; }
            .item-table th { border-bottom: 1px solid #000; border-top: 1px solid #000; text-align: left; padding: 3px 0; font-size: 9.5px; }
            .item-table td { padding: 3px 0; font-size: 9.5px; vertical-align: top; }
            .r { text-align: right; }
            .c { text-align: center; }
            .tot-table td { padding: 2px 0; }
            .grand { font-size: 13px; font-weight: bold; border-top: 1px solid #000; border-bottom: 1px solid #000; }
            .ftr { text-align: center; margin-top: 10px; font-size: 8.5px; border-top: 1px dashed #000; padding-top: 5px; }
          </style>
        </head>
        <body>
          <div class="hdr">
            <h2>WAQAS MEDICAL STORE</h2>
            <p>DRAP Lic # 04-DL-KAR-2024 &bull; NTN: 9814230-1</p>
            <p>Main Wholesale Market, Saddar / Karachi &bull; Tel: +92 300 1234567</p>
            <p><strong>SALES INVOICE (${pricingMode})</strong></p>
          </div>
          <div class="meta">
            <table class="meta-table">
              <tr><td><strong>Inv #:</strong> ${invoiceNo}</td><td class="r"><strong>Date:</strong> ${invDate}</td></tr>
              <tr><td><strong>Cust:</strong> [${currentCustomer.username}] ${currentCustomer.name}</td><td class="r"><strong>Time:</strong> ${currentTime}</td></tr>
              <tr><td><strong>Salesman:</strong> ${salesmanCode}</td><td class="r"><strong>Items:</strong> ${billRows.length}</td></tr>
            </table>
          </div>
          <table class="item-table">
            <thead>
              <tr>
                <th style="width: 44%;">Item / Batch</th>
                <th class="c" style="width: 14%;">Qty</th>
                <th class="r" style="width: 18%;">Rate</th>
                <th class="r" style="width: 24%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${billRows.map(r => {
                const qtyText = r.pcsQty > 0 ? `${r.fullQty}F+${r.pcsQty}P` : `${r.fullQty}`;
                return `
                  <tr>
                    <td>
                      <div><strong>${r.name}</strong></div>
                      <div style="font-size: 8px; color: #333;">B:${r.batchNo} Exp:${r.expiryDate} ${r.discPercent !== 0 ? `(D:${r.discPercent}%)` : ''}</div>
                    </td>
                    <td class="c">${qtyText}</td>
                    <td class="r">${Number(r.rate).toFixed(2)}</td>
                    <td class="r">${computeRowNet(r).toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>
          <table class="tot-table">
            <tr><td><strong>CURRENT BILL TOTAL:</strong></td><td class="r"><strong>Rs. ${billTotal.toFixed(2)}</strong></td></tr>
            ${customerOldBalance > 0 ? `<tr><td>OLD BALANCE (UDHAAR):</td><td class="r">Rs. ${customerOldBalance.toFixed(2)}</td></tr>` : ''}
            <tr class="grand"><td>TOTAL DUE:</td><td class="r">Rs. ${totalDue.toFixed(2)}</td></tr>
            <tr><td>CASH RECEIVED:</td><td class="r">Rs. ${cashRecvNum.toFixed(2)}</td></tr>
            <tr><td><strong>${netBalance >= 0 ? 'NET UDHAAR BALANCE:' : 'CHANGE RETURNED:'}</strong></td><td class="r"><strong>Rs. ${Math.abs(netBalance).toFixed(2)}</strong></td></tr>
          </table>
          <div class="ftr">
            <p>*** Software Verified Wholesale Tax Invoice ***</p>
            <p>Goods once sold can only be returned within 3 days with invoice.</p>
            <p><strong>THANK YOU FOR YOUR BUSINESS</strong></p>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    slipWin.document.close();
  };

  // WhatsApp Share
  const handleShareWhatsApp = () => {
    let msg = `*WAQAS MEDICAL STORE - INVOICE #${invoiceNo}*\n`;
    msg += `📅 *Date:* ${invDate} ${currentTime}\n`;
    msg += `👤 *Customer:* [${currentCustomer.username}] ${currentCustomer.name}\n`;
    msg += `--------------------------------\n`;
    billRows.forEach(r => {
      const q = r.pcsQty > 0 ? `${r.fullQty} Full + ${r.pcsQty} Pcs` : `${r.fullQty} Full`;
      msg += `• *${r.name}* (Batch: ${r.batchNo})\n  Qty: ${q} @ Rs. ${Number(r.rate).toFixed(2)} = Rs. ${computeRowNet(r).toFixed(2)}\n`;
    });
    msg += `--------------------------------\n`;
    msg += `*Current Bill:* Rs. ${billTotal.toFixed(2)}\n`;
    if (customerOldBalance > 0) msg += `*Old Balance:* Rs. ${customerOldBalance.toFixed(2)}\n`;
    msg += `*Total Due:* Rs. ${totalDue.toFixed(2)}\n`;
    msg += `*Cash Paid:* Rs. ${cashRecvNum.toFixed(2)}\n`;
    msg += `*${netBalance >= 0 ? 'Remaining Balance (Udhaar)' : 'Change'}:* Rs. ${Math.abs(netBalance).toFixed(2)}\n`;
    msg += `--------------------------------\n`;
    msg += `Thank you! Waqas Medical Store Karachi`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2' || e.key === 'F9' || (e.key === '/' && document.activeElement.tagName !== 'INPUT')) {
        e.preventDefault();
        if (searchInputRef.current) searchInputRef.current.focus();
      }
      else if (e.key === 'F3') {
        e.preventDefault();
        handleNewSale();
      }
      else if (e.key === 'F6') {
        e.preventDefault();
        handleTogglePricingMode();
      }
      else if (e.key === 'F10') {
        e.preventDefault();
        handlePrint80mm();
      }
      else if (e.key === 'F12') {
        e.preventDefault();
        handleShareWhatsApp();
      }
      else if (e.key === 'ArrowDown' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        setSelectedRowIndex(prev => Math.min(billRows.length - 1, prev + 1));
      }
      else if (e.key === 'ArrowUp' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        setSelectedRowIndex(prev => Math.max(0, prev - 1));
      }
      else if (e.key === 'Escape') {
        setShowSearchDropdown(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [billRows, pricingMode, invoiceNo, totalDue, cashReceived]);

  return (
    <div className="web-erp-terminal-container">
      
      {/* SUCCESS / ACTION BANNER */}
      {saveBannerMsg && (
        <div className="web-erp-status-toast">
          <CheckCircle2 size={16} /> {saveBannerMsg}
        </div>
      )}

      {/* =========================================================================
          MODERN WEB ERP TOP HEADER CARD
          ========================================================================= */}
      <div className="web-erp-header-card">
        <div className="web-hdr-left">
          <div className="web-terminal-brand">
            <div className="brand-icon-wrap">
              <Zap size={18} />
            </div>
            <div>
              <div className="brand-title-wrap">
                <span className="brand-title">SALES INVOICE EDITING</span>
                <span className="live-status-dot"></span>
              </div>
              <div className="brand-meta">
                <span className="inv-badge">Inv #{invoiceNo}</span>
                <span className="date-badge"><Clock size={12} /> {invDate} &bull; {currentTime}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="web-hdr-center">
          <div className="cust-selector-wrapper">
            <span className="cust-lbl"><User size={13} /> Customer:</span>
            <div className="cust-select-box">
              <select 
                className="web-cust-select"
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  if (e.target.value === 'ret-1') setCustomerOldBalance(4520.00);
                  else if (e.target.value === 'ret-2') setCustomerOldBalance(1200.00);
                  else setCustomerOldBalance(2138.00);
                }}
              >
                <option value="ret-3">[ 7 ] WAQAS MEDICAL STORE (Main Bazar) &bull; Credit: Rs. 2,138.00</option>
                <option value="ret-1">[ 12 ] ALI MEDICOS & PHARMACY &bull; Credit: Rs. 4,520.00</option>
                <option value="ret-2">[ 24 ] CITY CARE CLINIC & MED &bull; Credit: Rs. 1,200.00</option>
                <option value="walkin">[ 0 ] COUNTER CASH WALK-IN &bull; Credit: Rs. 0.00</option>
              </select>
              <ChevronDown size={14} className="select-arrow-icon" />
            </div>
          </div>
        </div>

        <div className="web-hdr-right">
          <div className="mode-toggle-group">
            <span className="mode-lbl">Mode [F6]:</span>
            <button 
              type="button" 
              className={`web-mode-btn ${pricingMode === 'WHOLESALE' ? 'is-wholesale' : 'is-retail'}`}
              onClick={() => handleTogglePricingMode()}
              title="Press F6 to toggle Wholesale TP vs Retail MRP"
            >
              {pricingMode === 'WHOLESALE' ? '⭐ Wholesale (TP)' : '🏷️ Retail (MRP)'}
            </button>
          </div>

          <div className="items-counter-chip">
            <Package size={13} />
            <span><strong>{billRows.length}</strong> Lines ({totalItemsCount} Units)</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RAPID OMNI-SEARCH & BARCODE SCANNER TOOLBAR
          ========================================================================= */}
      <div className="web-erp-search-toolbar">
        <div className="search-input-wrapper">
          <Search size={17} className="search-icon-left" />
          <input 
            ref={searchInputRef}
            type="text" 
            className="web-erp-search-input"
            placeholder="Scan barcode or type medicine name / generic / code (Press ENTER to quick-add top item)... [F9]"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchResults.length > 0) {
                e.preventDefault();
                handleAddProductToBill(searchResults[0]);
              }
            }}
          />
          {searchQuery && (
            <button className="btn-clear-search-web" onClick={() => setSearchQuery('')}>×</button>
          )}
          <span className="search-shortcut-pill">Press / or F9</span>
        </div>

        {/* Autocomplete Dropdown */}
        {showSearchDropdown && searchResults.length > 0 && (
          <div className="web-search-dropdown-menu">
            <div className="search-dropdown-header">
              <span>Matching Medicines ({searchResults.length})</span>
              <small>Click or press ⏎ Enter to Add</small>
            </div>
            <div className="search-dropdown-list">
              {searchResults.map((p, idx) => (
                <div 
                  key={p.id || idx} 
                  className="search-drop-item"
                  onClick={() => handleAddProductToBill(p)}
                >
                  <div className="item-col-code">
                    <code>{p.code}</code>
                  </div>
                  <div className="item-col-info">
                    <strong className="item-name">{p.name}</strong>
                    <span className="item-sub">{p.company} &bull; {p.packing} &bull; Exp: {p.expiryDate}</span>
                  </div>
                  <div className="item-col-stock">
                    <span className="stock-counter">Shop: <strong>{p.stock || 50}</strong></span>
                    <span className="stock-godown">Godown: {p.godownStock || 120}</span>
                  </div>
                  <div className="item-col-price">
                    <strong>Rs. {pricingMode === 'WHOLESALE' ? p.tradePrice.toFixed(2) : p.retailPrice.toFixed(2)}</strong>
                    <span className="add-action-tag">+ Add [Enter]</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          HIGH-DENSITY ERP DATA GRID TABLE
          ========================================================================= */}
      <div className="web-erp-grid-card">
        <div className="table-responsive-container">
          <table className="web-erp-table">
            <thead>
              <tr className="th-top-row">
                <th style={{ width: '65px' }}>CODE</th>
                <th>ITEM NAME & FORMULA [F9]</th>
                <th style={{ width: '130px' }}>BATCH / EXP [F10]</th>
                <th style={{ width: '95px', textAlign: 'center' }}>FULL (BOX)</th>
                <th style={{ width: '95px', textAlign: 'center' }}>PCS (UNIT)</th>
                <th style={{ width: '80px', textAlign: 'center' }}>DISC % [^F9]</th>
                <th style={{ width: '100px', textAlign: 'right' }}>RATE ({pricingMode === 'WHOLESALE' ? 'TP' : 'MRP'})</th>
                <th style={{ width: '110px', textAlign: 'right' }}>NET TOTAL</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {billRows.length > 0 ? (
                billRows.map((row, index) => {
                  const isSelected = selectedRowIndex === index;
                  const lineNet = computeRowNet(row);
                  const isNearExpiry = row.expiryDate && (row.expiryDate.includes('/26') || row.expiryDate.includes('/25'));
                  const isLowStock = row.shopStock < 20;

                  return (
                    <tr 
                      key={row.id || index}
                      className={`web-table-row ${isSelected ? 'is-selected-row' : ''}`}
                      onClick={() => setSelectedRowIndex(index)}
                    >
                      {/* Code */}
                      <td>
                        <span className="web-code-chip">{row.code}</span>
                      </td>

                      {/* Name */}
                      <td>
                        <div className="med-title-group">
                          <strong className="med-main-name">{row.name}</strong>
                          <div className="med-sub-meta">
                            <span className="med-comp-tag">{row.company}</span>
                            {isLowStock && <span className="low-stock-warn">⚠️ Stock: {row.shopStock}</span>}
                          </div>
                        </div>
                      </td>

                      {/* Batch & Expiry */}
                      <td>
                        <div className="batch-exp-group">
                          <span className="batch-chip">{row.batchNo}</span>
                          <span className={`exp-chip ${isNearExpiry ? 'is-near-exp' : ''}`}>
                            {row.expiryDate}
                          </span>
                        </div>
                      </td>

                      {/* FULL / BOX Quantity Stepper */}
                      <td>
                        <div className="qty-stepper-box">
                          <button 
                            type="button" 
                            className="qty-step-btn"
                            onClick={(e) => { e.stopPropagation(); handleStepQty(index, 'fullQty', -1); }}
                          >
                            -
                          </button>
                          <input 
                            type="number" 
                            min="0"
                            className="web-qty-input full-box-input"
                            value={row.fullQty}
                            onChange={(e) => handleUpdateRowField(index, 'fullQty', parseInt(e.target.value) || 0)}
                          />
                          <button 
                            type="button" 
                            className="qty-step-btn"
                            onClick={(e) => { e.stopPropagation(); handleStepQty(index, 'fullQty', 1); }}
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* PCS / Loose Unit Stepper */}
                      <td>
                        <div className="qty-stepper-box">
                          <button 
                            type="button" 
                            className="qty-step-btn"
                            onClick={(e) => { e.stopPropagation(); handleStepQty(index, 'pcsQty', -1); }}
                          >
                            -
                          </button>
                          <input 
                            type="number" 
                            min="0"
                            className="web-qty-input pcs-unit-input"
                            value={row.pcsQty}
                            onChange={(e) => handleUpdateRowField(index, 'pcsQty', parseInt(e.target.value) || 0)}
                          />
                          <button 
                            type="button" 
                            className="qty-step-btn"
                            onClick={(e) => { e.stopPropagation(); handleStepQty(index, 'pcsQty', 1); }}
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Discount % */}
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="number" 
                          step="0.5"
                          className="web-disc-input"
                          value={row.discPercent}
                          onChange={(e) => handleUpdateRowField(index, 'discPercent', parseFloat(e.target.value) || 0)}
                        />
                      </td>

                      {/* Rate */}
                      <td style={{ textAlign: 'right' }}>
                        <span className="web-rate-val">Rs. {Number(row.rate).toFixed(2)}</span>
                      </td>

                      {/* Net Total */}
                      <td style={{ textAlign: 'right' }}>
                        <strong className="web-net-val">Rs. {lineNet.toFixed(2)}</strong>
                      </td>

                      {/* Delete */}
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          type="button" 
                          className="btn-web-del-row"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveRow(index);
                          }}
                          title="Remove row (Del)"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="web-empty-table-state">
                    <Package size={36} color="#64748b" />
                    <h4>Register is Empty</h4>
                    <p>Press <strong>[F9]</strong> or type medicine name in the search bar above to start billing</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          DUAL BOTTOM HUD CARDS: ITEM INSPECTOR (Left) & FINANCIAL KHATA (Right)
          ========================================================================= */}
      <div className="web-erp-bottom-grid">
        
        {/* LEFT HUD: Contextual Item Inspector */}
        <div className="web-hud-card inspector-card">
          <div className="hud-card-header">
            <div className="hud-header-title">
              <Package size={15} color="#38bdf8" />
              <span>ITEM DETAILS: <strong>{activeInspectorItem ? activeInspectorItem.name : 'NO ROW SELECTED'}</strong></span>
            </div>
            {activeInspectorItem && (
              <span className="hud-code-tag">Code: {activeInspectorItem.code}</span>
            )}
          </div>

          {activeInspectorItem ? (
            <div className="hud-card-body inspector-body">
              <div className="inspector-specs-grid">
                <div className="spec-tile">
                  <span className="spec-k">PACKING</span>
                  <strong className="spec-v cyan-text">{activeInspectorItem.packing}</strong>
                </div>
                <div className="spec-tile">
                  <span className="spec-k">MANUFACTURER</span>
                  <strong className="spec-v">{activeInspectorItem.company}</strong>
                </div>
                <div className="spec-tile">
                  <span className="spec-k">SHOP STOCK</span>
                  <strong className="spec-v green-text">{activeInspectorItem.shopStock} BOXES ({activeInspectorItem.stripsPerPack * activeInspectorItem.shopStock} PCS)</strong>
                </div>
                <div className="spec-tile">
                  <span className="spec-k">GODOWN WAREHOUSE</span>
                  <strong className="spec-v">{activeInspectorItem.godownStock} BOXES</strong>
                </div>
                <div className="spec-tile">
                  <span className="spec-k">FEFO BATCH</span>
                  <strong className="spec-v amber-text">{activeInspectorItem.batchNo} (Exp: {activeInspectorItem.expiryDate})</strong>
                </div>
                <div className="spec-tile">
                  <span className="spec-k">COST & MARGIN [F12]</span>
                  <strong className="spec-v purple-text">TP Rs. {activeInspectorItem.costPrice.toFixed(2)} &bull; {activeItemMargin} Margin</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="inspector-empty-prompt">
              <span>Select any line item in the table above to view real-time batch, packing, and godown stock</span>
            </div>
          )}
        </div>

        {/* RIGHT HUD: Financial Settlement & Khata */}
        <div className="web-hud-card settlement-card">
          <div className="hud-card-header">
            <div className="hud-header-title">
              <CreditCard size={15} color="#10b981" />
              <span>FINANCIAL SETTLEMENT & KHATA BALANCE</span>
            </div>
            <span className="hud-cust-badge">{currentCustomer.name}</span>
          </div>

          <div className="hud-card-body settlement-body">
            <div className="settlement-rows-list">
              <div className="settle-line">
                <span className="s-lbl">Gross Bill Total:</span>
                <strong className="s-val">Rs. {billTotal.toFixed(2)}</strong>
              </div>

              <div className="settle-line">
                <span className="s-lbl">Previous Khata Balance:</span>
                <strong className="s-val red-text">+ Rs. {customerOldBalance.toFixed(2)}</strong>
              </div>

              <div className="settle-line total-due-line">
                <span className="s-lbl bold">TOTAL DUE PAYABLE:</span>
                <strong className="s-val due-highlight">Rs. {totalDue.toFixed(2)}</strong>
              </div>

              <div className="settle-line cash-tender-line">
                <span className="s-lbl">Cash Received:</span>
                <div className="cash-input-field-group">
                  <span className="currency-tag">Rs.</span>
                  <input 
                    ref={cashInputRef}
                    type="number" 
                    className="web-cash-tender-input"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                  />
                  <button 
                    type="button" 
                    className="btn-exact-amount"
                    onClick={() => setCashReceived(totalDue.toFixed(2))}
                  >
                    Exact
                  </button>
                </div>
              </div>

              <div className="settle-line net-balance-line">
                <span className="s-lbl bold">
                  {netBalance >= 0 ? 'Net Remaining Balance (Udhaar):' : 'Change to Return:'}
                </span>
                <strong className={`s-val final-balance ${netBalance >= 0 ? 'is-debt' : 'is-change'}`}>
                  Rs. {Math.abs(netBalance).toFixed(2)}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODERN WEB BOTTOM FUNCTION KEY HOTBAR
          ========================================================================= */}
      <div className="web-erp-hotbar">
        <div className="hotbar-actions-left">
          <button type="button" className="web-fkey-btn" onClick={handleNewSale}>
            <span className="fkey-pill">F3</span>
            <span>New Sale</span>
          </button>

          <button type="button" className="web-fkey-btn" onClick={() => handleTogglePricingMode()}>
            <span className="fkey-pill">F6</span>
            <span>{pricingMode === 'WHOLESALE' ? 'Retail MRP' : 'Wholesale TP'}</span>
          </button>

          <button type="button" className="web-fkey-btn" onClick={() => searchInputRef.current && searchInputRef.current.focus()}>
            <span className="fkey-pill">F9</span>
            <span>Search Item</span>
          </button>
        </div>

        <div className="hotbar-actions-right">
          <button type="button" className="web-fkey-btn print-action-btn" onClick={handlePrint80mm}>
            <span className="fkey-pill">F10</span>
            <Printer size={14} />
            <span>Print 80mm Slip</span>
          </button>

          <button type="button" className="web-fkey-btn whatsapp-action-btn" onClick={handleShareWhatsApp}>
            <span className="fkey-pill">F12</span>
            <Share2 size={14} />
            <span>WhatsApp Bill</span>
          </button>

          <button 
            type="button" 
            className="web-fkey-btn delete-action-btn"
            disabled={billRows.length === 0}
            onClick={() => handleRemoveRow(selectedRowIndex)}
          >
            <span className="fkey-pill">Del</span>
            <Trash2 size={14} />
            <span>Delete Line</span>
          </button>
        </div>
      </div>
    </div>
  );
}
