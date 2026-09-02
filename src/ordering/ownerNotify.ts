import { Order, OrderItem, Guest } from "@prisma/client";
import { env } from "../config/env";
import { formatMoney } from "../lib/money";
import { sendMessage } from "../whatsapp/send";
import { findOrCreateGuest, findOrCreateActiveConversation } from "../db/queries";

type PaidOrder = Order & { items: OrderItem[]; guest: Guest };

/**
 * The owner is tracked as a Guest/Conversation too (same as any WhatsApp
 * contact) purely to reuse the existing 24h-window + message-logging
 * plumbing — not because they're conceptually a hotel guest. A template
 * send is used because the owner isn't guaranteed to have messaged the bot
 * recently, so a free-form send could get silently refused by the window
 * check in src/whatsapp/send.ts.
 */
export async function notifyOwnerOfPaidOrder(order: PaidOrder): Promise<void> {
  const owner = await findOrCreateGuest(env.ownerWhatsappNumber);
  const ownerConversation = await findOrCreateActiveConversation(owner.id);

  const itemsSummary = order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ");
  const total = formatMoney(order.totalMinor, order.currency);

  await sendMessage(env.ownerWhatsappNumber, ownerConversation.id, {
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
