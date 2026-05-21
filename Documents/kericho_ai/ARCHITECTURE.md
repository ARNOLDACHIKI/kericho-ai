# Architecture & Design Documentation 🏗️

Complete technical overview of the Kericho Healthcare WhatsApp Assistant.

## System Architecture

```
┌─────────────────────────┐
│   WhatsApp User Device  │
│  (sends text messages)  │
└────────────┬────────────┘
             │
             │ WhatsApp Protocol
             ▼
┌─────────────────────────────────────────────────────┐
│  Baileys Library (WhatsApp Web Automation)          │
│  - QR Code Authentication                           │
│  - WebSocket Connection                             │
│  - Message Listener                                 │
└────────────┬────────────────────────────────────────┘
             │
             │ (messages, phone number)
             ▼
    ┌────────────────────────┐
    │  src/index.js          │
    │  Message Router        │
    └────────┬───────────────┘
             │
      ┌──────┴──────┬──────────┬──────────────┐
      │             │          │              │
      ▼             ▼          ▼              ▼
  DB Save    Response        Logging    AI Service
  (Chat)     Pipeline        (Pino)     (OpenAI)
     │          ▲                            │
     │          │                            │
     ▼          │            ┌───────────────┘
 MongoDB      Services       │
  (User       Pipeline:      │
  & Chat)     ┌─────────────┘│
              │              │
              ▼              │
        src/services/        │
        responseService.js ◄─┘
              ▲
              │
       ┌──────┼──────────────┐
       │      │              │
       ▼      ▼              ▼
   Safety  Knowledge   AI Fallback
   Check   Base Lookup  (if enabled)
   (find   (JSON)       
   emergencies
   )
       │      │              │
       └──────┴──────────────┘
              │
              ▼
        Response built
        (with disclaimer)
              │
              ▼
   src/services/whatsappService.js
   sendMessage(phone, response)
              │
              ▼ WhatsApp API
   ┌──────────────────────┐
   │  WhatsApp Platform   │
   └──────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │  WhatsApp User      │
    │  (receives message) │
    └─────────────────────┘
```

## Data Flow: Complete Request Cycle

### 1. User sends message via WhatsApp
```
User phone: +254712345678
Message: "What is malaria?"
Platform: WhatsApp App → WhatsApp servers → Baileys WebSocket
```

### 2. Message received by server
```javascript
// In src/index.js
onIncomingMessage(async (message) => {
  // {
  //   from: "+254712345678@s.whatsapp.net",
  //   text: "What is malaria?",
  //   messageId: "WAID...",
  //   timestamp: 1714406090
  // }
})
```

### 3. User lookup/creation
```javascript
// Check if user exists in MongoDB
let user = await User.findOne({ phoneNumber: "+254712345678" });
if (!user) {
  user = await User.create({
    phoneNumber: "+254712345678",
    language: "en",
    messageCount: 1
  });
}
```

### 4. Build response (orchestration)
```
buildAssistantReply("What is malaria?")
  ├─ Detect emergency keywords? NO
  ├─ Search knowledge base for "malaria"? YES
  │  └─ Found: healthKnowledgeBase.json → malaria section
  │     Return: {
  │       reply: "I am not a doctor...[malaria content]",
  │       topic: "malaria",
  │       source: "knowledge-base"
  │     }
  └─ Return response ← Don't need to call OpenAI
```

### 5. Save to database
```javascript
// Store for analytics and history
await Chat.create({
  phoneNumber: "+254712345678",
  userMessage: "What is malaria?",
  assistantResponse: "I am not a doctor...[response]",
  category: "malaria",
  aiModel: "knowledge-base"
});
```

### 6. Send response back
```javascript
// Send via Baileys/WhatsApp
await sendMessage("+254712345678", responseText);

// User receives:
// "I am not a doctor but can provide health education...
//  Malaria is a parasitic disease transmitted through... [etc]"
```

---

## Response Pipeline Priority

The system tries responses in this order (first match wins):

1. **Safety Check** (Emergency Detection)
   - Keywords: "chest pain", "fainting", "severe bleeding", etc.
   - Response: 🚨 Emergency escalation
   - No data lookup needed

2. **Knowledge Base** (JSON-based)
   - Checks: `src/data/healthKnowledgeBase.json`
   - Fast, curated, accurate
   - Always available (no API needed)
   - Topics: malaria, maternal health, HIV/AIDS, nutrition, mental health

3. **FAQ Database** (JSON-based)
   - Checks: `src/data/frequentlyAsked.json`
   - Pre-written Q&A pairs
   - Fast lookup

4. **AI Fallback** (LLM-based)
   - Only if OpenAI API key configured
   - Uses GPT-3.5-turbo
   - More flexible for unknown questions
   - Costs ~$0.0004 per response

5. **Fallback Response**
   - "I didn't understand. Please ask again or visit clinic"
   - Always available

### Example Flows

**Example 1: Emergency Scenario**
```
User: "I can't breathe"
  ↓
Safety check: "cannot breathe" in emergency keywords? YES
  ↓
Response: "🚨 This is an emergency. Call 999 immediately..."
  ↓ SKIP: KB, FAQ, AI lookups
  ↓
Message sent
```

**Example 2: Knowledge Base Hit**
```
User: "How do I prevent malaria?"
  ↓
Safety: No emergency words
  ↓
KB Search: "malaria" + "prevention" keywords? YES
  ↓
Response: [From malaria_prevention in healthKnowledgeBase.json]
  ↓ SKIP: FAQ, AI lookups
  ↓
Message sent
```

**Example 3: AI Fallback**
```
User: "I have a strange rash on my arm"
  ↓
Safety: No emergency words
  ↓
KB Search: Matches multiple topics, not specific enough
  ↓
FAQ Search: No matching FAQ
  ↓
AI Call (if enabled): Send to OpenAI
  ↓
Response: "I'm not a doctor... [AI-generated educational response]..."
  ↓
Message sent + logged
```

**Example 4: Fallback**
```
User: "Basketball rules"
  ↓
Safety: No emergency words
  ↓
KB/FAQ/AI: No matches found
  ↓
Response: "I didn't understand. Please ask about health topics..."
  ↓
Message sent
```

---

## Database Schema

### MongoDB Collections

#### 1. Users Collection
```javascript
{
  _id: ObjectId("..."),
  phoneNumber: "+254712345678",
  displayName: "John Doe",           // Optional
  language: "en",                    // "en" or "sw"
  isActive: true,
  lastMessageAt: 2024-04-29T10:00:00Z,
  messageCount: 42,
  createdAt: 2024-04-29T09:00:00Z,
  updatedAt: 2024-04-29T10:00:00Z
}
```

#### 2. Chats Collection
```javascript
{
  _id: ObjectId("..."),
  phoneNumber: "+254712345678",
  userMessage: "What is malaria?",
  assistantResponse: "I am not a doctor...",
  category: "malaria",              // Topic or "general"
  sentiment: "neutral",             // "positive", "neutral", "negative"
  resolved: true,                   // Was question answered?
  aiModel: "knowledge-base",        // "knowledge-base", "gpt-3.5-turbo", "gpt-4", "fallback"
  createdAt: 2024-04-29T10:00:00Z,
  updatedAt: 2024-04-29T10:00:00Z
}
```

#### 3. HealthContent Collection (Auto-populated)
```javascript
{
  _id: ObjectId("..."),
  id: "malaria_intro",
  title: "What is Malaria?",
  category: "malaria",
  keywords: ["malaria", "disease", "fever"],
  content: "Malaria is a parasitic disease...",
  contentSwahili: "Malaria ni ugonjwa...",
  disclaimer: "This is educational information only...",
  sources: ["WHO", "Ministry of Health Kenya"],
  tags: ["prevention", "symptoms"],
  createdAt: 2024-04-29T09:00:00Z
}
```

---

## Configuration Files

### 1. healthKnowledgeBase.json Structure
```json
{
  "category_name": [
    {
      "id": "unique-identifier",
      "title": "Display Title",
      "keywords": ["word1", "word2"],
      "content": "English content here",
      "contentSwahili": "Swahili translation",
      "disclaimer": "Educational use only",
      "sources": ["WHO", "Ministry"]
    }
  ]
}
```

**Current Categories**:
- `malaria`: 3 topics (intro, prevention, symptoms)
- `maternal_health`: 2 topics (prenatal care, nutrition)
- `nutrition`: 1 topic (balanced diet)
- `mental_health`: 1 topic (mental health basics)
- `hiv_aids`: 1 topic (HIV overview)

### 2. frequentlyAsked.json Structure
```json
[
  {
    "category": "General Health",
    "questions": [
      {
        "q": "I'm not feeling well. What should I do?",
        "a": "If you experience symptoms...[answer]"
      }
    ]
  }
]
```

---

## Service Architecture

### src/services/whatsappService.js
**Purpose**: WhatsApp connection via Baileys
```
Exports:
- initiateBaileysConnection()      → Connect to WhatsApp
- sendMessage(phone, msg)          → Send WhatsApp message
- onIncomingMessage(callback)      → Listen for incoming
- isWhatsAppConnected()            → Is connected?
- disconnectBaileys()              → Cleanup
```

### src/services/responseService.js
**Purpose**: Orchestrate response pipeline
```
Main function: buildAssistantReply(userMessage)
  ├─ detectLanguage()         → "en" or "sw"
  ├─ detectEmergency()        → Is this urgent?
  ├─ findKnowledgeResponse()  → Check KB/FAQ
  ├─ generateAiResponse()     → Ask OpenAI
  └─ return response object
```

### src/services/knowledgeBaseService.js
**Purpose**: Search JSON knowledge base
```
Functions:
- findKnowledgeResponse(message)   → Search KB & FAQ
- findHealthTopicResponse(message) → Search by category
- findFAQResponse(message)         → Search FAQs
```

### src/services/aiService.js
**Purpose**: OpenAI integration
```
Function: generateAiResponse({ message, language })
  ├─ Validate API key exists
  ├─ Build system prompt
  ├─ Call OpenAI API
  └─ Return text response
```

### src/services/safetyService.js
**Purpose**: Safety checks & compliance
```
Functions:
- detectEmergency(message)      → Find urgent keywords
- buildSafetyPrefix(language)   → Disclaimer text
```

---

## Message Processing Example

### Input
```
WhatsApp incoming message:
Phone: +254712345678
Text: "mama yangu ni mja wa mimba. chakula gani?"
Time: 2024-04-29 15:30:00
```

### Processing Steps

```javascript
// Step 1: Language detection
detectLanguage("mama yangu...") 
  → "sw" (Swahili keywords detected)

// Step 2: Emergency check
detectEmergency("mama yangu...")
  → false (no emergency keywords)

// Step 3: Knowledge base search
findKnowledgeResponse("mama yangu...")
  → Matches "maternal_health" category
  → Found: nutrition_pregnancy topic

// Step 4: Response building
{
  reply: "Mimi si daktari... Kula vyakula vya uzuri...",
  topic: "maternal_health",
  escalationSuggested: false,
  source: "knowledge-base",
  language: "sw"
}

// Step 5: Send response
sendMessage("+254712345678", reply)

// Step 6: Save to database
Chat.create({
  phoneNumber: "+254712345678",
  userMessage: "mama yangu ni mja wa mimba. chakula gani?",
  assistantResponse: "Mimi si daktari...",
  category: "maternal_health",
  language: "sw"
})
```

### Output
```
WhatsApp message to user:
"Mimi si daktari. Natoa elimu ya afya ya jumla pekee, 
sio uchunguzi wa kitabibu. Kula vyakula vya uzuri:
- Nyama, samaki
- Maharagwe
- Maziwa
- Matunda..."
```

---

## Environment Variables & Configuration

| Variable | Default | Used By | Purpose |
|----------|---------|---------|---------|
| `NODE_ENV` | dev | src/index.js | Error handling |
| `PORT` | 3000 | Express | Server port |
| `MONGODB_URI` | mongodb://localhost:27017/kericho_ai | src/lib/prisma.js | DB connection |
| `OPENAI_API_KEY` | (none) | src/services/aiService.js | AI responses |
| `OPENAI_MODEL` | gpt-3.5-turbo | src/services/aiService.js | Which GPT model |
| `DEFAULT_LANGUAGE` | en | src/services/responseService.js | Default language |
| `EMERGENCY_CONTACT_TEXT` | 🚨 Call 999... | src/services/responseService.js | Emergency message |

---

## Error Handling

### Knowledge Base Not Found
```
→ Skip KB lookup → Try AI → Return fallback
```

### AI API Error
```
OpenAI timeout/error
→ Log error
→ Return fallback response
→ Continue (not fatal)
```

### MongoDB Connection Error
```
Connection fails on startup
→ Log error
→ Exit process (Force restart/retry)
```

### WhatsApp Connection Error
```
Baileys WebSocket disconnects
→ Log warning
→ Attempt auto-reconnect
→ Wait for user to scan QR again
```

---

## Security Considerations

✅ **What we do**:
- No PII in logs (except phone number)
- Disclaimers prevent liability
- No medical diagnoses issued
- Emergency detection prevents harm

⚠️ **What to implement for production**:
- Rate limiting (prevent abuse)
- Message encryption at rest
- API key rotation
- Input validation
- GDPR compliance (data deletion)
- Regular security audits

---

## Performance Metrics

| Operation | Typical Time |
|-----------|--------------|
| Message received → Response sent | 200-500ms |
| KB lookup | 5-20ms |
| AI API call | 1-3 seconds |
| Database save | 50-100ms |
| WhatsApp send | 100-300ms |

**Bottleneck**: OpenAI API calls (1-3 seconds)
**Improvement**: Cache common responses

---

## Maintenance Tasks

### Weekly
- [ ] Review error logs in Sentry or console
- [ ] Check MongoDB storage usage

### Monthly
- [ ] Update health content as needed
- [ ] Review chat analytics
- [ ] Check for package updates: `npm outdated`

### Quarterly
- [ ] Security audit
- [ ] Update dependencies: `npm update`
- [ ] Review emergency keyword effectiveness

---

This documentation provides a complete technical reference for understanding, maintaining, and extending the system.
