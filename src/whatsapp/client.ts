import { env } from "../config/env";

const GRAPH_API_VERSION = "v21.0";
const baseUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${env.whatsappPhoneNumberId}/messages`;

interface GraphApiSendResponse {
  messages?: { id: string }[];
}

async function callGraphApi(body: Record<string, unknown>): Promise<GraphApiSendResponse> {
  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.whatsappAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`WhatsApp API error ${res.status}: ${errorBody}`);
  }

  return res.json() as Promise<GraphApiSendResponse>;
}

/** Max 3 buttons; each id <= 256 chars, title <= 20 chars (Meta limits). */
export interface ReplyButton {
  id: string;
  title: string;
}

/** Max 10 sections, max 10 rows per section (Meta limits). */
export interface ListSection {
  title: string;
  rows: { id: string; title: string; description?: string }[];
}

export async function sendTextMessage(to: string, body: string): Promise<string | undefined> {
  const res = await callGraphApi({
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body },
  });
  return res.messages?.[0]?.id;
}

export async function sendInteractiveButtonsMessage(
  to: string,
  bodyText: string,
  buttons: ReplyButton[]
): Promise<string | undefined> {
  const res = await callGraphApi({
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: {
        buttons: buttons.map((b) => ({
          type: "reply",
          reply: { id: b.id, title: b.title },
        })),
      },
    },
  });
  return res.messages?.[0]?.id;
}

export async function sendInteractiveListMessage(
  to: string,
  bodyText: string,
  buttonText: string,
  sections: ListSection[]
): Promise<string | undefined> {
  const res = await callGraphApi({
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: bodyText },
      action: { button: buttonText, sections },
    },
  });
  return res.messages?.[0]?.id;
}

/**
 * Templates are the only message type allowed outside the 24h customer
 * service window — they must already be approved in the Meta app dashboard.
 */
export async function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string,
  components?: Record<string, unknown>[]
): Promise<string | undefined> {
  const res = await callGraphApi({
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components ? { components } : {}),
    },
  });
  return res.messages?.[0]?.id;
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  await callGraphApi({
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
  });
}
