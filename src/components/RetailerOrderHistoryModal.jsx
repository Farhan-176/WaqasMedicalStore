import React, { useState } from 'react';
import { Store, Package, Clock, CheckCircle, Truck, Printer, MessageSquare, RefreshCw, X, FileText, ChevronDown, ChevronUp, ArrowLeft, Search, ShieldCheck, DollarSign, Calendar } from 'lucide-react';

export default function RetailerOrderHistoryModal({ 
  isOpen, 
  onClose, 
  retailerUser, 
  orders = [],
  onReOrder
}) {
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'delivered'
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');

  if (!isOpen || !retailerUser) return null;

  // Filter orders belonging to this retailer (or fallback sample B2B history)
  const retailerOrders = orders.filter(o => {
    const isRetailerMatch = 
      (o.customer?.isRetailer && (o.customer?.retailerName === retailerUser.name || o.customer?.name === retailerUser.name)) ||
      o.retailerUsername === retailerUser.username ||
      (o.orderType === 'b2b_retailer');
    return isRetailerMatch;
  });

  // If no live orders yet, supply realistic historical wholesale orders for this retailer
  const defaultHistoricalOrders = [
    {
      id: `ORD-B2B-${retailerUser.username.slice(0, 3).toUpperCase()}-9401`,
      customerName: retailerUser.name,
      phone: '0300-5559876',
      address: retailerUser.area,
      orderType: 'b2b_retailer',
      checkoutType: 'delivery',
      createdAt: 'Yesterday, 04:30 PM',
      status: 'Out for Delivery',
      items: [
        { name: 'CALAMOX 625 NEW LARG (Per Pack)', quantity: 10, price: 197.94 },
        { name: 'ACEFYL COUGH SYRUP (Per Pack)', quantity: 24, price: 169.15 },
        { name: 'ACENAC 100MG TABLET (Per Pack)', quantity: 15, price: 467.50 }
      ],
      subtotal: 13051.50,
      deliveryFee: 0,
      grandTotal: 13051.50
    },
    {
      id: `ORD-B2B-${retailerUser.username.slice(0, 3).toUpperCase()}-8820`,
      customerName: retailerUser.name,
      phone: '0300-5559876',
      address: retailerUser.area,
      orderType: 'b2b_retailer',
      checkoutType: 'delivery',
      createdAt: '18 Aug 2026, 11:15 AM',
      status: 'Delivered',
      items: [
        { name: 'ACORT CREAM NEW (Per Pack)', quantity: 20, price: 170.00 },
        { name: 'BOFALGAN ING (Per Pack)', quantity: 30, price: 212.50 },
        { name: 'ACNE MED CREAM (Per Pack)', quantity: 12, price: 416.50 }
      ],
      subtotal: 14773.00,
      deliveryFee: 0,
      grandTotal: 14773.00
    }
  ];

  const displayOrders = retailerOrders.length > 0 ? retailerOrders : defaultHistoricalOrders;

  // Calculate high-level summary KPIs
  const totalOrdersCount = displayOrders.length;
  const activeOrdersCount = displayOrders.filter(o => o.status !== 'Delivered').length;
  const deliveredOrdersCount = displayOrders.filter(o => o.status === 'Delivered').length;
  const totalSpend = displayOrders.reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);

  // Search & Filter
  const filteredOrders = displayOrders.filter(order => {
    // Filter status
    if (filterStatus === 'active' && order.status === 'Delivered') return false;
    if (filterStatus === 'delivered' && order.status !== 'Delivered') return false;

    // Search query
    if (searchHistoryQuery.trim()) {
      const q = searchHistoryQuery.toLowerCase();
      const matchId = (order.id || '').toLowerCase().includes(q);
      const matchItems = (order.items || []).some(it => (it.name || '').toLowerCase().includes(q));
      return matchId || matchItems;
    }
    return true;
  });

  const handlePrintInvoice = (order) => {
    const slipWindow = window.open('', '_blank');
    slipWindow.document.write(`
      <html>
        <head>
          <title>B2B Commercial Tax Invoice - ${order.id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; max-width: 650px; margin: auto; color: #1e293b; }
            .header { border-bottom: 2px solid #064e3b; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; }
            .title { font-size: 22px; font-weight: 800; color: #064e3b; margin: 0; }
            .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
            .invoice-badge { background: #f0fdf4; border: 1px solid #10b981; color: #064e3b; font-weight: 800; font-size: 12px; padding: 4px 10px; border-radius: 20px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; margin-bottom: 20px; background: #f8fafc; padding: 12px; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
            th { background: #064e3b; color: white; text-align: left; padding: 8px; font-size: 12px; text-transform: uppercase; }
            td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
            .total-row td { font-weight: 800; border-top: 2px solid #064e3b; font-size: 14px; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">WAQAS MEDICAL STORE</h1>
              <p class="subtitle">B2B Commercial Pharmaceutical Supply & Distribution</p>
            </div>
            <div>
              <span class="invoice-badge">WHOLESALE INVOICE</span>
            </div>
          </div>

          <div class="meta-grid">
            <div>
              <p style="margin: 3px 0;"><strong>Invoice No:</strong> ${order.id}</p>
              <p style="margin: 3px 0;"><strong>Date:</strong> ${order.createdAt}</p>
              <p style="margin: 3px 0;"><strong>Status:</strong> ${order.status}</p>
            </div>
            <div>
              <p style="margin: 3px 0;"><strong>Partner Retailer:</strong> ${retailerUser.name}</p>
              <p style="margin: 3px 0;"><strong>Area Hub:</strong> ${retailerUser.area}</p>
              <p style="margin: 3px 0;"><strong>License / NTN:</strong> ${retailerUser.licenseNo || 'Verified Partner'}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: center;">Qty (Packs)</th>
                <th style="text-align: right;">Rate (Rs.)</th>
                <th style="text-align: right;">Total (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items || []).map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">Rs. ${Number(item.price).toFixed(2)}</td>
                  <td style="text-align: right;">Rs. ${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3" style="text-align: right;">SUBTOTAL:</td>
                <td style="text-align: right;">Rs. ${Number(order.subtotal || order.grandTotal).toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td colspan="3" style="text-align: right;">DELIVERY / COLD-CHAIN:</td>
                <td style="text-align: right;">Rs. ${Number(order.deliveryFee || 0).toFixed(2)}</td>
              </tr>
              <tr class="total-row" style="background: #e6fffa; color: #065f46; font-size: 15px;">
                <td colspan="3" style="text-align: right;">NET INVOICE PAYABLE:</td>
                <td style="text-align: right;">Rs. ${Number(order.grandTotal).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <p>Authorized Pharmacist Sign-Off: Dr. Waqas (Chief Pharmacist)</p>
            <p>Thank you for your partner business with Waqas Medical Store!</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
  };

  return (
    <div className="retailer-history-fullscreen-view">
      {/* Full Window Top Navigation Bar */}
      <header className="rh-full-header">
        <div className="rh-header-left">
          <button className="btn-back-to-store" onClick={onClose}>
            <ArrowLeft size={16} />
            <span>Back to Medicine Catalog</span>
          </button>
          <div className="rh-brand-divider"></div>
          <div className="rh-portal-identity">
            <div className="rh-icon-box">
              <Store size={18} color="#ffffff" />
            </div>
            <div>
              <h3>B2B Wholesale Order Portal</h3>
              <span className="rh-retailer-tag">
                {retailerUser.name} &bull; <small>{retailerUser.area}</small>
              </span>
            </div>
          </div>
        </div>

        <div className="rh-header-right">
          <button className="rh-close-window-btn" onClick={onClose} title="Close Window (ESC)">
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Main Full Window Body */}
      <main className="rh-full-body">
        {/* KPI Summary Cards */}
        <section className="rh-kpi-grid">
          <div className="rh-kpi-card">
            <div className="rh-kpi-icon blue">
              <FileText size={20} />
            </div>
            <div>
              <span className="rh-kpi-label">Total Commercial Orders</span>
              <h4 className="rh-kpi-val">{totalOrdersCount}</h4>
            </div>
          </div>

          <div className="rh-kpi-card">
            <div className="rh-kpi-icon orange">
              <Truck size={20} />
            </div>
            <div>
              <span className="rh-kpi-label">In-Transit / Packing</span>
              <h4 className="rh-kpi-val">{activeOrdersCount}</h4>
            </div>
          </div>

          <div className="rh-kpi-card">
            <div className="rh-kpi-icon green">
              <CheckCircle size={20} />
            </div>
            <div>
              <span className="rh-kpi-label">Delivered & Closed</span>
              <h4 className="rh-kpi-val">{deliveredOrdersCount}</h4>
            </div>
          </div>

          <div className="rh-kpi-card">
            <div className="rh-kpi-icon teal">
              <DollarSign size={20} />
            </div>
            <div>
              <span className="rh-kpi-label">Total Wholesale Value</span>
              <h4 className="rh-kpi-val">Rs. {totalSpend.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
            </div>
          </div>
        </section>

        {/* Filter & Search Toolbar */}
        <div className="rh-toolbar">
          {/* Status Filter Tabs */}
          <div className="rh-tabs">
            <button 
              className={`rh-tab-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              All Orders ({displayOrders.length})
            </button>
            <button 
              className={`rh-tab-btn ${filterStatus === 'active' ? 'active' : ''}`}
              onClick={() => setFilterStatus('active')}
            >
              In Progress / Delivery ({activeOrdersCount})
            </button>
            <button 
              className={`rh-tab-btn ${filterStatus === 'delivered' ? 'active' : ''}`}
              onClick={() => setFilterStatus('delivered')}
            >
              Delivered ({deliveredOrdersCount})
            </button>
          </div>

          {/* Search Bar for Orders */}
          <div className="rh-search-box">
            <Search size={16} className="rh-search-icon" />
            <input 
              type="text"
              placeholder="Search by Order ID or Medicine..."
              value={searchHistoryQuery}
              onChange={(e) => setSearchHistoryQuery(e.target.value)}
            />
            {searchHistoryQuery && (
              <button className="rh-search-clear" onClick={() => setSearchHistoryQuery('')}>×</button>
            )}
          </div>
        </div>

        {/* Orders List / Grid */}
        <section className="rh-orders-container">
          {filteredOrders.length === 0 ? (
            <div className="rh-empty-box">
              <Package size={52} color="#cbd5e1" />
              <h3>No Orders Found</h3>
              <p>No past wholesale orders match your current filter criteria.</p>
              {searchHistoryQuery && (
                <button className="btn-back-to-store" onClick={() => setSearchHistoryQuery('')}>
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="rh-orders-grid">
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const itemsCount = (order.items || []).reduce((sum, it) => sum + it.quantity, 0);

                return (
                  <div key={order.id} className="rh-order-card">
                    {/* Top Row: ID, Date, Status */}
                    <div className="rh-card-head" onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}>
                      <div className="rh-card-meta">
                        <span className="rh-order-badge">{order.id}</span>
                        <span className="rh-order-date">
                          <Calendar size={13} /> {order.createdAt}
                        </span>
                      </div>

                      <div className="rh-head-right">
                        <span className={`status-pill status-${order.status.toLowerCase().replace(/[^a-z]/g, '')}`}>
                          {order.status}
                        </span>
                        <button className="rh-expand-icon-btn" title="Toggle Details">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Middle Row: Quick Stats */}
                    <div className="rh-card-summary">
                      <div className="rh-summary-item">
                        <span className="label">Total Quantity</span>
                        <strong>{itemsCount} Packs ({order.items?.length || 0} Products)</strong>
                      </div>
                      <div className="rh-summary-item">
                        <span className="label">Grand Total</span>
                        <strong className="rh-amount">Rs. {Number(order.grandTotal).toFixed(2)}</strong>
                      </div>
                    </div>

                    {/* Expandable Order Details & Line Items */}
                    {isExpanded ? (
                      <div className="rh-expanded-content">
                        <div className="rh-items-table">
                          <div className="rh-table-th">
                            <span>Medicine Name</span>
                            <span style={{ textAlign: 'center' }}>Qty</span>
                            <span style={{ textAlign: 'right' }}>Wholesale Rate</span>
                            <span style={{ textAlign: 'right' }}>Total Amount</span>
                          </div>
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} className="rh-table-tr">
                              <span className="rh-name-col"><strong>{item.name}</strong></span>
                              <span className="rh-qty-col" style={{ textAlign: 'center' }}>{item.quantity}</span>
                              <span className="rh-rate-col" style={{ textAlign: 'right' }}>Rs. {Number(item.price).toFixed(2)}</span>
                              <span className="rh-sub-col" style={{ textAlign: 'right' }}>Rs. {(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="rh-card-actions">
                          <button className="rh-btn-invoice" onClick={() => handlePrintInvoice(order)}>
                            <Printer size={14} /> Print Commercial Invoice
                          </button>

                          {onReOrder && (
                            <button 
                              className="rh-btn-reorder" 
                              onClick={() => {
                                onReOrder(order.items || []);
                                onClose();
                              }}
                              title="Add all items from this order to current cart"
                            >
                              <RefreshCw size={14} /> 1-Click Re-Order
                            </button>
                          )}

                          <a 
                            href={`https://wa.me/923000000000?text=${encodeURIComponent(`Assalam o Alaikum Dr. Waqas, regarding our B2B wholesale order (${order.id}) for ${retailerUser.name}...`)}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="rh-btn-wa"
                          >
                            <MessageSquare size={14} /> WhatsApp Support
                          </a>
                        </div>
                      </div>
                    ) : (
                      /* Preview of first 2 items when collapsed */
                      <div className="rh-collapsed-preview" onClick={() => setExpandedOrderId(order.id)}>
                        <p className="rh-preview-text">
                          {(order.items || []).slice(0, 2).map(it => `${it.name} (x${it.quantity})`).join(', ')}
                          {(order.items || []).length > 2 && ` + ${(order.items || []).length - 2} more`}
                        </p>
                        <span className="rh-view-details-link">Click to view items & print invoice &darr;</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
