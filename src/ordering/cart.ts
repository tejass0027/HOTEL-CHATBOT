import { getMenuItem } from "../../config/menu";
import { toMinorUnits, formatMoney } from "../lib/money";
import { sendMessage } from "../whatsapp/send";
import {
  findOrCreateDraftOrder,
  addOrderItem as addOrderItemDb,
  getOrderWithItems,
} from "../db/orderQueries";

export async function addItemToCart(
  guestId: string,
  conversationId: string,
  menuItemId: string
): Promise<{ orderId: string } | { error: string }> {
  const menuItem = getMenuItem(menuItemId);
  if (!menuItem || !menuItem.available) {
    return { error: "Sorry, that item isn't available right now." };
  }

  const order = await findOrCreateDraftOrder(guestId, conversationId);
  await addOrderItemDb(order.id, menuItem.id, menuItem.name, toMinorUnits(menuItem.price));
  return { orderId: order.id };
}

export async function sendCartSummary(to: string, conversationId: string, orderId: string): Promise<void> {
  const order = await getOrderWithItems(orderId);

  const lines = order.items.map(
    (item) =>
      `${item.quantity}x ${item.name} — ${formatMoney(item.unitPriceMinor * item.quantity, order.currency)}`
  );
  const bodyText = `${lines.join("\n")}\n\nTotal: ${formatMoney(order.totalMinor, order.currency)}`;

  await sendMessage(to, conversationId, {
    type: "buttons",
    bodyText,
    buttons: [
      { id: "cart_add_more", title: "Add more" },
      { id: "cart_checkout", title: "Checkout" },
      { id: "cart_clear", title: "Clear cart" },
    ],
  });
}
