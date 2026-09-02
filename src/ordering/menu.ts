import { menu } from "../../config/menu";
import { hotel } from "../../config/hotel";
import { toMinorUnits, formatMoney } from "../lib/money";
import { sendMessage } from "../whatsapp/send";
import { ListSection } from "../whatsapp/client";

const MAX_ROWS_PER_SECTION = 10;
const MAX_SECTIONS = 10;

export function buildMenuSections(): ListSection[] {
  const available = menu.filter((item) => item.available);
  const categories = Array.from(new Set(available.map((item) => item.category)));

  return categories.slice(0, MAX_SECTIONS).map((category) => ({
    title: category,
    rows: available
      .filter((item) => item.category === category)
      .slice(0, MAX_ROWS_PER_SECTION)
      .map((item) => ({
        id: `menu:${item.id}`,
        title: item.name,
        description: formatMoney(toMinorUnits(item.price), hotel.currency),
      })),
  }));
}

export async function sendMenu(to: string, conversationId: string): Promise<void> {
  await sendMessage(to, conversationId, {
    type: "list",
    bodyText: "Here's our menu — tap to add an item to your cart.",
    buttonText: "View menu",
    sections: buildMenuSections(),
  });
}
