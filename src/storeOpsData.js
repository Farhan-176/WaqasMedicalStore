export const INITIAL_EXPIRY_BATCHES = [
  {
    batchNo: 'BAT-2026-091',
    productName: 'ACORT CREAM NEW',
    mfgDate: '2024-03-10',
    expiryDate: '2026-09-01',
    daysRemaining: 24,
    stock: 45,
    purchaseCost: 140,
    sellingPrice: 170.00,
    supplier: 'Bosch Pharmaceuticals'
  },
  {
    batchNo: 'BAT-2026-104',
    productName: 'CALAMOX 625 NEW LARG',
    mfgDate: '2024-05-15',
    expiryDate: '2026-09-25',
    daysRemaining: 48,
    stock: 18,
    purchaseCost: 160,
    sellingPrice: 197.94,
    supplier: 'Bosch Pharmaceuticals'
  },
  {
    batchNo: 'BAT-2026-118',
    productName: 'BOFALGAN ING',
    mfgDate: '2024-01-20',
    expiryDate: '2026-10-15',
    daysRemaining: 68,
    stock: 8,
    purchaseCost: 180,
    sellingPrice: 212.50,
    supplier: 'Getz Pharma Ltd'
  }
];

export const SUPPLIERS = [
  { id: 'sup-1', name: 'GlaxoSmithKline (GSK) Pakistan', contact: '021-111-475-757', city: 'Karachi / Islamabad Hub', totalOrders: 142 },
  { id: 'sup-2', name: 'Getz Pharma Ltd', contact: '021-38641111', city: 'Karachi', totalOrders: 98 },
  { id: 'sup-3', name: 'Bosch Pharmaceuticals', contact: '021-35060641', city: 'Karachi', totalOrders: 64 },
  { id: 'sup-4', name: 'Abbott Laboratories Pakistan', contact: '021-111-222-688', city: 'Karachi', totalOrders: 110 }
];
