const outlets = [
  {
    name: 'Starbucks Downtown',
    description: 'Starbucks coffee shop in downtown area',
    address: {
      street: '789 Downtown Blvd',
      city: 'City',
      state: 'State',
      zipCode: '12345',
      country: 'Country'
    },
    location: {
      type: 'Point',
      coordinates: [-73.9857, 40.7484] // Example coordinates
    },
    contactInfo: {
      phone: '+1234567892',
      email: 'downtown@starbucks.com'
    },
    businessHours: [
      { day: 'Monday', openTime: '07:00', closeTime: '22:00' },
      { day: 'Tuesday', openTime: '07:00', closeTime: '22:00' },
      { day: 'Wednesday', openTime: '07:00', closeTime: '22:00' },
      { day: 'Thursday', openTime: '07:00', closeTime: '22:00' },
      { day: 'Friday', openTime: '07:00', closeTime: '23:00' },
      { day: 'Saturday', openTime: '08:00', closeTime: '23:00' },
      { day: 'Sunday', openTime: '08:00', closeTime: '20:00' }
    ]
  },
  {
    name: 'Starbucks Mall',
    description: 'Starbucks coffee shop in shopping mall',
    address: {
      street: '101 Mall Street',
      city: 'City',
      state: 'State',
      zipCode: '12345',
      country: 'Country'
    },
    location: {
      type: 'Point',
      coordinates: [-73.9857, 40.7484] // Example coordinates
    },
    contactInfo: {
      phone: '+1234567893',
      email: 'mall@starbucks.com'
    },
    businessHours: [
      { day: 'Monday', openTime: '09:00', closeTime: '21:00' },
      { day: 'Tuesday', openTime: '09:00', closeTime: '21:00' },
      { day: 'Wednesday', openTime: '09:00', closeTime: '21:00' },
      { day: 'Thursday', openTime: '09:00', closeTime: '21:00' },
      { day: 'Friday', openTime: '09:00', closeTime: '21:00' },
      { day: 'Saturday', openTime: '09:00', closeTime: '21:00' },
      { day: 'Sunday', openTime: '10:00', closeTime: '18:00' }
    ]
  }
];

module.exports = outlets;
