# Setup

## 0. Start Postgres and run migrations

Requires Docker Desktop running locally. **This step is no longer optional** —
since phase 3, every inbound message writes to the database (guest, conversation,
message record), so the bot will log a `Can't reach database server` error and
fail to reply if Postgres isn't running.

```bash
docker compose up -d
cp .env.example .env   # if you haven't already — DATABASE_URL already matches docker-compose.yml
npm install
npm run prisma:migrate
```

`prisma:migrate` creates the database tables (Guest, Conversation, Message, BookingRequest, ServiceTicket, Escalation, Order, OrderItem) from `prisma/schema.prisma`. Re-run it any time the schema changes.

## 1. Set up the Meta WhatsApp Cloud API app

You need a Meta developer account and a business (a personal Facebook account is enough to start with the free test number).

1. Go to **developers.facebook.com** → **My Apps** → **Create App** → choose type **Business** → give it a name (e.g. "Hotel Bot Dev").
2. In the app dashboard, find **WhatsApp** in the product list and click **Set up**. This provisions a free **test phone number** and a test recipient list automatically — no real business number needed yet.
3. On the WhatsApp → **API Setup** page, note down:
   - **Phone number ID** (under "From")
   - **Temporary access token** (valid ~24h — fine for phase 1 testing; we'll swap to a permanent token later using a System User)
4. Under **App settings → Basic**, note down the **App Secret** (click "Show", may ask for your password).
5. Under the test number's recipient list, add your own WhatsApp number (must accept an invite code sent to that number) — this is who you'll message from/to during testing.
6. Pick any random string yourself for `WHATSAPP_VERIFY_TOKEN` — you invent this, Meta doesn't give it to you. You'll enter the same value in both `.env` and the Meta dashboard's webhook config in step 4 below.

You do **not** need WhatsApp Business verification, a real phone number, or app review to test with the free tier — those are only required to message non-test numbers or go to production.

## 2. Configure your `.env`

```bash
cp .env.example .env
```

Fill in `WHATSAPP_VERIFY_TOKEN` (your own invented string), `WHATSAPP_APP_SECRET`, `WHATSAPP_ACCESS_TOKEN`, and `WHATSAPP_PHONE_NUMBER_ID` from step 1 above.

## 3. Run the server and expose it via ngrok

```bash
npm install
npm run dev
```

In another terminal:

```bash
ngrok http 3000
```

Copy the `https://...ngrok-free.app` URL ngrok gives you.

## 4. Point Meta's webhook at ngrok

In the app dashboard: **WhatsApp → Configuration → Webhook → Edit**.
- **Callback URL**: `https://<your-ngrok-domain>/webhook`
- **Verify token**: the same string you put in `WHATSAPP_VERIFY_TOKEN`
- Click **Verify and save** — this triggers the `GET /webhook` handshake; the server logs `Webhook verified by Meta` if it succeeds.
- Under **Webhook fields**, subscribe to **messages**.

## 5. Test it

From the WhatsApp number you added as a test recipient, send a message to the test business number shown in the API Setup page. You should see it echoed back (`Echo: <your message>`), and the bot's own log line for the inbound message (phone number redacted).
