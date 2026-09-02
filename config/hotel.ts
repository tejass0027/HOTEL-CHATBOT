// Single source of truth for hotel facts. The agent (phase 4+) must load
// facts from here (or from a tool backed by this file) rather than having
// anything hotel-specific baked into the system prompt.
//
// Replace every placeholder value below with the real thing when you have it.

export interface RoomType {
  id: string;
  name: string;
  description: string;
  maxOccupancy: number;
  rackRatePerNight: number;
}

export const hotel = {
  name: "Placeholder Hotel Name",
  city: "Placeholder City",
  country: "Placeholder Country",
  address: "Placeholder full address, for guest-facing replies",
  currency: "USD",

  checkInTime: "15:00",
  checkOutTime: "11:00",

  supportedLanguages: ["en"] as const,

  contact: {
    frontDeskPhone: "+00 0000000000",
    email: "frontdesk@example.com",
  },

  airportDistanceKm: 0,
  airportDistanceNote: "Placeholder: e.g. '12 km, ~25 min by taxi'",

  wifi: {
    available: true,
    note: "Placeholder: e.g. 'Free wifi in all rooms and public areas'",
  },

  parking: {
    available: true,
    note: "Placeholder: e.g. 'Free self-parking on-site'",
  },

  petPolicy: "Placeholder: e.g. 'Pets under 10kg allowed, additional fee applies'",

  breakfastHours: "Placeholder: e.g. '07:00–10:30'",

  cancellationPolicy:
    "Placeholder: e.g. 'Free cancellation up to 48h before check-in; after that, first night is charged'",

  roomTypes: [
    {
      id: "standard",
      name: "Standard Room",
      description: "Placeholder description",
      maxOccupancy: 2,
      rackRatePerNight: 100,
    },
    {
      id: "deluxe",
      name: "Deluxe Room",
      description: "Placeholder description",
      maxOccupancy: 3,
      rackRatePerNight: 150,
    },
    {
      id: "suite",
      name: "Suite",
      description: "Placeholder description",
      maxOccupancy: 4,
      rackRatePerNight: 250,
    },
  ] as RoomType[],
};

export type Hotel = typeof hotel;
