import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required("DATABASE_URL"),
  whatsappVerifyToken: required("WHATSAPP_VERIFY_TOKEN"),
  whatsappAppSecret: required("WHATSAPP_APP_SECRET"),
  whatsappAccessToken: required("WHATSAPP_ACCESS_TOKEN"),
  whatsappPhoneNumberId: required("WHATSAPP_PHONE_NUMBER_ID"),
  // The owner's own personal number, NOT the bot's number — the bot's number
  // is fully automated via the Cloud API, so the owner can't just read its
  // inbox normally. Order receipts get sent here instead.
  ownerWhatsappNumber: required("OWNER_WHATSAPP_NUMBER"),
  // Must be an approved Meta message template name — see SETUP.md. Required
  // because the owner isn't guaranteed to be within the 24h free-form
  // messaging window when an order comes in.
  orderReceiptTemplateName: required("WHATSAPP_ORDER_RECEIPT_TEMPLATE_NAME"),
  whatsappTemplateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "en_US",
};
