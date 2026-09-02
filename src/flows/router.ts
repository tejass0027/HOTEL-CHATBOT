import type { WhatsAppInboundMessage } from "../types/whatsapp";
import { sendMessage } from "../whatsapp/send";
import { sendMainMenu, MAIN_MENU_PREFIX } from "./mainMenu";
import { sendMenu as sendFoodMenu } from "../ordering/menu";
import { handleOrderingMessage } from "../ordering/flow";
import { startEscalation, submitEscalationMessage, PENDING_ESCALATION_MESSAGE } from "./talkToStaff";
import { findActiveOrder } from "../db/orderQueries";
import { getPendingAction } from "../db/queries";

const GREETINGS = new Set(["hi", "hello", "hey", "hii", "menu", "start", "help"]);

function isGreeting(text: string): boolean {
  return GREETINGS.has(text.trim().toLowerCase());
}

/**
 * Top-level entry point for every inbound message: owns pending-flow state,
 * greeting → main menu, and main-menu dispatch. Anything it doesn't own
 * itself (cart taps, checkout buttons) falls through to handleOrderingMessage.
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

      if (option === "talk_to_staff") {
        await startEscalation(to, conversationId);
        return true;
      }
    }
  }

  if (message.type === "text") {
    const text = message.text?.body ?? "";

    // Mid-flow state takes priority over greeting matching — if the guest
    // is answering "what do you need help with?", treat their reply as
    // that answer even if it happens to look like a greeting.
    const pendingAction = await getPendingAction(conversationId);
    if (pendingAction === PENDING_ESCALATION_MESSAGE) {
      await submitEscalationMessage(to, guestId, conversationId, text);
      return true;
    }

    if (isGreeting(text)) {
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
  }

  return handleOrderingMessage(message, guestId, conversationId);
}
