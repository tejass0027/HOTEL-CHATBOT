import { PaymentProvider, CreatePaymentLinkParams, PaymentLink, PaymentWebhookEvent } from "./provider";

/**
 * Placeholder until a real gateway (Razorpay, Stripe, etc.) is chosen. The
 * "link" returned here does NOT process any real payment — it exists so the
 * checkout flow is fully wired and testable end-to-end. Swap the export in
 * src/payments/index.ts for a real adapter once a gateway is picked; nothing
 * else in the ordering flow needs to change.
 *
 * verifyAndParseWebhook has NO real signature check, since there's no real
 * gateway secret to check against — it's only here so POST /webhooks/payment
 * can be exercised manually (e.g. via curl) while testing the rest of the
 * flow. A real adapter MUST verify a signature header before trusting the
 * body, or anyone could POST a fake "paid" event for any order.
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

  verifyAndParseWebhook(rawBody: Buffer): PaymentWebhookEvent | null {
    try {
      const body = JSON.parse(rawBody.toString("utf-8"));
      if (
        typeof body.reference === "string" &&
        (body.status === "paid" || body.status === "failed")
      ) {
        return { reference: body.reference, status: body.status };
      }
      return null;
    } catch {
      return null;
    }
  },
};
