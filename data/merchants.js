const merchants = [
  {
    name: 'Starbucks',
    logo: '/uploads/sample/starbucks-logo.png',
    coverImage: '/uploads/sample/starbucks-cover.jpg',
    description: 'Welcome to Starbucks, a global coffeehouse chain that has been enchanting coffee lovers since 1971. Renowned for our commitment to quality coffee, ethically sourced beans, and a warm ambiance, Starbucks is not just a coffee destination; it’s a community.',
    category: 'Food & Drinks',
    isPopular: true,
    locations: [
      {
        name: 'Starbucks - Times Square',
        address: '1500 Broadway, New York, NY 10036',
        phone: '(212) 555-1234',
        openingHours: '6:00 - 22:00',
        location: {
          type: 'Point',
          coordinates: [-73.985130, 40.758896]
        },
        category: 'Food & Drinks'
      },
      {
        name: 'Starbucks - Central Park West',
        address: '1700 Central Park West, New York, NY 10023',
        phone: '(212) 555-5678',
        openingHours: 'CLOSED',
        location: {
          type: 'Point',
          coordinates: [-73.9718, 40.7781]
        },
        category: 'Food & Drinks'
      }
    ]
  },
  {
    name: 'McDonalds',
    logo: '/uploads/sample/mcdonalds-logo.png',
    coverImage: '/uploads/sample/mcdonalds-cover.jpg',
    description: 'McDonald\'s is the world\'s largest restaurant chain by revenue, serving over 69 million customers daily in over 100 countries.',
    category: 'Food & Drinks',
    isPopular: true,
    locations: [
      {
        name: 'McDonalds - Grand Central',
        address: '42nd St, New York, NY 10017',
        phone: '(212) 555-8888',
        openingHours: '24 Hours',
        location: {
          type: 'Point',
          coordinates: [-73.9772, 40.7527]
        },
        category: 'Food & Drinks'
      }
    ]
  },
  {
    name: 'Nike',
    logo: '/uploads/sample/nike-logo.png',
    coverImage: '/uploads/sample/nike-cover.jpg',
    description: 'Nike, Inc. is an American multinational corporation that is engaged in the design, development, manufacturing, and worldwide marketing and sales of footwear, apparel, equipment, accessories, and services.',
    category: 'Fashion',
    isPopular: true,
    locations: [
      {
        name: 'Nike - 5th Avenue',
        address: '650 5th Ave, New York, NY 10019',
        phone: '(212) 555-6453',
        openingHours: '10:00 - 20:00',
        location: {
          type: 'Point',
          coordinates: [-73.9761, 40.7613]
        },
        category: 'Fashion'
      }
    ]
  },
  {
    name: 'Airbnb',
    logo: '/uploads/sample/airbnb-logo.png',
    coverImage: '/uploads/sample/airbnb-cover.jpg',
    description: 'Airbnb, Inc. is an American company that operates an online marketplace for lodging, primarily homestays for vacation rentals, and tourism activities.',
    category: 'Travel',
    isPopular: true,
    locations: []
  }
];

module.exports = merchants;
