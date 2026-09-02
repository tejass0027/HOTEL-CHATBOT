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

export interface PaymentProvider {
  name: string;
  createPaymentLink(params: CreatePaymentLinkParams): Promise<PaymentLink>;
}
