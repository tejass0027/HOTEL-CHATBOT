# Hotel WhatsApp Bot

A WhatsApp chatbot for a hotel, built on the Meta WhatsApp Business Cloud API.

It talks to guests directly in WhatsApp to:
- Answer FAQs from a hotel-maintained knowledge base (check-in/out times, amenities, parking, pet policy, wifi, breakfast hours, airport distance, cancellation policy).
- Show room types and pricing for a requested date range.
- Collect booking requests (name, dates, guests, room type, contact), store them, and notify staff — it does not charge cards or confirm availability against a real PMS.
- Log existing-guest service requests (late checkout, extra towels, taxi booking) as tickets for staff.
- Escalate to a human when the guest asks for one, the bot is unsure, or the message sounds like a complaint.

Built with Node.js/TypeScript, Express, PostgreSQL (Prisma), and the Anthropic API for understanding free-text messages and generating replies.

For local setup instructions, see [SETUP.md](SETUP.md).
