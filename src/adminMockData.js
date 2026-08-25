export const INITIAL_PRESCRIPTIONS = [
  {
    id: 'RX-901',
    customerName: 'Muhammad Tariq',
    phone: '0301-5551234',
    address: 'House 45, Street 12, Block 5, Gulshan-e-Iqbal, Karachi',
    notes: 'Requires 2 months dose for BP medicine',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80',
    status: 'Pending', // 'Pending', 'Verified', 'Rejected'
    uploadedAt: 'Today, 11:20 AM',
    verifiedBy: null
  },
  {
    id: 'RX-902',
    customerName: 'Saima Khan',
    phone: '0333-9876543',
    address: 'Flat 4B, Sea View Apartments, Block 2, Clifton, Karachi',
    notes: 'Please check if generic alternative is available',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&q=80',
    status: 'Pending',
    uploadedAt: 'Today, 10:45 AM',
    verifiedBy: null
  }
];

export const INITIAL_FULFILLMENT_ORDERS = [
  {
    id: 'ORD-882190',
    customerName: 'Usman Ali',
    phone: '0300-1234567',
    address: 'Shop 14, Denso Hall Market, M.A Jinnah Road',
    zone: 'Saddar / Denso Hall / M.A Jinnah Road (Free Local Delivery)',
    checkoutType: 'delivery',
    items: [
      { name: 'ACORT CREAM NEW', quantity: 2, price: 170.00 },
      { name: 'BOFALGAN ING', quantity: 1, price: 212.50 }
    ],
    subtotal: 552.50,
    deliveryFee: 0,
    grandTotal: 552.50,
    requiresRx: false,
    status: 'Received',
    createdAt: 'Today, 12:10 PM'
  },
  {
    id: 'ORD-882191',
    customerName: 'Dr. Ayesha Ahmed',
    phone: '0321-4443322',
    address: 'Clinic 3, Medicare Center, Block 6, PECHS',
    zone: 'Gulshan-e-Iqbal / Gulistan-e-Johar / PECHS / Tariq Road',
    checkoutType: 'delivery',
    items: [
      { name: 'CALAMOX 625 NEW LARG', quantity: 3, price: 197.94 },
      { name: 'BARINEP EYE DROP', quantity: 1, price: 476 }
    ],
    subtotal: 1069.82,
    deliveryFee: 60,
    grandTotal: 1129.82,
    requiresRx: true,
    status: 'Pharmacist Verified / Packing',
    createdAt: 'Today, 11:55 AM'
  },
  {
    id: 'ORD-882192',
    customerName: 'Tariq Mehmood',
    phone: '0333-8877665',
    address: 'Apt 4B, Creek Vista, Phase 8, DHA',
    zone: 'Clifton / DHA (Defence) / Kharadar / Garden / Burns Road',
    checkoutType: 'delivery',
    items: [
      { name: 'ACEFYL COUGH SYRUP', quantity: 1, price: 169.15 },
      { name: 'ACENAC 100MG TABLET', quantity: 2, price: 467.50 }
    ],
    subtotal: 1104.15,
    deliveryFee: 80,
    grandTotal: 1184.15,
    requiresRx: false,
    status: 'Out for Delivery',
    createdAt: 'Today, 10:30 AM'
  },
  {
    id: 'ORD-882193',
    customerName: 'Saima Khan',
    phone: '0312-5544332',
    address: 'House 88, Block C, North Nazimabad',
    zone: 'North Nazimabad / Nazimabad / Federal B Area / Liaquatabad',
    checkoutType: 'delivery',
    items: [
      { name: 'ACNE MED CREAM', quantity: 1, price: 416.50 }
    ],
    subtotal: 416.50,
    deliveryFee: 80,
    grandTotal: 496.50,
    requiresRx: false,
    status: 'Delivered',
    createdAt: 'Today, 09:15 AM'
  }
];
