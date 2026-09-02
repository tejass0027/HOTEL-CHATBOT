import { getOrderWithItems, markOrderAwaitingPayment } from "../db/orderQueries";
import { paymentProvider } from "../payments";
import { sendMessage } from "../whatsapp/send";
import { formatMoney } from "../lib/money";

export async function checkoutOrder(to: string, conversationId: string, orderId: string): Promise<void> {
  const order = await getOrderWithItems(orderId);

  if (order.items.length === 0) {
    await sendMessage(to, conversationId, {
      type: "text",
      body: "Your cart is empty — say 'hi' to see the menu.",
    });
    return;
  }

  const link = await paymentProvider.createPaymentLink({
    orderId: order.id,
    amountMinor: order.totalMinor,
    currency: order.currency,
    description: `Order ${order.id}`,
    guestPhone: to,
  });

  await markOrderAwaitingPayment(order.id, {
    paymentProvider: paymentProvider.name,
    paymentReference: link.reference,
    paymentLinkUrl: link.url,
  });

  await sendMessage(to, conversationId, {
    type: "text",
    body: `Total: ${formatMoney(order.totalMinor, order.currency)}\nPay here to confirm your order: ${link.url}`,
  });
}
