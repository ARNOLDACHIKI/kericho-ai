# Emergency Detection & Admin Dashboard - Testing Guide

## Overview

This guide shows you how to test the newly added features:

1. **Emergency Detection System** - Detects life-threatening keywords in user messages
2. **Admin Dashboard API** - Analytics and monitoring endpoints

---

## Part 1: Emergency Detection System

### How It Works

When a user sends a message containing emergency keywords (e.g., "can't breathe", "chest pain", "emergency"), the system:

1. Immediately detects the emergency
2. Logs it with HIGH PRIORITY
3. Returns urgent medical guidance
4. Suggests nearby hospitals if user location is known
5. Marks message in database with `escalationSuggested: true`

### Keywords Included

File: `data/emergencyKeywords.json`

Examples:
- "can't breathe", "difficulty breathing", "shortness of breath"
- "severe pain", "bleeding heavily", "chest pain"
- "unconscious", "unresponsive", "stroke"
- "heart attack", "overdose", "poisoning"
- "emergency", "help me", "urgent"
- ...and 40+ more keywords

### Testing Emergency Detection

#### Method 1: HTTP Chat Endpoint

```bash
# Send emergency message via HTTP
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "from": "254700000001",
    "message": "I cant breathe and have severe chest pain",
    "text": "I cant breathe and have severe chest pain"
  }'
```

**Expected Response:**
```json
{
  "message": "⚠️ MEDICAL EMERGENCY\n\nThis appears to be a medical emergency...",
  "source": "emergency",
  "priority": "HIGH",
  "escalationSuggested": true
}
```

#### Method 2: WhatsApp WebHook (Meta Cloud API)

Send WhatsApp message with emergency keywords:
```
User: "I can't breathe help me now"
```

The webhook handler will:
- Detect emergency
- Log event
- Send back emergency response
- Mark in database

#### Method 3: Test with Location Integration

```bash
# Emergency with location
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "from": "254700000002",
    "message": "severe pain emergency",
    "location": {
      "label": "Kericho",
      "query": "Kericho"
    }
  }'
```

**Expected Response with Facility Suggestions:**
```json
{
  "message": "⚠️ MEDICAL EMERGENCY\n\nNEAREST HOSPITALS in Kericho:\n1. Kericho County Referral Hospital (general, maternal, emergency)\n2. Litein Mission Hospital (general, maternity)...",
  "source": "emergency",
  "priority": "HIGH"
}
```

### Verify in Database

```bash
# Check emergency messages in PostgreSQL (using psql)
psql $DATABASE_URL -c "
  SELECT 
    id, 
    content, 
    escalationSuggested, 
    topic, 
    source, 
    \"createdAt\"
  FROM \"ConversationMessage\"
  WHERE \"escalationSuggested\" = true
  ORDER BY \"createdAt\" DESC
  LIMIT 10;
"
```

### Service Usage in Code

```javascript
const { 
  detectEmergency, 
  getEmergencyResponse, 
  logEmergency 
} = require('./services/emergencyService');

// Check if message is an emergency
if (detectEmergency(userMessage)) {
  // Log for monitoring
  logEmergency({
    userId: user.id,
    message: userMessage,
    timestamp: new Date().toISOString()
  });
  
  // Get response (with optional location context)
  const response = getEmergencyResponse({
    facilities: nearbyHospitals,
    location: userLocation
  });
  
  // Send response to user
  sendMessage(response);
  
  // Mark as escalated in database
  await recordAssistantMessage({
    userId: user.id,
    assistant: {
      reply: response,
      escalationSuggested: true,
      source: "emergency"
    }
  });
}
```

---

## Part 2: Admin Dashboard API

### Setup

1. **Set ADMIN_API_KEY in `.env`:**

```bash
# Development (insecure for testing)
ADMIN_API_KEY=admin-key-change-me-in-production

# Production (generate strong key)
# Option 1: Using openssl
ADMIN_API_KEY=$(openssl rand -hex 32)

# Option 2: Using node
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
echo "ADMIN_API_KEY=$(openssl rand -hex 32)" >> .env
```

2. **Restart the server:**

```bash
npm start
```

### Authentication

All admin endpoints require the `x-api-key` header:

```bash
curl -X GET http://localhost:3000/admin/stats \
  -H "x-api-key: your-admin-api-key-value"
```

If key is missing or invalid:
```json
{
  "success": false,
  "error": "Missing x-api-key header"
}
```

---

### Endpoint: GET /admin/health

**Health check for the admin API**

```bash
curl -X GET http://localhost:3000/admin/health \
  -H "x-api-key: admin-key-change-me-in-production"
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "data": {
    "users": 120,
    "messages": 540,
    "emergencies": 12
  },
  "timestamp": "2025-01-15T14:30:00.000Z"
}
```

---

### Endpoint: GET /admin/stats

**Full dashboard summary with all metrics**

```bash
curl -X GET http://localhost:3000/admin/stats \
  -H "x-api-key: admin-key-change-me-in-production"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalUsers": 120,
      "totalMessages": 540,
      "emergencyCount": 12,
      "activeUsers7d": 85,
      "emergencyRate": "2.22"
    },
    "topTopics": [
      {
        "topic": "malaria",
        "count": 150
      },
      {
        "topic": "headache",
        "count": 120
      },
      {
        "topic": "nutrition",
        "count": 95
      }
    ],
    "feedback": {
      "total": 45,
      "averageRating": 4.2
    },
    "recentEmergencies": [
      {
        "id": "msg123",
        "userId": "uid456",
        "userPhone": "+254712345678",
        "message": "can't breathe",
        "timestamp": "2025-01-15T14:00:00Z",
        "source": "whatsapp"
      }
    ]
  },
  "timestamp": "2025-01-15T14:30:00.000Z"
}
```

---

### Endpoint: GET /admin/users

**List all users with pagination and message counts**

```bash
# Get first 50 users
curl -X GET "http://localhost:3000/admin/users?limit=50&offset=0" \
  -H "x-api-key: admin-key-change-me-in-production"

# Get next 50 users (pagination)
curl -X GET "http://localhost:3000/admin/users?limit=50&offset=50" \
  -H "x-api-key: admin-key-change-me-in-production"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uid123",
      "whatsappNumber": "+254712345678",
      "preferredLanguage": "en",
      "joinedAt": "2025-01-10T08:30:00Z",
      "totalMessages": 25,
      "feedbackCount": 2
    },
    {
      "id": "uid124",
      "whatsappNumber": "+254789654321",
      "preferredLanguage": "sw",
      "joinedAt": "2025-01-12T14:15:00Z",
      "totalMessages": 12,
      "feedbackCount": 0
    }
  ],
  "pagination": {
    "offset": 0,
    "limit": 50,
    "total": 120
  },
  "timestamp": "2025-01-15T14:30:00.000Z"
}
```

---

### Endpoint: GET /admin/messages

**List recent messages with filters**

```bash
# Get all messages (last 100)
curl -X GET "http://localhost:3000/admin/messages?limit=100" \
  -H "x-api-key: admin-key-change-me-in-production"

# Get only escalated/emergency messages
curl -X GET "http://localhost:3000/admin/messages?escalated=true&limit=50" \
  -H "x-api-key: admin-key-change-me-in-production"

# Filter by topic
curl -X GET "http://localhost:3000/admin/messages?topic=malaria&limit=50" \
  -H "x-api-key: admin-key-change-me-in-production"

# Combine filters
curl -X GET "http://localhost:3000/admin/messages?topic=headache&escalated=false&limit=30" \
  -H "x-api-key: admin-key-change-me-in-production"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg123",
      "userPhone": "+254712345678",
      "content": "I have had a severe headache for 3 days...",
      "topic": "headache",
      "escalated": false,
      "source": "whatsapp",
      "timestamp": "2025-01-15T10:30:00Z"
    }
  ],
  "count": 1,
  "timestamp": "2025-01-15T14:30:00.000Z"
}
```

---

### Endpoint: GET /admin/emergencies

**Get emergency messages (escalated = true)**

```bash
# Get emergencies from last 30 days
curl -X GET "http://localhost:3000/admin/emergencies?days=30&limit=100" \
  -H "x-api-key: admin-key-change-me-in-production"

# Get emergencies from last 7 days
curl -X GET "http://localhost:3000/admin/emergencies?days=7&limit=50" \
  -H "x-api-key: admin-key-change-me-in-production"

# Get last 10 emergencies (any date)
curl -X GET "http://localhost:3000/admin/emergencies?days=365&limit=10" \
  -H "x-api-key: admin-key-change-me-in-production"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg456",
      "userId": "uid789",
      "userPhone": "+254798765432",
      "message": "can't breathe, chest pain, severe pain",
      "topic": null,
      "timestamp": "2025-01-15T14:22:00Z",
      "source": "whatsapp"
    },
    {
      "id": "msg457",
      "userId": "uid790",
      "userPhone": "+254799876543",
      "message": "emergency, bleeding heavily, need help",
      "topic": null,
      "timestamp": "2025-01-15T13:45:00Z",
      "source": "whatsapp"
    }
  ],
  "summary": {
    "totalEmergencies": 12,
    "period": "30 days"
  },
  "timestamp": "2025-01-15T14:30:00.000Z"
}
```

---

### Endpoint: GET /admin/feedback

**Get user feedback and satisfaction metrics**

```bash
# Get recent feedback
curl -X GET "http://localhost:3000/admin/feedback?limit=50" \
  -H "x-api-key: admin-key-change-me-in-production"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "fb123",
      "userPhone": "+254712345678",
      "rating": 5,
      "comment": "Great app, very helpful",
      "timestamp": "2025-01-15T12:00:00Z"
    },
    {
      "id": "fb124",
      "userPhone": "+254789654321",
      "rating": 4,
      "comment": "Good but needs improvement in responses",
      "timestamp": "2025-01-14T18:30:00Z"
    }
  ],
  "stats": {
    "total": 45,
    "averageRating": 4.2
  },
  "timestamp": "2025-01-15T14:30:00.000Z"
}
```

---

### Endpoint: GET /admin/topics

**Get health topic statistics and breakdown**

```bash
# Get top 10 topics
curl -X GET "http://localhost:3000/admin/topics?limit=10" \
  -H "x-api-key: admin-key-change-me-in-production"

# Get top 5 topics
curl -X GET "http://localhost:3000/admin/topics?limit=5" \
  -H "x-api-key: admin-key-change-me-in-production"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "topTopics": [
      {
        "topic": "malaria",
        "count": 150
      },
      {
        "topic": "headache",
        "count": 120
      },
      {
        "topic": "nutrition",
        "count": 95
      }
    ],
    "breakdown": {
      "normal": [
        {
          "topic": "malaria",
          "count": 145
        },
        {
          "topic": "headache",
          "count": 115
        }
      ],
      "escalated": [
        {
          "topic": "malaria",
          "count": 5
        },
        {
          "topic": "headache",
          "count": 5
        }
      ]
    }
  },
  "timestamp": "2025-01-15T14:30:00.000Z"
}
```

---

## Testing with Postman

### 1. Create Environment Variable

1. Open Postman
2. Click "Environments" → "Create New"
3. Name: `Kericho Admin`
4. Add variable:
   - **Key:** `admin_api_key`
   - **Value:** `admin-key-change-me-in-production`
   - **Type:** `secret`

5. Add variable:
   - **Key:** `base_url`
   - **Value:** `http://localhost:3000`

6. Click Save

### 2. Create Requests

**For each endpoint, create a GET request:**

- **Admin Health:** `{{base_url}}/admin/health`
- **Stats:** `{{base_url}}/admin/stats`
- **Users:** `{{base_url}}/admin/users?limit=50&offset=0`
- **Messages:** `{{base_url}}/admin/messages?limit=100`
- **Emergencies:** `{{base_url}}/admin/emergencies?days=30&limit=100`
- **Feedback:** `{{base_url}}/admin/feedback?limit=50`
- **Topics:** `{{base_url}}/admin/topics?limit=10`

### 3. Add Authentication

For each request:
1. Go to "Headers" tab
2. Add new header:
   - **Key:** `x-api-key`
   - **Value:** `{{admin_api_key}}`

3. Click "Send"

---

## Monitoring Emergency Messages

### SQL Query to Track Emergencies

```sql
SELECT 
  id,
  "userId",
  content,
  topic,
  "escalationSuggested",
  source,
  "createdAt",
  source = 'emergency' AS is_emergency_source
FROM "ConversationMessage"
WHERE "escalationSuggested" = true
ORDER BY "createdAt" DESC
LIMIT 50;
```

### Alert Dashboard Query

```sql
-- Emergency messages in last 24 hours
SELECT 
  COUNT(*) as emergency_count,
  AVG(CASE WHEN "createdAt" > NOW() - INTERVAL '1 hour' THEN 1 ELSE 0 END) * 24 as hourly_rate
FROM "ConversationMessage"
WHERE "escalationSuggested" = true
AND "createdAt" > NOW() - INTERVAL '24 hours';
```

---

## Security Best Practices

### Production Deployment

Before deploying to production:

1. **Generate Strong Admin Key:**
```bash
openssl rand -hex 32
```

2. **Update .env:**
```bash
ADMIN_API_KEY=your-generated-hex-string
```

3. **Enable HTTPS:**
- All admin endpoints should use HTTPS only
- Update `APP_BASE_URL` to `https://...`

4. **Rate Limiting (Optional):**
- Add express-rate-limit to `/admin/*` routes
- Limit to 100 requests per 15 minutes per IP

5. **Audit Logging:**
- All admin API access is logged with timestamp and IP
- Check `/var/log/kericho-admin.log`

---

## Troubleshooting

### Admin Key Not Working

```bash
# Check environment variable
echo $ADMIN_API_KEY

# Restart server
npm start
```

### Emergency Not Detected

1. Check keywords in `data/emergencyKeywords.json`
2. Keywords are case-insensitive and partial matches
3. Example: "I have a can't breathe feeling" ✅ Matches
4. Add new keywords if needed to the JSON file

### Analytics Queries Slow

- Database may need indexing
- Check `prisma/schema.prisma` for index definitions
- Run Prisma migrations: `npx prisma migrate deploy`

### No Emergencies Showing

1. Test with obvious keywords: "emergency", "can't breathe"
2. Check database directly:
```bash
psql $DATABASE_URL -c "
  SELECT COUNT(*) FROM \"ConversationMessage\" 
  WHERE \"escalationSuggested\" = true;
"
```

---

## Next Steps

1. **Add Rate Limiting** to prevent brute force attacks on admin endpoints
2. **Add Two-Factor Authentication** for admin dashboard
3. **Create Admin Web UI** to visualize the data
4. **Set up Alerts** for high emergency count
5. **Add Export Functionality** for reports (CSV, PDF)

