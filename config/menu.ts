// Food menu the ordering flow (cart/checkout) reads from. Edit freely.
// Prices are in whole currency units (matches `hotel.currency`), e.g. 250
// means 250 rupees — conversion to minor units (paise/cents) for order
// totals and the payment gateway happens in src/lib/money.ts, not here.

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  available: boolean;
}

export const menu: MenuItem[] = [
  {
    id: "veg-thali",
    name: "Veg Thali",
    description: "Placeholder description",
    category: "Mains",
    price: 250,
    available: true,
  },
  {
    id: "butter-chicken",
    name: "Butter Chicken",
    description: "Placeholder description",
    category: "Mains",
    price: 320,
    available: true,
  },
  {
    id: "paneer-tikka",
    name: "Paneer Tikka",
    description: "Placeholder description",
    category: "Starters",
    price: 220,
    available: true,
  },
  {
    id: "masala-chai",
    name: "Masala Chai",
    description: "Placeholder description",
    category: "Beverages",
    price: 60,
    available: true,
  },
];

export function getMenuItem(id: string): MenuItem | undefined {
  return menu.find((item) => item.id === id);
}
