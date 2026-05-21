# Troubleshooting Guide 🔧

Solutions to common problems with the Kericho Healthcare WhatsApp Assistant.

## Connection & Startup Issues

### ❌ "Cannot connect to PostgreSQL"

**Symptoms**:
- Server logs: `Error: Failed to connect to PostgreSQL`
- Application crashes on startup
- Cannot save chat history

**Solutions**:

1. **Check if PostgreSQL is running**
   ```bash
   # Check if local PostgreSQL is running
   ps aux | grep postgres
   
   # Or check if Docker container is running
   docker ps | grep postgres
   
   # If Docker container not running:
   docker-compose up -d postgres
   ```

2. **Verify connection string in .env**
   ```bash
   # Local PostgreSQL should be:
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kericho_ai?schema=public
   
   # Managed PostgreSQL should be:
   DATABASE_URL=postgresql://user:password@host:5432/kericho_ai?schema=public
   ```

3. **Test connection manually**
   ```bash
   # Install PostgreSQL client tools (if not present)
   sudo apt-get install postgresql-client
   
   # Connect to your database
   psql "postgresql://postgres:postgres@localhost:5432/kericho_ai?schema=public"
   # or
   psql "postgresql://user:password@host:5432/kericho_ai?schema=public"
   
   # You should see: kericho_ai>
   ```

4. **If using managed PostgreSQL**, ensure:
   - ✅ Database host is reachable
   - ✅ Database user created with correct password
   - ✅ Connection string has correct username:password

---

### ❌ "QR Code not appearing"

**Symptoms**:
- Terminal shows server started but no QR code
- `.auth` folder empty
- WhatsApp not connecting

**Solutions**:

1. **Clear authentication cache**
   ```bash
   rm -rf .auth
   npm run dev
   ```

2. **Check port 3000 is free**
   ```bash
   # See what's using port 3000
   lsof -i :3000
   
   # Kill the process if needed
   kill -9 <PID>
   ```

3. **Try clearing all node_modules**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run dev
   ```

4. **Ensure Baileys dependency installed**
   ```bash
   npm install @whiskeysockets/baileys --save
   npm run dev
   ```

5. **Check server is actually running**
   ```bash
   # In another terminal, test the server
   curl http://localhost:3000/
   
   # You should see JSON response with version info
   ```

---

### ❌ "EADDR ALREADY IN USE :::3000"

**Symptoms**:
- Error message: `listen EADDRINUSE :::3000`
- Can't start server

**Solution**:
```bash
# Find and kill process using port 3000
lsof -i :3000
kill -9 <PID>

# Or change port in .env
PORT=3001
npm run dev

# Test new port
curl http://localhost:3001/
```

---

## WhatsApp & Message Issues

### ❌ "Messages not being processed"

**Symptoms**:
- Send message but bot doesn't respond
- No errors in logs
- `.auth` folder exists

**Debugging steps**:

1. **Verify WhatsApp is connected**
   ```bash
   # Look for this line in logs:
   # ✅ WhatsApp Web connected via Baileys
   ```

2. **Check phone number format**
   - Should include country code: `+254...`
   - WhatsApp internal format: `+254712345678@s.whatsapp.net`

3. **Enable verbose logging**
   ```bash
   # Edit src/services/whatsappService.js
   # Change: logger: { level: "silent"... }
   # To: logger: { level: "debug"... }
   npm run dev
   ```

4. **Test message sending via API**
   ```bash
   # You might need to add a test endpoint temporarily
   # in src/index.js to debug
   ```

5. **Check Baileys connection event**
   ```javascript
   // Add this to src/services/whatsappService.js for debugging
   sock.ev.on("connection.update", (update) => {
     console.log("Connection update:", update);
   });
   ```

---

### ❌ "Message sent but no response"

**Symptoms**:
- bot receives message (logs show it)
- bot doesn't send reply
- No errors in terminal

**Solutions**:

1. **Check knowledge base is loaded**
   ```bash
   # Verify JSON files exist and are valid
   node -e "console.log(require('./src/data/healthKnowledgeBase.json'))"
   
   # Should print the JSON without errors
   ```

2. **Check response service is building replies**
   ```javascript
   // Add logging to src/services/responseService.js
   logger.info("Starting response build for:", userMessage);
   ```

3. **Test knowledge base matching**
   ```javascript
   // Add temporary test in src/index.js
   const { findKnowledgeResponse } = require("./services/knowledgeBaseService");
   console.log(
     "KB Match:",
     findKnowledgeResponse("What is malaria?")
   );
   ```

4. **Check emergency detection isn't blocking**
   ```javascript
   // Add to src/services/responseService.js
   const { detectEmergency } = require("./services/safetyService");
   console.log("Is emergency:", detectEmergency(userMessage));
   ```

---

## AI & API Issues

### ❌ "OpenAI API errors"

**Symptoms**:
- Error: `401 Unauthorized`
- Error: `429 Rate limited`
- Error: `Connection timeout`

**Solutions**:

1. **Check API key is valid**
   ```bash
   # Verify in .env
   OPENAI_API_KEY=sk-...
   
   # Go to https://platform.openai.com/account/api-keys
   # Make sure key is active and not expired
   ```

2. **Check account has credits**
   ```
   https://platform.openai.com/account/billing/overview
   - Look for remaining credit or payment method
   - If $0, add payment method or credit
   ```

3. **Check rate limits**
   - Free tier: Limited requests/minute
   - If getting "429" errors, either:
     - Upgrade account
     - Add delay between requests
     - Use knowledge base instead (free!)

4. **Temporarily disable AI to test KB**
   ```bash
   # In .env, don't set OPENAI_API_KEY
   OPENAI_API_KEY=
   
   # System will use knowledge base only
   npm run dev
   ```

---

### ❌ "Responses are too long/short/wrong language"

**Symptoms**:
- Bot sending multi-page messages
- Messages not in Kiswahili when expected
- Generic/irrelevant responses

**Solutions**:

1. **Check response truncation settings**
   ```javascript
   // In src/services/aiService.js
   max_tokens: 150  // Lower = shorter responses
   ```

2. **Debug language detection**
   ```javascript
   // In src/services/responseService.js
   function detectLanguage(message) {
     const swIndicators = ["habari", "naumwa", ...];
     console.log("Detected language for:", message);
     // Add more Swahili keywords if needed
   }
   ```

3. **Check system prompt effectiveness**
   ```javascript
   // Edit systemPrompt in src/services/aiService.js
   const systemPrompt = `You are... Keep responses UNDER 150 characters always.`;
   ```

---

## Database Issues

### ❌ "MongoDB Atlas connection timeout"

**Symptoms**:
- Connection works locally
- Fails on deployed server
- Error: `connection timeout`

**Solutions**:

1. **Whitelist deployment server IP**
   - Go to MongoDB Atlas Dashboard
   - Network Access → Add IP Address
   - Choose "Allow access from anywhere" (0.0.0.0/0)
   - ⚠️ For production, use specific IP instead

2. **Check connection string format**
   ```
   ✅ mongodb+srv://user:password@cluster.mongodb.net/kericho_ai
   ❌ mongodb://user:password@cluster.mongodb.net:27017/kericho_ai
   
   Use "SRV" format, not direct port
   ```

3. **Verify credentials**
   - Username and password must match exactly
   - Special characters must be URL encoded
   - Example: `p@ss` → `p%40ss`

4. **Test connection**
   ```bash
   mongosh "mongodb+srv://user:password@cluster.mongodb.net/kericho_ai"
   
   If works locally but not on server:
   - Check server firewall
   - Check network access is truly open (0.0.0.0/0)
   ```

---

### ❌ "Storage quota exceeded"

**Symptoms**:
- Error: `database storage exceeded`
- Cannot save new messages
- Only appears after a while

**Solutions**:

1. **Check storage usage**
   ```bash
   # In MongoDB Atlas, see Usage tab
   # "your_cluster" → Metrics → Storage
   ```

2. **Archive old chats** (if you have thousands)
   ```bash
   # Export old data for backup
   mongoexport --uri="mongodb+srv://..." --db=kericho_ai --collection=chats > backup.json
   
   # Delete chats older than 90 days
   # mongosh: db.chats.deleteMany({createdAt: {$lt: new Date("2024-01-01")}})
   ```

3. **Upgrade MongoDB tier**
   - M0: 512 MB (free)
   - M2: 2 GB ($9/month)
   - M5: 5 GB (+cost)
   - M10: 10 GB (+cost)

---

## Deployment Issues

### ❌ "App crashes on Render/Railway/Fly"

**Symptoms**:
- Works locally, crashes on deployed server
- Logs show MongoDB connection error
- Server restarts repeatedly

**Solutions**:

1. **Check environment variables**
   ```
   Render: Settings → Environment
   Railway: Variables → Show/Edit
   Fly.io: fly secrets list
   
   Ensure all variables are set:
   - MONGODB_URI (most important)
   - NODE_ENV=production
   - OPENAI_API_KEY (optional)
   ```

2. **Verify MongoDB whitelist**
   - For deployed apps, whitelist `0.0.0.0/0`
   - Or whitelist specific server IP if available

3. **Check logs on platform**
   ```
   Render: https://dashboard.render.com → Logs
   Railway: https://railway.app → Logs
   Fly.io: flyctl logs -f
   ```

4. **Redeploy**
   ```bash
   # Just push to GitHub
   git push origin main
   
   # Automatic redeploy will trigger
   # Check dashboard for status
   ```

---

### ❌ "Free tier keeps going to sleep"

**Symptoms**:
- App works fine first time
- After 15 minutes of no traffic, doesn't respond
- Messages aren't received during sleep

**Solutions**:

1. **Use a pinger service** (keep alive)
   ```
   https://uptimerobot.com (free)
   - Create monitor for your URL
   - Check every 5 minutes
   - Keeps server awake
   ```

2. **Upgrade to paid tier**
   - Render: Starter ($7/month)
   - Railway: $5/month credit (never sleeps)
   - Fly.io: $3/month minimum

3. **For production**: Recommend paid tier
   - Free tier not suitable for 24/7 service
   - Users expect always on
   - Cost only $5-10/month

---

## Performance Problems

### ❌ "Responses are slow"

**Symptoms**:
- User waits 5+ seconds for response
- Timeout errors sometimes

**Diagnosis**:
```bash
# Look for bottleneck in logs
npm run dev
# Send message and time in logs:
# - Message received: 15:30:00.100
# - Response sent: 15:30:02.500
# = 2.4 seconds

# Where is time spent?
# - OpenAI call: 1-3 seconds (expected)
# - MongoDB save: might be slow
# - WhatsApp send: usually fast
```

**Solutions**:

1. **If using OpenAI**: Slow is normal
   - GPT calls take 1-3 seconds
   - This is expected behavior
   - Can't be improved much

2. **If MongoDB is slow**:
   - Check if free tier is under heavy load
   - Upgrade to M2 tier ($9/month)
   - Check network latency to Atlas

3. **Cache responses** (advanced)
   - Use Redis to cache common questions
   - Implement LRU cache for popular topics

---

## Log Analysis

### Understanding Log Messages

```
✅ Kericho WhatsApp assistant server started
   → Server is running

✅ Connected to MongoDB
   → Database connection successful

✅ Baileys WhatsApp connection initiated
   → WhatsApp connection started

QR Code ready - scan with WhatsApp mobile app to connect
   → User needs to scan QR now

INFO: Incoming WhatsApp message
   → User sent message (check terminal for details)

INFO: Response built
   → System figured out what to say

Message sent
   → Message successfully sent to user

ERROR: Failed to connect to MongoDB
   → Database problem, see solutions above

ERROR: AI response generation failed
   → OpenAI API issue

ERROR: Failed to send message
   → WhatsApp sending problem
```

---

## Getting Help

### Debugging Checklist

When something goes wrong:

- [ ] Check terminal logs (npm run dev)
- [ ] Verify .env file is correct
- [ ] Test MongoDB connection separately
- [ ] Check package.json has all dependencies
- [ ] Try: `rm -rf .auth && npm run dev`
- [ ] Check if port 3000 is already in use
- [ ] Verify WhatsApp is logged in (look for ✅ symbols)
- [ ] Test with knowledge base only (disable OpenAI)

### Still stuck?

1. **Check GitHub Issues** (link in README.md)
2. **Review full logs**: `npm run dev` shows everything
3. **Test each component separately**:
   ```bash
   # Test DB
   mongosh "your-connection-string"
   
   # Test KB
   node -e "console.log(require('./src/data/healthKnowledgeBase.json'))"
   
   # Test OpenAI (if configured)
   node -e "const o=require('openai'); console.log('OpenAI OK')"
   ```

---

**Remember: Most issues are:**
- MongoDB connection (check .env)
- WhatsApp not logged in (scan QR)
- Missing dependencies (npm install)

These account for 90% of problems!
