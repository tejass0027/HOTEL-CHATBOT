import type { WhatsAppInboundMessage } from "../types/whatsapp";
import { sendMessage } from "../whatsapp/send";
import { sendMenu } from "./menu";
import { addItemToCart, sendCartSummary } from "./cart";
import { checkoutOrder } from "./checkout";
import { findActiveOrder, cancelOrder } from "../db/orderQueries";

const GREETINGS = new Set(["hi", "hello", "hey", "hii", "menu", "order", "start"]);
const MENU_ITEM_PREFIX = "menu:";

function isGreeting(text: string): boolean {
  return GREETINGS.has(text.trim().toLowerCase());
}

/**
 * Handles a message as part of the food-ordering flow. Returns whether it
 * recognized and responded to the message, so the caller can fall back to
 * a generic reply otherwise.
 */
export async function handleOrderingMessage(
  message: WhatsAppInboundMessage,
  guestId: string,
  conversationId: string
): Promise<boolean> {
  const to = message.from;

  if (message.type === "interactive") {
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

  if (message.type === "text") {
    const text = message.text?.body ?? "";

    if (isGreeting(text)) {
      const activeOrder = await findActiveOrder(guestId);
      if (activeOrder?.status === "AWAITING_PAYMENT") {
        await sendMessage(to, conversationId, {
          type: "text",
          body: `You already have an order awaiting payment: ${activeOrder.paymentLinkUrl}`,
        });
        return true;
      }
      await sendMenu(to, conversationId);
      return true;
    }
  }

  return false;
}
