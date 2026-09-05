import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Send, 
  Smartphone, 
  Printer, 
  Eye, 
  Search, 
  Share2, 
  RotateCcw, 
  FileSpreadsheet, 
  FileText,
  Download,
  ExternalLink,
  Receipt,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const ALPHABET = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), '#'];

export default function WhatsAppCatalogModal({ isOpen, onClose, products = [] }) {
  // Mode: 'pdf-doc' (Default!), 'offer-list', 'raw-text'
  const [viewMode, setViewMode] = useState('pdf-doc');
  const [selectedLetter, setSelectedLetter] = useState('ALL');
  const [shopName, setShopName] = useState(() => localStorage.getItem('wms_offer_shop_name') || '');
  const [searchFilter, setSearchFilter] = useState('');
  
  // PDF Document State
  const [pdfBlob, setPdfBlob] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [statusNotice, setStatusNotice] = useState(null);

  // Web Table Order Quantities State
  const [quantities, setQuantities] = useState({});
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState(null);

  const dateStr = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  }, []);

  // Fetch / Generate PDF Document
  const fetchPdfDocument = async (letterToFetch = selectedLetter, customShop = shopName, queryFilter = searchFilter) => {
    setIsGeneratingPdf(true);
    setStatusNotice(null);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '';
      const params = new URLSearchParams({
        letter: letterToFetch,
        shopName: customShop.trim(),
        search: queryFilter.trim()
      });

      const response = await fetch(`${API_BASE_URL}/api/products/offer-list-pdf?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to generate PDF document');

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      // Revoke previous blob url to prevent memory leaks
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }

      setPdfBlob(blob);
      setPdfUrl(objectUrl);
    } catch (err) {
      console.error('PDF Fetch Error:', err);
      setStatusNotice({
        type: 'error',
        message: 'Could not generate PDF from backend. Make sure the server is active.'
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Generate PDF when modal opens or primary scope changes
  useEffect(() => {
    if (isOpen) {
      fetchPdfDocument(selectedLetter, shopName, searchFilter);
    }
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen, selectedLetter]);

  const handleShopNameChange = (val) => {
    setShopName(val);
    try {
      localStorage.setItem('wms_offer_shop_name', val);
    } catch (e) {}
  };

  // 1. Share PDF Directly to WhatsApp
  const handleShareWhatsAppPdf = async () => {
    if (!pdfBlob) {
      await fetchPdfDocument();
    }

    const currentBlob = pdfBlob;
    const letterSuffix = selectedLetter !== 'ALL' ? `_${selectedLetter}` : '';
    const fileName = `Waqas_Medical_Store_Offer_List${letterSuffix}.pdf`;
    const file = new File([currentBlob || new Blob()], fileName, { type: 'application/pdf' });

    // A) If browser supports Web Share API with files (Android Chrome, iOS Safari):
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Waqas Medical Store — Wholesale Offer List',
          text: `*🏥 WAQAS MEDICAL STORE — WHOLESALE OFFER LIST*\n📅 Date: ${dateStr}\n📍 Denso Hall, Saddar, Karachi\nAttached is our official Offer List PDF document for orders.`
        });
        setStatusNotice({
          type: 'success',
          message: 'PDF Document dispatched via WhatsApp successfully!'
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Share dialog dismissed or error:', err);
        }
      }
    }

    // B) Desktop / PC Fallback:
    // 1. Trigger automatic download of the PDF file to user's downloads folder
    if (pdfUrl) {
      const downloadLink = document.createElement('a');
      downloadLink.href = pdfUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }

    // 2. Open WhatsApp Web with official share message
    const API_BASE_URL = window.location.origin;
    const directPdfLink = `${API_BASE_URL}/api/products/offer-list-pdf?letter=${selectedLetter}`;
    const waText = encodeURIComponent(
      `*🏥 WAQAS MEDICAL STORE — WHOLESALE OFFER LIST (PDF)*\n` +
      `📅 *Date:* ${dateStr}\n` +
      `📍 *Denso Hall, Medicine Market, Saddar, Karachi*\n` +
      `📞 *WhatsApp Orders:* 0300-1234567\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📎 *Official PDF Document Attached*\n` +
      `📥 *Direct PDF Link:* ${directPdfLink}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `*(The PDF document "${fileName}" has been downloaded to your computer. Simply drag & drop or attach the file into this WhatsApp chat)*`
    );

    window.open(`https://wa.me/?text=${waText}`, '_blank');

    setStatusNotice({
      type: 'success',
      message: `✅ PDF Document "${fileName}" downloaded! WhatsApp Web opened. Attach or drag-drop the PDF file into your chat.`
    });
  };

  // 2. Direct Download PDF
  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    const letterSuffix = selectedLetter !== 'ALL' ? `_${selectedLetter}` : '';
    const fileName = `Waqas_Medical_Store_Offer_List${letterSuffix}.pdf`;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setStatusNotice({
      type: 'success',
      message: `Downloaded "${fileName}" successfully!`
    });
  };

  // 3. Open in New Tab
  const handleOpenNewTab = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, '_blank');
  };

  // 4. Print PDF
  const handlePrintPdf = () => {
    if (!pdfUrl) return;
    const iframe = document.getElementById('offer-pdf-iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.print();
    } else {
      window.print();
    }
  };

  // Web Table Calculations & Data (Fallback Mode)
  const inStockItems = useMemo(() => {
    if (!products || products.length === 0) return [];
    return products.filter(p => (Number(p.stock) > 0 || p.stock === undefined));
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = inStockItems;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) || 
        (p.code && String(p.code).toLowerCase().includes(q)) ||
        (p.genericName && p.genericName.toLowerCase().includes(q))
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="offer-list-modal-container" 
        style={{ maxWidth: '1000px', height: '94vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* TOP BAR */}
        <div className="offer-list-topbar">
          <div className="offer-list-title-group">
            <h3 className="offer-list-main-title">
              <FileText size={20} color="#38bdf8" /> WHOLESALE OFFER LIST (PDF)
            </h3>
            <span className="offer-list-date-badge">
              Lock Date: {dateStr}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* View Mode Toggle */}
            <div className="offer-view-toggle">
              <button 
                className={`offer-toggle-btn ${viewMode === 'pdf-doc' ? 'active' : ''}`}
                onClick={() => setViewMode('pdf-doc')}
                title="View and share the official PDF document"
              >
                <FileText size={14} /> PDF Document
              </button>
              <button 
                className={`offer-toggle-btn ${viewMode === 'offer-list' ? 'active' : ''}`}
                onClick={() => setViewMode('offer-list')}
                title="Interactive on-screen bill order sheet"
              >
                <FileSpreadsheet size={14} /> Order Bill Sheet
              </button>
              <button 
                className={`offer-toggle-btn ${viewMode === 'raw-text' ? 'active' : ''}`}
                onClick={() => setViewMode('raw-text')}
                title="Raw WhatsApp markdown text"
              >
                <Smartphone size={14} /> WhatsApp Broadcast
              </button>
            </div>

            <button 
              className="close-btn" 
              style={{ color: '#ffffff', background: 'transparent', border: 'none', cursor: 'pointer' }} 
              onClick={onClose}
              title="Close"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* =========================================================================
            PRIMARY VIEW: PDF DOCUMENT GENERATOR & WHATSAPP DISPATCHER
            ========================================================================= */}
        {viewMode === 'pdf-doc' && (
          <div className="pdf-preview-container">
            {/* ACTION TOOLBAR - LARGE WHATSAPP & DOWNLOAD BUTTONS */}
            <div className="pdf-toolbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: '700' }}>
                  📄 Format: Printable A4 PDF (Categorized A, B, C... with Red Banners)
                </span>
                {isGeneratingPdf && (
                  <span style={{ fontSize: '0.8rem', color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <RefreshCw size={12} className="spin" /> Generating PDF...
                  </span>
                )}
              </div>

              <div className="pdf-toolbar-actions">
                <button 
                  className="pdf-btn-whatsapp"
                  onClick={handleShareWhatsAppPdf}
                  title="Share this official PDF document directly via WhatsApp"
                >
                  <Smartphone size={16} /> Share PDF on WhatsApp
                </button>

                <button 
                  className="pdf-btn-download"
                  onClick={handleDownloadPdf}
                  title="Download the PDF document (.pdf) to your device"
                >
                  <Download size={16} /> Download PDF (.pdf)
                </button>

                <button 
                  className="pdf-btn-secondary"
                  onClick={handleOpenNewTab}
                  title="Open PDF in a new browser window"
                >
                  <ExternalLink size={15} /> Open Tab
                </button>

                <button 
                  className="pdf-btn-secondary"
                  onClick={handlePrintPdf}
                  title="Print PDF directly"
                >
                  <Printer size={15} /> Print
                </button>
              </div>
            </div>

            {/* CONFIGURATION & FILTER ROW */}
            <div className="pdf-config-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '800', color: '#1e293b', whiteSpace: 'nowrap' }}>
                  CUSTOMER / SHOP NAME:
                </label>
                <input 
                  type="text"
                  placeholder="Enter Retailer Shop Name (Optional)"
                  value={shopName}
                  onChange={e => handleShopNameChange(e.target.value)}
                  style={{
                    padding: '5px 10px',
                    fontSize: '0.84rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    flex: 1
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button 
                  onClick={() => fetchPdfDocument(selectedLetter, shopName, searchFilter)}
                  style={{
                    background: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '5px 12px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw size={12} className={isGeneratingPdf ? 'spin' : ''} /> Refresh PDF
                </button>
              </div>
            </div>

            {/* ALPHABET JUMP BAR FOR PDF SCOPE */}
            <div style={{ background: '#f8fafc', padding: '6px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: '800', color: '#64748b', marginRight: '6px' }}>
                LETTER SCOPE:
              </span>
              {ALPHABET.map(letter => (
                <button
                  key={letter}
                  className={`offer-alpha-btn ${selectedLetter === letter ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedLetter(letter);
                    fetchPdfDocument(letter, shopName, searchFilter);
                  }}
                  title={`Generate PDF for Letter ${letter}`}
                >
                  {letter}
                </button>
              ))}
            </div>

            {/* STATUS / GUIDANCE BANNER */}
            {statusNotice && (
              <div style={{
                background: statusNotice.type === 'success' ? '#ecfdf5' : '#fef2f2',
                color: statusNotice.type === 'success' ? '#065f46' : '#991b1b',
                padding: '8px 16px',
                fontSize: '0.84rem',
                fontWeight: '600',
                borderBottom: `1px solid ${statusNotice.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {statusNotice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{statusNotice.message}</span>
              </div>
            )}

            {/* EMBEDDED REAL PDF DOCUMENT VIEWER */}
            <div style={{ flex: 1, position: 'relative', background: '#334155' }}>
              {isGeneratingPdf && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(15, 23, 42, 0.7)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  zIndex: 20,
                  backdropFilter: 'blur(2px)'
                }}>
                  <RefreshCw size={36} className="spin" style={{ marginBottom: '12px', color: '#38bdf8' }} />
                  <h4 style={{ margin: '0 0 6px 0' }}>Generating Official Offer List PDF...</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>Categorizing products with red banners & wholesale rates</p>
                </div>
              )}

              {pdfUrl ? (
                <iframe 
                  id="offer-pdf-iframe"
                  src={pdfUrl}
                  className="pdf-iframe-frame"
                  title="Wholesale Offer List PDF Document"
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                  Click Refresh to load PDF Document.
                </div>
              )}
            </div>

            {/* BOTTOM INSTRUCTION BAR */}
            <div style={{ background: '#1e293b', color: '#94a3b8', padding: '8px 16px', fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span>
                💡 <strong>Mobile / Tablet:</strong> Tapping "Share PDF on WhatsApp" sends the actual <strong>.pdf</strong> file directly to contacts.
              </span>
              <span>
                💡 <strong>Desktop:</strong> PDF automatically downloads and WhatsApp Web opens so you can attach it directly into your chat.
              </span>
            </div>
          </div>
        )}

        {/* =========================================================================
            SECONDARY VIEW: ON-SCREEN ORDER SHEET TABLE
            ========================================================================= */}
        {viewMode === 'offer-list' && (
          <>
            <div className="offer-list-controls">
              <div className="offer-list-search-row">
                <div className="offer-search-input-wrapper">
                  <Search size={16} className="offer-search-icon" />
                  <input 
                    type="text"
                    className="offer-search-input"
                    placeholder="Search product by name, generic formula, or code..."
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                  />
                </div>

                <div className="offer-stats-pill">
                  Scope: Letter {selectedLetter} ({filteredProducts.length} items)
                </div>
              </div>

              <div className="offer-alphabet-pills">
                <span className="offer-alpha-label">A-Z Jump:</span>
                {ALPHABET.map(letter => (
                  <button
                    key={letter}
                    className={`offer-alpha-btn ${selectedLetter === letter ? 'active' : ''}`}
                    onClick={() => setSelectedLetter(letter)}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            </div>

            <div className="offer-table-header">
              <span>CODE</span>
              <span>PRODUCT NAME</span>
              <span style={{ textAlign: 'right' }}>RATE</span>
              <span style={{ textAlign: 'center' }}>QTY</span>
              <span style={{ textAlign: 'right' }}>DISC %</span>
              <span style={{ textAlign: 'center' }}>SCHEME / NET</span>
            </div>

            <div className="offer-scroll-body">
              {availableLetters.map(letter => {
                const items = groupedByLetter[letter] || [];
                return (
                  <div key={letter}>
                    <div className="offer-section-banner">{letter}</div>
                    {items.map(prod => {
                      const itemKey = prod.id || prod._id || prod.code;
                      const code = prod.code || prod.itemCode || String(itemKey).slice(-4).toUpperCase();
                      const priceFormatted = (Number(prod.price) || 0).toFixed(2);
                      const discFormatted = prod.offerDiscount || '10.00%';
                      const schemeText = prod.bonusText || (prod.unit || 'NET');
                      const hasQty = Number(quantities[itemKey]) > 0;

                      return (
                        <div key={itemKey} className={`offer-item-row ${hasQty ? 'has-qty' : ''}`}>
                          <span className="offer-col-code">{code}</span>
                          <span className="offer-col-name">{prod.name.toUpperCase()}</span>
                          <span className="offer-col-price">{priceFormatted}</span>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <div className="offer-qty-pill">
                              <span className="qty-label">Qty</span>
                              <input 
                                type="text"
                                inputMode="numeric"
                                value={quantities[itemKey] || ''}
                                onChange={e => handleQuantityChange(itemKey, e.target.value)}
                              />
                            </div>
                          </div>
                          <span className="offer-col-disc">{discFormatted}</span>
                          <span className="offer-col-scheme">{schemeText}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="offer-bottom-panel">
              <div className="offer-actions-grid">
                <button className="offer-btn offer-btn-wa" onClick={handleShareWhatsAppPdf}>
                  <Smartphone size={15} /> Export & Share PDF on WhatsApp
                </button>
                <button className="offer-btn" onClick={handleDownloadPdf}>
                  <Download size={15} /> Download PDF (.pdf)
                </button>
                <button className="offer-btn" onClick={() => setViewMode('pdf-doc')}>
                  <Eye size={15} /> Switch to PDF Document
                </button>
                <button className="offer-btn" onClick={handlePrintPdf}>
                  <Printer size={15} /> Print PDF
                </button>
              </div>
            </div>
          </>
        )}

        {/* =========================================================================
            SECONDARY VIEW: RAW WHATSAPP TEXT & BROADCAST
            ========================================================================= */}
        {viewMode === 'raw-text' && (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.88rem', color: '#475569' }}>
                Raw WhatsApp Markdown Text broadcast for B2B retailer network.
              </span>
              <button 
                className="btn"
                onClick={handleShareWhatsAppPdf}
                style={{ background: '#25D366', color: '#ffffff', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Smartphone size={16} /> Share as PDF Instead
              </button>
            </div>

            <div style={{ background: '#0f172a', color: '#38bdf8', padding: '18px', borderRadius: '10px', fontSize: '0.88rem', lineHeight: '1.5', overflowY: 'auto', maxHeight: '420px', whiteSpace: 'pre-wrap' }}>
              {`*🏥 WAQAS MEDICAL STORE — WHOLESALE OFFER LIST*\n📅 Date: ${dateStr}\n📍 Denso Hall, Medicine Market, Saddar, Karachi\n\n📥 Download Official PDF Document:\n${window.location.origin}/api/products/offer-list-pdf?letter=${selectedLetter}\n\n📲 Send your medicine orders to WhatsApp: 0300-1234567`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
