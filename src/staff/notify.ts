import { Order, OrderItem, Guest, Escalation } from "@prisma/client";
import { env } from "../config/env";
import { formatMoney } from "../lib/money";
import { sendMessage } from "../whatsapp/send";
import { findOrCreateGuest, findOrCreateActiveConversation } from "../db/queries";

/**
 * The owner is tracked as a Guest/Conversation too (same as any WhatsApp
 * contact) purely to reuse the existing 24h-window + message-logging
 * plumbing — not because they're conceptually a restaurant guest. Every
 * notification here uses a template send because the owner isn't
 * guaranteed to have messaged the bot recently, and a free-form send would
 * get silently refused by the window check in src/whatsapp/send.ts.
 */
async function getOwnerConversationId(): Promise<string> {
  const owner = await findOrCreateGuest(env.ownerWhatsappNumber);
  const conversation = await findOrCreateActiveConversation(owner.id);
  return conversation.id;
}

type PaidOrder = Order & { items: OrderItem[]; guest: Guest };

export async function notifyOwnerOfPaidOrder(order: PaidOrder): Promise<void> {
  const conversationId = await getOwnerConversationId();

  const itemsSummary = order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ");
  const total = formatMoney(order.totalMinor, order.currency);

  await sendMessage(env.ownerWhatsappNumber, conversationId, {
    type: "template",
    templateName: env.orderReceiptTemplateName,
    languageCode: env.whatsappTemplateLanguage,
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: order.id.slice(-8) },
          { type: "text", text: order.guest.phone },
          { type: "text", text: itemsSummary },
          { type: "text", text: total },
        ],
      },
    ],
  });
}

type EscalationWithGuest = Escalation & { guest: Guest };

export async function notifyOwnerOfEscalation(escalation: EscalationWithGuest): Promise<void> {
  const conversationId = await getOwnerConversationId();

  await sendMessage(env.ownerWhatsappNumber, conversationId, {
    type: "template",
    templateName: env.escalationTemplateName,
    languageCode: env.whatsappTemplateLanguage,
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: escalation.guest.phone },
          { type: "text", text: escalation.notes ?? "(no message)" },
        ],
      },
    ],
  });
}
