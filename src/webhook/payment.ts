import { Router, Request, Response } from "express";
import { paymentProvider } from "../payments";
import { findOrderByPaymentReference, markOrderPaidIfAwaiting } from "../db/orderQueries";
import { sendMessage } from "../whatsapp/send";
import { notifyOwnerOfPaidOrder } from "../staff/notify";
import { log } from "../logger";
import type { PaymentWebhookEvent } from "../payments/provider";

export const paymentWebhookRouter = Router();

paymentWebhookRouter.post("/", (req: Request, res: Response) => {
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!rawBody) {
    res.sendStatus(400);
    return;
  }

  const event = paymentProvider.verifyAndParseWebhook(rawBody, req.headers);
  if (!event) {
    log("Rejected payment webhook: failed verification/parse");
    res.sendStatus(401);
    return;
  }

  // Ack immediately, same as the WhatsApp webhook — process after responding.
  res.sendStatus(200);

  processPaymentEvent(event).catch((err) => {
    log("Error processing payment webhook", { error: String(err) });
  });
});

async function processPaymentEvent(event: PaymentWebhookEvent): Promise<void> {
  const order = await findOrderByPaymentReference(event.reference);
  if (!order) {
    log("Payment webhook: no order found for reference", { reference: event.reference });
    return;
  }

  if (event.status === "failed") {
    await sendMessage(order.guest.phone, order.conversationId, {
      type: "text",
      body: "Your payment didn't go through — please try checking out again, or contact the front desk.",
    });
    return;
  }

  const paidOrder = await markOrderPaidIfAwaiting(order.id);
  if (!paidOrder) {
    // Already PAID (or otherwise no longer AWAITING_PAYMENT) — a redelivered
    // webhook, not a new event. Don't re-send the guest/owner messages.
    log("Payment webhook: order already settled, skipping", { orderId: order.id });
    return;
  }

  await sendMessage(order.guest.phone, order.conversationId, {
    type: "text",
    body: "Payment received! Your order is confirmed — we'll have it ready for pickup shortly.",
  });

  await notifyOwnerOfPaidOrder(paidOrder).catch((err) =>
    log("Failed to notify owner of paid order", { error: String(err), orderId: order.id })
  );
}
