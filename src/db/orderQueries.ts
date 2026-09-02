import { Order, OrderStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { hotel } from "../../config/hotel";

const OPEN_STATUSES: OrderStatus[] = ["DRAFT", "AWAITING_PAYMENT"];

export async function findActiveOrder(guestId: string) {
  return prisma.order.findFirst({
    where: { guestId, status: { in: OPEN_STATUSES } },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
}

export async function findOrCreateDraftOrder(guestId: string, conversationId: string) {
  const existing = await prisma.order.findFirst({
    where: { guestId, status: "DRAFT" },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  if (existing) return existing;

  return prisma.order.create({
    data: { guestId, conversationId, status: "DRAFT", currency: hotel.currency },
    include: { items: true },
  });
}

/** Adds one unit of a menu item, or increments quantity if it's already in the cart. */
export async function addOrderItem(
  orderId: string,
  menuItemId: string,
  name: string,
  unitPriceMinor: number
): Promise<Order> {
  const existingItem = await prisma.orderItem.findFirst({ where: { orderId, menuItemId } });

  if (existingItem) {
    await prisma.orderItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + 1 },
    });
  } else {
    await prisma.orderItem.create({
      data: { orderId, menuItemId, name, unitPriceMinor, quantity: 1 },
    });
  }

  return recomputeOrderTotal(orderId);
}

async function recomputeOrderTotal(orderId: string): Promise<Order> {
  const items = await prisma.orderItem.findMany({ where: { orderId } });
  const totalMinor = items.reduce((sum, item) => sum + item.unitPriceMinor * item.quantity, 0);
  return prisma.order.update({ where: { id: orderId }, data: { totalMinor } });
}

export async function cancelOrder(orderId: string): Promise<Order> {
  return prisma.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
}

export async function getOrderWithItems(orderId: string) {
  return prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
}

export async function markOrderAwaitingPayment(
  orderId: string,
  payment: { paymentProvider: string; paymentReference: string; paymentLinkUrl: string }
): Promise<Order> {
  return prisma.order.update({
    where: { id: orderId },
    data: {
      status: "AWAITING_PAYMENT",
      paymentProvider: payment.paymentProvider,
      paymentReference: payment.paymentReference,
      paymentLinkUrl: payment.paymentLinkUrl,
    },
  });
}

export async function findOrderByPaymentReference(reference: string) {
  return prisma.order.findFirst({
    where: { paymentReference: reference },
    include: { items: true, guest: true },
  });
}

/** No-ops (returns null) if the order isn't currently AWAITING_PAYMENT, so a
 *  redelivered webhook can't double-fire the owner notification. */
export async function markOrderPaidIfAwaiting(orderId: string) {
  const result = await prisma.order.updateMany({
    where: { id: orderId, status: "AWAITING_PAYMENT" },
    data: { status: "PAID" },
  });
  if (result.count === 0) return null;
  return prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true, guest: true } });
}
