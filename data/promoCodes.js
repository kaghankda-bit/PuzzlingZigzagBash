const promoCodes = [
  {
    code: 'SAVE10',
    discountType: 'percentage',
    discountValue: 10,
    maxUses: 100,
    timesUsed: 0,
    isActive: true,
    validUntil: new Date(new Date().setMonth(new Date().getMonth() + 1))
  },
  {
    code: 'SAVE20',
    discountType: 'percentage',
    discountValue: 20,
    maxUses: 50,
    timesUsed: 0,
    isActive: true,
    validUntil: new Date(new Date().setMonth(new Date().getMonth() + 1))
  },
  {
    code: 'WELCOME5',
    discountType: 'percentage',
    discountValue: 5,
    maxUses: 200,
    timesUsed: 0,
    isActive: true,
    validUntil: new Date(new Date().setDate(new Date().getDate() + 7))
  }
];

module.exports = promoCodes;
