# WhatsApp Healthcare Assistant - Implementation Guide

## Project Overview

This is a complete Node.js + Express backend for a WhatsApp-based healthcare educational assistant for Kericho County, Kenya.

### Key Features
- ✅ WhatsApp Cloud API integration (Meta)
- ✅ Webhook verification and message handling
- ✅ OpenAI AI integration for smart responses
- ✅ Local health knowledge base (JSON)
- ✅ PostgreSQL database with Prisma ORM
- ✅ Environment-based configuration
- ✅ Comprehensive error handling
- ✅ Production-ready

---

## Quick Start

### 1. Prerequisites
```bash
Node.js 20+
PostgreSQL 14+
npm or yarn
```

### 2. Installation
```bash
cd /home/lod/Documents/kericho_ai

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Set up your .env file (see .env.example)
cp .env.example .env
```

### 3. Database Setup
```bash
# Option A: Local PostgreSQL with Docker
docker-compose up -d postgres

# Wait for Postgres to be ready (health check)
sleep 5

# Option B: Managed PostgreSQL
# Use Neon, Supabase, or any provider
# Add CONNECTION_URL to .env
```

### 4. Initialize Database
```bash
# Run migrations
npm run prisma:migrate

# Seed knowledge base
npm run prisma:seed
```

### 5. Configure WhatsApp & OpenAI
Update your `.env` file with:
```env
# WhatsApp Cloud API
WHATSAPP_PROVIDER=meta
WHATSAPP_VERIFY_TOKEN=your-verify-token
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_API_VERSION=v20.0

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Database
DATABASE_URL=postgresql://user:password@host:5432/kericho_ai
```

### 6. Start the Server
```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

### 7. Test the Webhook
```bash
# Test webhook verification
curl -X GET "http://localhost:3000/webhook?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=your-verify-token"

# Send a test message (use Meta's testing interface or send from WhatsApp)
```

---

## Architecture

### Directory Structure
```
src/
├── index.js                    # Server entry point
├── config/
│   └── env.js                 # Environment validation
├── lib/
│   └── prisma.js              # Database client
├── routes/
│   └── webhookRoutes.js        # Webhook endpoints
├── controllers/
│   └── webhookController.js    # Request handlers
├── services/
│   ├── whatsappService.js      # WhatsApp API integration
│   ├── aiService.js            # OpenAI integration
│   ├── knowledgeBaseService.js # Local KB search
│   ├── responseService.js      # Response building
│   ├── conversationService.js  # Conversation logic
│   └── safetyService.js        # Safety checks
├── models/
│   └── (handled via Prisma)
├── utils/
│   ├── text.js                 # Text utilities
│   └── phone.js                # Phone utilities
└── data/
    └── healthKnowledgeBase.json # Knowledge base

prisma/
├── schema.prisma               # Database schema
└── seed.js                     # Database seeding
```

### Data Flow

1. **Incoming Message**
   ```
   WhatsApp User → Meta Cloud API → POST /webhook → Verify signature
   ```

2. **Processing**
   ```
   Parse message → Extract phone & text → Upsert user → Query KB → Call AI → Build response
   ```

3. **Outgoing Message**
   ```
   Send response → Store in DB → Send via WhatsApp Cloud API → User receives
   ```

---

## API Endpoints

### Webhook Endpoints

#### `GET /webhook`
Webhook verification from Meta

**Query Parameters:**
- `hub.mode` - should be "subscribe"
- `hub.verify_token` - must match `WHATSAPP_VERIFY_TOKEN`
- `hub.challenge` - challenge string to echo back

**Response:** Challenge string if verified, 403 if invalid

#### `POST /webhook`
Receive incoming messages from WhatsApp

**Body Format:**
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "254712345678",
          "text": { "body": "Hello" },
          "timestamp": "1234567890"
        }]
      }
    }]
  }]
}
```

**Response:** 200 OK (immediate)

### Health Check Endpoints

#### `GET /api/health`
System status check

**Response:**
```json
{
  "status": "ok",
  "service": "kericho-healthcare-assistant",
  "version": "1.0.0"
}
```

#### `GET /api/ready`
Readiness probe (includes DB check)

---

## Environment Variables

Create `.env` file:

```env
# Server
NODE_ENV=development
PORT=3000

# Database - PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kericho_ai?schema=public

# WhatsApp Cloud API
WHATSAPP_PROVIDER=meta
WHATSAPP_VERIFY_TOKEN=your-secret-verify-token
WHATSAPP_ACCESS_TOKEN=your-meta-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_API_VERSION=v20.0

# OpenAI
OPENAI_API_KEY=sk-your-api-key

# App
DEFAULT_LANGUAGE=en
APP_BASE_URL=http://localhost:3000
```

---

## Database Schema

### User Table
```sql
CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "whatsappNumber" TEXT UNIQUE NOT NULL,
  "preferredLanguage" TEXT DEFAULT 'en',
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP
);
```

### ConversationMessage Table
```sql
CREATE TABLE "ConversationMessage" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  "role" TEXT NOT NULL, -- 'user' or 'assistant'
  "content" TEXT NOT NULL,
  "topic" TEXT,
  "escalationSuggested" BOOLEAN DEFAULT false,
  "source" TEXT,
  "createdAt" TIMESTAMP DEFAULT now()
);
```

### KnowledgeArticle Table
```sql
CREATE TABLE "KnowledgeArticle" (
  "id" TEXT PRIMARY KEY,
  "topic" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "language" TEXT DEFAULT 'en',
  "source" TEXT,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP
);
```

---

## Testing

### 1. Webhook Verification
```bash
curl -X GET "http://localhost:3000/webhook?hub.mode=subscribe&hub.challenge=test_challenge&hub.verify_token=your-verify-token"

# Expected: Returns the challenge token
```

### 2. Health Check
```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/ready
```

### 3. Knowledge Base Matching
Send a WhatsApp message with "malaria" to test KB matching.

### 4. AI Fallback
Send a custom question like "What is the capital of Kenya?" to test OpenAI fallback.

---

## Deployment

### Deploy to Render
1. Push to GitHub
2. Create new Web Service on Render
3. Connect GitHub repo
4. Build: `npm install`
5. Start: `npm start`
6. Add PostgreSQL database
7. Set environment variables
8. Deploy!

### Deploy to Railway
1. Connect GitHub repo
2. Railway auto-detects Node.js
3. Add PostgreSQL from "Add Service"
4. Set environment variables
5. Deploy automatically on push

### Deploy to Fly.io
```bash
flyctl launch
flyctl secrets set WHATSAPP_ACCESS_TOKEN="your-token"
flyctl deploy
```

---

## Troubleshooting

### "Cannot connect to PostgreSQL"
- Check DATABASE_URL is correct
- Verify Postgres is running: `docker ps`
- Test connection: `psql $DATABASE_URL`

### "Webhook not receiving messages"
- Verify WHATSAPP_VERIFY_TOKEN matches Meta setting
- Check webhook URL is publicly accessible
- Verify WHATSAPP_ACCESS_TOKEN is valid
- Check logs: `npm run dev`

### "OpenAI errors"
- Verify API key is correct
- Check account has credits
- Monitor rate limits
- System still works with KB alone if AI is down

### Messages not being saved
- Run migrations: `npm run prisma:migrate`
- Check DATABASE_URL
- Verify Prisma client generated: `npm run prisma:generate`

---

## File Documentation

See individual files for detailed comments:
- [src/index.js](src/index.js) - Server bootstrap
- [src/routes/webhookRoutes.js](src/routes/webhookRoutes.js) - Webhook routing
- [src/controllers/webhookController.js](src/controllers/webhookController.js) - Request handling
- [src/services/whatsappService.js](src/services/whatsappService.js) - WhatsApp API
- [src/services/aiService.js](src/services/aiService.js) - OpenAI integration
- [src/services/conversationService.js](src/services/conversationService.js) - Conversation flow
- [prisma/schema.prisma](prisma/schema.prisma) - Database schema

---

## Support & Next Steps

1. **Add more health topics** - Edit [src/data/healthKnowledgeBase.json](src/data/healthKnowledgeBase.json)
2. **Customize AI prompt** - Edit [src/services/aiService.js](src/services/aiService.js)
3. **Add authentication** - Implement bearer token validation
4. **Add analytics** - Query conversation history from DB
5. **Support media** - Extend message parser for images/audio

---

**Last Updated:** April 2026
**Status:** ✅ Production Ready
