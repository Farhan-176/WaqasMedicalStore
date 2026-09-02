import React, { useMemo } from 'react';
import { X, User, Phone, MapPin, Store, Calendar, ShoppingBag, DollarSign, Award, Clock } from 'lucide-react';

export default function CustomerProfileModal({ isOpen, onClose, customerInfo, orders = [] }) {
  if (!isOpen || !customerInfo) return null;

  const phoneQuery = (customerInfo.phone || customerInfo.recipientDetails?.phone || '').trim();
  const nameQuery = (customerInfo.name || customerInfo.customerName || customerInfo.recipientDetails?.name || '').trim();
  const shopName = customerInfo.shopName || customerInfo.recipientDetails?.shopName || customerInfo.retailerName || '';

  // Filter orders matching this customer
  const customerOrders = useMemo(() => {
    return orders.filter(o => {
      const oPhone = o.phone || o.customer?.phone || o.recipientDetails?.phone || '';
      const oName = o.customerName || o.customer?.name || o.recipientDetails?.name || '';
      const oShop = o.customer?.retailerName || o.recipientDetails?.shopName || '';
      
      if (phoneQuery && oPhone.includes(phoneQuery)) return true;
      if (nameQuery && oName.toLowerCase().includes(nameQuery.toLowerCase())) return true;
      if (shopName && oShop.toLowerCase().includes(shopName.toLowerCase())) return true;
      return false;
    });
  }, [orders, phoneQuery, nameQuery, shopName]);

  const stats = useMemo(() => {
    const totalOrders = customerOrders.length;
    const totalSpend = customerOrders.reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalSpend / totalOrders : 0;
    const isRetailer = Boolean(customerInfo.isRetailer || customerInfo.customerType === 'REGISTERED_RETAILER' || shopName);

    return {
      totalOrders,
      totalSpend,
      avgOrderValue,
      isRetailer
    };
  }, [customerOrders, customerInfo, shopName]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" style={{ maxWidth: '850px', width: '95%' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ background: '#1e293b', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={22} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>
              Customer Lifetime Profile & Audit Ledger
            </h3>
          </div>
          <button className="close-btn" style={{ color: '#fff' }} onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ padding: '20px' }}>
          {/* Customer Meta Header Card */}
          <div style={{ 
            background: stats.isRetailer ? '#f0fdf4' : '#f8fafc', 
            border: `1px solid ${stats.isRetailer ? '#bbf7d0' : '#e2e8f0'}`,
            borderRadius: '8px', 
            padding: '16px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '15px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0f172a' }}>
                  {nameQuery || 'Customer Profile'}
                </span>
                {shopName && (
                  <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600' }}>
                    🏢 {shopName}
                  </span>
                )}
                <span style={{ 
                  background: stats.isRetailer ? '#22c55e' : '#3b82f6', 
                  color: '#fff', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontSize: '0.75rem', 
                  fontWeight: '600' 
                }}>
                  {stats.isRetailer ? 'B2B REGISTERED RETAILER' : 'B2C CONSUMER'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.88rem', color: '#475569' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={14} color="var(--primary)" /> {phoneQuery || 'N/A'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={14} color="var(--secondary)" /> {customerInfo.address || customerInfo.area || 'Karachi, Pakistan'}
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account Status</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontWeight: 'bold', fontSize: '0.95rem' }}>
                <Award size={16} /> Verified Active Account
              </div>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: '#f1f5f9', padding: '14px', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Lifetime Orders</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#1e293b', marginTop: '4px' }}>
                {stats.totalOrders} Orders
              </div>
            </div>

            <div style={{ background: '#f1f5f9', padding: '14px', borderRadius: '8px', borderLeft: '4px solid var(--secondary)' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Revenue / Spend</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#047857', marginTop: '4px' }}>
                Rs. {stats.totalSpend.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ background: '#f1f5f9', padding: '14px', borderRadius: '8px', borderLeft: '4px solid #84cc16' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Average Order Value</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#365349', marginTop: '4px' }}>
                Rs. {stats.avgOrderValue.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Order History Table */}
          <h4 style={{ fontSize: '1.05rem', color: '#0f172a', marginBottom: '10px' }}>Lifetime Transaction History</h4>
          <div style={{ overflowX: 'auto', maxHeight: '280px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Order ID</th>
                  <th style={{ padding: '10px' }}>Date</th>
                  <th style={{ padding: '10px' }}>Channel / Source</th>
                  <th style={{ padding: '10px' }}>Items</th>
                  <th style={{ padding: '10px' }}>Grand Total</th>
                  <th style={{ padding: '10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {customerOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                      No matching order records found in database ledger.
                    </td>
                  </tr>
                ) : (
                  customerOrders.map(o => (
                    <tr key={o.id || o.orderId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px', fontWeight: '600', color: 'var(--primary)' }}>{o.orderId || o.id}</td>
                      <td style={{ padding: '10px', color: '#64748b' }}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB') : 'Recent'}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                          {o.orderSource || 'WEB_APP'}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>{(o.items || []).length} items</td>
                      <td style={{ padding: '10px', fontWeight: 'bold', color: '#0f172a' }}>
                        Rs. {(Number(o.grandTotal) || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: '10px', 
                          fontSize: '0.75rem', 
                          fontWeight: 'bold',
                          background: o.status === 'Delivered' ? '#dcfce7' : '#fef3c7',
                          color: o.status === 'Delivered' ? '#15803d' : '#b45309'
                        }}>
                          {o.status || 'Received'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
