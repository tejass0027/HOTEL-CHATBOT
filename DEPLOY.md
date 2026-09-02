# Deploying to Railway

## 0. Blocker: generate the initial migration first

This repo has no `prisma/migrations/` folder yet — every phase so far was built and tested without a live Postgres available in the build environment, so `prisma migrate dev` has never actually been run. Railway's start command (`railway.json`) runs `prisma migrate deploy`, which **applies existing migration files** — it does not generate new ones. Without a migration file, the production database will have no tables and every DB query will fail.

Before your first deploy, run this once, locally, against `docker compose up -d` (see [SETUP.md](SETUP.md) step 0):

```bash
docker compose up -d
npm run prisma:migrate -- --name init
```

This creates `prisma/migrations/<timestamp>_init/migration.sql`. Commit it and push — Railway needs it in the repo.

## 1. Create the Railway project

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → pick `tejass0027/HOTEL-CHATBOT`.
2. In the same project, **+ New** → **Database** → **Add PostgreSQL**. Railway provisions it and exposes a `DATABASE_URL` you can reference.
3. On the app service (not the Postgres one) → **Variables** → add a reference to the Postgres service's `DATABASE_URL` (Railway's variable picker lists it — `${{Postgres.DATABASE_URL}}`), rather than typing your own. This is a different database from your local docker-compose one; migrations run against it fresh via the start command.

## 2. Set the remaining environment variables

On the app service → **Variables**, add everything from `.env.example` except `DATABASE_URL` and `PORT` (Railway provides `PORT` itself, and `DATABASE_URL` comes from the reference above):

- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`
- `WHATSAPP_ACCESS_TOKEN` — use a **permanent** token now, not the temporary one from local dev (see step 4 below)
- `WHATSAPP_PHONE_NUMBER_ID`
- `OWNER_WHATSAPP_NUMBER`
- `WHATSAPP_ORDER_RECEIPT_TEMPLATE_NAME`
- `WHATSAPP_ESCALATION_TEMPLATE_NAME`
- `WHATSAPP_TEMPLATE_LANGUAGE`

## 3. Deploy

Railway builds automatically on push once the project is connected (Nixpacks detects Node from `package.json`, runs `npm install` → `postinstall` generates the Prisma client → `npm run build`). On start, `railway.json`'s `startCommand` runs `prisma migrate deploy` before `npm start`, so every deploy re-applies any new migrations automatically.

Check the deploy logs for `Server listening on port ...` and hit `https://<your-app>.up.railway.app/health` to confirm.

## 4. Get a permanent WhatsApp access token

The temporary token from [SETUP.md](SETUP.md) step 1 expires in ~24h — fine for local testing, not for production. In the Meta app dashboard: **App Settings → Basic**, or **Business Settings → System Users**, create a System User with access to your WhatsApp app, and generate a permanent token scoped to `whatsapp_business_messaging` + `whatsapp_business_management`. Use that for `WHATSAPP_ACCESS_TOKEN` in Railway.

## 5. Point Meta's webhook at Railway

Same as [SETUP.md](SETUP.md) step 4, but with your Railway URL instead of ngrok:
- **Callback URL**: `https://<your-app>.up.railway.app/webhook`
- **Verify token**: same `WHATSAPP_VERIFY_TOKEN` value you set in Railway's variables
- Re-subscribe to the **messages** field if prompted.

Once verified, ngrok is no longer needed — the bot runs against the real Railway deployment.
