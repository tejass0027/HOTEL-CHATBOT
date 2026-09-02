import { env } from "../config/env";

const GRAPH_API_VERSION = "v21.0";
const baseUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}/${env.whatsappPhoneNumberId}/messages`;

async function callGraphApi(body: Record<string, unknown>): Promise<void> {
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
}

export async function sendTextMessage(to: string, body: string): Promise<void> {
  await callGraphApi({
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body },
  });
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  await callGraphApi({
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
  });
}
