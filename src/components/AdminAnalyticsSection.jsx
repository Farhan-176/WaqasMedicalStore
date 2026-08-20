import React, { useState } from 'react';
import { 
  TrendingUp, DollarSign, PieChart, ShieldAlert, Printer, CheckCircle, 
  AlertCircle, ArrowUpRight, ArrowDownRight, Search, Clock, FileText, 
  CreditCard, Smartphone, ShoppingBag, Landmark, Activity, UserCheck 
} from 'lucide-react';
import { 
  FINANCIAL_SUMMARY, WEEKLY_SALES_TREND, CATEGORY_MARGINS, 
  TOP_PROFIT_PRODUCTS, INITIAL_REGISTER_BALANCING 
} from '../adminAnalyticsData';
import '../App.css';

export default function AdminAnalyticsSection({ auditLogs, onAddAuditLog }) {
  const [subTab, setSubTab] = useState('overview'); // 'overview', 'register', 'audit'
  
  // Register Balancing Local State
  const [registerData, setRegisterData] = useState(INITIAL_REGISTER_BALANCING);
  const [actualCashInput, setActualCashInput] = useState(INITIAL_REGISTER_BALANCING.actualCashInDrawer);
  const [cashExpensesInput, setCashExpensesInput] = useState(INITIAL_REGISTER_BALANCING.cashExpenses);
  const [registerNotes, setRegisterNotes] = useState(INITIAL_REGISTER_BALANCING.notes);
  const [registerSuccessMsg, setRegisterSuccessMsg] = useState('');

  // Audit Logs Filtering State
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Calculations for Register
  const expectedCash = registerData.openingCash + registerData.posCashSales + registerData.codCashCollected - (parseFloat(cashExpensesInput) || 0);
  const variance = (parseFloat(actualCashInput) || 0) - expectedCash;

  const handleSaveRegisterBalancing = () => {
    setRegisterData(prev => ({
      ...prev,
      cashExpenses: parseFloat(cashExpensesInput) || 0,
      expectedEndingCash: expectedCash,
      actualCashInDrawer: parseFloat(actualCashInput) || 0,
      notes: registerNotes
    }));

    setRegisterSuccessMsg('✅ Register Balancing Saved & Audit Log Generated!');
    setTimeout(() => setRegisterSuccessMsg(''), 3500);

    // Dynamic Audit Log Creation
    const varianceText = variance === 0 
      ? 'Cleanly Balanced (Rs. 0 variance)' 
      : variance > 0 
        ? `Surplus of +Rs. ${variance}` 
        : `Shortage of -Rs. ${Math.abs(variance)}`;

    onAddAuditLog({
      id: `LOG-${Date.now().toString().slice(-4)}`,
      timestamp: 'Just now',
      staff: registerData.staffName,
      actionType: 'REGISTER_CLOSE',
      category: 'Financial',
      details: `Shift Register Closed. Actual Cash: Rs. ${actualCashInput} | Expected: Rs. ${expectedCash} | ${varianceText}`,
      severity: variance === 0 ? 'success' : 'warning'
    });
  };

  const handlePrintShiftReport = () => {
    const printWin = window.open('', '_blank');
    printWin.document.write(`
      <html>
        <head>
          <title>Shift Register Closing Slip - Waqas Medical</title>
          <style>
            body { font-family: 'Courier New', monospace; width: 340px; margin: auto; padding: 15px; font-size: 13px; }
            h3, h4 { text-align: center; margin: 4px 0; }
            .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; margin: 4px 0; }
            .bold { font-weight: bold; }
            .highlight { background: #eee; padding: 4px; border: 1px solid #ccc; font-weight: bold; margin-top: 8px; }
          </style>
        </head>
        <body>
          <h3>WAQAS MEDICAL STORE</h3>
          <h4>DAILY SHIFT CLOSING SUMMARY</h4>
          <p><strong>Date:</strong> ${registerData.shiftDate}<br><strong>Staff:</strong> ${registerData.staffName}</p>
          <div class="divider"></div>

          <div class="row"><span>Opening Cash:</span><span>Rs. ${registerData.openingCash}</span></div>
          <div class="row"><span>POS Counter Cash:</span><span>Rs. ${registerData.posCashSales}</span></div>
          <div class="row"><span>COD Online Cash:</span><span>Rs. ${registerData.codCashCollected}</span></div>
          <div class="row"><span>EasyPaisa/JazzCash:</span><span>Rs. ${registerData.easypaisaQrSales}</span></div>
          <div class="row"><span>Card Payments:</span><span>Rs. ${registerData.cardSales}</span></div>
          <div class="row"><span>Petty Cash Expenses:</span><span>- Rs. ${cashExpensesInput}</span></div>

          <div class="divider"></div>
          <div class="row bold"><span>Expected Ending Cash:</span><span>Rs. ${expectedCash}</span></div>
          <div class="row bold"><span>Actual Cash Count:</span><span>Rs. ${actualCashInput}</span></div>
          <div class="highlight row">
            <span>VARIANCE STATUS:</span>
            <span>${variance === 0 ? 'BALANCED' : variance > 0 ? `SURPLUS (+${variance})` : `SHORTAGE (-${Math.abs(variance)})`}</span>
          </div>

          <div class="divider"></div>
          <p><strong>Manager Notes:</strong> ${registerNotes || 'None'}</p>
          <br>
          <p style="text-align: center; font-size: 11px;">Verified & Signed by Store Manager</p>
          <script>window.print();</script>
        </body>
      </html>
    `);
  };

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(auditSearch.toLowerCase()) || 
                          log.staff.toLowerCase().includes(auditSearch.toLowerCase()) ||
                          log.id.toLowerCase().includes(auditSearch.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || log.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="admin-analytics-container">
      {/* Top Executive Financial KPI Cards */}
      <div className="kpi-cards-grid">
        <div className="kpi-card green-card">
          <div className="kpi-header">
            <span>Today's Total Sales</span>
            <div className="kpi-icon-box"><DollarSign size={18} /></div>
          </div>
          <h2>Rs. {FINANCIAL_SUMMARY.todayRevenue.toLocaleString()}</h2>
          <div className="kpi-footer green-text">
            <ArrowUpRight size={14} /> +15.4% vs yesterday (Rs. {FINANCIAL_SUMMARY.yesterdayRevenue.toLocaleString()})
          </div>
        </div>

        <div className="kpi-card blue-card">
          <div className="kpi-header">
            <span>Estimated Net Profit</span>
            <div className="kpi-icon-box"><TrendingUp size={18} /></div>
          </div>
          <h2>Rs. {FINANCIAL_SUMMARY.todayNetProfit.toLocaleString()}</h2>
          <div className="kpi-footer blue-text">
            <Activity size={14} /> Overall Profit Margin: <strong>{FINANCIAL_SUMMARY.grossMarginPercent}%</strong>
          </div>
        </div>

        <div className="kpi-card purple-card">
          <div className="kpi-header">
            <span>Sales Channel Breakdown</span>
            <div className="kpi-icon-box"><ShoppingBag size={18} /></div>
          </div>
          <div className="channel-split">
            <div>
              <small>POS Counter Sales</small>
              <strong>Rs. {FINANCIAL_SUMMARY.counterPosRevenue.toLocaleString()}</strong>
            </div>
            <div>
              <small>Online Delivery</small>
              <strong>Rs. {FINANCIAL_SUMMARY.onlineSalesRevenue.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        <div className="kpi-card orange-card">
          <div className="kpi-header">
            <span>Total Store Stock Valuation</span>
            <div className="kpi-icon-box"><Landmark size={18} /></div>
          </div>
          <h2>Rs. {FINANCIAL_SUMMARY.totalInventoryRetail.toLocaleString()}</h2>
          <div className="kpi-footer orange-text">
            <PieChart size={14} /> Purchase Cost: Rs. {FINANCIAL_SUMMARY.totalInventoryCost.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Sub Navigation Bar for Analytics */}
      <div className="analytics-subnav">
        <button 
          className={`subnav-btn ${subTab === 'overview' ? 'active' : ''}`}
          onClick={() => setSubTab('overview')}
        >
          <TrendingUp size={16} /> Sales & Profit Overview
        </button>

        <button 
          className={`subnav-btn ${subTab === 'register' ? 'active' : ''}`}
          onClick={() => setSubTab('register')}
        >
          <Landmark size={16} /> Daily Register Balancing
        </button>

        <button 
          className={`subnav-btn ${subTab === 'audit' ? 'active' : ''}`}
          onClick={() => setSubTab('audit')}
        >
          <ShieldAlert size={16} /> Audit Trail & Staff Logs
          <span className="log-badge-count">{auditLogs.length}</span>
        </button>
      </div>

      {/* SUB-TAB 1: Sales & Profit Overview */}
      {subTab === 'overview' && (
        <div className="analytics-tab-content">
          <div className="analytics-grid-layout">
            {/* Weekly Sales Trend Visualization */}
            <div className="ops-card flex-1">
              <div className="ops-card-header">
                <div>
                  <h3>7-Day Revenue & Net Profit Trend</h3>
                  <p>Daily breakdown comparing POS Counter transactions vs Online Home Delivery sales.</p>
                </div>
              </div>

              <div className="trend-bar-chart">
                {WEEKLY_SALES_TREND.map(day => {
                  const maxRevenue = 60000;
                  const posHeight = (day.pos / maxRevenue) * 100;
                  const onlineHeight = (day.online / maxRevenue) * 100;
                  const profitHeight = (day.profit / maxRevenue) * 100;

                  return (
                    <div key={day.day} className="chart-bar-group">
                      <div className="bars-container">
                        <div className="bar pos-bar" style={{ height: `${posHeight}%` }} title={`POS: Rs. ${day.pos}`}></div>
                        <div className="bar online-bar" style={{ height: `${onlineHeight}%` }} title={`Online: Rs. ${day.online}`}></div>
                        <div className="bar profit-bar" style={{ height: `${profitHeight}%` }} title={`Profit: Rs. ${day.profit}`}></div>
                      </div>
                      <span className="bar-day-label">{day.day}</span>
                      <small className="bar-revenue-val">Rs. {(day.revenue / 1000).toFixed(1)}k</small>
                    </div>
                  );
                })}
              </div>

              <div className="chart-legend">
                <span><span className="dot pos-dot"></span> POS Sales</span>
                <span><span className="dot online-dot"></span> Online Delivery</span>
                <span><span className="dot profit-dot"></span> Net Profit</span>
              </div>
            </div>

            {/* Category Profitability Breakdown */}
            <div className="ops-card category-margin-card">
              <div className="ops-card-header">
                <div>
                  <h3>Profit Margins by Category</h3>
                  <p>Revenue & margin contribution across medical departments.</p>
                </div>
              </div>

              <div className="category-margin-list">
                {CATEGORY_MARGINS.map(cat => (
                  <div key={cat.id} className="margin-item">
                    <div className="margin-item-header">
                      <strong>{cat.category}</strong>
                      <span className="margin-badge">{cat.margin} Margin</span>
                    </div>
                    <div className="margin-item-progress">
                      <div 
                        className="margin-fill" 
                        style={{ width: `${parseFloat(cat.margin)}%` }}
                      ></div>
                    </div>
                    <div className="margin-item-details">
                      <span>Rev: <strong>Rs. {cat.revenue}</strong></span>
                      <span>Cost: Rs. {cat.cost}</span>
                      <span className="profit-text">Profit: Rs. {cat.profit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Selling & High-Margin Products Table */}
          <div className="ops-card margin-top-20">
            <div className="ops-card-header">
              <div>
                <h3>Top Profit-Generating Products Today</h3>
                <p>Track fast-moving inventory driving gross profit margins.</p>
              </div>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product Title</th>
                  <th>Units Sold Today</th>
                  <th>Total Revenue</th>
                  <th>Purchase Cost</th>
                  <th>Net Profit</th>
                  <th>Margin %</th>
                </tr>
              </thead>
              <tbody>
                {TOP_PROFIT_PRODUCTS.map((prod, i) => (
                  <tr key={i}>
                    <td><strong>{prod.name}</strong></td>
                    <td>{prod.salesQty} Units</td>
                    <td>Rs. {prod.revenue.toLocaleString()}</td>
                    <td>Rs. {prod.cost.toLocaleString()}</td>
                    <td><strong className="green-text">Rs. {prod.profit.toLocaleString()}</strong></td>
                    <td>
                      <span className="status-pill status-verified">{prod.margin}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Daily Register Balancing */}
      {subTab === 'register' && (
        <div className="analytics-tab-content">
          <div className="ops-card">
            <div className="ops-card-header">
              <div>
                <h3>Shift Register Balancing & Cash Reconciliation</h3>
                <p>Track cash drawer opening balance, register sales, digital QR collections, and petty cash payouts.</p>
              </div>
              <button className="btn-print-slip" onClick={handlePrintShiftReport}>
                <Printer size={14} /> Print Shift Closing Slip
              </button>
            </div>

            {registerSuccessMsg && (
              <div className="ops-success-banner">
                <CheckCircle size={16} /> {registerSuccessMsg}
              </div>
            )}

            <div className="register-balancing-grid">
              {/* Left Column: Register Breakdown Form */}
              <div className="register-form-panel">
                <div className="register-info-header">
                  <div>
                    <h4>Shift Session: {registerData.shiftDate}</h4>
                    <span className="user-role-tag"><UserCheck size={12} /> Cashier: {registerData.staffName}</span>
                  </div>
                </div>

                <div className="register-lines">
                  <div className="reg-line-row">
                    <span>1. Shift Opening Cash Balance</span>
                    <strong>Rs. {registerData.openingCash.toLocaleString()}</strong>
                  </div>
                  <div className="reg-line-row">
                    <span>2. Counter POS Cash Sales</span>
                    <strong>+ Rs. {registerData.posCashSales.toLocaleString()}</strong>
                  </div>
                  <div className="reg-line-row">
                    <span>3. COD Cash Collected (Rider Deliveries)</span>
                    <strong>+ Rs. {registerData.codCashCollected.toLocaleString()}</strong>
                  </div>
                  <div className="reg-line-row input-line">
                    <span>4. Petty Cash Payouts / Expenses (Rs.)</span>
                    <input 
                      type="number" 
                      className="reg-input-num"
                      value={cashExpensesInput}
                      onChange={(e) => setCashExpensesInput(e.target.value)}
                    />
                  </div>

                  <div className="reg-line-divider"></div>

                  <div className="reg-line-row expected-row">
                    <span>Expected Cash in Drawer:</span>
                    <strong>Rs. {expectedCash.toLocaleString()}</strong>
                  </div>

                  <div className="reg-line-row input-line actual-row">
                    <span>5. Actual Cash Counted in Drawer (Rs.)</span>
                    <input 
                      type="number" 
                      className="reg-input-num actual-input"
                      value={actualCashInput}
                      onChange={(e) => setActualCashInput(e.target.value)}
                    />
                  </div>
                </div>

                {/* Variance Alert Box */}
                <div className={`variance-alert-box ${variance === 0 ? 'variance-zero' : variance > 0 ? 'variance-surplus' : 'variance-shortage'}`}>
                  <div>
                    <strong>CASH DRAWER VARIANCE:</strong>
                    <span>
                      {variance === 0 
                        ? '✅ Perfect Match! Register is balanced cleanly.' 
                        : variance > 0 
                          ? `⚠️ Surplus: +Rs. ${variance.toLocaleString()} extra in drawer.` 
                          : `🚨 Shortage: -Rs. ${Math.abs(variance).toLocaleString()} missing from drawer!`}
                    </span>
                  </div>
                  <div className="variance-val">Rs. {variance}</div>
                </div>

                <div className="form-group margin-top-15">
                  <label>Shift Closing Manager Notes / Reason for Discrepancy:</label>
                  <textarea 
                    rows={2} 
                    className="reg-textarea"
                    value={registerNotes}
                    onChange={(e) => setRegisterNotes(e.target.value)}
                    placeholder="Enter notes regarding petty cash receipts, driver payouts, or cash drawer comments..."
                  />
                </div>

                <button className="btn-complete-pos btn-save-register" onClick={handleSaveRegisterBalancing}>
                  <CheckCircle size={16} /> Reconcile Cash & Close Shift Register
                </button>
              </div>

              {/* Right Column: Digital & Total Payment Breakdown */}
              <div className="register-summary-panel">
                <h4>Payment Gateway Breakdown Today</h4>
                <p>Non-cash digital collections verified against merchant bank terminals.</p>

                <div className="digital-cards-list">
                  <div className="digi-card">
                    <div className="digi-icon green-bg"><DollarSign size={18} /></div>
                    <div>
                      <small>Total Cash Collected (POS + COD)</small>
                      <strong>Rs. {(registerData.posCashSales + registerData.codCashCollected).toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="digi-card">
                    <div className="digi-icon blue-bg"><Smartphone size={18} /></div>
                    <div>
                      <small>EasyPaisa / JazzCash QR</small>
                      <strong>Rs. {registerData.easypaisaQrSales.toLocaleString()}</strong>
                    </div>
                  </div>

                  <div className="digi-card">
                    <div className="digi-icon purple-bg"><CreditCard size={18} /></div>
                    <div>
                      <small>Debit / Credit Card Reader</small>
                      <strong>Rs. {registerData.cardSales.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                <div className="grand-register-total">
                  <span>Grand Total Shift Receipts</span>
                  <h2>Rs. {(registerData.posCashSales + registerData.codCashCollected + registerData.easypaisaQrSales + registerData.cardSales).toLocaleString()}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Audit Trail & Staff Logs */}
      {subTab === 'audit' && (
        <div className="analytics-tab-content">
          <div className="ops-card">
            <div className="ops-card-header">
              <div>
                <h3>Staff Activity & System Audit Trail</h3>
                <p>Immutable log recording all admin logins, rate quick-edits, stock overrides, Rx approvals, and register balance actions.</p>
              </div>

              <div className="audit-controls">
                <div className="ops-search-box">
                  <input 
                    type="text" 
                    placeholder="Search logs by staff, ID, or action..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="ops-search-input"
                  />
                </div>

                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="audit-cat-select"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Financial">Financial</option>
                  <option value="Prescription">Prescription</option>
                  <option value="Inventory">Inventory</option>
                  <option value="Fulfillment">Fulfillment</option>
                </select>
              </div>
            </div>

            <table className="admin-table audit-table">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Timestamp</th>
                  <th>Staff Member</th>
                  <th>Category</th>
                  <th>Action Type</th>
                  <th>Log Event Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuditLogs.map(log => (
                  <tr key={log.id}>
                    <td><code>{log.id}</code></td>
                    <td><small>{log.timestamp}</small></td>
                    <td><strong>{log.staff}</strong></td>
                    <td>
                      <span className={`cat-pill cat-${log.category.toLowerCase()}`}>
                        {log.category}
                      </span>
                    </td>
                    <td>
                      <span className={`severity-tag severity-${log.severity}`}>
                        {log.actionType}
                      </span>
                    </td>
                    <td>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
