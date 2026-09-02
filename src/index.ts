import express, { Request } from "express";
import { env } from "./config/env";
import { webhookRouter } from "./webhook";
import { paymentWebhookRouter } from "./webhook/payment";
import { log } from "./logger";

const app = express();

// Capture the raw request body bytes so the webhook route can verify the
// HMAC signature against exactly what Meta sent, before JSON.parse touches it.
app.use(
  express.json({
    verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
      req.rawBody = Buffer.from(buf);
    },
  })
);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/webhook", webhookRouter);
app.use("/webhooks/payment", paymentWebhookRouter);

app.listen(env.port, () => {
  log(`Server listening on port ${env.port}`);
});
