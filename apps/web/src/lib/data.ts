import type {
  Traveler, Trip, TripDetail, Insight, InboxItem, Integration,
} from './types';

export const TODAY = new Date('2026-04-20');

export const TRAVELERS: Traveler[] = [
  { id: 't1', name: 'Quincy', relationship: 'self', initials: 'Q' },
  { id: 't2', name: 'Maren', relationship: 'spouse', initials: 'M' },
  { id: 't3', name: 'Ezra', relationship: 'child', initials: 'E' },
  { id: 't4', name: 'Iris', relationship: 'child', initials: 'I' },
  { id: 't5', name: 'Dev', relationship: 'friend', initials: 'D' },
];

export const TRIPS: Trip[] = [
  // DREAMING
  {
    id: 'tr-kyoto', destination: 'Kyoto', region: 'Kansai', country: 'Japan',
    stage: 'dreaming', categories: ['family'],
    start_date: null, end_date: null, date_approx: 'Spring 2027',
    budget_total: 14000, budget_spent: 0, budget_currency: 'USD',
    travelers: ['t1', 't2', 't3', 't4'],
    cover: { hue: 18, label: 'cherry·indigo' },
    notes: 'Temples, food, shinkansen day trip to Nara. Maren wants Arashiyama bamboo grove at dawn.',
    nights: 9, created_days_ago: 184, daysInStage: 184,
  },
  {
    id: 'tr-patagonia', destination: 'Patagonia', region: 'Torres del Paine', country: 'Chile',
    stage: 'dreaming', categories: ['couple'],
    start_date: null, end_date: null, date_approx: 'Nov 2026',
    budget_total: 8500, budget_spent: 0, budget_currency: 'USD',
    travelers: ['t1', 't2'],
    cover: { hue: 210, label: 'glacier·slate' },
    notes: 'W-trek, 5 days. Refugios not camping. Fly into Punta Arenas.',
    nights: 8, created_days_ago: 42, daysInStage: 42,
  },
  // PLANNING
  {
    id: 'tr-lisbon', destination: 'Lisbon', region: 'Alfama + Sintra', country: 'Portugal',
    stage: 'planning', categories: ['couple'],
    start_date: '2026-09-12', end_date: '2026-09-21', date_approx: null,
    budget_total: 6200, budget_spent: 1420, budget_currency: 'USD',
    travelers: ['t1', 't2'],
    cover: { hue: 32, label: 'tile·bougainvillea' },
    notes: 'Tenth anniversary. Day trip to Sintra. Fado night. Maren wants the seafood at Cervejaria Ramiro.',
    nights: 9, created_days_ago: 60, daysInStage: 22,
  },
  {
    id: 'tr-marrakech', destination: 'Marrakech', region: 'Medina + Atlas', country: 'Morocco',
    stage: 'planning', categories: ['friends'],
    start_date: '2026-10-22', end_date: '2026-10-29', date_approx: null,
    budget_total: 4800, budget_spent: 0, budget_currency: 'USD',
    travelers: ['t1', 't5'],
    cover: { hue: 12, label: 'saffron·rose' },
    notes: 'With Dev. Riad in medina, 2 nights in Atlas mountains.',
    nights: 7, created_days_ago: 28, daysInStage: 28,
  },
  // BOOKED
  {
    id: 'tr-iceland', destination: 'Reykjavík', region: 'Ring Road south', country: 'Iceland',
    stage: 'booked', categories: ['family'],
    start_date: '2026-07-08', end_date: '2026-07-17', date_approx: null,
    budget_total: 11200, budget_spent: 7840, budget_currency: 'USD',
    travelers: ['t1', 't2', 't3', 't4'],
    cover: { hue: 195, label: 'basalt·moss' },
    notes: 'Rented 4×4. Kids old enough for the glacier hike now.',
    nights: 9, created_days_ago: 95, daysInStage: 18,
  },
  {
    id: 'tr-hyrox', destination: 'HYROX Berlin', region: 'Messe Berlin', country: 'Germany',
    stage: 'booked', categories: ['race', 'solo'],
    start_date: '2026-06-06', end_date: '2026-06-10', date_approx: null,
    budget_total: 2400, budget_spent: 1950, budget_currency: 'USD',
    travelers: ['t1'],
    cover: { hue: 42, label: 'concrete·amber' },
    notes: 'World Championships qualifier. Arrive Thu, race Sat morning, fly back Sun.',
    nights: 4, created_days_ago: 140, daysInStage: 32,
  },
  // UPCOMING
  {
    id: 'tr-mexico', destination: 'Oaxaca', region: 'Centro Histórico', country: 'Mexico',
    stage: 'upcoming', categories: ['couple'],
    start_date: '2026-05-02', end_date: '2026-05-09', date_approx: null,
    budget_total: 4200, budget_spent: 3680, budget_currency: 'USD',
    travelers: ['t1', 't2'],
    cover: { hue: 350, label: 'cochineal·clay' },
    notes: 'Mezcal tour booked. Day of the Dead museum.',
    nights: 7, created_days_ago: 68, daysInStage: 6,
  },
  {
    id: 'tr-catskills', destination: 'Catskills', region: 'Phoenicia, NY', country: 'USA',
    stage: 'upcoming', categories: ['family'],
    start_date: '2026-04-24', end_date: '2026-04-27', date_approx: null,
    budget_total: 950, budget_spent: 820, budget_currency: 'USD',
    travelers: ['t1', 't2', 't3', 't4'],
    cover: { hue: 120, label: 'pine·granite' },
    notes: 'Cabin on Esopus Creek. Drive up Fri afternoon.',
    nights: 3, created_days_ago: 21, daysInStage: 21,
  },
  // ARCHIVED
  {
    id: 'tr-rome', destination: 'Rome', region: 'Trastevere', country: 'Italy',
    stage: 'archived', categories: ['family'],
    start_date: '2025-10-11', end_date: '2025-10-20', date_approx: null,
    budget_total: 9800, budget_spent: 10240, budget_currency: 'USD',
    travelers: ['t1', 't2', 't3', 't4'],
    cover: { hue: 25, label: 'terracotta·ochre' },
    notes: 'Came in $440 over. Gelato budget was a lie.', nights: 9,
  },
  {
    id: 'tr-boston', destination: 'Boston Marathon', region: 'Hopkinton → Boylston', country: 'USA',
    stage: 'archived', categories: ['race', 'solo'],
    start_date: '2025-04-18', end_date: '2025-04-22', date_approx: null,
    budget_total: 1800, budget_spent: 1720, budget_currency: 'USD',
    travelers: ['t1'],
    cover: { hue: 0, label: 'unicorn·asphalt' },
    notes: '3:12:44. PR by 4 minutes.', nights: 4,
  },
  {
    id: 'tr-banff', destination: 'Banff', region: 'Lake Louise', country: 'Canada',
    stage: 'archived', categories: ['couple'],
    start_date: '2025-07-03', end_date: '2025-07-10', date_approx: null,
    budget_total: 5400, budget_spent: 5180, budget_currency: 'USD',
    travelers: ['t1', 't2'],
    cover: { hue: 180, label: 'moraine·spruce' },
    notes: 'Moraine Lake sunrise. Smoke from BC fires cut day 5.', nights: 7,
  },
];

export const TRIP_DETAILS: Record<string, TripDetail> = {
  'tr-lisbon': {
    itinerary: [
      { day: 1, date: '2026-09-12', summary: 'Arrive Lisbon', activities: [
        { time: '14:30', title: 'Land at LIS', location: 'Lisbon Airport', cost: 0 },
        { time: '16:00', title: 'Check in to Memmo Alfama', location: 'Alfama', cost: 0 },
        { time: '20:00', title: 'Dinner at Taberna da Rua das Flores', location: 'Chiado', cost: 110 },
      ]},
      { day: 2, date: '2026-09-13', summary: 'Alfama walking day', activities: [
        { time: '09:00', title: 'Coffee at Dear Breakfast', cost: 18 },
        { time: '10:30', title: 'Walk Alfama · São Jorge Castle', duration: 180 },
        { time: '19:00', title: 'Fado night at Mesa de Frades', cost: 140 },
      ]},
      { day: 3, date: '2026-09-14', summary: 'Sintra day trip', activities: [
        { time: '08:15', title: 'Train to Sintra from Rossio' },
        { time: '10:00', title: 'Quinta da Regaleira', cost: 30 },
        { time: '13:00', title: 'Lunch at Incomum' },
        { time: '15:00', title: 'Pena Palace', cost: 28 },
      ]},
      { day: 4, date: '2026-09-15', summary: 'Belém + LX Factory', activities: [
        { time: '10:00', title: 'Jerónimos Monastery', cost: 22 },
        { time: '12:30', title: 'Pastéis de Belém (the real ones)' },
        { time: '15:00', title: 'LX Factory wander' },
      ]},
      { day: 5, date: '2026-09-16', summary: 'Open — beach day?', activities: [] },
      { day: 6, date: '2026-09-17', summary: 'Cascais', activities: [
        { title: 'Train to Cascais, beach, seafood lunch' },
      ]},
      { day: 7, date: '2026-09-18', summary: 'Anniversary', activities: [
        { time: '20:00', title: 'Dinner at Belcanto', cost: 420 },
      ]},
      { day: 8, date: '2026-09-19', summary: 'Day trip — Évora', activities: [] },
      { day: 9, date: '2026-09-20', summary: 'Farewell Lisbon', activities: [
        { time: '21:00', title: 'Cervejaria Ramiro', cost: 160 },
      ]},
      { day: 10, date: '2026-09-21', summary: 'Fly home', activities: [
        { time: '11:45', title: 'LIS → EWR' },
      ]},
    ],
    bookings: [
      { category: 'flight', title: 'EWR → LIS', vendor: 'TAP Portugal', status: 'done', cost: 1420, confirmation: 'TAPX8QZ2', travel_date: '2026-09-12', source: 'gmail' },
      { category: 'flight', title: 'LIS → EWR', vendor: 'TAP Portugal', status: 'done', cost: 0, confirmation: 'TAPX8QZ2', travel_date: '2026-09-21', notes: 'Same PNR' },
      { category: 'lodging', title: 'Memmo Alfama (6 nights)', vendor: 'Memmo Hotels', status: 'pending', cost: 2340, travel_date: '2026-09-12', source: 'email' },
      { category: 'lodging', title: 'Sintra · Sintra Boutique', vendor: 'Direct', status: 'todo', cost: 0, travel_date: '2026-09-17' },
      { category: 'activity', title: 'Fado · Mesa de Frades', vendor: 'Booking.com', status: 'todo', cost: 0 },
      { category: 'dining', title: 'Belcanto (anniversary)', vendor: 'SevenRooms', status: 'todo', cost: 0, notes: 'Reservations open 60 days out — July 20' },
      { category: 'transport', title: 'Airport transfer', status: 'todo', cost: 0 },
    ],
    budget_breakdown: [
      { category: 'Flights', total: 1420, spent: 1420 },
      { category: 'Lodging', total: 2800, spent: 0 },
      { category: 'Food', total: 1200, spent: 0 },
      { category: 'Activities', total: 500, spent: 0 },
      { category: 'Transport', total: 280, spent: 0 },
    ],
    packing: [
      { category: 'clothing', item: 'Linen shirts', qty: 3, packed: false },
      { category: 'clothing', item: 'Walking sandals', qty: 1, packed: false },
      { category: 'clothing', item: 'Light rain shell', qty: 1, packed: false },
      { category: 'clothing', item: 'Dinner outfit (Belcanto)', qty: 1, packed: false },
      { category: 'documents', item: 'Passports', qty: 2, packed: false },
      { category: 'documents', item: 'Printed TAP confirmation', qty: 1, packed: false },
      { category: 'electronics', item: 'EU adapter', qty: 2, packed: false },
      { category: 'electronics', item: 'Kindle', qty: 1, packed: false },
      { category: 'toiletries', item: 'Sunscreen', qty: 1, packed: false },
    ],
    documents: [
      { type: 'passport', title: 'Quincy passport', expiry: '2029-03-14' },
      { type: 'passport', title: 'Maren passport', expiry: '2027-08-02' },
      { type: 'confirmation', title: 'TAP e-ticket.pdf' },
    ],
    splits: [
      { travelerId: 't1', paid: 1200, share: 710 },
      { travelerId: 't2', paid: 220, share: 710 },
    ],
  },

  'tr-iceland': {
    itinerary: [
      { day: 1, date: '2026-07-08', summary: 'Arrive KEF', activities: [
        { time: '06:30', title: 'Land KEF, pick up 4×4', cost: 1680, duration: 120 },
        { time: '12:00', title: 'Reykjavík lunch · Matur og Drykkur' },
        { time: '15:00', title: 'Check in — 101 Hotel' },
      ]},
      { day: 2, date: '2026-07-09', summary: 'Golden Circle', activities: [
        { title: 'Þingvellir · Geysir · Gullfoss (self-drive)' },
      ]},
      { day: 3, date: '2026-07-10', summary: 'Drive to Vík', activities: [
        { title: 'Seljalandsfoss · Skógafoss · Reynisfjara black sand' },
      ]},
      { day: 4, date: '2026-07-11', summary: 'Glacier day', activities: [
        { time: '09:00', title: 'Sólheimajökull glacier hike', cost: 520 },
      ]},
      { day: 5, date: '2026-07-12', summary: 'Jökulsárlón', activities: [] },
      { day: 6, date: '2026-07-13', summary: 'Drive back west', activities: [] },
      { day: 7, date: '2026-07-14', summary: 'Snæfellsnes', activities: [] },
      { day: 8, date: '2026-07-15', summary: 'Blue Lagoon + puffins', activities: [] },
      { day: 9, date: '2026-07-16', summary: 'Reykjavík wander', activities: [] },
      { day: 10, date: '2026-07-17', summary: 'Fly home', activities: [] },
    ],
    bookings: [
      { category: 'flight', title: 'EWR → KEF (×4)', vendor: 'Icelandair', status: 'done', cost: 3120, confirmation: 'FI-7K2X9', source: 'manual' },
      { category: 'flight', title: 'KEF → EWR (×4)', vendor: 'Icelandair', status: 'done', cost: 0, confirmation: 'FI-7K2X9' },
      { category: 'lodging', title: '101 Hotel · 3 nights', vendor: 'Direct', status: 'done', cost: 1890 },
      { category: 'lodging', title: 'Hotel Vík · 3 nights', vendor: 'Booking', status: 'done', cost: 1240 },
      { category: 'lodging', title: 'Hotel Búðir · 2 nights', vendor: 'Direct', status: 'pending', cost: 980 },
      { category: 'transport', title: 'Dacia Duster 4×4 · 9 days', vendor: 'Blue Car Rental', status: 'done', cost: 1680, source: 'email' },
      { category: 'activity', title: 'Glacier hike · family of 4', vendor: 'Arctic Adventures', status: 'done', cost: 520 },
      { category: 'activity', title: 'Blue Lagoon entry', vendor: 'Direct', status: 'todo', cost: 0 },
    ],
    budget_breakdown: [
      { category: 'Flights', total: 3400, spent: 3120 },
      { category: 'Lodging', total: 4200, spent: 3130 },
      { category: 'Transport', total: 1800, spent: 1680 },
      { category: 'Activities', total: 900, spent: 520 },
      { category: 'Food', total: 900, spent: 0 },
    ],
    packing: [
      { category: 'clothing', item: 'Waterproof shells (×4)', qty: 4, packed: true },
      { category: 'clothing', item: 'Hiking boots', qty: 4, packed: true },
      { category: 'clothing', item: 'Fleece mid-layers', qty: 4, packed: false },
      { category: 'clothing', item: 'Swimsuits (Blue Lagoon)', qty: 4, packed: false },
      { category: 'clothing', item: 'Kids thermals', qty: 4, packed: false },
      { category: 'electronics', item: 'EU adapters', qty: 3, packed: false },
      { category: 'electronics', item: 'Dashcam for rental', qty: 1, packed: false },
      { category: 'documents', item: 'Passports (×4)', qty: 4, packed: false },
      { category: 'other', item: 'Motion sickness for kids', qty: 1, packed: false },
    ],
    documents: [
      { type: 'passport', title: 'Family passports (×4)', expiry: '2027-08-02' },
      { type: 'confirmation', title: 'Icelandair e-tickets.pdf' },
      { type: 'confirmation', title: 'Blue Car Rental contract.pdf' },
    ],
    splits: [
      { travelerId: 't1', paid: 4800, share: 1960 },
      { travelerId: 't2', paid: 2100, share: 1960 },
      { travelerId: 't3', paid: 640, share: 1960 },
      { travelerId: 't4', paid: 300, share: 1960 },
    ],
  },

  'tr-mexico': {
    itinerary: [
      { day: 1, date: '2026-05-02', summary: 'Arrive Oaxaca', activities: [
        { time: '11:20', title: 'EWR → OAX via MEX' },
        { time: '19:00', title: 'Dinner at Criollo' },
      ]},
      { day: 2, date: '2026-05-03', summary: 'Centro walk', activities: [
        { title: 'Zócalo · Templo de Santo Domingo · mercado 20 de Noviembre' },
      ]},
      { day: 3, date: '2026-05-04', summary: 'Hierve el Agua', activities: [
        { time: '08:00', title: 'Day trip with driver', cost: 180 },
      ]},
      { day: 4, date: '2026-05-05', summary: 'Mezcal tour', activities: [
        { time: '10:00', title: 'Mezcal palenques · Matatlán', cost: 220 },
      ]},
      { day: 5, date: '2026-05-06', summary: 'Teotitlán rugs', activities: [] },
      { day: 6, date: '2026-05-07', summary: 'Rest + cooking class', activities: [
        { time: '10:00', title: 'Casa Crespo cooking class', cost: 180 },
      ]},
      { day: 7, date: '2026-05-08', summary: 'Open', activities: [] },
      { day: 8, date: '2026-05-09', summary: 'Fly home', activities: [] },
    ],
    bookings: [
      { category: 'flight', title: 'EWR → OAX', vendor: 'Aeromexico', status: 'done', cost: 980 },
      { category: 'flight', title: 'OAX → EWR', vendor: 'Aeromexico', status: 'done', cost: 0 },
      { category: 'lodging', title: 'Casa Antonieta · 7 nights', vendor: 'Direct', status: 'done', cost: 1820 },
      { category: 'activity', title: 'Mezcal tour', vendor: 'Mezcaloteca', status: 'done', cost: 220, source: 'viator' },
      { category: 'activity', title: 'Hierve el Agua driver', vendor: 'Oaxaca Driver', status: 'done', cost: 180 },
      { category: 'activity', title: 'Casa Crespo cooking', vendor: 'Direct', status: 'done', cost: 180 },
      { category: 'dining', title: 'Criollo · opening night', vendor: 'Direct', status: 'done', cost: 0 },
    ],
    budget_breakdown: [
      { category: 'Flights', total: 1000, spent: 980 },
      { category: 'Lodging', total: 1820, spent: 1820 },
      { category: 'Activities', total: 700, spent: 580 },
      { category: 'Food', total: 500, spent: 180 },
      { category: 'Transport', total: 180, spent: 120 },
    ],
    packing: [
      { category: 'clothing', item: 'Linen shirts', qty: 3, packed: true },
      { category: 'clothing', item: 'Walking shoes', qty: 1, packed: true },
      { category: 'clothing', item: 'Sun hat', qty: 2, packed: true },
      { category: 'documents', item: 'Passports', qty: 2, packed: true },
      { category: 'documents', item: 'Printed lodging conf', qty: 1, packed: false },
      { category: 'toiletries', item: 'Sunscreen SPF 50', qty: 2, packed: true },
      { category: 'toiletries', item: 'Insect repellent', qty: 1, packed: false },
      { category: 'electronics', item: 'Type A adapter (none needed)', qty: 0, packed: true },
      { category: 'other', item: 'Pesos cash $300', qty: 1, packed: false },
    ],
    documents: [
      { type: 'passport', title: 'Quincy passport', expiry: '2029-03-14' },
      { type: 'passport', title: 'Maren passport', expiry: '2027-08-02' },
      { type: 'confirmation', title: 'Aeromexico e-ticket.pdf' },
      { type: 'confirmation', title: 'Casa Antonieta reservation.pdf' },
    ],
    splits: [
      { travelerId: 't1', paid: 2800, share: 1840 },
      { travelerId: 't2', paid: 880, share: 1840 },
    ],
  },
};

export const INSIGHTS: Insight[] = [
  { id: 'i1', trip_id: 'tr-kyoto', type: 'stage_stale', severity: 'info',
    title: 'Kyoto has been dreaming for 6 months', body: 'Ready to pick dates and move to Planning?' },
  { id: 'i2', trip_id: 'tr-lisbon', type: 'price_drop', severity: 'urgent',
    title: 'Lisbon flights dropped $180', body: 'TAP EWR→LIS Sep 12 now $1,240 (was $1,420). Rebook window: 2 days.' },
  { id: 'i3', trip_id: 'tr-iceland', type: 'passport_expiry', severity: 'warning',
    title: "Maren's passport expires 6mo after Iceland", body: 'Expires Aug 2027 — renew before July trip for Schengen buffer.' },
  { id: 'i4', trip_id: 'tr-mexico', type: 'packing_reminder', severity: 'info',
    title: 'Oaxaca packing starts in 7 days', body: 'Template loaded — 9 items, 5 still to pack.' },
  { id: 'i5', trip_id: 'tr-catskills', type: 'weather', severity: 'info',
    title: 'Catskills forecast: 58°F, showers Sat', body: 'Rain layers + boots suggested. 6 days out.' },
];

export const INBOX: InboxItem[] = [
  {
    id: 'in-1', source: 'email', vendor: 'Airbnb',
    subject: 'Reservation confirmed · Riad Dar Anika', from: 'automated@airbnb.com',
    received_ago: '12 min ago', status: 'parsed',
    parsed: { type: 'lodging', title: 'Riad Dar Anika · 4 nights', dates: 'Oct 22 – Oct 26, 2026', cost: 1240, confirmation: 'HMABCX9FTK' },
    suggested_trip: 'tr-marrakech', suggested_confidence: 0.98,
  },
  {
    id: 'in-2', source: 'gmail', vendor: 'United Airlines',
    subject: 'Your flight confirmation — EWR → LIS', from: 'Receipts@united.com',
    received_ago: '2 hours ago', status: 'parsing', parsed: null,
  },
  {
    id: 'in-3', source: 'email', vendor: 'Viator',
    subject: 'Booking confirmed · Hierve el Agua day trip', from: 'no-reply@viator.com',
    received_ago: 'yesterday', status: 'parsed',
    parsed: { type: 'activity', title: 'Hierve el Agua day tour', dates: 'May 4, 2026', cost: 180, confirmation: 'VR-8829144' },
    suggested_trip: 'tr-mexico', suggested_confidence: 0.96,
  },
  {
    id: 'in-4', source: 'extension', vendor: 'Airbnb',
    subject: 'Saved from airbnb.com — Beppu Onsen house', from: 'Chrome extension',
    received_ago: 'yesterday', status: 'pending_trip',
    parsed: { type: 'lodging', title: 'Beppu Onsen house (saved listing)', dates: '—', cost: 0, confirmation: null, note: 'Listing saved for research — $412/night' },
    suggested_trip: 'tr-kyoto', suggested_confidence: 0.72,
  },
  {
    id: 'in-5', source: 'gmail', vendor: 'OpenTable',
    subject: 'Reservation confirmed · Belcanto', from: 'no-reply@opentable.com',
    received_ago: '3 days ago', status: 'parsed',
    parsed: { type: 'dining', title: 'Belcanto · 8:00 PM, party of 2', dates: 'Sep 18, 2026', cost: 0, confirmation: 'OT-2287' },
    suggested_trip: 'tr-lisbon', suggested_confidence: 0.99,
  },
  {
    id: 'in-6', source: 'email', vendor: 'Expedia',
    subject: 'Itinerary attached · Icelandair KEF', from: 'travel@expedia.com',
    received_ago: '4 days ago', status: 'needs_review',
    parsed: { type: 'flight', title: 'Icelandair EWR → KEF (family of 4)', dates: 'Jul 8, 2026', cost: 3120, confirmation: 'FI-7K2X9' },
    suggested_trip: 'tr-iceland', suggested_confidence: 0.88,
    note: 'Already matches a booking on this trip — dedupe?',
  },
];

export const INTEGRATIONS: Integration[] = [
  { key: 'forward', name: 'Forwarding inbox', desc: 'Forward any confirmation to a dedicated address. Point Postmark, SendGrid or Cloudflare Email Routing at /api/inbox/ingest.', status: 'active', meta: 'POST /api/inbox/ingest' },
  { key: 'calendar', name: 'Calendar export', desc: 'Subscribe to your trips and confirmed bookings as an iCal feed.', status: 'active', meta: 'webcal feed' },
  { key: 'gmail', name: 'Gmail', desc: 'Read-only scan of confirmation senders. Needs an OAuth flow — not built yet.', status: 'available', meta: null },
  { key: 'airlines', name: 'Flight tracking', desc: 'Price-drop alerts and itinerary sync. Duffel is self-serve and pay-as-you-go — not wired up yet.', status: 'available', meta: null },
  { key: 'extension', name: 'Browser extension', desc: 'Save listings from Airbnb, Vrbo, Booking.com while researching. Not built yet.', status: 'available', meta: null },
  { key: 'airbnb', name: 'Airbnb', desc: 'No public API — use the forwarding inbox.', status: 'email-only', meta: null },
  { key: 'viator', name: 'Viator / GetYourGuide', desc: 'Affiliate search + deep links. Bookings come via email.', status: 'available', meta: null },
  { key: 'opentable', name: 'OpenTable', desc: 'Forwarding inbox handles reservation confirmations.', status: 'email-only', meta: null },
];
