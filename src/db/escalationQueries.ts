import { EscalationReason } from "@prisma/client";
import { prisma } from "./prisma";

export async function createEscalation(
  guestId: string,
  conversationId: string,
  reason: EscalationReason,
  notes: string
) {
  return prisma.escalation.create({
    data: { guestId, conversationId, reason, notes },
    include: { guest: true },
  });
}
