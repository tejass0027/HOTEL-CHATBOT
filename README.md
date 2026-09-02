# Hotel WhatsApp Bot

A WhatsApp ordering bot for a restaurant, built on the Meta WhatsApp Business Cloud API.

It's fully menu/button-driven — no AI or free-text understanding involved. Guests:
- Say "hi" to get a main menu.
- **Order Food**: browse the dish menu as a WhatsApp list, add items to a cart, review the total, and check out. Checkout sends a payment link in the chat (currently a non-functional stub — see `src/payments/`, no real gateway is wired up yet).
- **Talk to Staff**: type what they need help with; it's relayed as-is to the owner, no interpretation.

Once a payment link is paid, the guest gets a confirmation and the owner gets an order receipt on their own personal WhatsApp number (the bot's number is fully automated via the Cloud API, so the owner can't just read its inbox directly).

Built with Node.js/TypeScript, Express, and PostgreSQL (Prisma).

- Local setup: [SETUP.md](SETUP.md)
- Deploying to Railway: [DEPLOY.md](DEPLOY.md)
