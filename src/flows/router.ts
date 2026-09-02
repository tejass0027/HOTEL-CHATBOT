import type { WhatsAppInboundMessage } from "../types/whatsapp";
import { sendMessage } from "../whatsapp/send";
import { sendMainMenu, MAIN_MENU_PREFIX } from "./mainMenu";
import { sendMenu as sendFoodMenu } from "../ordering/menu";
import { handleOrderingMessage } from "../ordering/flow";
import { findActiveOrder } from "../db/orderQueries";

const GREETINGS = new Set(["hi", "hello", "hey", "hii", "menu", "start", "help"]);

function isGreeting(text: string): boolean {
  return GREETINGS.has(text.trim().toLowerCase());
}

// Features not built yet (see project plan) — tapping these gives a clear
// "not yet" reply instead of silently doing nothing.
const COMING_SOON: Record<string, string> = {
  hotel_info: "Hotel info is coming soon — for now, please contact the front desk directly.",
  book_room: "Room booking requests are coming soon — for now, please contact the front desk.",
  request_service: "Service requests are coming soon — for now, please contact the front desk.",
  talk_to_staff: "Staff handoff is coming soon — for now, please contact the front desk directly.",
};

/**
 * Top-level entry point for every inbound message: owns the greeting →
 * main menu → feature routing. Anything it doesn't own itself (cart taps,
 * checkout buttons) falls through to handleOrderingMessage.
 */
export async function routeInboundMessage(
  message: WhatsAppInboundMessage,
  guestId: string,
  conversationId: string
): Promise<boolean> {
  const to = message.from;

  if (message.type === "interactive") {
    const listId = message.interactive?.list_reply?.id;

    if (listId?.startsWith(MAIN_MENU_PREFIX)) {
      const option = listId.slice(MAIN_MENU_PREFIX.length);

      if (option === "order_food") {
        await sendFoodMenu(to, conversationId);
        return true;
      }

      const stubReply = COMING_SOON[option];
      if (stubReply) {
        await sendMessage(to, conversationId, { type: "text", body: stubReply });
        return true;
      }
    }
  }

  if (message.type === "text" && isGreeting(message.text?.body ?? "")) {
    const activeOrder = await findActiveOrder(guestId);
    if (activeOrder?.status === "AWAITING_PAYMENT") {
      await sendMessage(to, conversationId, {
        type: "text",
        body: `You already have an order awaiting payment: ${activeOrder.paymentLinkUrl}`,
      });
      return true;
    }
    await sendMainMenu(to, conversationId);
    return true;
  }

  return handleOrderingMessage(message, guestId, conversationId);
}
