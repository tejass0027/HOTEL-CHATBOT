export interface CreatePaymentLinkParams {
  orderId: string;
  amountMinor: number;
  currency: string;
  description: string;
  guestPhone: string;
}

export interface PaymentLink {
  reference: string;
  url: string;
}

export interface PaymentWebhookEvent {
  reference: string;
  status: "paid" | "failed";
}

export interface PaymentProvider {
  name: string;
  createPaymentLink(params: CreatePaymentLinkParams): Promise<PaymentLink>;
  /**
   * Verifies the webhook's authenticity (e.g. HMAC signature header check)
   * and parses it into a normalized event. MUST return null for anything
   * that fails verification — a real adapter that skips this check lets
   * anyone mark any order "paid" with a bare POST request.
   */
  verifyAndParseWebhook(
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>
  ): PaymentWebhookEvent | null;
}
