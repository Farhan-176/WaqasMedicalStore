import React, { useState } from 'react';
import { Store, Package, Clock, CheckCircle, Truck, Printer, MessageSquare, RefreshCw, X, FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function RetailerOrderHistoryModal({ 
  isOpen, 
  onClose, 
  retailerUser, 
  orders = [],
  onReOrder
}) {
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'delivered'
  const [expandedOrderId, setExpandedOrderId] = useState(null);

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

  const filteredOrders = displayOrders.filter(order => {
    if (filterStatus === 'active') return order.status !== 'Delivered';
    if (filterStatus === 'delivered') return order.status === 'Delivered';
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
            .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 12px; margin-bottom: 16px; }
            .header h2 { color: #0f766e; margin: 0 0 4px 0; letter-spacing: 1px; }
            .header p { margin: 2px 0; font-size: 13px; color: #64748b; }
            .b2b-badge { display: inline-block; background: #ccfbf1; color: #0f766e; font-weight: bold; padding: 4px 10px; border-radius: 4px; font-size: 12px; margin-top: 6px; }
            .info-grid { display: flex; justify-content: space-between; margin: 16px 0; font-size: 13px; line-height: 1.6; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; background: #f8fafc; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
            th { background: #0f766e; color: #ffffff; text-align: left; padding: 8px 10px; }
            td { border-bottom: 1px solid #e2e8f0; padding: 8px 10px; }
            .total-row { font-weight: bold; background: #f1f5f9; font-size: 14px; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>WAQAS MEDICAL STORE</h2>
            <p>Wholesale Pharmaceutical Distribution & Retail Supply</p>
            <p>DRAP Lic #: 04-WMS-2024 | Sector G-9, Islamabad | Tel: +92 300 0000000</p>
            <div class="b2b-badge">COMMERCIAL B2B WHOLESALE INVOICE</div>
          </div>

          <div class="info-grid">
            <div>
              <strong>Billed To (Retailer / Clinic):</strong><br />
              <strong>${retailerUser.name}</strong><br />
              <span>Location: ${order.address || retailerUser.area}</span><br />
              <span>Drug License #: ${retailerUser.licenseNo || 'Verified Partner'}</span>
            </div>
            <div style="text-align: right;">
              <strong>Invoice #:</strong> ${order.id}<br />
              <strong>Date:</strong> ${order.createdAt}<br />
              <strong>Status:</strong> ${order.status}<br />
              <strong>Payment:</strong> Cash on Commercial Delivery (COD)
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item / Formula Description</th>
                <th style="text-align: center;">Qty (Units/Packs)</th>
                <th style="text-align: right;">Trade Price (Rs.)</th>
                <th style="text-align: right;">Total Amount (Rs.)</th>
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container retailer-order-history-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="roh-header-title">
            <Store size={22} color="#0d9488" />
            <div>
              <h2>B2B Order History & Invoices</h2>
              <span className="roh-store-tag">{retailerUser.name} — ({retailerUser.area})</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Filter Tabs */}
        <div className="roh-filter-tabs">
          <button 
            className={`roh-tab ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All Orders ({displayOrders.length})
          </button>
          <button 
            className={`roh-tab ${filterStatus === 'active' ? 'active' : ''}`}
            onClick={() => setFilterStatus('active')}
          >
            In Progress / Delivery ({displayOrders.filter(o => o.status !== 'Delivered').length})
          </button>
          <button 
            className={`roh-tab ${filterStatus === 'delivered' ? 'active' : ''}`}
            onClick={() => setFilterStatus('delivered')}
          >
            Delivered & Paid ({displayOrders.filter(o => o.status === 'Delivered').length})
          </button>
        </div>

        {/* Orders List */}
        <div className="modal-body roh-body">
          {filteredOrders.length === 0 ? (
            <div className="roh-empty-state">
              <Package size={42} color="#94a3b8" />
              <p>No orders found matching this filter.</p>
            </div>
          ) : (
            <div className="roh-orders-list">
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const itemsCount = (order.items || []).reduce((sum, it) => sum + it.quantity, 0);

                return (
                  <div key={order.id} className="roh-order-card">
                    {/* Card Header Row */}
                    <div className="roh-card-top" onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}>
                      <div className="roh-id-col">
                        <span className="b2b-order-id-badge">{order.id}</span>
                        <small className="roh-date">{order.createdAt}</small>
                      </div>

                      <div className="roh-items-col">
                        <span className="roh-items-count">{itemsCount} Packs ({order.items?.length || 0} Products)</span>
                        <strong className="roh-total-amount">Rs. {Number(order.grandTotal).toFixed(2)}</strong>
                      </div>

                      <div className="roh-status-col">
                        <span className={`status-pill status-${order.status.toLowerCase().replace(/[^a-z]/g, '')}`}>
                          {order.status}
                        </span>
                        <button className="btn-toggle-expand">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Order Details */}
                    {isExpanded && (
                      <div className="roh-card-expanded-body">
                        <div className="roh-items-table">
                          <div className="roh-table-header">
                            <span>Item Name</span>
                            <span style={{ textAlign: 'center' }}>Qty</span>
                            <span style={{ textAlign: 'right' }}>Wholesale Rate</span>
                            <span style={{ textAlign: 'right' }}>Total</span>
                          </div>
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} className="roh-table-row">
                              <span className="roh-item-name">{item.name}</span>
                              <span className="roh-item-qty">{item.quantity}</span>
                              <span className="roh-item-rate">Rs. {Number(item.price).toFixed(2)}</span>
                              <span className="roh-item-subtotal">Rs. {(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Card Action Buttons */}
                        <div className="roh-actions-bar">
                          <button className="btn-print-invoice" onClick={() => handlePrintInvoice(order)}>
                            <Printer size={14} /> Print Commercial Invoice
                          </button>

                          {onReOrder && (
                            <button 
                              className="btn-reorder-b2b" 
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
                            className="btn-wa-b2b-inquiry"
                          >
                            <MessageSquare size={14} /> WhatsApp Inquiry
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
