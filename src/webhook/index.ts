import { Router, Request, Response } from "express";
import { env } from "../config/env";
import { isValidSignature } from "./signature";
import { isDuplicateMessage } from "./dedup";
import { sendTextMessage, markMessageAsRead } from "../whatsapp/client";
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

async function handleInboundMessage(message: WhatsAppInboundMessage): Promise<void> {
  if (isDuplicateMessage(message.id)) {
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

  if (message.type !== "text") {
    await sendTextMessage(
      message.from,
      "I can only read text messages for now — please type your question and I'll help."
    );
    return;
  }

  const incomingText = message.text?.body ?? "";
  await sendTextMessage(message.from, `Echo: ${incomingText}`);
}
