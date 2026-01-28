# Restaurant ChatBot

A session-based chatbot for restaurant ordering with Paystack payment.

## Features
- Device-based session (no login)
- Menu browsing & cart management
- Order history & current order view
- Paystack test payment integration
- Real-time chat interface

## Setup
1. Clone repo
2. `npm install`
3. Create `.env` with `PAYSTACK_SECRET_KEY`
4. `npm run dev`
5. Open `http://localhost:3000`

## Notes
- Uses in-memory storage (restart clears data)
- For production: replace with Redis/DB
- Webhook not fully validated (for demo)