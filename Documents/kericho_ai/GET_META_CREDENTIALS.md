# 🔐 Get Meta WhatsApp Credentials (5 minutes)

Your bot needs **2 credentials from Meta's dashboard** to send WhatsApp messages. The token in `.env` has expired and needs to be refreshed.

---

## Step 1: Get Fresh Access Token (2 min)

1. Visit **[Meta App Dashboard](https://developers.facebook.com/apps)**
2. Select your app
3. Click **WhatsApp** in left sidebar
4. Go to **API Setup** (or **Getting Started** tab)
5. Copy the **Access Token**
   - If expired, click "Generate" or "Refresh"
   - Token looks like: `EAAc46apisgoBAs...` (long alphanumeric string)
6. Open `.env` in your editor and replace the value:
   ```bash
   META_ACCESS_TOKEN=<paste-your-new-token>
   ```

---

## Step 2: Get Phone Number ID (2 min)

This is the ID of your WhatsApp Business Phone Number. You'll see it on the same **API Setup** page.

1. Return to **Meta App Dashboard** > **WhatsApp** > **API Setup**
2. Look for "Phone Number ID" (numeric, usually 10-15 digits)
   - Example: `102234567890123`
3. Add it to `.env`:
   ```bash
   WHATSAPP_PHONE_NUMBER_ID=<paste-your-phone-number-id>
   ```

---

## Step 3: Restart the Server

```bash
pkill -f "node src/index.js"
sleep 2
node src/index.js
```

---

## Verify It Works

Send a WhatsApp message to your test number. Bot should respond with AI-generated health information.

**Expected flow:**
1. ✅ WhatsApp message received
2. ✅ Webhook parses it
3. ✅ Gemini AI generates response
4. ✅ Bot sends reply via Meta API

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| "Unsupported post request" | Phone Number ID missing or wrong | Double-check ID in `.env` |
| "Invalid access token" | Token expired or typo | Get fresh token from dashboard |
| "401 Unauthorized" | Token has no proper permissions | Regenerate token with full permissions |
| No response received | Server not running | Check `node src/index.js` is running |

---

## Still Stuck?

Run the automated helper:
```bash
bash refresh-token.sh
```

This will prompt you for both credentials and update `.env` automatically.
