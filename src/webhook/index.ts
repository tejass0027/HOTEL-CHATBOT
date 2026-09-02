import { Router, Request, Response } from "express";
import { env } from "../config/env";
import { isValidSignature } from "./signature";
import { markMessageAsRead } from "../whatsapp/client";
import { sendMessage } from "../whatsapp/send";
import {
  findOrCreateGuest,
  findOrCreateActiveConversation,
  recordInboundMessage,
} from "../db/queries";
import { routeInboundMessage } from "../flows/router";
import { log, redactPhone } from "../logger";
import type {
  WhatsAppWebhookBody,
  WhatsAppInboundMessage,
} from "../types/whatsapp";

export const webhookRouter = Router();

// --- GET: Meta's subscription verification handshake ---
webhookRouter.get("/", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === env.whatsappVerifyToken) {
    log("Webhook verified by Meta");
    res.status(200).send(challenge);
    return;
  }

  log("Webhook verification failed", { mode, tokenProvided: Boolean(token) });
  res.sendStatus(403);
});

// --- POST: inbound events ---
webhookRouter.post("/", (req: Request, res: Response) => {
  const signature = req.get("X-Hub-Signature-256");
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

  if (!rawBody || !isValidSignature(rawBody, signature, env.whatsappAppSecret)) {
    log("Rejected webhook: invalid signature");
    res.sendStatus(401);
    return;
  }

  // Ack immediately — Meta retries aggressively on slow/failed responses.
  // Everything else happens after the response is sent.
  res.sendStatus(200);

  processWebhookBody(req.body as WhatsAppWebhookBody).catch((err) => {
    log("Error processing webhook body", { error: String(err) });
  });
});

async function processWebhookBody(body: WhatsAppWebhookBody): Promise<void> {
  if (body.object !== "whatsapp_business_account") {
    return;
  }

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;

      for (const message of value.messages ?? []) {
        await handleInboundMessage(message);
      }

      // Delivery/read receipts for messages we sent — nothing to do with
      // them yet, but they're not errors either.
      for (const status of value.statuses ?? []) {
        log("Received status update", {
          status: status.status,
          to: redactPhone(status.recipient_id),
        });
      }
    }
  }
}

function extractMessageBody(message: WhatsAppInboundMessage): string | null {
  if (message.type === "text") return message.text?.body ?? null;
  if (message.type === "interactive") {
    return (
      message.interactive?.button_reply?.title ??
      message.interactive?.list_reply?.title ??
      null
    );
  }
  return null;
}

async function handleInboundMessage(message: WhatsAppInboundMessage): Promise<void> {
  const guest = await findOrCreateGuest(message.from);
  const conversation = await findOrCreateActiveConversation(guest.id);

  const stored = await recordInboundMessage({
    conversationId: conversation.id,
    whatsappMessageId: message.id,
    messageType: message.type,
    body: extractMessageBody(message),
    rawPayload: message,
    receivedAt: new Date(Number(message.timestamp) * 1000),
  });

  if (!stored) {
    log("Skipped duplicate message", { id: message.id });
    return;
  }

  log("Inbound message", {
    from: redactPhone(message.from),
    type: message.type,
  });

  await markMessageAsRead(message.id).catch((err) =>
    log("Failed to mark message as read", { error: String(err) })
  );

  const handled = await routeInboundMessage(message, guest.id, conversation.id);
  if (handled) return;

  await sendMessage(message.from, conversation.id, {
    type: "text",
    body: "Say 'hi' to see what we can help with.",
  });
}
