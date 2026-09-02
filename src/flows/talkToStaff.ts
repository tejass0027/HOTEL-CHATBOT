import { sendMessage } from "../whatsapp/send";
import { setPendingAction } from "../db/queries";
import { createEscalation } from "../db/escalationQueries";
import { notifyOwnerOfEscalation } from "../staff/notify";
import { log } from "../logger";

export const PENDING_ESCALATION_MESSAGE = "ESCALATION_MESSAGE";

export async function startEscalation(to: string, conversationId: string): Promise<void> {
  await setPendingAction(conversationId, PENDING_ESCALATION_MESSAGE);
  await sendMessage(to, conversationId, {
    type: "text",
    body: "Sure — please type what you need help with, and our staff will get back to you.",
  });
}

export async function submitEscalationMessage(
  to: string,
  guestId: string,
  conversationId: string,
  text: string
): Promise<void> {
  await setPendingAction(conversationId, null);

  const escalation = await createEscalation(guestId, conversationId, "GUEST_REQUESTED", text);

  await sendMessage(to, conversationId, {
    type: "text",
    body: "Thanks — we've let our staff know. They'll reach out shortly.",
  });

  await notifyOwnerOfEscalation(escalation).catch((err) =>
    log("Failed to notify owner of escalation", { error: String(err), escalationId: escalation.id })
  );
}
