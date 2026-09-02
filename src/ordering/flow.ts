import type { WhatsAppInboundMessage } from "../types/whatsapp";
import { sendMessage } from "../whatsapp/send";
import { sendMenu } from "./menu";
import { addItemToCart, sendCartSummary } from "./cart";
import { checkoutOrder } from "./checkout";
import { findActiveOrder, cancelOrder } from "../db/orderQueries";

const MENU_ITEM_PREFIX = "menu:";

/**
 * Handles the food-ordering-specific interactive replies (menu row taps,
 * cart buttons). The main greeting/menu entry point lives in
 * src/flows/router.ts, which calls this for anything it doesn't own itself.
 * Returns whether it recognized and responded to the message.
 */
export async function handleOrderingMessage(
  message: WhatsAppInboundMessage,
  guestId: string,
  conversationId: string
): Promise<boolean> {
  const to = message.from;

  if (message.type !== "interactive") {
    return false;
  }

  const listId = message.interactive?.list_reply?.id;
  const buttonId = message.interactive?.button_reply?.id;

  if (listId?.startsWith(MENU_ITEM_PREFIX)) {
    const menuItemId = listId.slice(MENU_ITEM_PREFIX.length);
    const result = await addItemToCart(guestId, conversationId, menuItemId);
    if ("error" in result) {
      await sendMessage(to, conversationId, { type: "text", body: result.error });
      return true;
    }
    await sendCartSummary(to, conversationId, result.orderId);
    return true;
  }

  if (buttonId === "cart_add_more") {
    await sendMenu(to, conversationId);
    return true;
  }

  if (buttonId === "cart_checkout") {
    const order = await findActiveOrder(guestId);
    if (!order) {
      await sendMessage(to, conversationId, {
        type: "text",
        body: "Your cart is empty — say 'hi' to see the menu.",
      });
      return true;
    }
    await checkoutOrder(to, conversationId, order.id);
    return true;
  }

  if (buttonId === "cart_clear") {
    const order = await findActiveOrder(guestId);
    if (order) await cancelOrder(order.id);
    await sendMessage(to, conversationId, {
      type: "text",
      body: "Cart cleared. Say 'hi' any time to start a new order.",
    });
    return true;
  }

  return false;
}
