const users = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: '123456',
    isAdmin: false,
    isPartnerAdmin: false
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: '123456',
    isAdmin: true,
    isPartnerAdmin: false
  },
  {
    name: 'Partner Admin',
    email: 'partner@example.com',
    password: '123456',
    isAdmin: false,
    isPartnerAdmin: true
  }
];

module.exports = users;
