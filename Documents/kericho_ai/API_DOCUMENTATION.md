# API Documentation

## Overview

The Kericho AI WhatsApp Healthcare Assistant provides a REST API for health information queries via WhatsApp. This document describes all available endpoints, their parameters, and expected responses.

**Base URL (Local):** `http://localhost:3000`  
**Base URL (Production):** Depends on your deployment platform

---

## Table of Contents

1. [Authentication](#authentication)
2. [Health Check Endpoint](#health-check-endpoint)
3. [WhatsApp Webhook Endpoints](#whatsapp-webhook-endpoints)
4. [Message Flow](#message-flow)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Examples](#examples)

---

## Authentication

### Webhook Verification Token

Meta's Cloud API uses a **webhook verification token** to authenticate your endpoint.

- **Location:** Environment variable `WHATSAPP_VERIFY_TOKEN`
- **Usage:** Meta includes this in GET requests when verifying the webhook
- **Security:** Keep this token secure and rotate it periodically in production

**Example:**
```bash
# In .env
WHATSAPP_VERIFY_TOKEN=kericho-secure-webhook-token-2024

# Meta will verify by calling:
GET /webhook?hub.mode=subscribe&hub.verify_token=kericho-secure-webhook-token-2024&hub.challenge=abc123xyz
```

---

## Health Check Endpoint

### GET /api/health

**Purpose:** Check if the API is running and database is connected

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "database": "connected",
  "version": "1.0.0"
}
```

**Example:**
```bash
curl http://localhost:3000/api/health
```

---

## WhatsApp Webhook Endpoints

### GET /webhook

**Purpose:** Webhook verification from Meta

Meta calls this endpoint to verify your webhook is active.

**Query Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `hub.mode` | Yes | Should be `subscribe` |
| `hub.verify_token` | Yes | Must match `WHATSAPP_VERIFY_TOKEN` env var |
| `hub.challenge` | Yes | Random challenge string to echo back |

**Response (200 OK):**
```
hub.challenge value (plain text)
```

**Errors:**
- `403 Forbidden` - Invalid verify token
- `400 Bad Request` - Missing parameters

**Example:**
```bash
# This is what Meta calls
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=kericho-secure-webhook-token-2024&hub.challenge=test123"

# Response: test123
```

---

### POST /webhook

**Purpose:** Receive incoming messages from WhatsApp users via Meta's Cloud API

**Headers Required:**
```
Content-Type: application/json
```

**Body Structure:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "...",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "27XXXXXXXXX",
              "phone_number_id": "123456789"
            },
            "messages": [
              {
                "from": "27XXXXXXXXX",
                "id": "wamid.xxx",
                "timestamp": "1673456789",
                "type": "text",
                "text": {
                  "body": "what is malaria?"
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Message received and queued for processing"
}
```

**Processing Flow:**
1. ✅ Webhook verifies signature (Meta webhook signature)
2. ✅ Message is queued for async processing
3. ✅ Response sent immediately (200 OK)
4. ✅ Backend processes message async:
   - Search knowledge base
   - If no match, query OpenAI
   - Store conversation in database
   - Send WhatsApp reply via Meta API

**Errors:**
- `200 OK` - Always return this for Meta (even if processing fails later)
- `401 Unauthorized` - Invalid webhook signature
- `500 Internal Server Error` - Webhook processing error (logged)

**Example:**
```bash
# Simulate incoming message from Meta
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "27123456789",
            "type": "text",
            "text": {"body": "what is malaria?"}
          }],
          "metadata": {
            "phone_number_id": "123456789"
          }
        }
      }]
    }]
  }'

# Response: {"success": true, ...}
```

---

## Message Flow

### Complete User Journey

```
User sends WhatsApp message
        ↓
Meta receives message
        ↓
Meta sends webhook POST to your /webhook endpoint
        ↓
Your app returns 200 OK immediately
        ↓
App processes message asynchronously:
  1. Extract phone number + message text
  2. Upsert User in DB (with WhatsApp number)
  3. Check Knowledge Base for answer
        ├─ Found: Use KB response
        └─ Not found: Query OpenAI API
  4. Save User message to DB
  5. Save AI/KB response to DB
  6. Send WhatsApp reply via Meta API
        ↓
User receives response in WhatsApp
```

### Response Generation Priority

1. **Knowledge Base Search** (fastest, no API calls)
   - Matches keywords in user message
   - Returns both English and Kiswahili responses

2. **OpenAI API** (slower, costs $)
   - Used if KB has no match
   - Healthcare-focused system prompt
   - Enforces "not a doctor" disclaimer

3. **Fallback Response** (if OpenAI fails)
   - Generic "ask healthcare provider" message
   - Ensures user always gets a response

---

## Error Handling

### Error Response Format

All errors include a descriptive message and HTTP status code.

```json
{
  "error": "Descriptive error message",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

### Common Error Codes

| Status | Reason | Recovery |
|--------|--------|----------|
| `400` | Bad request (malformed JSON) | Check request format |
| `401` | Webhook signature invalid | Verify `WHATSAPP_VERIFY_TOKEN` |
| `403` | Verify token mismatch | Update `.env` file |
| `429` | Rate limited (OpenAI quota) | Wait before retrying |
| `500` | Server error | Check logs, restart if needed |
| `503` | PostgreSQL down | Restart database service |

### Database Errors

If PostgreSQL is unavailable:
- Health check returns `database: disconnected`
- Webhook still accepts messages (returns 200) but processes fail
- Messages not stored (will be lost)
- Fix: Restart PostgreSQL service

### OpenAI Errors

If OpenAI API key is invalid or quota exceeded:
- KB responses still work
- AI responses fall back to KB
- User sees KB response or fallback message
- No error shown to user
- Admin logs will show API error

---

## Rate Limiting

### Current Limits

- Per user: Maximum 1 message per second
- Overall: No limit (can change in future versions)
- OpenAI: Subject to your API plan's rate limits

### Future Rate Limiting

You can add rate limiting via:
- Redis + `npm install express-rate-limit`
- Per-phone-number limits
- Per-minute quotas

---

## Examples

### 1. Check API Health

```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "database": "connected",
  "version": "1.0.0"
}
```

---

### 2. Verify Webhook (What Meta Calls)

```bash
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=kericho-secure-webhook-token-2024&hub.challenge=test-challenge-123"
```

**Response:**
```
test-challenge-123
```

---

### 3. Simulate User Message (Local Testing)

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "123456",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "27123456789",
            "phone_number_id": "567890",
            "business_account_id": "123456"
          },
          "messages": [{
            "from": "27712345678",
            "id": "wamid.test123",
            "timestamp": "1673456789",
            "type": "text",
            "text": {
              "body": "Is there a cure for malaria?"
            }
          }],
          "contacts": [{
            "profile": {
              "name": "John Doe"
            },
            "wa_id": "27712345678"
          }]
        }
      }]
    }]
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Message received and queued for processing"
}
```

**Check Database:**
```bash
# View stored message (PostgreSQL)
psql postgresql://postgres:postgres@localhost:5432/kericho_ai

kericho_ai=# SELECT * FROM "ConversationMessage" ORDER BY "createdAt" DESC LIMIT 1;
```

---

### 4. Query Conversation History

```bash
# Get all messages for a user (phone number)
curl "http://localhost:3000/api/conversation/27712345678" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Note: Requires authentication header (not yet implemented - for future feature)

---

## Debugging Tips

### 1. Check Webhook Verification

```bash
# Test with correct token
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=kericho-secure-webhook-token-2024&hub.challenge=123"

# Test with wrong token (should fail)
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=wrong-token&hub.challenge=123"
```

### 2. Monitor Logs

```bash
# In development
npm run dev

# Watch logs output (development always shows webhook requests)
```

### 3. Check Database Connection

```bash
# Test that app can reach PostgreSQL
npm run dev

# Look for success message:
# "✅ Database connected"
```

### 4. Validate Message Format

```bash
# Test your webhook message format is valid JSON
node -e 'console.log(JSON.stringify({...}))' > test-message.json

# Valid JSON?
cat test-message.json | jq . > /dev/null && echo "Valid JSON" || echo "Invalid JSON"
```

### 5. Check OpenAI Integration

```bash
# Test OpenAI API key
OPENAI_API_KEY=sk-your-key curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-your-key"

# Should return list of models
```

---

## Testing Checklist

- [ ] `GET /api/health` returns `{"status":"ok"}`
- [ ] `GET /webhook?hub.mode=subscribe&hub.verify_token=...&hub.challenge=test` returns `test`
- [ ] `GET /webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=test` returns 403
- [ ] `POST /webhook` with valid message returns `{"success":true}`
- [ ] Message appears in PostgreSQL `ConversationMessage` table
- [ ] Bot responds on WhatsApp within 10 seconds
- [ ] Bot response uses KB if topic matches
- [ ] Bot uses OpenAI if KB has no match
- [ ] Both English and Kiswahili work

---

## Deployment Checklist

Before deploying to production:

- [ ] Set `WHATSAPP_VERIFY_TOKEN` to a secure random string in .env
- [ ] Update webhook URL in Meta dashboard to your production domain
- [ ] Verify SSL certificate is valid
- [ ] Set `NODE_ENV=production` in environment
- [ ] Update `DATABASE_URL` to managed PostgreSQL (Neon, Supabase, etc.)
- [ ] Set valid `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`
- [ ] Set valid `OPENAI_API_KEY`
- [ ] Run database migrations: `npm run prisma:migrate`
- [ ] Seed knowledge base: `npm run prisma:seed`
- [ ] Test health endpoint: `curl https://your-app.com/api/health`
- [ ] Test webhook verification from Meta dashboard
- [ ] Send test message from WhatsApp and verify response

---

## Support

For issues:
1. Check logs for error messages
2. Verify all environment variables are set correctly
3. Check PostgreSQL connection
4. Verify Meta webhook token matches
5. Review [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
