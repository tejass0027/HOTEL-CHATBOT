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

Fill in `WHATSAPP_VERIFY_TOKEN` (your own invented string), `WHATSAPP_APP_SECRET`, `WHATSAPP_ACCESS_TOKEN`, and `WHATSAPP_PHONE_NUMBER_ID` from step 1 above. See step 6 below for the `OWNER_WHATSAPP_NUMBER` and template variables.

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

From the WhatsApp number you added as a test recipient, send `hi` to the test business number shown in the API Setup page. You should get the main menu as a tappable list. Tap **Order Food** to get the dish menu — pick an item, then use the Checkout button to get a (fake, stub) payment link. The other menu options (Hotel Info, Book a Room, Request Service, Talk to Staff) currently reply "coming soon" — those flows aren't built yet.

## 6. Owner order receipts

The bot's own number is fully automated via the Cloud API, so the owner can't just check its inbox normally — order receipts need to land on the owner's own separate personal WhatsApp number instead.

1. Set `OWNER_WHATSAPP_NUMBER` in `.env` to the owner's personal number (international format, e.g. `+91XXXXXXXXXX`), **not** the bot's own `WHATSAPP_PHONE_NUMBER_ID` number.
2. The owner isn't guaranteed to have messaged the bot in the last 24h, so receipts are sent as an approved **message template** rather than a free-form message (Meta requires this outside the 24h window). Create one in the Meta app dashboard: **WhatsApp → Message Templates → Create Template**, category "Utility", with a body like:

   ```
   New order {{1}} — PAID.
   Guest: {{2}}
   Items: {{3}}
   Total: {{4}}
   ```

   Submit it for approval (usually a few hours). Set `WHATSAPP_ORDER_RECEIPT_TEMPLATE_NAME` in `.env` to whatever you name it, and `WHATSAPP_TEMPLATE_LANGUAGE` to match the language you submitted it in (default `en_US`).
3. Until the template is approved, you can still test the rest of the flow — the receipt send will just fail (logged, not fatal) until the template exists.

### Testing the payment webhook manually

There's no real payment gateway wired up yet (see `src/payments/stubProvider.ts`), so nothing calls `POST /webhooks/payment` on its own. To manually simulate a payment confirming, place an order through the bot up to the Checkout step, find the order's `paymentReference` (`stub_<orderId>` — check the DB or the payment link the bot sent you), then:

```bash
curl -X POST http://localhost:3000/webhooks/payment \
  -H "Content-Type: application/json" \
  -d '{"reference":"stub_<orderId>","status":"paid"}'
```

You should get a WhatsApp confirmation message, and the owner's number should get the receipt template (once approved).
