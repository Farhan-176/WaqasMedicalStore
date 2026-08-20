export const FINANCIAL_SUMMARY = {
  todayRevenue: 48590,
  yesterdayRevenue: 42100,
  todayNetProfit: 11660,
  grossMarginPercent: 24.0,
  onlineSalesRevenue: 18450,
  counterPosRevenue: 30140,
  totalInventoryCost: 845000,
  totalInventoryRetail: 1120000,
  totalTransactionsCount: 142
};

export const WEEKLY_SALES_TREND = [
  { day: 'Mon', revenue: 38400, profit: 9200, pos: 24000, online: 14400 },
  { day: 'Tue', revenue: 41200, profit: 9900, pos: 26000, online: 15200 },
  { day: 'Wed', revenue: 39500, profit: 9480, pos: 25500, online: 14000 },
  { day: 'Thu', revenue: 45800, profit: 11000, pos: 29000, online: 16800 },
  { day: 'Fri', revenue: 52100, profit: 12500, pos: 33000, online: 19100 },
  { day: 'Sat', revenue: 49800, profit: 11950, pos: 31500, online: 18300 },
  { day: 'Sun', revenue: 48590, profit: 11660, pos: 30140, online: 18450 }
];

export const CATEGORY_MARGINS = [
  { id: 'medicines', category: 'Medicines', revenue: 26400, cost: 20500, profit: 5900, margin: '22.3%' },
  { id: 'baby-care', category: 'Baby Care', revenue: 11200, cost: 8900, profit: 2300, margin: '20.5%' },
  { id: 'hygiene', category: 'Hygiene & Personal', revenue: 6400, cost: 4400, profit: 2000, margin: '31.2%' },
  { id: 'otc-first-aid', category: 'OTC & First Aid', revenue: 4590, cost: 3130, profit: 1460, margin: '31.8%' }
];

export const TOP_PROFIT_PRODUCTS = [
  { name: 'CALAMOX 625 NEW LARG', salesQty: 28, revenue: 5542.32, cost: 4480, profit: 1062.32, margin: '19.2%' },
  { name: 'ACORT CREAM NEW', salesQty: 32, revenue: 5440, cost: 4160, profit: 1280, margin: '23.5%' },
  { name: 'BARINEP EYE DROP', salesQty: 12, revenue: 5712, cost: 4200, profit: 1512, margin: '26.5%' },
  { name: 'ADMIT 50/500 TAB', salesQty: 15, revenue: 5737.5, cost: 4500, profit: 1237.5, margin: '21.5%' },
  { name: 'BOFALGAN ING', salesQty: 22, revenue: 4675, cost: 3520, profit: 1155, margin: '24.7%' }
];

export const INITIAL_REGISTER_BALANCING = {
  shiftDate: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
  staffName: 'Dr. Waqas (Pharmacist Lead)',
  openingCash: 5000,
  posCashSales: 21640,
  codCashCollected: 8500,
  easypaisaQrSales: 4500,
  cardSales: 4000,
  cashExpenses: 1200, // payouts/petty cash
  expectedEndingCash: 33940, // opening (5000) + posCash (21640) + cod (8500) - expenses (1200) = 33940
  actualCashInDrawer: 33940,
  notes: 'Shift balanced cleanly. Rs. 1,200 paid for local distilled water supply batch.'
};

export const INITIAL_AUDIT_LOGS = [
  {
    id: 'LOG-1049',
    timestamp: 'Today, 06:15 PM',
    staff: 'Dr. Waqas (Admin)',
    actionType: 'REGISTER_CLOSE',
    category: 'Financial',
    details: 'Shift register balanced & verified. Expected: Rs. 33,940 | Actual: Rs. 33,940',
    severity: 'info'
  },
  {
    id: 'LOG-1048',
    timestamp: 'Today, 05:40 PM',
    staff: 'Pharmacist Tariq',
    actionType: 'RX_VERIFIED',
    category: 'Prescription',
    details: 'Verified Prescription RX-901 for customer Muhammad Tariq',
    severity: 'success'
  },
  {
    id: 'LOG-1047',
    timestamp: 'Today, 04:22 PM',
    staff: 'Dr. Waqas (Admin)',
    actionType: 'PRICE_EDIT',
    category: 'Inventory',
    details: 'Updated Trade Price for "CALAMOX 625" from Rs. 190.00 to Rs. 197.94',
    severity: 'warning'
  },
  {
    id: 'LOG-1046',
    timestamp: 'Today, 02:15 PM',
    staff: 'Pharmacist Tariq',
    actionType: 'ORDER_STAGE',
    category: 'Fulfillment',
    details: 'Order ORD-882190 marked as "Out for Delivery"',
    severity: 'info'
  },
  {
    id: 'LOG-1045',
    timestamp: 'Today, 11:30 AM',
    staff: 'Dr. Waqas (Admin)',
    actionType: 'BULK_PRICING',
    category: 'Financial',
    details: 'Applied +5% price adjustment across category: Hygiene & Personal',
    severity: 'warning'
  }
];
