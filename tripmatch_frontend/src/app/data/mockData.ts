export interface Trip {
  id: string;
  title: string;
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  budget: number;
  status: 'draft' | 'published' | 'active' | 'completed';
  image: string;
  description: string;
  travelStyle: string;
  travelers: number;
  offersCount: number;
  days: number;
}

export interface TravelRequest {
  id: string;
  tripId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  budget: number;
  travelType: string;
  description: string;
  activities: string[];
  image: string;
  status: 'open' | 'closed' | 'matched';
  publishedAt: string;
  offersCount: number;
  travelers: number;
  days: number;
}

export interface Activity {
  id: string;
  time: string;
  title: string;
  description: string;
  location: string;
  duration: string;
  cost: number;
  type: 'transport' | 'accommodation' | 'food' | 'activity' | 'sightseeing';
}

export interface ItineraryDay {
  day: number;
  date: string;
  title: string;
  activities: Activity[];
}

export interface Offer {
  id: string;
  requestId: string;
  agencyId: string;
  agencyName: string;
  agencyLogo: string;
  agencyRating: number;
  agencyReviews: number;
  agencyVerified: boolean;
  price: number;
  originalPrice?: number;
  status: 'pending' | 'accepted' | 'rejected' | 'changes_requested';
  highlights: string[];
  accommodation: string;
  transport: string;
  itinerary: ItineraryDay[];
  includes: string[];
  excludes: string[];
  notes: string;
  validUntil: string;
  createdAt: string;
  destination: string;
  image: string;
  duration: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'traveler' | 'agency' | 'admin';
  status: 'active' | 'blocked' | 'pending';
  joinedAt: string;
  tripsCount: number;
  offersCount: number;
  verified: boolean;
  country: string;
}

export interface BudgetCategory {
  name: string;
  allocated: number;
  spent: number;
  color: string;
  icon: string;
}

// ---- TRIPS ----
export const mockTrips: Trip[] = [
  {
    id: 't1',
    title: 'Tropical Bali Escape',
    destination: 'Bali',
    country: 'Indonesia',
    startDate: '2026-04-15',
    endDate: '2026-04-25',
    budget: 3500,
    status: 'published',
    image: 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=600&h=400&fit=crop',
    description: 'A relaxing 10-day trip to Bali with temple visits, rice terrace walks, and sunset beach time.',
    travelStyle: 'Cultural & Relaxation',
    travelers: 2,
    offersCount: 4,
    days: 10,
  },
  {
    id: 't2',
    title: 'Greek Island Hopping',
    destination: 'Santorini',
    country: 'Greece',
    startDate: '2026-06-10',
    endDate: '2026-06-22',
    budget: 5200,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1758839603414-89d170c4eea0?w=600&h=400&fit=crop',
    description: 'Exploring Santorini, Mykonos and Rhodes. Looking for authentic experiences and fine dining.',
    travelStyle: 'Luxury & Culture',
    travelers: 2,
    offersCount: 7,
    days: 12,
  },
  {
    id: 't3',
    title: 'Tokyo Adventure',
    destination: 'Tokyo',
    country: 'Japan',
    startDate: '2026-08-01',
    endDate: '2026-08-10',
    budget: 4800,
    status: 'draft',
    image: 'https://images.unsplash.com/photo-1608339759414-36b34c722dd6?w=600&h=400&fit=crop',
    description: 'Immersive Tokyo experience — street food, tech culture, anime districts, and day trips.',
    travelStyle: 'Adventure & Food',
    travelers: 1,
    offersCount: 0,
    days: 9,
  },
  {
    id: 't4',
    title: 'Maldives Honeymoon',
    destination: 'Maldives',
    country: 'Maldives',
    startDate: '2026-02-14',
    endDate: '2026-02-21',
    budget: 8000,
    status: 'completed',
    image: 'https://images.unsplash.com/photo-1758717152007-6a2eb7299409?w=600&h=400&fit=crop',
    description: 'Romantic overwater bungalow getaway with diving, spa, and candlelit dinners.',
    travelStyle: 'Luxury & Romance',
    travelers: 2,
    offersCount: 5,
    days: 7,
  },
];

// ---- MARKETPLACE REQUESTS ----
export const mockRequests: TravelRequest[] = [
  {
    id: 'r1',
    tripId: 't1',
    userId: 'u1',
    userName: 'Alex Johnson',
    userAvatar: 'https://images.unsplash.com/photo-1691274149778-162107694838?w=60&h=60&fit=crop&crop=face',
    destination: 'Bali',
    country: 'Indonesia',
    startDate: '2026-04-15',
    endDate: '2026-04-25',
    budget: 3500,
    travelType: 'Cultural & Relaxation',
    description: 'Looking for a 10-day Bali experience with temple tours, rice terrace treks, and beach time. 2 adults, mid-range accommodation.',
    activities: ['Temple Visits', 'Rice Terrace Walks', 'Surfing', 'Spa', 'Cooking Class'],
    image: 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=600&h=400&fit=crop',
    status: 'open',
    publishedAt: '2026-03-10',
    offersCount: 4,
    travelers: 2,
    days: 10,
  },
  {
    id: 'r2',
    tripId: 't2',
    userId: 'u2',
    userName: 'Sarah Chen',
    userAvatar: 'https://images.unsplash.com/photo-1762331660187-4251d9eeed74?w=60&h=60&fit=crop&crop=face',
    destination: 'Santorini',
    country: 'Greece',
    startDate: '2026-06-10',
    endDate: '2026-06-22',
    budget: 5200,
    travelType: 'Luxury & Culture',
    description: 'Honeymoon trip to Santorini and Mykonos. Seeking luxury hotels, private yacht tours, and fine dining.',
    activities: ['Yacht Charter', 'Wine Tasting', 'Caldera Views', 'Fine Dining', 'Photography Tours'],
    image: 'https://images.unsplash.com/photo-1758839603414-89d170c4eea0?w=600&h=400&fit=crop',
    status: 'open',
    publishedAt: '2026-03-08',
    offersCount: 7,
    travelers: 2,
    days: 12,
  },
  {
    id: 'r3',
    tripId: 't3',
    userId: 'u3',
    userName: 'Marco Rivera',
    userAvatar: '',
    destination: 'Tokyo',
    country: 'Japan',
    startDate: '2026-08-01',
    endDate: '2026-08-10',
    budget: 4800,
    travelType: 'Adventure & Food',
    description: 'Solo trip to Tokyo. Want to explore Shibuya, Harajuku, Akihabara, and day trips to Nikko and Hakone.',
    activities: ['Street Food Tours', 'Anime Districts', 'Tea Ceremony', 'Mt Fuji Day Trip', 'Sumo Wrestling'],
    image: 'https://images.unsplash.com/photo-1608339759414-36b34c722dd6?w=600&h=400&fit=crop',
    status: 'open',
    publishedAt: '2026-03-12',
    offersCount: 2,
    travelers: 1,
    days: 9,
  },
  {
    id: 'r4',
    tripId: 't4',
    userId: 'u4',
    userName: 'Emma & James',
    userAvatar: '',
    destination: 'Maldives',
    country: 'Maldives',
    startDate: '2026-09-05',
    endDate: '2026-09-12',
    budget: 7500,
    travelType: 'Luxury & Romance',
    description: 'Romantic getaway. Looking for overwater villa, private beach dinners, snorkeling and spa packages.',
    activities: ['Snorkeling', 'Spa', 'Private Dining', 'Dolphin Cruise', 'Diving'],
    image: 'https://images.unsplash.com/photo-1758717152007-6a2eb7299409?w=600&h=400&fit=crop',
    status: 'open',
    publishedAt: '2026-03-11',
    offersCount: 5,
    travelers: 2,
    days: 7,
  },
  {
    id: 'r5',
    tripId: 't5',
    userId: 'u5',
    userName: 'Liam Taylor',
    userAvatar: '',
    destination: 'Machu Picchu',
    country: 'Peru',
    startDate: '2026-07-20',
    endDate: '2026-07-30',
    budget: 3200,
    travelType: 'Adventure',
    description: 'Inca Trail trek and Machu Picchu. Looking for guided group tour, camping, and cultural immersion.',
    activities: ['Inca Trail Trek', 'Machu Picchu', 'Cusco Tour', 'Sacred Valley', 'Camping'],
    image: 'https://images.unsplash.com/photo-1762177390615-829cd3ef7c7c?w=600&h=400&fit=crop',
    status: 'open',
    publishedAt: '2026-03-09',
    offersCount: 3,
    travelers: 4,
    days: 10,
  },
];

// ---- OFFERS ----
export const mockOffers: Offer[] = [
  {
    id: 'o1',
    requestId: 'r1',
    agencyId: 'a1',
    agencyName: 'Wanderlust Travel Co.',
    agencyLogo: 'https://images.unsplash.com/photo-1749577298029-8df3bebac068?w=80&h=80&fit=crop&crop=face',
    agencyRating: 4.9,
    agencyReviews: 312,
    agencyVerified: true,
    price: 3200,
    originalPrice: 3800,
    status: 'pending',
    highlights: ['5-star Ubud villa', 'Private temple guide', 'Sunset dinner at Jimbaran Bay'],
    accommodation: 'Komaneka Bisma Resort, Ubud (5-star)',
    transport: 'Private car with driver throughout',
    itinerary: [
      {
        day: 1,
        date: '2026-04-15',
        title: 'Arrival & Ubud Orientation',
        activities: [
          { id: 'a1', time: '14:00', title: 'Airport Transfer', description: 'Private pickup from Ngurah Rai Airport', location: 'Bali Airport', duration: '1.5 hrs', cost: 40, type: 'transport' },
          { id: 'a2', time: '16:00', title: 'Hotel Check-in', description: 'Check into Komaneka Bisma Resort', location: 'Ubud', duration: '30 min', cost: 0, type: 'accommodation' },
          { id: 'a3', time: '19:00', title: 'Welcome Dinner', description: 'Traditional Balinese dinner at local warung', location: 'Ubud Center', duration: '2 hrs', cost: 45, type: 'food' },
        ],
      },
      {
        day: 2,
        date: '2026-04-16',
        title: 'Temples & Rice Terraces',
        activities: [
          { id: 'a4', time: '08:00', title: 'Tegallalang Rice Terraces', description: 'Morning walk through iconic rice paddies', location: 'Tegallalang', duration: '2 hrs', cost: 5, type: 'sightseeing' },
          { id: 'a5', time: '11:00', title: 'Pura Tirta Empul', description: 'Holy water temple purification ritual', location: 'Tampaksiring', duration: '1.5 hrs', cost: 10, type: 'sightseeing' },
          { id: 'a6', time: '15:00', title: 'Cooking Class', description: 'Learn to cook 5 traditional Balinese dishes', location: 'Ubud Cooking School', duration: '3 hrs', cost: 55, type: 'activity' },
        ],
      },
    ],
    includes: ['Accommodation (9 nights)', 'Daily breakfast', 'Private driver', 'Temple entrance fees', 'Cooking class', 'Airport transfers'],
    excludes: ['International flights', 'Travel insurance', 'Personal expenses', 'Spa treatments'],
    notes: 'We offer a 100% satisfaction guarantee. Our local guide Wayan has 15 years experience.',
    validUntil: '2026-03-30',
    createdAt: '2026-03-13',
    destination: 'Bali, Indonesia',
    image: 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=600&h=400&fit=crop',
    duration: '10 days / 9 nights',
  },
  {
    id: 'o2',
    requestId: 'r1',
    agencyId: 'a2',
    agencyName: 'Elite Voyages',
    agencyLogo: 'https://images.unsplash.com/photo-1762331660187-4251d9eeed74?w=80&h=80&fit=crop&crop=face',
    agencyRating: 4.7,
    agencyReviews: 189,
    agencyVerified: true,
    price: 2850,
    status: 'accepted',
    highlights: ['Eco-resort in Ubud jungle', 'Sunrise Batur volcano trek', 'Kecak fire dance show'],
    accommodation: 'Bambu Indah Eco-Retreat',
    transport: 'Shared transport + motorbike rental',
    itinerary: [],
    includes: ['Accommodation', 'Daily breakfast', 'Guided volcano trek', 'Cultural shows'],
    excludes: ['Flights', 'Lunches & dinners', 'Insurance'],
    notes: 'Best rated eco-resort in Ubud. Sustainable travel certified.',
    validUntil: '2026-03-28',
    createdAt: '2026-03-11',
    destination: 'Bali, Indonesia',
    image: 'https://images.unsplash.com/photo-1573790387438-4da905039392?w=600&h=400&fit=crop',
    duration: '10 days / 9 nights',
  },
  {
    id: 'o3',
    requestId: 'r2',
    agencyId: 'a3',
    agencyName: 'Mediterranean Dreams',
    agencyLogo: '',
    agencyRating: 4.8,
    agencyReviews: 245,
    agencyVerified: false,
    price: 4900,
    originalPrice: 5500,
    status: 'pending',
    highlights: ['Caldera view suite', 'Private yacht charter', 'Michelin-star dinner'],
    accommodation: 'Canaves Oia Epitome (5-star)',
    transport: 'Private yacht for island transfers',
    itinerary: [],
    includes: ['Luxury accommodation', 'Yacht charter 2 days', 'Guided tours', 'Fine dining dinner'],
    excludes: ['Flights', 'Insurance', 'Additional activities'],
    notes: 'Honeymoon package with complimentary champagne on arrival.',
    validUntil: '2026-04-01',
    createdAt: '2026-03-10',
    destination: 'Santorini, Greece',
    image: 'https://images.unsplash.com/photo-1758839603414-89d170c4eea0?w=600&h=400&fit=crop',
    duration: '12 days / 11 nights',
  },
];

// ---- ADMIN USERS ----
export const mockAdminUsers: AdminUser[] = [
  { id: 'u1', name: 'Alex Johnson', email: 'alex@example.com', role: 'traveler', status: 'active', joinedAt: '2025-11-15', tripsCount: 4, offersCount: 0, verified: true, country: 'USA' },
  { id: 'u2', name: 'Sarah Chen', email: 'sarah@example.com', role: 'traveler', status: 'active', joinedAt: '2025-12-01', tripsCount: 2, offersCount: 0, verified: true, country: 'Canada' },
  { id: 'u3', name: 'Marco Rivera', email: 'marco@example.com', role: 'traveler', status: 'active', joinedAt: '2026-01-10', tripsCount: 1, offersCount: 0, verified: false, country: 'Spain' },
  { id: 'u4', name: 'Emma Thompson', email: 'emma@example.com', role: 'traveler', status: 'blocked', joinedAt: '2025-10-20', tripsCount: 3, offersCount: 0, verified: true, country: 'UK' },
  { id: 'a1', name: 'Wanderlust Travel Co.', email: 'hello@wanderlust.travel', role: 'agency', status: 'active', joinedAt: '2025-09-01', tripsCount: 0, offersCount: 48, verified: true, country: 'USA' },
  { id: 'a2', name: 'Elite Voyages', email: 'info@elitevoyages.com', role: 'agency', status: 'active', joinedAt: '2025-10-15', tripsCount: 0, offersCount: 32, verified: true, country: 'France' },
  { id: 'a3', name: 'Mediterranean Dreams', email: 'contact@meddreams.gr', role: 'agency', status: 'pending', joinedAt: '2026-02-28', tripsCount: 0, offersCount: 5, verified: false, country: 'Greece' },
  { id: 'a4', name: 'Asia Pacific Tours', email: 'info@apctours.com', role: 'agency', status: 'active', joinedAt: '2025-11-20', tripsCount: 0, offersCount: 21, verified: true, country: 'Singapore' },
];

// ---- BUDGET CATEGORIES ----
export const mockBudgetCategories: BudgetCategory[] = [
  { name: 'Accommodation', allocated: 1400, spent: 1200, color: '#0EA5E9', icon: '🏨' },
  { name: 'Transport', allocated: 600, spent: 450, color: '#0D9488', icon: '✈️' },
  { name: 'Food & Dining', allocated: 700, spent: 580, color: '#F97316', icon: '🍽️' },
  { name: 'Activities', allocated: 500, spent: 320, color: '#8B5CF6', icon: '🎭' },
  { name: 'Shopping', allocated: 200, spent: 180, color: '#EC4899', icon: '🛍️' },
  { name: 'Emergency', allocated: 100, spent: 0, color: '#94A3B8', icon: '🛡️' },
];

export const statsData = {
  traveler: {
    activeTrips: 3,
    pendingOffers: 6,
    completedTrips: 8,
    totalSpent: 24500,
  },
  agency: {
    activeRequests: 47,
    offersSent: 23,
    offersAccepted: 18,
    revenue: 142000,
  },
  admin: {
    totalUsers: 1842,
    totalAgencies: 94,
    activeRequests: 312,
    monthlyRevenue: 38400,
  },
};
