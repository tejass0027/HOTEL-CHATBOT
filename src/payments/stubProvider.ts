import { PaymentProvider, CreatePaymentLinkParams, PaymentLink } from "./provider";

/**
 * Placeholder until a real gateway (Razorpay, Stripe, etc.) is chosen. The
 * "link" returned here does NOT process any real payment — it exists so the
 * checkout flow is fully wired and testable end-to-end. Swap the export in
 * src/payments/index.ts for a real adapter once a gateway is picked; nothing
 * else in the ordering flow needs to change.
 */
export const stubPaymentProvider: PaymentProvider = {
  name: "stub",
  async createPaymentLink(params: CreatePaymentLinkParams): Promise<PaymentLink> {
    const reference = `stub_${params.orderId}`;
    return {
      reference,
      url: `https://example.com/pay/${reference}`,
    };
  },
};
