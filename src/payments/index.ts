import { PaymentProvider } from "./provider";
import { stubPaymentProvider } from "./stubProvider";

// Swap this for a real adapter (Razorpay/Stripe/etc.) once a gateway is chosen.
export const paymentProvider: PaymentProvider = stubPaymentProvider;
