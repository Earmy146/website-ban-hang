export const initialCoupons = [
  {
    id: 'coup-1',
    code: 'HELLO10',
    discountType: 'Phần trăm (%)',
    value: 10,
    minSpend: 40.00,
    eligibility: 'Khách hàng mới',
    status: 'Active',
    usageCount: 184,
    usageLimit: 500,
    startDate: '01 Thg 1, 2026',
    endDate: '31 Thg 12, 2026'
  },
  {
    id: 'coup-2',
    code: 'SUMMER15',
    discountType: 'Phần trăm (%)',
    value: 15,
    minSpend: 75.00,
    eligibility: 'Tất cả mọi người',
    status: 'Scheduled',
    usageCount: 0,
    usageLimit: 300,
    startDate: '01 Thg 6, 2026',
    endDate: '31 Thg 8, 2026'
  },
  {
    id: 'coup-3',
    code: 'WELCOME20',
    discountType: 'Số tiền cố định ($)',
    value: 20,
    minSpend: 120.00,
    eligibility: 'Khách hàng mới',
    status: 'Active',
    usageCount: 219,
    usageLimit: 250,
    startDate: '15 Thg 2, 2026',
    endDate: '30 Thg 11, 2026'
  },
  {
    id: 'coup-4',
    code: 'SHIPFREE',
    discountType: 'Miễn phí vận chuyển',
    value: 0,
    minSpend: 90.00,
    eligibility: 'Khách hàng quen',
    status: 'Active',
    usageCount: 100,
    usageLimit: 100,
    startDate: '01 Thg 3, 2026',
    endDate: '30 Thg 9, 2026'
  }
];

