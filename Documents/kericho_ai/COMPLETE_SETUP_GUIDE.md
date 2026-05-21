# Complete Backend Setup & Testing Guide

## Overview

This guide walks you through the complete setup of the Kericho AI WhatsApp Healthcare Assistant backend, from initial configuration through testing to production deployment.

**Estimated Time:** 30-45 minutes (including all steps)  
**Prerequisites:** Node.js 20+, Docker, PostgreSQL client (psql)

---

## Table of Contents

1. [Quick Start (5 min)](#quick-start)
2. [Configuration Setup (10 min)](#configuration-setup)
3. [Database Setup (5 min)](#database-setup)
4. [Running Locally (5 min)](#running-locally)
5. [Testing (10 min)](#testing)
6. [Troubleshooting](#troubleshooting)
7. [Production Deployment](#production-deployment)

---

## Quick Start

**Get running in 5 minutes:**

```bash
# 1. Clone repository (if not already done)
git clone <your-repo>
cd kericho_ai

# 2. Install dependencies
npm install

# 3. Set up environment (copy template)
cp SETUP_GUIDE.env .env

# 4. Start PostgreSQL
docker-compose up -d postgres

# 5. Run migrations and seed
npm run prisma:migrate
npm run prisma:seed

# 6. Start server
npm run dev

# 7. Test health check
curl http://localhost:3000/api/health
```

If all steps succeed, you're ready to test!

---

## Configuration Setup

### Step 1: Create .env File

```bash
# Copy template
cp SETUP_GUIDE.env .env

# Edit with your values
nano .env  # or use your favorite editor
```

### Step 2: Configure Database

For **local development** (recommended):
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kericho_ai?schema=public
```

For **managed PostgreSQL** (Neon, Supabase, Railway):
```env
# Get connection string from provider dashboard
DATABASE_URL=postgresql://user:password@host.neon.tech:5432/neondb?schema=public
```

### Step 3: Configure WhatsApp (Optional for Testing)

For **local development** (Baileys - no Meta credentials needed):
```env
WHATSAPP_PROVIDER=baileys
WHATSAPP_VERIFY_TOKEN=dev-token-local-only
```

For **Meta Cloud API** (requires Meta dashboard setup):
```env
WHATSAPP_PROVIDER=meta
WHATSAPP_VERIFY_TOKEN=your-secure-random-token
WHATSAPP_ACCESS_TOKEN=EAAC...
WHATSAPP_PHONE_NUMBER_ID=123456789
```

### Step 4: Configure OpenAI (Optional)

```env
# Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...

# Choose model
OPENAI_MODEL=gpt-3.5-turbo
```

**Note:** App works fine without OpenAI - uses knowledge base as fallback.

---

## Database Setup

### Start PostgreSQL (Docker)

```bash
# Start PostgreSQL service
docker-compose up -d postgres

# Wait for it to be ready (~10 seconds)
docker-compose logs postgres

# Look for: "database system is ready to accept connections"
```

### Run Migrations

```bash
# Generate Prisma client
npm run prisma:generate

# Apply schema to database
npm run prisma:migrate

# Output should show:
# ✔ Successfully created migrations
# ✔ Database is in sync
```

### Seed Knowledge Base

```bash
# Populate health articles
npm run prisma:seed

# Output should show:
# ✅ Created 8 health articles
# Done seeding database
```

### Verify Database

```bash
# Connect to PostgreSQL
psql postgresql://postgres:postgres@localhost:5432/kericho_ai

# Check tables
\dt

# Show users table
SELECT * FROM "User";

# Show knowledge articles
SELECT topic, language FROM "KnowledgeArticle";

# Exit
\q
```

---

## Running Locally

### Development Mode

```bash
# Terminal 1: Start PostgreSQL
docker-compose up postgres

# Terminal 2: Start API server
npm run dev

# Expected output:
# ✅ Database connected
# 🚀 Server listening on port 3000
# 📡 WhatsApp provider: baileys (or auto-detected)
```

### Production Mode

```bash
# Set environment
export NODE_ENV=production

# Start server
npm start

# Output should show:
# ✅ Database connected (production)
# 🚀 Server listening on port 3000
```

### Monitor Logs

```bash
# See all logs
npm run dev

# Or filter specific logs
# grep "webhook" logs/app.log
# grep "ERROR" logs/app.log
```

---

## Testing

### Online Testing Tool

Use the included test utility to verify all endpoints:

```bash
# Run all tests
node utils/test-webhook.js

# Expected output:
# ✅ Health check passed
# ✅ Webhook verification passed
# ✅ Correctly rejected invalid token with 403 Forbidden
# ✅ Message accepted by webhook
# ✅ Message accepted by webhook
# 
# Test Summary
# Passed: 5/5
# Failed: 0/5
```

### Test Individual Components

#### 1. Health Check

```bash
curl http://localhost:3000/api/health

# Response:
# {
#   "status": "ok",
#   "database": "connected",
#   "timestamp": "2024-01-15T10:30:45.123Z"
# }
```

#### 2. Webhook Verification

```bash
# This is what Meta calls to verify your endpoint
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=your-token&hub.challenge=test123"

# Response: test123 (plain text)
```

#### 3. Simulate User Message

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "27712345678",
            "type": "text",
            "text": {"body": "what is malaria?"}
          }],
          "metadata": {
            "phone_number_id": "567890"
          }
        }
      }]
    }]
  }'

# Response:
# {"success": true, "message": "Message received"}
```

#### 4. Check Stored Messages

```bash
psql postgresql://postgres:postgres@localhost:5432/kericho_ai

# Get latest message
SELECT * FROM "ConversationMessage" ORDER BY "createdAt" DESC LIMIT 1;

# Get user's conversation
SELECT * FROM "ConversationMessage" WHERE "userId" = (
  SELECT id FROM "User" WHERE "whatsappNumber" = '27712345678'
);

# Exit
\q
```

### Testing Checklist

Use this checklist to verify everything works:

- [ ] Server starts without errors: `npm run dev`
- [ ] Health check returns `status: ok`
- [ ] Webhook verification returns same challenge value
- [ ] Invalid token returns 403 Forbidden
- [ ] Webhook accepts incoming message
- [ ] Message stored in PostgreSQL
- [ ] Response appears in logs
- [ ] Query can retrieve conversation from DB

---

## Troubleshooting

### Server Won't Start

```bash
# Error: "Cannot find module"
npm install

# Error: "Port 3000 in use"
lsof -i :3000
kill -9 <PID>

# Error: "database: not_available"
docker-compose up -d postgres
sleep 5
npm run dev
```

### Database Connection Error

```bash
# Check PostgreSQL is running
docker-compose ps

# If postgres container is down:
docker-compose up -d postgres

# Check logs
docker-compose logs postgres

# Reset PostgreSQL (will erase data!)
docker-compose down -v
docker-compose up -d postgres
```

### PostgreSQL Schema Issues

```bash
# Reset database completely
npm run prisma:migrate reset

# This will:
# - Drop all tables
# - Re-create schema
# - Run all migrations
# - Seed data
# (Only do this in development!)
```

### Webhook Not Receiving Messages

1. Check token matches:
   ```bash
   # In .env
   echo $WHATSAPP_VERIFY_TOKEN
   
   # In Meta dashboard: WhatsApp → Configuration → Webhooks
   # Should match exactly
   ```

2. Verify webhook URL is accessible:
   ```bash
   curl https://your-app.com/webhook?hub.mode=subscribe&hub.verify_token=token&hub.challenge=test
   ```

3. Check Meta logs:
   - Meta Dashboard → App Dashboard → Webhooks
   - See delivery status and error messages

### Messages Not Responding

```bash
# Check server logs
npm run dev

# Look for:
# - "Message received from..."
# - "Searching knowledge base..."
# - "Response sent to WhatsApp"

# If you see "Response sent" but user doesn't receive:
# - Check Meta sends it (App Dashboard → Logs)
# - Check WhatsApp_ACCESS_TOKEN is correct
# - Check WHATSAPP_PHONE_NUMBER_ID is correct
```

### High Latency Responses

```bash
# Check OpenAI latency
# Takes 2-5 seconds per AI call

# Optimize:
# 1. Use gpt-3.5-turbo (faster than gpt-4)
# 2. Add more KB articles (fewer AI calls needed)
# 3. Check internet connection to OpenAI
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] All tests passing locally (`node utils/test-webhook.js`)
- [ ] `.env` file configured for production
- [ ] PostgreSQL database backed up
- [ ] WHATSAPP_VERIFY_TOKEN changed to secure random string
- [ ] All secrets stored in environment (not in code)
- [ ] SSL certificate valid for domain
- [ ] Error logging configured
- [ ] Monitor/alerting set up

### Deploy to Railway

**Simple 5-minute deployment:**

1. **Connect GitHub**
   - Go to https://railway.app
   - Click "New Project"
   - Select your GitHub repo

2. **Add PostgreSQL Service**
   - Click "Add Plugin" → PostgreSQL
   - Railway auto-creates database

3. **Set Environment Variables**
   - In Railway dashboard
   - Add all variables from `.env`

4. **Deploy**
   - Railway auto-deploys on git push
   - Get URL: `https://your-project-name.up.railway.app`

5. **Update Meta Webhook**
   - Meta Dashboard → WhatsApp → Configuration
   - Callback URL: `https://your-project-name.up.railway.app/webhook`
   - Same verify token you set

6. **Test**
   ```bash
   curl https://your-project-name.up.railway.app/api/health
   ```

### Alternative Deployments

**Render:**
- https://render.com (free tier available)
- Similar to Railway process
- Free PostgreSQL included

**Fly.io:**
- https://fly.io
- Good for high performance
- More complex setup

**AWS Lambda + RDS:**
- Serverless option
- Higher cost for low traffic
- Good for high scaling

### Monitor Production

```bash
# Set up logging
export LOG_LEVEL=info

# Configure error tracking
npm install @sentry/node
# Add to index.js:
# Sentry.init({dsn: process.env.SENTRY_DSN});

# Check health
curl https://your-app.com/api/health

# Monitor webhook delivery
# Meta Dashboard → App Dashboard → Logs
```

---

## Next Steps

### 1. Customize Health Content

Edit knowledge base:
```bash
nano src/data/healthKnowledgeBase.json

# Add new topics, update content, translate to Kiswahili
# Re-seed database:
npm run prisma:seed
```

### 2. Add User Analytics

```bash
# Query conversation stats
psql <DATABASE_URL>

# Get top questions
SELECT content, COUNT(*) as count 
FROM "ConversationMessage" 
WHERE role = 'user'
GROUP BY content 
ORDER BY count DESC;

# Get users count
SELECT COUNT(*) FROM "User";
```

### 3. Set Up Monitoring

```bash
# Add Sentry for error tracking
npm install @sentry/node

# Add StatsD for metrics
npm install node-statsd

# Add DataDog monitoring
npm install dd-trace
```

### 4. Scale to More Users

```bash
# Use connection pooling
# Install PgBouncer or use Supabase connection pooling

# Add caching
npm install redis

# Add rate limiting
npm install express-rate-limit
```

---

## Quick Reference Commands

```bash
# Setup
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# Development
npm run dev
npm run dev:fix  # Auto-fix linting

# Testing
node utils/test-webhook.js
npm test          # (not yet implemented)

# Database
npm run prisma:studio  # Visual DB browser
npm run prisma:reset    # DANGEROUS: drop all data

# Production
export NODE_ENV=production
npm start

# Docker
docker-compose up -d postgres
docker-compose logs postgres
docker-compose down
```

---

## Support & Resources

- **Documentation:** See [README.md](README.md), [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Troubleshooting:** See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Architecture:** See [ARCHITECTURE.md](ARCHITECTURE.md)
- **Deployment:** See [DEPLOYMENT.md](DEPLOYMENT.md)

---

## Success Indicators

When everything is working:

✅ `curl http://localhost:3000/api/health` returns status ok  
✅ Webhook verification returns correct challenge value  
✅ `node utils/test-webhook.js` shows all tests passing  
✅ Messages appear in PostgreSQL `ConversationMessage` table  
✅ Server logs show "Message received from..." entries  
✅ Knowledge base topics show relevant responses  
✅ OpenAI integration works (if configured)  

You're ready to connect real WhatsApp users!

---

## Common Configurations

### Development (Baileys)
```env
WHATSAPP_PROVIDER=baileys
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kericho_ai
OPENAI_API_KEY=sk-... (optional)
```

### Development (Meta Testing)
```env
WHATSAPP_PROVIDER=meta
WHATSAPP_VERIFY_TOKEN=dev-random-token
WHATSAPP_ACCESS_TOKEN=EAAC... (from Meta sandbox)
WHATSAPP_PHONE_NUMBER_ID=... (from Meta)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kericho_ai
OPENAI_API_KEY=sk-...
```

### Production
```env
NODE_ENV=production
WHATSAPP_PROVIDER=meta
WHATSAPP_VERIFY_TOKEN=<secure-random-string>
WHATSAPP_ACCESS_TOKEN=<production-token>
WHATSAPP_PHONE_NUMBER_ID=<prod-number>
DATABASE_URL=<managed-postgres-url>
OPENAI_API_KEY=<sk-...>
PORT=3000
```

---

**Last Updated:** 2024  
**Tested On:** Node.js 20+, PostgreSQL 14+, Docker 24+
