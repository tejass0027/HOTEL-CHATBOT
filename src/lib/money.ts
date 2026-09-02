// Order totals and payment gateway APIs (Razorpay, Stripe) work in integer
// minor units (paise/cents) to avoid floating-point rounding errors. Config
// files stay in human-friendly whole units — convert at the boundary.

export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

export function formatMoney(minorUnits: number, currency: string): string {
  const whole = (minorUnits / 100).toFixed(2);
  return `${currency} ${whole}`;
}
