# Kericho Healthcare Educational WhatsApp Assistant 🏥

A WhatsApp-based healthcare educational assistant for residents of Kericho County, Kenya. Built with Node.js, PostgreSQL, and powered by AI to provide reliable health information, guidance, and support.

## Project Architecture

```
WhatsApp User
    ↓ (messages)
WhatsApp Gateway (Meta Cloud API or Baileys)
    ↓
Node.js Express Server
    ├→ Health Knowledge Base (JSON)
    ├→ AI Engine (OpenAI)
    └→ Safety & Compliance Layer
    ↓
PostgreSQL (user chats, logs, analytics)
    ↓
Deployed to: Render/Railway/Fly.io (free tier)
```

## Features ✨

- **WhatsApp Integration**: Uses Baileys for local development or Meta Cloud API for webhook-based production setups
- **Health Knowledge Base**: JSON-based curated health content for common topics:
  - Malaria prevention & symptoms
  - HIV/AIDS awareness
  - Maternal health & prenatal care
  - Nutrition & balanced diet
  - Mental health & wellness
  - General hygiene & sanitation
  
- **Safety Guardrails**:
  - Non-diagnostic responses (never acts as a doctor)
  - Emergency detection and escalation
  - Bilingual support (English & Kiswahili)
  - Always recommends professional medical care

- **AI Fallback**: Optional OpenAI integration for questions not in knowledge base

- **Persistent Storage**: PostgreSQL for tracking user interactions and analytics

- **Local Development**: Works completely locally with PostgreSQL and Baileys

## Project Structure

```
src/
├── index.js                 # Server startup & message routing
├── config/
│   └── env.js              # Environment variables & validation
├── lib/
│   ├── logger.js           # Pino logging
│   └── prisma.js           # PostgreSQL connection via Prisma
├── models/
│   ├── User.js             # User schema
│   ├── Chat.js             # Chat history schema
│   └── HealthContent.js    # Health content schema
├── services/
│   ├── whatsappService.js  # Baileys WhatsApp integration
│   ├── aiService.js        # OpenAI integration
│   ├── knowledgeBaseService.js  # Knowledge base search
│   ├── responseService.js  # Response orchestration
│   └── safetyService.js    # Safety checks & disclaimers
├── utils/
│   └── text.js             # Text processing utilities
└── data/
    ├── healthKnowledgeBase.json  # Health topics
    └── frequentlyAsked.json      # FAQ database
```

## Prerequisites

- **Node.js** 20+
- **PostgreSQL** 14+ (local or managed)
- **OpenAI API key** (optional, for AI fallback)
- **WhatsApp Account** (any regular WhatsApp mobile account)

## Installation & Setup

### 1. Clone & Install Dependencies

```bash
cd /home/lod/Documents/kericho_ai
npm install
```

### 2. Set Up Database

**Option A: Local PostgreSQL (Recommended for Development)**
```bash
# Start PostgreSQL locally and create the kericho_ai database.
# For example:
# createdb kericho_ai
```

**Option B: Managed PostgreSQL (Free Tier)**
1. Create a free database at https://neon.tech or https://supabase.com
2. Copy the connection string
3. Update `.env`: `DATABASE_URL=postgresql://user:password@host:5432/kericho_ai?schema=public`

### 3. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env with your settings (at minimum, just run with defaults for local dev)
```

Key variables:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kericho_ai?schema=public
WHATSAPP_PROVIDER=baileys
WHATSAPP_VERIFY_TOKEN=kericho-verify-token
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
OPENAI_API_KEY=  # (optional)
DEFAULT_LANGUAGE=en
```

### 4. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
GOOGLE_MAPS_API_KEY=  # (optional)
npm start
```

`GOOGLE_MAPS_API_KEY` enables real geocoding and nearby hospital search through Google Maps. If it is not set, the app falls back to the existing local facility list.

When the server is running, the root URL returns a simple live check message:

```bash
curl http://localhost:3000/
# Healthcare WhatsApp Assistant is live
```

### 5. Connect WhatsApp

1. When server starts, you'll see: `✅ Baileys WhatsApp connection initiated`
2. A **QR Code** will appear in the terminal
3. Open **WhatsApp on your mobile phone**
4. Go: Menu → Linked Devices → Link a Device
5. Scan the QR code from the terminal
6. Done! Now messages sent to your WhatsApp number will be processed by the bot

### 6. Test It Out

Send any health-related message to your WhatsApp account:
- "What is malaria?"
- "How do I prevent mosquito bites?"
- "I'm pregnant, what should I eat?"
- "Tell me about HIV prevention"

The bot will respond with educational information from the knowledge base or, if configured, use OpenAI for follow-up.

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | Server status |
| GET | `/api/health` | Health check |
| GET | `/api/ready` | Readiness check |
| GET/POST | `/webhook` | Meta Cloud API webhook verification and delivery |
| GET | `/qr` | QR code status for WhatsApp connection |
| GET | `/api/chat/:phoneNumber` | Chat history for a user |

Example:
```bash
curl http://localhost:3000/
curl http://localhost:3000/qr
curl http://localhost:3000/api/chat/254712345678
```

## Deployment to Free Hosting

Choose one:

### Option 1: Render.com (Recommended)
1. Push code to GitHub
2. Connect GitHub repo at https://render.com
3. Create new "Web Service"
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables from `.env`
7. Add PostgreSQL connection string (use Neon, Supabase, or Render Postgres)
8. Deploy!

After deployment, your public WhatsApp webhook URL will be:

```text
https://your-app-url/webhook
```

Use that exact URL in the Meta WhatsApp webhook settings together with your verify token.

## Simple Frontend Dashboard

The project now includes a lightweight dashboard in `frontend/` for monitoring analytics.

### Run locally

1. Start the backend server:

```bash
npm start
```

2. In a second terminal, serve the frontend folder:

```bash
cd frontend
python3 -m http.server 5500
```

3. Open:

```text
http://localhost:5500
```

### API notes

- The dashboard calls `GET /admin/stats`
- The dashboard calls `GET /admin/messages`
- The dashboard calls `GET /admin/emergencies`
- Login via `POST /auth/login` from `frontend/login.html`
- A JWT token is stored in browser `localStorage`
- Dashboard requests send `Authorization: Bearer <token>`

### Bootstrapping an admin account

Create the first admin user once:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"ChangeMe123!"}'
```

### Option 2: Railway.app
1. Create account at https://railway.app
2. Connect GitHub repo
3. Railway auto-detects Node.js
4. Add `DATABASE_URL` environment variable
5. Deploy!

### Option 3: Fly.io
1. Install Fly CLI
2. Run: `flyctl launch`
3. Configure PostgreSQL connection
4. Run: `flyctl deploy`

## Configuration Guide

### Environment Variables for Deployment

Use these variables in production:

```env
PORT=3000
WHATSAPP_TOKEN=your-meta-access-token
VERIFY_TOKEN=your-webhook-verify-token
PHONE_NUMBER_ID=your-whatsapp-phone-number-id
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://user:password@host:5432/kericho_ai?schema=public
```

The app also accepts the older names `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_VERIFY_TOKEN`, and `WHATSAPP_PHONE_NUMBER_ID` for backward compatibility.

### Adding More Health Topics

Edit `src/data/healthKnowledgeBase.json`:

```json
{
  "your-topic": [
    {
      "id": "unique-id",
      "title": "Title",
      "keywords": ["word1", "word2"],
      "content": "English content here",
      "contentSwahili": "Kiswahili content here",
      "sources": ["WHO", "Ministry of Health"]
    }
  ]
}
```

### Customizing AI Responses

Edit system prompt in `src/services/aiService.js`:

```js
const systemPrompt = `Your custom instructions here...`;
```

### Emergency Contacts

Update emergency keywords in `src/services/safetyService.js`:

```js
const emergencyKeywords = [
  "chest pain",
  "severe bleeding",
  // add more...
];
```

## Local Webhook Testing with ngrok

If you want Meta to reach your local machine during development, use ngrok:

1. Install ngrok from https://ngrok.com/
2. Start the app locally:

```bash
npm start
```

3. In a second terminal, expose your local server:

```bash
ngrok http 3000
```

4. Copy the HTTPS forwarding URL that ngrok gives you.
5. Set your Meta webhook callback URL to:

```text
https://your-ngrok-url/webhook
```

6. Use your verify token value when Meta asks for webhook verification.

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | development | development/production |
| `PORT` | 3000 | Server port |
| `DATABASE_URL` | postgresql://postgres:postgres@localhost:5432/kericho_ai?schema=public | Database connection |
| `OPENAI_API_KEY` | (none) | For AI fallback responses |
| `OPENAI_MODEL` | gpt-3.5-turbo | Which OpenAI model to use |
| `DEFAULT_LANGUAGE` | en | Default language (en/sw) |
| `WHATSAPP_PROVIDER` | baileys | `baileys`, `meta`, or `auto` |
| `WHATSAPP_VERIFY_TOKEN` | kericho-verify-token | Meta webhook verification token |
| `WHATSAPP_ACCESS_TOKEN` | (none) | Meta Cloud API token |
| `WHATSAPP_PHONE_NUMBER_ID` | (none) | Meta Cloud API phone number id |

## Troubleshooting

### QR Code not appearing
```
- Make sure you're on latest Node version: node --version
- Try clearing .auth folder: rm -rf .auth
- Restart the server
```

### PostgreSQL connection failed
```
- Check PostgreSQL is running and DATABASE_URL is correct
- Verify Prisma client was generated with `npm run prisma:generate`
- Try connecting with psql to debug
```

### Messages not being received
```
- Verify WhatsApp is connected (check terminal for ✅ symbol)
- Check that the phone number format includes country code (+254...)
- Review logs: npm run dev will show detailed output
```

### OpenAI API errors
```
- Verify your API key is valid at https://platform.openai.com
- Check account has credits
- Note: Without API key, system still works using knowledge base!
```

## Development Tips

### View Live Logs
```bash
npm run dev
```
Both server logs and WhatsApp incoming messages are printed in real-time.

### Database Inspection
```bash
# PostgreSQL client (GUI)
# Use pgAdmin, DBeaver, or another Postgres client

# Or via psql
psql "postgresql://postgres:postgres@localhost:5432/kericho_ai?schema=public"
```

### Test Knowledge Base Matching
Edit a message in `src/services/knowledgeBaseService.js` and add:
```js
console.log("Searching for:", messageLower);
```

## Safety & Compliance

✅ **Always includes disclaimers** that prevent medical diagnosis
✅ **Emergency detection** escalates critical symptoms immediately  
✅ **Non-prescriptive** - never suggests specific medications
✅ **Bilingual** - Swahili & English for accessibility
✅ **Data privacy** - Can be completely self-hosted

⚠️ **Important**: This is educational only, not a medical service. Always recommend professional care.

## Future Enhancements

- [ ] Voice message support
- [ ] Location-based health facility finder
- [ ] Symptom checker (controlled AI)
- [ ] Integration with local hospitals
- [ ] Mobile app version
- [ ] Real-time disease outbreak alerts
- [ ] Medication reminders
- [ ] Support for additional languages

## Contributing

Pull requests welcome! For major changes, open an issue first.

## License

MIT

## Support

For issues or questions:
1. Check logs: `npm run dev`
2. Verify `.env` configuration
3. Test knowledge base manually
4. Check database connectivity

---

**Built for Kericho County Healthcare 🏥**
2. Important variables:
   - `WHATSAPP_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_VERIFY_TOKEN`
   - `DATABASE_URL`
   - `OPENAI_API_KEY` (optional if using only static knowledge responses)

## Run locally

1. Start PostgreSQL:

```bash
docker compose up -d
```

2. Generate Prisma client and push schema:

```bash
npm run prisma:generate
npm run prisma:push
```

3. Seed starter health content:

```bash
npm run seed
```

4. Start the backend:

```bash
npm run dev
```

Server runs at `http://localhost:3000`.

## Expose webhook to WhatsApp (local testing)

Use a tunnel (for example, ngrok) so Meta can reach your local server:

```bash
ngrok http 3000
```

Set webhook callback URL in Meta dashboard to:

`https://<your-ngrok-subdomain>/webhook`

Use `WHATSAPP_VERIFY_TOKEN` as the verification token in Meta.

## API endpoints

- `GET /api/health` - liveness check
- `GET /api/ready` - readiness check with DB query
- `GET /webhook` - webhook verification
- `POST /webhook` - webhook event receiver

## Safety note

This assistant is educational and non-diagnostic. It should not replace professional medical advice, diagnosis, or treatment.

## Next implementation priorities

- Add full Kiswahili response templates and local dialect support
- Add consent/privacy notice and opt-out command handling
- Add analytics dashboard and feedback capture route
- Add automated tests for webhook and response logic
