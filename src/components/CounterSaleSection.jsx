import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Printer, Share2, Plus, Minus, Trash2, Check, AlertTriangle, 
  RotateCcw, Sparkles, User, Building2, Clock, ShieldCheck, ChevronDown,
  Package, DollarSign, ArrowRight, Zap, TrendingUp, Layers, HelpCircle,
  FileText, CreditCard, CheckCircle2, AlertCircle, PauseCircle, PlayCircle,
  HardDrive, Usb, Cpu, X, Tag, ShoppingCart, RefreshCw
} from 'lucide-react';

export default function CounterSaleSection({ catalog = [], onUpdateCatalog, retailers = [], currentUser }) {
  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio Synthesizer Beep Feedback
  const playBeep = (freq = 880, dur = 80) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur / 1000);
    } catch (e) {}
  };

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
      barcode: p.barcode || p.code || (Math.abs(hash % 900000000000) + 100000000000).toString(),
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
  
  // Invoice & Customer
  const [invoiceNo, setInvoiceNo] = useState('028078');
  const [invDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [selectedCustomerId, setSelectedCustomerId] = useState('ret-3');
  const [customerOldBalance, setCustomerOldBalance] = useState(2138.00);

  // Active Bill Rows
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
      id: 'row-5',
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

  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchInputRef = useRef(null);

  // Settlement Inputs
  const [cashReceived, setCashReceived] = useState('2000.00');
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  // Parked Drafts
  const [parkedBills, setParkedBills] = useState(() => {
    try {
      const saved = localStorage.getItem('waqas_pos_parked_bills');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [showParkedModal, setShowParkedModal] = useState(false);

  const saveParkedBills = (bills) => {
    setParkedBills(bills);
    try {
      localStorage.setItem('waqas_pos_parked_bills', JSON.stringify(bills));
    } catch (e) {}
  };

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

  // Compute Line Net
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

  // Financial Totals
  const billTotal = useMemo(() => {
    return billRows.reduce((sum, row) => sum + computeRowNet(row), 0);
  }, [billRows]);

  const totalDue = Math.round((billTotal + customerOldBalance) * 100) / 100;
  const cashRecvNum = parseFloat(cashReceived) || 0;
  const netBalance = Math.round((totalDue - cashRecvNum) * 100) / 100;
  const totalItemsCount = billRows.reduce((sum, r) => sum + (Number(r.fullQty) || 0) + (Number(r.pcsQty) || 0), 0);

  // Active Selected Item for Details
  const activeItem = useMemo(() => {
    if (billRows.length === 0) return null;
    const idx = Math.min(Math.max(0, selectedRowIndex), billRows.length - 1);
    return billRows[idx];
  }, [billRows, selectedRowIndex]);

  // Search Results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return enrichedCatalog.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.code.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.genericName && p.genericName.toLowerCase().includes(q)) ||
      (p.company && p.company.toLowerCase().includes(q))
    ).slice(0, 7);
  }, [enrichedCatalog, searchQuery]);

  const triggerToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 2500);
  };

  // Add Item to Bill
  const handleAddProduct = (product, isScan = false) => {
    const existingIndex = billRows.findIndex(r => r.code === product.code || r.name === product.name);
    
    if (existingIndex !== -1 && isScan) {
      setBillRows(prev => {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          fullQty: (Number(updated[existingIndex].fullQty) || 0) + 1
        };
        return updated;
      });
      setSelectedRowIndex(existingIndex);
      triggerToast(`+1 Box: ${product.name}`, 'info');
      return;
    }

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

    setBillRows(prev => [newRow, ...prev]);
    setSelectedRowIndex(0);
    setSearchQuery('');
    setShowSearchDropdown(false);
    triggerToast(`Added: ${product.name}`);
  };

  const handleUpdateQty = (index, field, value) => {
    setBillRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: Math.max(0, parseInt(value) || 0) };
      return updated;
    });
  };

  const handleStepQty = (index, field, delta) => {
    setBillRows(prev => {
      const updated = [...prev];
      const current = Number(updated[index][field]) || 0;
      updated[index] = { ...updated[index], [field]: Math.max(0, current + delta) };
      return updated;
    });
  };

  const handleRemoveRow = (index) => {
    setBillRows(prev => prev.filter((_, i) => i !== index));
    if (selectedRowIndex >= index && selectedRowIndex > 0) {
      setSelectedRowIndex(selectedRowIndex - 1);
    }
  };

  const handleNewSale = () => {
    setBillRows([]);
    setInvoiceNo(Math.floor(10000 + Math.random() * 90000).toString());
    setCashReceived('0.00');
    triggerToast('New Sale Initialized');
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const handleTogglePricingMode = () => {
    const nextMode = pricingMode === 'WHOLESALE' ? 'RETAIL' : 'WHOLESALE';
    setPricingMode(nextMode);
    setBillRows(prev => prev.map(row => {
      const match = enrichedCatalog.find(c => c.code === row.code || c.name === row.name);
      if (match) {
        return { ...row, rate: nextMode === 'WHOLESALE' ? match.tradePrice : match.retailPrice };
      }
      return row;
    }));
    triggerToast(`Pricing: ${nextMode === 'WHOLESALE' ? 'Wholesale (TP)' : 'Retail (MRP)'}`, 'info');
  };

  // Park Bill
  const handleParkBill = () => {
    if (billRows.length === 0) {
      triggerToast('No items to hold', 'warning');
      return;
    }
    const newPark = {
      id: `PARK-${Date.now()}`,
      invoiceNo,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      customerName: currentCustomer.name,
      customerId: selectedCustomerId,
      customerOldBalance,
      pricingMode,
      billRows: [...billRows],
      billTotal,
      totalDue,
      cashReceived,
      itemCount: billRows.length
    };
    saveParkedBills([newPark, ...parkedBills]);
    setBillRows([]);
    setInvoiceNo(Math.floor(10000 + Math.random() * 90000).toString());
    setCashReceived('0.00');
    playBeep(640, 100);
    triggerToast(`Bill #${newPark.invoiceNo} Parked on Hold`, 'success');
  };

  const handleRecallBill = (parkItem) => {
    saveParkedBills(parkedBills.filter(p => p.id !== parkItem.id));
    setInvoiceNo(parkItem.invoiceNo);
    setSelectedCustomerId(parkItem.customerId || 'ret-3');
    setCustomerOldBalance(parkItem.customerOldBalance || 0);
    setPricingMode(parkItem.pricingMode || 'WHOLESALE');
    setBillRows(parkItem.billRows || []);
    setCashReceived(parkItem.cashReceived || '0.00');
    setSelectedRowIndex(0);
    setShowParkedModal(false);
    playBeep(880, 100);
    triggerToast(`Recalled Bill #${parkItem.invoiceNo}`);
  };

  // Direct Print 80mm
  const handlePrintReceipt = () => {
    const slipWin = window.open('', '_blank');
    if (!slipWin) return;
    slipWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${invoiceNo}</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace; width: 320px; margin: 0 auto; padding: 12px; color: #000; font-size: 11px; }
            .hdr { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
            .hdr h2 { margin: 0; font-size: 16px; font-weight: 800; }
            .hdr p { margin: 2px 0; font-size: 10px; color: #333; }
            .meta { margin-bottom: 8px; font-size: 10.5px; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
            .table th { border-bottom: 1px solid #000; text-align: left; padding: 4px 0; font-size: 10px; }
            .table td { padding: 4px 0; font-size: 10px; vertical-align: top; }
            .tot { width: 100%; border-top: 1px dashed #000; padding-top: 6px; }
            .tot-row { display: flex; justify-content: space-between; margin: 2px 0; }
            .grand { font-weight: 800; font-size: 13px; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 4px 0; margin: 4px 0; }
            .ftr { text-align: center; margin-top: 12px; font-size: 9px; color: #555; }
          </style>
        </head>
        <body>
          <div class="hdr">
            <h2>WAQAS MEDICAL STORE</h2>
            <p>DRAP Lic: 04-DL-KAR-2024 &bull; NTN: 9814230-1</p>
            <p>Main Wholesale Market, Saddar Karachi</p>
            <p><strong>SALES INVOICE (${pricingMode})</strong></p>
          </div>
          <div class="meta">
            <div><strong>Inv #:</strong> ${invoiceNo} &nbsp;|&nbsp; <strong>Date:</strong> ${invDate}</div>
            <div><strong>Customer:</strong> [${currentCustomer.username}] ${currentCustomer.name}</div>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Rate</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${billRows.map(r => `
                <tr>
                  <td><strong>${r.name}</strong><br><small style="color: #666;">B:${r.batchNo} Exp:${r.expiryDate}</small></td>
                  <td style="text-align: center;">${r.fullQty}F${r.pcsQty > 0 ? `+${r.pcsQty}P` : ''}</td>
                  <td style="text-align: right;">${Number(r.rate).toFixed(1)}</td>
                  <td style="text-align: right;">${computeRowNet(r).toFixed(1)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="tot">
            <div class="tot-row"><span>Bill Total:</span><strong>Rs. ${billTotal.toFixed(2)}</strong></div>
            ${customerOldBalance > 0 ? `<div class="tot-row"><span>Old Balance:</span><span>Rs. ${customerOldBalance.toFixed(2)}</span></div>` : ''}
            <div class="tot-row grand"><span>TOTAL DUE:</span><span>Rs. ${totalDue.toFixed(2)}</span></div>
            <div class="tot-row"><span>Cash Paid:</span><span>Rs. ${cashRecvNum.toFixed(2)}</span></div>
            <div class="tot-row"><span><strong>${netBalance >= 0 ? 'Remaining Balance:' : 'Change:'}</strong></span><strong>Rs. ${Math.abs(netBalance).toFixed(2)}</strong></div>
          </div>
          <div class="ftr">
            <p>Goods once sold can be returned within 3 days with receipt.</p>
            <p><strong>THANK YOU FOR YOUR VISIT</strong></p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    slipWin.document.close();
  };

  // WhatsApp Share
  const handleWhatsApp = () => {
    let msg = `*WAQAS MEDICAL STORE - INVOICE #${invoiceNo}*\n`;
    msg += `📅 *Date:* ${invDate} ${currentTime}\n`;
    msg += `👤 *Customer:* ${currentCustomer.name}\n`;
    msg += `--------------------------------\n`;
    billRows.forEach(r => {
      const q = r.pcsQty > 0 ? `${r.fullQty} Full + ${r.pcsQty} Pcs` : `${r.fullQty} Full`;
      msg += `• *${r.name}* (Batch: ${r.batchNo})\n  Qty: ${q} @ Rs. ${Number(r.rate).toFixed(2)} = Rs. ${computeRowNet(r).toFixed(2)}\n`;
    });
    msg += `--------------------------------\n`;
    msg += `*Bill Amount:* Rs. ${billTotal.toFixed(2)}\n`;
    if (customerOldBalance > 0) msg += `*Old Balance:* Rs. ${customerOldBalance.toFixed(2)}\n`;
    msg += `*Total Due:* Rs. ${totalDue.toFixed(2)}\n`;
    msg += `*Cash Paid:* Rs. ${cashRecvNum.toFixed(2)}\n`;
    msg += `*${netBalance >= 0 ? 'Remaining Udhaar' : 'Change'}:* Rs. ${Math.abs(netBalance).toFixed(2)}\n`;
    msg += `Thank you!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Keyboard Shortcuts & Hardware Scanner Listener
  const scannerBufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const now = Date.now();
      const diff = now - lastKeyTimeRef.current;
      const isInput = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT');

      // 1. Scanner rapid burst (< 50ms)
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (diff < 50 || scannerBufferRef.current.length === 0) {
          if (diff > 70 && scannerBufferRef.current.length > 0) {
            scannerBufferRef.current = e.key;
          } else {
            scannerBufferRef.current += e.key;
          }
        } else {
          scannerBufferRef.current = e.key;
        }
        lastKeyTimeRef.current = now;
      } else if (e.key === 'Enter') {
        if (scannerBufferRef.current.length >= 2 && diff < 80) {
          const raw = scannerBufferRef.current.trim().toLowerCase();
          const found = enrichedCatalog.find(p => p.code.toLowerCase() === raw || (p.barcode && p.barcode.toLowerCase() === raw));
          if (found) {
            e.preventDefault();
            playBeep(920, 80);
            handleAddProduct(found, true);
          }
          scannerBufferRef.current = '';
          return;
        }
        scannerBufferRef.current = '';
      }

      // 2. Shortcuts
      if (e.key === 'F2' || e.key === 'F9' || (e.key === '/' && !isInput)) {
        e.preventDefault();
        if (searchInputRef.current) searchInputRef.current.focus();
      } else if (e.key === 'F3') {
        e.preventDefault();
        handleNewSale();
      } else if (e.key === 'F4') {
        e.preventDefault();
        handleParkBill();
      } else if (e.key === 'F6') {
        e.preventDefault();
        handleTogglePricingMode();
      } else if (e.key === 'F7') {
        e.preventDefault();
        setShowParkedModal(prev => !prev);
      } else if (e.key === 'F10') {
        e.preventDefault();
        handlePrintReceipt();
      } else if (e.key === 'F12') {
        e.preventDefault();
        handleWhatsApp();
      } else if (e.key === 'Escape') {
        setShowSearchDropdown(false);
        setShowParkedModal(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [billRows, pricingMode, invoiceNo, totalDue, cashReceived, enrichedCatalog, parkedBills, selectedCustomerId, customerOldBalance]);

  return (
    <div className="pos-clean-container">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`pos-toast-msg ${toastType}`}>
          <CheckCircle2 size={15} /> <span>{toastMsg}</span>
        </div>
      )}

      {/* =========================================================================
          1. CLEAN TOP HEADER WITH KEYBOARD BADGES
          ========================================================================= */}
      <div className="pos-clean-header">
        <div className="pos-header-left">
          <div className="pos-brand-pill">
            <Zap size={16} />
            <span>Counter POS</span>
          </div>
          <span className="pos-inv-chip">#{invoiceNo}</span>
          <span className="pos-date-chip">{invDate}</span>
        </div>

        <div className="pos-header-center">
          <div className="pos-cust-box">
            <User size={14} color="#0d9488" />
            <select 
              className="pos-cust-select"
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                if (e.target.value === 'ret-1') setCustomerOldBalance(4520.00);
                else if (e.target.value === 'ret-2') setCustomerOldBalance(1200.00);
                else setCustomerOldBalance(2138.00);
              }}
            >
              <option value="ret-3">[ 7 ] WAQAS MEDICAL STORE &bull; Balance: Rs. 2,138</option>
              <option value="ret-1">[ 12 ] ALI MEDICOS &bull; Balance: Rs. 4,520</option>
              <option value="ret-2">[ 24 ] CITY CARE CLINIC &bull; Balance: Rs. 1,200</option>
              <option value="walkin">[ 0 ] WALK-IN CASH CUSTOMER &bull; Balance: Rs. 0</option>
            </select>
          </div>
        </div>

        <div className="pos-header-right">
          {/* F6 Mode Switcher */}
          <button 
            type="button" 
            className={`pos-mode-badge ${pricingMode === 'WHOLESALE' ? 'wholesale' : 'retail'}`}
            onClick={handleTogglePricingMode}
            title="Toggle pricing mode (F6)"
          >
            <span className="fkey-pill-tag">F6</span>
            <span>{pricingMode === 'WHOLESALE' ? '⭐ Wholesale TP' : '🏷️ Retail MRP'}</span>
          </button>

          {/* F7 Parked Drafts Button */}
          <button 
            type="button" 
            className={`pos-drafts-btn ${parkedBills.length > 0 ? 'active' : ''}`}
            onClick={() => setShowParkedModal(true)}
            title="View held drafts (F7)"
          >
            <span className="fkey-pill-tag">F7</span>
            <PauseCircle size={14} />
            <span>Drafts ({parkedBills.length})</span>
          </button>

          {/* F3 Clear & New Sale Button */}
          <button 
            type="button" 
            className="pos-btn-new-sale" 
            onClick={handleNewSale}
            title="Start new bill (F3)"
          >
            <span className="fkey-pill-tag">F3</span>
            <RefreshCw size={13} />
            <span>New Sale</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. SIMPLE SEARCH & QUICK ADD BAR
          ========================================================================= */}
      <div className="pos-search-box-wrap">
        <Search size={18} className="pos-search-icon" />
        <input 
          ref={searchInputRef}
          type="text" 
          className="pos-clean-search-input"
          placeholder="🔍 Search medicine by name, barcode, or generic (Press ENTER to add)..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSearchDropdown(true);
          }}
          onFocus={() => setShowSearchDropdown(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchResults.length > 0) {
              e.preventDefault();
              handleAddProduct(searchResults[0]);
            }
          }}
        />
        <div className="pos-search-right-badges">
          <span className="search-fkey-badge">Press <b>F9</b> or <b>/</b></span>
          {searchQuery && (
            <button className="pos-btn-clear-search" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {showSearchDropdown && searchResults.length > 0 && (
          <div className="pos-search-drop-menu">
            <div className="pos-drop-header">
              <span>Matching Medicines ({searchResults.length})</span>
              <small>Click to add</small>
            </div>
            {searchResults.map((p, idx) => (
              <div 
                key={p.id || idx} 
                className="pos-search-row"
                onClick={() => handleAddProduct(p)}
              >
                <div className="pos-row-code"><code>{p.code}</code></div>
                <div className="pos-row-info">
                  <strong>{p.name}</strong>
                  <span>{p.company} &bull; {p.packing} &bull; Stock: {p.stock || 50}</span>
                </div>
                <div className="pos-row-price">
                  <strong>Rs. {pricingMode === 'WHOLESALE' ? p.tradePrice.toFixed(2) : p.retailPrice.toFixed(2)}</strong>
                  <span className="pos-add-pill">+ Add</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================================
          3. CLEAN BILLING DATA TABLE
          ========================================================================= */}
      <div className="pos-table-card">
        <div className="pos-table-scroll">
          <table className="pos-table">
            <thead>
              <tr>
                <th style={{ width: '38%' }}>Medicine Name & Details</th>
                <th style={{ width: '15%', textAlign: 'center' }}>Box / Pack</th>
                <th style={{ width: '15%', textAlign: 'center' }}>Loose (Pcs)</th>
                <th style={{ width: '10%', textAlign: 'center' }}>Disc %</th>
                <th style={{ width: '12%', textAlign: 'right' }}>Rate</th>
                <th style={{ width: '14%', textAlign: 'right' }}>Total</th>
                <th style={{ width: '4%' }}></th>
              </tr>
            </thead>
            <tbody>
              {billRows.length > 0 ? (
                billRows.map((row, index) => {
                  const isSelected = selectedRowIndex === index;
                  const lineTotal = computeRowNet(row);

                  return (
                    <tr 
                      key={row.id || index}
                      className={`pos-table-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedRowIndex(index)}
                    >
                      {/* Name & Batch */}
                      <td>
                        <div className="pos-med-name-group">
                          <strong className="med-title">{row.name}</strong>
                          <div className="med-subtitle">
                            <span className="comp-tag">{row.company}</span>
                            <span className="batch-tag">Batch: {row.batchNo}</span>
                            <span className="exp-tag">Exp: {row.expiryDate}</span>
                          </div>
                        </div>
                      </td>

                      {/* Box Quantity Stepper */}
                      <td style={{ textAlign: 'center' }}>
                        <div className="pos-stepper-box">
                          <button 
                            type="button" 
                            className="pos-step-btn"
                            onClick={(e) => { e.stopPropagation(); handleStepQty(index, 'fullQty', -1); }}
                          >
                            -
                          </button>
                          <input 
                            type="number" 
                            min="0"
                            className="pos-qty-input"
                            value={row.fullQty}
                            onChange={(e) => handleUpdateQty(index, 'fullQty', e.target.value)}
                          />
                          <button 
                            type="button" 
                            className="pos-step-btn"
                            onClick={(e) => { e.stopPropagation(); handleStepQty(index, 'fullQty', 1); }}
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Loose Quantity Stepper */}
                      <td style={{ textAlign: 'center' }}>
                        <div className="pos-stepper-box">
                          <button 
                            type="button" 
                            className="pos-step-btn"
                            onClick={(e) => { e.stopPropagation(); handleStepQty(index, 'pcsQty', -1); }}
                          >
                            -
                          </button>
                          <input 
                            type="number" 
                            min="0"
                            className="pos-qty-input"
                            value={row.pcsQty}
                            onChange={(e) => handleUpdateQty(index, 'pcsQty', e.target.value)}
                          />
                          <button 
                            type="button" 
                            className="pos-step-btn"
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
                          step="1"
                          className="pos-disc-input"
                          value={row.discPercent}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setBillRows(prev => {
                              const updated = [...prev];
                              updated[index] = { ...updated[index], discPercent: val };
                              return updated;
                            });
                          }}
                        />
                      </td>

                      {/* Rate */}
                      <td style={{ textAlign: 'right' }}>
                        <span className="pos-rate-txt">Rs. {Number(row.rate).toFixed(1)}</span>
                      </td>

                      {/* Total */}
                      <td style={{ textAlign: 'right' }}>
                        <strong className="pos-total-txt">Rs. {lineTotal.toFixed(1)}</strong>
                      </td>

                      {/* Delete */}
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          type="button" 
                          className="pos-del-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveRow(index);
                          }}
                          title="Remove item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="pos-empty-state">
                    <ShoppingCart size={32} color="#94a3b8" />
                    <h4>Invoice is Empty</h4>
                    <p>Search medicine above or scan barcode to add items</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          4. UNIFIED STREAMLINED BOTTOM SUMMARY & CHECKOUT
          ========================================================================= */}
      <div className="pos-bottom-grid">
        
        {/* Left: Quick Item Info */}
        <div className="pos-item-info-card">
          <div className="pos-info-header">
            <Package size={14} color="#0d9488" />
            <span>Selected Item Information</span>
          </div>

          {activeItem ? (
            <div className="pos-info-details">
              <div className="info-main-title">{activeItem.name}</div>
              <div className="info-chips-row">
                <span className="info-chip">📦 {activeItem.packing}</span>
                <span className="info-chip">🏢 {activeItem.company}</span>
                <span className="info-chip highlight">Counter Stock: <strong>{activeItem.shopStock} Boxes</strong></span>
                <span className="info-chip">Godown: {activeItem.godownStock}</span>
                <span className="info-chip">Expiry: {activeItem.expiryDate}</span>
              </div>
            </div>
          ) : (
            <div className="pos-info-empty">Select any medicine line in table to view stock & packing info</div>
          )}
        </div>

        {/* Right: Clean Payment & Totals */}
        <div className="pos-settlement-card">
          <div className="pos-totals-row">
            <span className="tot-lbl">Bill Amount ({billRows.length} Items):</span>
            <strong className="tot-val">Rs. {billTotal.toFixed(2)}</strong>
          </div>

          {customerOldBalance > 0 && (
            <div className="pos-totals-row">
              <span className="tot-lbl">Previous Khata Balance:</span>
              <strong className="tot-val red-text">+ Rs. {customerOldBalance.toFixed(2)}</strong>
            </div>
          )}

          <div className="pos-totals-row grand-row">
            <span className="tot-lbl bold">TOTAL DUE:</span>
            <strong className="tot-val grand-val">Rs. {totalDue.toFixed(2)}</strong>
          </div>

          <div className="pos-cash-input-row">
            <span className="tot-lbl">Cash Paid:</span>
            <div className="cash-input-wrap">
              <span className="rs-tag">Rs.</span>
              <input 
                type="number" 
                className="pos-cash-input"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
              />
              <button 
                type="button" 
                className="btn-exact"
                onClick={() => setCashReceived(totalDue.toFixed(2))}
              >
                Exact
              </button>
            </div>
          </div>

          <div className="pos-totals-row balance-row">
            <span className="tot-lbl bold">{netBalance >= 0 ? 'Remaining Balance (Udhaar):' : 'Change Return:'}</span>
            <strong className={`tot-val ${netBalance >= 0 ? 'debt-val' : 'change-val'}`}>
              Rs. {Math.abs(netBalance).toFixed(2)}
            </strong>
          </div>
        </div>
      </div>

      {/* =========================================================================
          5. PRIMARY FAST ACTIONS BAR WITH CLEAR SHORTCUT BADGES
          ========================================================================= */}
      <div className="pos-actions-bar">
        <div className="actions-left">
          <button 
            type="button" 
            className="pos-action-btn secondary"
            onClick={handleParkBill}
            disabled={billRows.length === 0}
            title="Hold bill to serve next customer (F4)"
          >
            <span className="btn-fkey-tag">F4</span>
            <PauseCircle size={15} />
            <span>Hold Bill</span>
          </button>

          <button 
            type="button" 
            className="pos-action-btn secondary"
            onClick={handleWhatsApp}
            disabled={billRows.length === 0}
            title="Share bill on WhatsApp (F12)"
          >
            <span className="btn-fkey-tag">F12</span>
            <Share2 size={15} />
            <span>WhatsApp Bill</span>
          </button>
        </div>

        <div className="actions-right">
          <button 
            type="button" 
            className="pos-action-btn primary-print"
            onClick={handlePrintReceipt}
            disabled={billRows.length === 0}
            title="Complete & Print Receipt (F10)"
          >
            <span className="btn-fkey-tag print-tag">F10</span>
            <Printer size={16} />
            <span>Complete & Print Bill (80mm)</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          6. DEDICATED KEYBOARD SHORTCUTS REFERENCE BAR
          ========================================================================= */}
      <div className="pos-shortcuts-strip">
        <div className="shortcut-item"><kbd>F3</kbd> New Sale</div>
        <span className="sc-dot">&bull;</span>
        <div className="shortcut-item"><kbd>F4</kbd> Hold Bill</div>
        <span className="sc-dot">&bull;</span>
        <div className="shortcut-item"><kbd>F6</kbd> Wholesale/Retail</div>
        <span className="sc-dot">&bull;</span>
        <div className="shortcut-item"><kbd>F7</kbd> Parked Drafts</div>
        <span className="sc-dot">&bull;</span>
        <div className="shortcut-item"><kbd>F9</kbd> / <kbd>/</kbd> Search</div>
        <span className="sc-dot">&bull;</span>
        <div className="shortcut-item"><kbd>F10</kbd> Print 80mm</div>
        <span className="sc-dot">&bull;</span>
        <div className="shortcut-item"><kbd>F12</kbd> WhatsApp</div>
        <span className="sc-dot">&bull;</span>
        <div className="shortcut-item"><kbd>Esc</kbd> Close</div>
      </div>

      {/* =========================================================================
          PARKED BILLS MODAL
          ========================================================================= */}
      {showParkedModal && (
        <div className="parked-modal-overlay" onClick={() => setShowParkedModal(false)}>
          <div className="parked-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="parked-modal-header">
              <div className="parked-hdr-title">
                <PauseCircle size={18} color="#0d9488" />
                <h3>Held / Parked Bills ({parkedBills.length})</h3>
              </div>
              <button className="btn-close-parked-modal" onClick={() => setShowParkedModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="parked-modal-body">
              {parkedBills.length > 0 ? (
                <div className="parked-cards-grid">
                  {parkedBills.map((park) => (
                    <div key={park.id} className="parked-draft-card">
                      <div className="draft-card-top">
                        <span className="draft-inv-tag">Inv #{park.invoiceNo}</span>
                        <span className="draft-time"><Clock size={12} /> {park.timestamp}</span>
                        <strong className="draft-total-val">Rs. {Number(park.totalDue).toFixed(2)}</strong>
                      </div>
                      <div className="draft-cust-name">
                        <User size={13} /> {park.customerName} ({park.itemCount} Items)
                      </div>
                      <div className="draft-card-actions">
                        <button 
                          type="button" 
                          className="btn-recall-draft"
                          onClick={() => handleRecallBill(park)}
                        >
                          <PlayCircle size={14} /> Resume Bill
                        </button>
                        <button 
                          type="button" 
                          className="btn-delete-draft"
                          onClick={(e) => {
                            e.stopPropagation();
                            saveParkedBills(parkedBills.filter(p => p.id !== park.id));
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="parked-empty-state">
                  <PauseCircle size={36} color="#94a3b8" />
                  <h4>No bills on hold</h4>
                  <p>Press <strong>Hold Bill [F4]</strong> to pause an active sale for another customer.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
