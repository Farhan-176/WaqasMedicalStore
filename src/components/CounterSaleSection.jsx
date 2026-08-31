import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Printer, Share2, Plus, Minus, Trash2, Check, AlertTriangle, 
  RotateCcw, Sparkles, User, Building2, Clock, ShieldCheck, ChevronDown,
  Package, DollarSign, ArrowRight, Zap, TrendingUp, Layers, HelpCircle,
  FileText, CreditCard, CheckCircle2, AlertCircle, PauseCircle, PlayCircle,
  HardDrive, Usb, Cpu, X, Tag, ShoppingCart, RefreshCw, ExternalLink
} from 'lucide-react';

export default function CounterSaleSection({ 
  catalog = [], 
  onUpdateCatalog, 
  retailers = [], 
  currentUser,
  incomingOrder,
  orders = [],
  onClearIncomingOrder 
}) {
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
    
    const packingTypes = ['10x10 Strips', '30 Tabs Box', '60ML Bottle', '100ml Syrup', '15g Tube', '5 Ampoules Box', '20 Strips Box'];
    const packing = p.packaging || p.unit || packingTypes[Math.abs(hash) % packingTypes.length];
    const godownStock = Math.abs(hash % 150) + 20;
    const stripsPerPack = Number(p.stripsPerPack || p.unitsPerPack) || 10;
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
  const [invoiceNo, setInvoiceNo] = useState(() => Math.floor(10000 + Math.random() * 90000).toString());
  const [invDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [selectedCustomerId, setSelectedCustomerId] = useState('walkin');
  const [customerOldBalance, setCustomerOldBalance] = useState(0.00);

  // Active Bill Rows (Clean Empty Register on Load)
  const [billRows, setBillRows] = useState([]);

  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const searchInputRef = useRef(null);
  const searchBoxRef = useRef(null);

  // Auto-close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Settlement Inputs
  const [cashReceived, setCashReceived] = useState('0.00');
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
  const [showIncomingOrdersModal, setShowIncomingOrdersModal] = useState(false);

  const saveParkedBills = (bills) => {
    setParkedBills(bills);
    try {
      localStorage.setItem('waqas_pos_parked_bills', JSON.stringify(bills));
    } catch (e) {}
  };

  // Pending Retailer Orders available to load into POS
  const pendingRetailerOrders = useMemo(() => {
    return (orders || []).filter(o => o.status !== 'Delivered');
  }, [orders]);

  // Load Order into POS Register
  const handleLoadOrderToRegister = (order) => {
    // 1. Match and assign Customer
    const matchedRetailer = retailers.find(r => 
      r.id === order.retailerId || 
      r._id === order.retailerId ||
      (order.customerName && r.name.toLowerCase() === order.customerName.toLowerCase()) ||
      r.username === order.retailerId
    );
    if (matchedRetailer) {
      setSelectedCustomerId(matchedRetailer.id || matchedRetailer._id);
    } else {
      setSelectedCustomerId('walkin');
    }

    // 2. Map items to POS rows
    const rows = (order.items || []).map(item => {
      const prod = enrichedCatalog.find(p => p.name.toLowerCase() === item.name.toLowerCase() || p.id === item.id) || {};
      const rate = Number(item.price || prod.tradePrice || prod.price || 100);
      const strips = Number(prod.stripsPerPack || prod.unitsPerPack) || 10;
      return {
        id: `row-${Date.now()}-${Math.random()}`,
        code: prod.code || item.code || '---',
        name: item.name,
        company: prod.company || 'Standard Pharma',
        packing: prod.packing || prod.unit || 'Pack',
        batchNo: prod.batchNo || 'B441',
        expiryDate: prod.expiryDate || '12/2026',
        fullQty: item.quantity || 1,
        pcsQty: 0,
        stripsPerPack: strips,
        discPercent: item.discountPercent || 0,
        rate: rate,
        tradePrice: prod.tradePrice || rate,
        retailPrice: prod.retailPrice || (rate * 1.15),
        shopStock: prod.shopStock || 50,
        godownStock: prod.godownStock || 120,
        costPrice: prod.costPrice || (rate * 0.88)
      };
    });

    setBillRows(rows);
    setSelectedRowIndex(0);
    setInvoiceNo(order.id ? order.id.replace(/[^0-9]/g, '') : Math.floor(10000 + Math.random() * 90000).toString());
    setShowIncomingOrdersModal(false);
    triggerToast(`📦 Loaded Order #${order.id} for ${order.customerName || 'Retailer'}!`);
  };

  // Auto-load incomingOrder if passed as prop
  useEffect(() => {
    if (incomingOrder && incomingOrder.items && incomingOrder.items.length > 0) {
      handleLoadOrderToRegister(incomingOrder);
      if (onClearIncomingOrder) onClearIncomingOrder();
    }
  }, [incomingOrder]);

  // Selected Customer details
  const currentCustomer = useMemo(() => {
    if (selectedCustomerId === 'walkin') {
      return {
        id: 'walkin',
        name: 'WALK-IN CASH CUSTOMER',
        username: '0',
        area: 'Counter Sale (Local)',
        licenseNo: 'N/A'
      };
    }
    const found = retailers.find(r => r.id === selectedCustomerId || r._id === selectedCustomerId);
    if (found) return found;
    return {
      id: 'walkin',
      name: 'WALK-IN CASH CUSTOMER',
      username: '0',
      area: 'Counter Sale (Local)',
      licenseNo: 'N/A'
    };
  }, [retailers, selectedCustomerId]);

  // Compute Line Net (Full Boxes + Loose Strips / Pcs where 1 Box = stripsPerPack)
  const computeRowNet = (row) => {
    const full = Number(row.fullQty) || 0;
    const pcs = Number(row.pcsQty) || 0;
    const strips = Number(row.stripsPerPack || row.unitsPerPack) || 10;
    const boxRate = Number(row.rate) || 0;
    const pcsRate = boxRate / strips; // Rate per individual strip/pcs
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
      (p.name && p.name.toLowerCase().includes(q)) || 
      (p.code && p.code.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.toLowerCase().includes(q)) ||
      (p.genericName && p.genericName.toLowerCase().includes(q)) ||
      (p.company && p.company.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    ).slice(0, 10);
  }, [enrichedCatalog, searchQuery]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

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
                setCustomerOldBalance(0.00);
              }}
            >
              <option value="walkin">[ 0 ] WALK-IN CASH CUSTOMER &bull; Balance: Rs. 0.00</option>
              {retailers.map(r => (
                <option key={r.id || r._id} value={r.id || r._id}>
                  [ {r.username || r.id} ] {r.name} &bull; Balance: Rs. 0.00
                </option>
              ))}
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

          {/* Incoming Retailer B2B Orders Button */}
          {pendingRetailerOrders.length > 0 && (
            <button 
              type="button" 
              className="pos-btn-incoming-orders"
              onClick={() => setShowIncomingOrdersModal(true)}
              title="View and load received B2B Retailer Orders into Counter POS"
            >
              <span className="incoming-pulse-dot"></span>
              <ShoppingCart size={13} />
              <span>Retailer Orders ({pendingRetailerOrders.length})</span>
            </button>
          )}

          {/* Open in New Window Tab Button */}
          <button 
            type="button" 
            className="pos-btn-open-tab"
            onClick={() => window.open('/?view=pos', '_blank', 'noopener,noreferrer')}
            title="Open Counter POS in a separate dedicated browser window/tab"
          >
            <ExternalLink size={13} />
            <span>Open in New Tab</span>
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
          2. RESTORED PROMINENT SEARCH & AUTOCOMPLETE BAR (WITH TP & MRP DISPLAY)
          ========================================================================= */}
      <div className="pos-search-box-wrap" ref={searchBoxRef}>
        <Search size={17} className="pos-search-icon" />
        <input 
          ref={searchInputRef}
          type="text" 
          className="pos-clean-search-input"
          placeholder="🔍 Search medicine by name, barcode, code, or generic formula (Press ENTER to add)..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSearchDropdown(true);
          }}
          onFocus={() => {
            if (searchQuery.trim()) setShowSearchDropdown(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              if (searchResults.length > 0) {
                e.preventDefault();
                setShowSearchDropdown(true);
                setHighlightedIndex(prev => (prev + 1) % searchResults.length);
              }
            } else if (e.key === 'ArrowUp') {
              if (searchResults.length > 0) {
                e.preventDefault();
                setShowSearchDropdown(true);
                setHighlightedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
              }
            } else if (e.key === 'Enter') {
              if (searchResults.length > 0) {
                e.preventDefault();
                const chosen = searchResults[highlightedIndex] || searchResults[0];
                handleAddProduct(chosen);
              }
            } else if (e.key === 'Escape') {
              setShowSearchDropdown(false);
            }
          }}
        />
        <div className="pos-search-right-badges">
          <span className="search-fkey-badge">Press <b>F9</b> or <b>/</b></span>
          {searchQuery && (
            <button 
              type="button" 
              className="pos-btn-clear-search" 
              onClick={() => {
                setSearchQuery('');
                setShowSearchDropdown(false);
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown showing both TP (Wholesale) and MRP (Retail) */}
        {showSearchDropdown && searchQuery.trim().length > 0 && (
          <div className="pos-search-drop-menu">
            {searchResults.length > 0 ? (
              <>
                <div className="pos-drop-header">
                  <span>Matching Medicines ({searchResults.length})</span>
                  <small>Use &uarr;&darr; keys &bull; Press <strong>ENTER</strong> to add</small>
                </div>
                <div className="pos-drop-items-list">
                  {searchResults.map((p, idx) => {
                    const isHigh = highlightedIndex === idx;
                    const isLowStock = (p.stock || 50) < 15;
                    const displayRate = pricingMode === 'WHOLESALE' ? p.tradePrice.toFixed(2) : p.retailPrice.toFixed(2);

                    return (
                      <div 
                        key={p.id || idx} 
                        className={`pos-search-row ${isHigh ? 'highlighted' : ''}`}
                        onClick={() => handleAddProduct(p)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                      >
                        <div className="pos-row-code">
                          <code>{p.code}</code>
                        </div>
                        <div className="pos-row-info">
                          <div className="pos-row-title-line">
                            <strong className="pos-med-name">{p.name}</strong>
                            {p.genericName && <span className="pos-med-generic">({p.genericName})</span>}
                          </div>
                          <div className="pos-row-meta-line">
                            <span className="pos-meta-company">{p.company}</span>
                            <span className="pos-meta-dot">&bull;</span>
                            <span className="pos-meta-pack">{p.packing}</span>
                            <span className="pos-meta-dot">&bull;</span>
                            <span className={`pos-stock-pill ${isLowStock ? 'low' : 'ok'}`}>
                              {isLowStock ? `Low Stock: ${p.stock || 5}` : `Stock: ${p.stock || 50} Boxes`}
                            </span>
                          </div>
                        </div>
                        <div className="pos-row-price">
                          <div className="pos-dual-rate-tag">
                            <span className="rate-tp-badge">TP: Rs. {p.tradePrice.toFixed(1)}</span>
                            <span className="rate-mrp-badge">MRP: Rs. {p.retailPrice.toFixed(1)}</span>
                          </div>
                          <strong className="pos-price-amt">Rs. {displayRate}</strong>
                          <span className={`pos-add-pill ${isHigh ? 'active-add' : ''}`}>+ Add (Enter)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="pos-search-empty-drop">
                <p>🔍 No medicines found matching <strong>"{searchQuery}"</strong></p>
                <small>Check spelling or try generic formula.</small>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          3. DEDICATED PROPER PRODUCT TABLE AREA (FULL-HEIGHT WORKSPACE LIKE DOS/ERP)
          ========================================================================= */}
      <div className="pos-table-card">
        <div className="pos-table-scroll">
          <table className="pos-table">
            <thead>
              <tr>
                <th style={{ width: '8%' }}>CODE</th>
                <th style={{ width: '36%' }}>ITEM NAME & PACKING [F9]</th>
                <th style={{ width: '12%', textAlign: 'center' }}>FULL (BOX)</th>
                <th style={{ width: '12%', textAlign: 'center' }} title="Loose Strips count (1 Box = X Strips)">STRIP (PCS)</th>
                <th style={{ width: '9%', textAlign: 'center' }}>DISC %</th>
                <th style={{ width: '12%', textAlign: 'right' }}>RATE (TP/MRP)</th>
                <th style={{ width: '11%', textAlign: 'right' }}>NET TOTAL</th>
                <th style={{ width: '4%' }}></th>
              </tr>
            </thead>
            <tbody>
              {/* Existing Billed Rows */}
              {billRows.map((row, index) => {
                const isSelected = selectedRowIndex === index;
                const lineTotal = computeRowNet(row);

                return (
                  <tr 
                    key={row.id || index}
                    className={`pos-table-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedRowIndex(index)}
                  >
                    {/* Item Code */}
                    <td>
                      <code className="pos-grid-code">{row.code}</code>
                    </td>

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

                    {/* Rate (Active rate with TP and MRP subtags) */}
                    <td style={{ textAlign: 'right' }}>
                      <div className="pos-rate-box">
                        <span className="pos-rate-txt">Rs. {Number(row.rate).toFixed(1)}</span>
                        <div className="pos-rate-sub-tags">
                          <span className="sub-tag-tp" title="Retailer Wholesale TP Rate">TP:{Number(row.tradePrice || row.rate).toFixed(1)}</span>
                          <span className="sub-tag-mrp" title="Consumer Retail MRP">MRP:{Number(row.retailPrice || (row.rate * 1.15)).toFixed(1)}</span>
                        </div>
                      </div>
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
              })}
                           {/* Empty Table State when no items added */}
              {billRows.length === 0 && (
                <tr className="pos-empty-cart-row">
                  <td colSpan={8} style={{ padding: '36px 20px', textAlign: 'center' }}>
                    <div className="pos-empty-table-state">
                      <div className="pos-empty-icon-circle">
                        <ShoppingCart size={32} color="#0d9488" />
                      </div>
                      <h4 style={{ margin: '8px 0 4px', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                        Register Ready for Sales
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                        Scan barcode or search medicine in the search bar above <kbd style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 800 }}>F9</kbd> to add items to bill.
                      </p>
                    </div>
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
        
        {/* Left: Quick Item Info (with both TP and MRP) */}
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
                <span className="info-chip highlight">📦 1 Box = <strong>{activeItem.stripsPerPack || 10} Strips (PCS)</strong></span>
                <span className="info-chip rate-chip tp">💊 Strip TP: <strong>Rs. {(Number(activeItem.tradePrice || activeItem.rate) / (activeItem.stripsPerPack || 10)).toFixed(2)}</strong></span>
                <span className="info-chip rate-chip tp">🏪 Box TP: <strong>Rs. {Number(activeItem.tradePrice || activeItem.rate).toFixed(2)}</strong></span>
                <span className="info-chip rate-chip mrp">🏷️ Box MRP: <strong>Rs. {Number(activeItem.retailPrice || (activeItem.rate * 1.15)).toFixed(2)}</strong></span>
                <span className="info-chip">Counter Stock: <strong>{activeItem.shopStock} Boxes</strong></span>
                <span className="info-chip">Exp: {activeItem.expiryDate}</span>
              </div>
            </div>
          ) : (
            <div className="pos-info-details empty-hint">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.76rem' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                <span><strong>Shift Status:</strong> Active &bull; <strong>Register:</strong> Terminal-01 &bull; <strong>Pricing:</strong> {pricingMode === 'WHOLESALE' ? 'Wholesale TP' : 'Retail MRP'}</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px', display: 'block' }}>
                Select any medicine line in the grid above to inspect packing, stock & both TP/MRP rates.
              </span>
            </div>
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
                step="any"
                className="pos-cash-input"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="0.00"
              />
              <button 
                type="button" 
                className="btn-exact"
                onClick={() => setCashReceived(totalDue.toFixed(2))}
                title="Auto-fill exact bill amount"
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
          5. PRIMARY FAST ACTIONS BAR (INTEGRATED SHORTCUT BADGES - ZERO REDUNDANCY)
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

      {/* =========================================================================
          INCOMING B2B RETAILER ORDERS MODAL
          ========================================================================= */}
      {showIncomingOrdersModal && (
        <div className="pos-modal-overlay" onClick={() => setShowIncomingOrdersModal(false)}>
          <div className="pos-modal-box incoming-orders-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="pos-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={18} color="#0d9488" />
                <h3>Received Retailer Orders ({pendingRetailerOrders.length})</h3>
              </div>
              <button 
                type="button" 
                className="pos-modal-close"
                onClick={() => setShowIncomingOrdersModal(false)}
              >
                &times;
              </button>
            </div>

            <div className="pos-modal-body">
              {pendingRetailerOrders.length > 0 ? (
                <div className="incoming-orders-list">
                  {pendingRetailerOrders.map((order) => (
                    <div key={order.id} className="incoming-order-card">
                      <div className="io-card-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="io-id-tag">{order.id}</span>
                          <span className="order-b2b-tag">🏢 B2B Retailer</span>
                        </div>
                        <span className="io-time"><Clock size={12} /> {order.createdAt || 'Today'}</span>
                        <strong className="io-total-val">Rs. {Number(order.grandTotal || 0).toFixed(2)}</strong>
                      </div>

                      <div className="io-customer-info">
                        <strong>{order.customerName || order.customer?.name || 'Retailer Pharmacy'}</strong>
                        <span> • {order.phone || order.customer?.phone || 'N/A'} • {order.address || 'Local Delivery'}</span>
                      </div>

                      <div className="io-items-preview">
                        {(order.items || []).map((it, idx) => (
                          <span key={idx} className="io-item-pill">
                            {it.name} <b>x{it.quantity}</b>
                          </span>
                        ))}
                      </div>

                      <div className="io-card-footer">
                        <button 
                          type="button" 
                          className="btn-load-to-pos"
                          onClick={() => handleLoadOrderToRegister(order)}
                        >
                          <Zap size={14} /> Load into POS Register
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="parked-empty-state">
                  <Package size={36} color="#94a3b8" />
                  <h4>No pending retailer orders</h4>
                  <p>When B2B pharmacy retailers place orders, they appear here ready for 1-click counter billing.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
