export const FINANCIAL_SUMMARY = {
  todayRevenue: 0,
  yesterdayRevenue: 0,
  todayNetProfit: 0,
  grossMarginPercent: 0.0,
  onlineSalesRevenue: 0,
  counterPosRevenue: 0,
  totalInventoryCost: 0,
  totalInventoryRetail: 0,
  totalTransactionsCount: 0
};

export const WEEKLY_SALES_TREND = [
  { day: 'Mon', revenue: 0, profit: 0, pos: 0, online: 0 },
  { day: 'Tue', revenue: 0, profit: 0, pos: 0, online: 0 },
  { day: 'Wed', revenue: 0, profit: 0, pos: 0, online: 0 },
  { day: 'Thu', revenue: 0, profit: 0, pos: 0, online: 0 },
  { day: 'Fri', revenue: 0, profit: 0, pos: 0, online: 0 },
  { day: 'Sat', revenue: 0, profit: 0, pos: 0, online: 0 },
  { day: 'Sun', revenue: 0, profit: 0, pos: 0, online: 0 }
];

export const CATEGORY_MARGINS = [];

export const TOP_PROFIT_PRODUCTS = [];

export const INITIAL_REGISTER_BALANCING = {
  shiftDate: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
  staffName: 'Dr. Waqas (Pharmacist Lead)',
  openingCash: 0,
  posCashSales: 0,
  codCashCollected: 0,
  easypaisaQrSales: 0,
  cardSales: 0,
  cashExpenses: 0,
  expectedEndingCash: 0,
  actualCashInDrawer: 0,
  notes: 'Register initialized. Ready for shift sales.'
};

export const INITIAL_AUDIT_LOGS = [
  {
    id: 'LOG-1001',
    timestamp: 'Initial Setup',
    staff: 'Dr. Waqas (Chief Pharmacist)',
    actionType: 'SYSTEM_READY',
    category: 'System',
    details: 'Pharmacy POS Terminal & Inventory Management System initialized and ready for production operations.',
    severity: 'success'
  }
];

