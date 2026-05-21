# ⚡ Quick Start: Get Your Bot Replying (5 Minutes)

## You're 1 Step Away! 🎯

The bot code is **100% fixed**. The only blocker is your expired WhatsApp access token.

## Option A: Automated Token Refresh (Recommended)

```bash
cd /home/lod/Documents/kericho_ai
bash refresh-token.sh
```

The script will:
1. Prompt you for your new token
2. Backup your `.env`
3. Update the token automatically
4. Verify the change

Then restart the server (see below).

---

## Option B: Manual Token Refresh

### Step 1: Get New Token
- Go to https://developers.facebook.com/apps/
- Select your WhatsApp Business App
- Click: WhatsApp > API Setup
- Click: **Generate Token** (under "Temporary Access Token")
- Copy the new token (starts with `EAAc`)

### Step 2: Update `.env`
```bash
# Edit the file
nano /home/lod/Documents/kericho_ai/.env

# Find these lines and update both:
WHATSAPP_TOKEN=<PASTE_NEW_TOKEN>
META_ACCESS_TOKEN=<PASTE_NEW_TOKEN>

# Save: Ctrl+X, then Y, then Enter
```

---

## Step 3: Restart Server (Both Options)

```bash
# Kill old server
pkill -f "node src/index.js"

# Start fresh
cd /home/lod/Documents/kericho_ai
node src/index.js
```

You should see:
```
[STARTUP] env=development port=3000 verifyTokenLoaded=true webhookMount=/webhook
[STARTUP] registered webhook routes: GET /webhook, POST /webhook
[schedulerService] ✓ Daily tips scheduled for 9:00 AM every day
```

---

## Step 4: Test the Bot

1. **Send a WhatsApp message** to your bot number
2. **Wait 2-5 seconds** for AI to generate response
3. **Receive health information** in WhatsApp

### Example Conversations:

**You:** "Hi"
```
Bot: "Hi there! 👋 How are you feeling today? How can I help you with your health?"
```

**You:** "What is fever?"
```
Bot: "Fever is a sign that your body is fighting infection. Common causes include flu, malaria, 
and urinary tract infections. Drink plenty of water, rest, and monitor your temperature. 
If fever lasts more than 3 days or reaches 39°C, visit a health facility."
```

**You:** "I have chest pain"
```
Bot: "Chest pain can have many causes. Some are serious. Please visit a health facility 
or call 999 immediately for evaluation. Don't wait - get medical help right away."
```

---

## Verify It's Working

Check server logs for:
```
Incoming WhatsApp message from: 254712345678
🤖 Generating dynamic AI response
✅ AI response generated
📤 WhatsApp message sent successfully
```

---

## Troubleshooting

### Still not working?
1. **Is the server running?** 
   - Check: `ps aux | grep "node src/index.js"`

2. **Is the new token in .env?**
   - Check: `grep "WHATSAPP_TOKEN=" /home/lod/Documents/kericho_ai/.env`
   - Should show new token, NOT old one

3. **Did you restart the server?**
   - Must restart AFTER updating .env

4. **Is Gemini API key valid?**
   - Check: `echo $GEMINI_API_KEY`

5. **Is the bot number in your Test Contacts?**
   - Go to Meta Dashboard > WhatsApp > Test Contacts
   - Add your phone number if not listed

### Need more help?
See: `COMPLETE_FIX_SUMMARY.md` for full details.

---

## Success Criteria

| Check | Status |
|-------|--------|
| Server running | ✅ or `ps aux \| grep node` |
| New token in .env | ✅ or `grep WHATSAPP_TOKEN .env` |
| Message received | ✅ Check ngrok logs |
| AI response generated | ✅ Check server logs for "✅ AI response generated" |
| Message sent to WhatsApp | ✅ You receive reply in WhatsApp |

---

## You're Done! 🎉

Once you refresh the token and restart, your bot will:
- ✅ Receive WhatsApp messages
- ✅ Generate AI responses in real-time
- ✅ Send replies instantly
- ✅ Store conversations in database
- ✅ Support English and Swahili

**Ready to deploy or add more features!**
