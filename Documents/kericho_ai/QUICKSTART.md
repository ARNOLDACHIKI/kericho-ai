# Quick Start Guide 🚀

Get the Kericho Healthcare WhatsApp Assistant up and running in 5 minutes!

## 1. Prerequisites Check

```bash
# Check Node.js version (need 20+)
node --version

# Check npm version
npm --version

# Optional: Install PostgreSQL locally or use Docker
# OR skip to Step 2 and use a managed PostgreSQL free tier
```

## 2. Install Dependencies

```bash
cd /home/lod/Documents/kericho_ai
npm install
```

## 3. Database Setup (Choose One)

### Option A: Using PostgreSQL Locally
```bash
# If you have PostgreSQL installed, just run it in another terminal.
# Make sure the kericho_ai database exists.
```

### Option B: Managed PostgreSQL (Recommended for Testing)
1. Go to https://neon.tech or https://supabase.com
2. Sign up for a free account
3. Create a free database
4. Get your connection string
5. Update `/home/lod/Documents/kericho_ai/.env`:
   ```
   DATABASE_URL=postgresql://username:password@host:5432/kericho_ai?schema=public
   ```

## 4. Configure Environment (Optional)

Edit `.env` file:

```bash
# For local development, defaults are fine!
# Only change if you want to add OpenAI support:

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kericho_ai?schema=public
WHATSAPP_PROVIDER=baileys
OPENAI_API_KEY=your-api-key-from-https://platform.openai.com
```

## 5. Start the Server

```bash
npm run dev
```

You should see:
```
✅ Kericho WhatsApp assistant server started
✅ PostgreSQL connected
✅ Baileys WhatsApp connection initiated
QR Code ready - scan with WhatsApp mobile app to connect
```

## 6. Connect WhatsApp

When you see the QR code in the terminal:

1. **On your phone**, open WhatsApp
2. Go to **Settings → Linked Devices → Link a Device**
3. **Scan the QR code** shown in your terminal
4. Done! Your WhatsApp account is now connected

## 7. Test It!

Send messages from your WhatsApp to yourself:

```
User: What is malaria?
Bot: I am not a doctor but can provide health education...
[Detailed response from knowledge base]

User: How do I prevent mosquito bites?
Bot: [Health information response]

User: I can't breathe
Bot: 🚨 This may be a medical emergency. Call 999 immediately...
```

## API Endpoints (Testing)

In another terminal, test the endpoints:

```bash
# Check server status
curl http://localhost:3000/

# Health check
curl http://localhost:3000/api/health

# View chat history for a phone number
curl http://localhost:3000/api/chat/254712345678
```

## Troubleshooting

### "Cannot connect to PostgreSQL"
- Make sure PostgreSQL is running (either locally or check your connection string)
- Run `npm run prisma:generate` after changing the schema
- Restart the server: Press `Ctrl+C` and run `npm run dev` again

### "QR Code not appearing"
- Try: `rm -rf .auth && npm run dev`
- Make sure port 3000 is not blocked

### "Messages not processing"
- Check WhatsApp is connected (look for ✅ in console)
- Verify `.env` has the correct DATABASE_URL
- Check logs in the terminal running `npm run dev`

### Want to add OpenAI support?
1. Get API key from https://platform.openai.com/api-keys
2. Add to `.env`: `OPENAI_API_KEY=sk-...`
3. Restart server
4. Now the bot will use AI for questions not in the knowledge base!

## Next Steps

1. **Customize Health Topics**: Edit `src/data/healthKnowledgeBase.json`
2. **Add FAQ Entries**: Edit `src/data/frequentlyAsked.json`
3. **Deploy to Free Hosting**:
   - Render: https://render.com
   - Railway: https://railway.app
   - Fly.io: https://fly.io

See [README.md](./README.md) for full deployment guide.

## File Structure Quick Reference

```
src/
├── index.js                         ← Server startup
├── data/
│   ├── healthKnowledgeBase.json    ← Edit: Add health topics
│   └── frequentlyAsked.json        ← Edit: Add FAQs
├── services/
│   ├── whatsappService.js          ← WhatsApp connection
│   └── aiService.js                ← OpenAI integration
└── models/
    ├── User.js                     ← Stored user info
    ├── Chat.js                     ← Chat history
    └── HealthContent.js            ← Health content DB
```

## Common Commands

```bash
# Development with auto-reload
npm run dev

# Production mode
npm start

# Check for outdated packages
npm outdated

# Update packages
npm update

# See what port is running
lsof -i :3000
```

---

**Stuck? Check [README.md](./README.md) for complete documentation or review the terminal logs for specific errors.**
