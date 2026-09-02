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
  whatsappVerifyToken: required("WHATSAPP_VERIFY_TOKEN"),
  whatsappAppSecret: required("WHATSAPP_APP_SECRET"),
  whatsappAccessToken: required("WHATSAPP_ACCESS_TOKEN"),
  whatsappPhoneNumberId: required("WHATSAPP_PHONE_NUMBER_ID"),
};
