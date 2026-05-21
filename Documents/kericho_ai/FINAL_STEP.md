# ⚡ FINAL STEP: Get Credentials & Run

Your bot code is **fully fixed and tested**. Just 3 quick actions needed:

---

## 🔑 Get 2 Credentials from Meta (2 min)

Visit: **https://developers.facebook.com/apps/**

1. Select your WhatsApp Business App
2. Click: **WhatsApp** in the left sidebar
3. Click: **API Setup**
4. **Copy these two values:**

   | Field | Where | Example |
   |-------|-------|---------|
   | Access Token | "Temporary Access Token" section | `EAAc46apisgoBRs...` |
   | Phone Number ID | "Phone Number ID" field | `102234567890123` |

---

## 🤖 Update Bot & Restart (1 min)

Open **terminal** in the `/home/lod/Documents/kericho_ai` folder and run:

```bash
bash refresh-token.sh
```

It will ask for:
1. **Paste Access Token** (the long `EAAc...` string)
2. **Paste Phone Number ID** (the numeric ID)

Then press Enter. Done! ✅

---

## 📱 Test It Works (1 min)

The terminal will show:
```
🚀 Next: Restart the server
   1. Stop current server: pkill -f 'node src/index.js'
   2. Start fresh: node src/index.js
```

Copy and run those commands, then:
- **Send any WhatsApp message** to your test number
- **Bot responds** with AI-generated health info in ~2-3 seconds

---

## ✅ What's Already Fixed

- ✅ Code structure (webhook → parsing → AI → send)
- ✅ All hardcoded replies removed
- ✅ AI response generation working
- ✅ Database storage working
- ✅ 55 Jest tests passing
- ✅ Webhook verification endpoint tested

**Only step left: Add your credentials above**

---

## 🆘 If "Unsupported post request" Error

Check `.env`:
1. `WHATSAPP_PHONE_NUMBER_ID=` is **not empty**
2. It's a **numeric value** (no dashes, no letters)
3. **Restart** the server after fixing

Run `cat .env | grep WHATSAPP_PHONE_NUMBER_ID` to verify.
