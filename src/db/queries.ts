import { Prisma, Conversation, Guest } from "@prisma/client";
import { prisma } from "./prisma";

const SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function findOrCreateGuest(phone: string): Promise<Guest> {
  return prisma.guest.upsert({
    where: { phone },
    update: {},
    create: { phone },
  });
}

/**
 * Returns the guest's open conversation, creating one if none is active.
 * Guests get a single ongoing conversation rather than one per message.
 */
export async function findOrCreateActiveConversation(guestId: string): Promise<Conversation> {
  const existing = await prisma.conversation.findFirst({
    where: { guestId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: { guestId, status: "ACTIVE" },
  });
}

/**
 * Persists an inbound message and bumps the conversation's 24h service
 * window. Returns null if this whatsappMessageId was already recorded
 * (Meta redelivery) instead of throwing, so callers can just check for null.
 */
export async function recordInboundMessage(params: {
  conversationId: string;
  whatsappMessageId: string;
  messageType: string;
  body: string | null;
  rawPayload: unknown;
  receivedAt: Date;
}) {
  try {
    const message = await prisma.message.create({
      data: {
        conversationId: params.conversationId,
        direction: "INBOUND",
        whatsappMessageId: params.whatsappMessageId,
        messageType: params.messageType,
        body: params.body,
        rawPayload: params.rawPayload as Prisma.InputJsonValue,
      },
    });

    await prisma.conversation.update({
      where: { id: params.conversationId },
      data: { lastInboundAt: params.receivedAt },
    });

    return message;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // Unique constraint on whatsappMessageId — this is a Meta redelivery.
      return null;
    }
    throw err;
  }
}

export async function recordOutboundMessage(params: {
  conversationId: string;
  whatsappMessageId?: string;
  messageType: string;
  body: string | null;
  rawPayload: unknown;
}) {
  return prisma.message.create({
    data: {
      conversationId: params.conversationId,
      direction: "OUTBOUND",
      whatsappMessageId: params.whatsappMessageId,
      messageType: params.messageType,
      body: params.body,
      rawPayload: params.rawPayload as Prisma.InputJsonValue,
    },
  });
}

/**
 * Meta only allows free-form (non-template) sends within 24h of the guest's
 * last inbound message. Templates are exempt — those are pre-approved for
 * exactly this case.
 */
export async function isWithinServiceWindow(conversationId: string): Promise<boolean> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { lastInboundAt: true },
  });

  if (!conversation?.lastInboundAt) return false;

  return Date.now() - conversation.lastInboundAt.getTime() < SERVICE_WINDOW_MS;
}
