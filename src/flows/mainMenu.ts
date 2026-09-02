import { sendMessage } from "../whatsapp/send";
import { ListSection } from "../whatsapp/client";

export const MAIN_MENU_PREFIX = "main:";

export const MAIN_MENU_OPTIONS = [
  { id: "order_food", title: "Order Food", description: "Browse our menu and order" },
  { id: "hotel_info", title: "Hotel Info", description: "Check-in, wifi, parking, and more" },
  { id: "book_room", title: "Book a Room", description: "Request a room booking" },
  { id: "request_service", title: "Request Service", description: "Towels, taxi, late checkout" },
  { id: "talk_to_staff", title: "Talk to Staff", description: "Get help from our team" },
] as const;

function buildMainMenuSections(): ListSection[] {
  return [
    {
      title: "How can we help?",
      rows: MAIN_MENU_OPTIONS.map((option) => ({
        id: `${MAIN_MENU_PREFIX}${option.id}`,
        title: option.title,
        description: option.description,
      })),
    },
  ];
}

export async function sendMainMenu(to: string, conversationId: string): Promise<void> {
  await sendMessage(to, conversationId, {
    type: "list",
    bodyText: "Welcome! What would you like to do?",
    buttonText: "Open menu",
    sections: buildMainMenuSections(),
  });
}
