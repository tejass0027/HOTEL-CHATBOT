import {
  ReplyButton,
  ListSection,
  sendTextMessage,
  sendInteractiveButtonsMessage,
  sendInteractiveListMessage,
  sendTemplateMessage,
} from "./client";
import { isWithinServiceWindow, recordOutboundMessage } from "../db/queries";
import { log, redactPhone } from "../logger";

export class OutsideServiceWindowError extends Error {
  constructor(to: string) {
    super(
      `Cannot send a free-form message to ${redactPhone(to)} — outside the 24h ` +
        `customer service window. Use a template instead.`
    );
    this.name = "OutsideServiceWindowError";
  }
}

type OutboundMessage =
  | { type: "text"; body: string }
  | { type: "buttons"; bodyText: string; buttons: ReplyButton[] }
  | { type: "list"; bodyText: string; buttonText: string; sections: ListSection[] }
  | { type: "template"; templateName: string; languageCode: string; components?: Record<string, unknown>[] };

/**
 * The only place application code should call to send an outbound WhatsApp
 * message: enforces the 24h service window for free-form types, and
 * persists every send to the Message table.
 */
export async function sendMessage(
  to: string,
  conversationId: string,
  message: OutboundMessage
): Promise<void> {
  if (message.type !== "template") {
    const withinWindow = await isWithinServiceWindow(conversationId);
    if (!withinWindow) {
      log("Refused free-form send: outside 24h service window", {
        to: redactPhone(to),
        type: message.type,
      });
      throw new OutsideServiceWindowError(to);
    }
  }

  let whatsappMessageId: string | undefined;
  let body: string | null = null;

  switch (message.type) {
    case "text":
      whatsappMessageId = await sendTextMessage(to, message.body);
      body = message.body;
      break;
    case "buttons":
      whatsappMessageId = await sendInteractiveButtonsMessage(to, message.bodyText, message.buttons);
      body = message.bodyText;
      break;
    case "list":
      whatsappMessageId = await sendInteractiveListMessage(
        to,
        message.bodyText,
        message.buttonText,
        message.sections
      );
      body = message.bodyText;
      break;
    case "template":
      whatsappMessageId = await sendTemplateMessage(
        to,
        message.templateName,
        message.languageCode,
        message.components
      );
      body = `[template:${message.templateName}]`;
      break;
  }

  await recordOutboundMessage({
    conversationId,
    whatsappMessageId,
    messageType: message.type,
    body,
    rawPayload: message,
  });
}
