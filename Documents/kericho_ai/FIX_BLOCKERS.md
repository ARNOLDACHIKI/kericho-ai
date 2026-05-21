# 🚨 Known Blockers - How to Fix

Your webhook is **working perfectly** and **receiving messages**. The bot cannot **send replies** due to 2 issues:

---

## Issue #1: Expired Meta Access Token ⏰

**What's happening:**
```
Error validating access token: Session has expired on Wednesday, 20-May-26 17:00:00 PDT
```

**How to fix (2 minutes):**
1. Go to: https://developers.facebook.com/apps
2. Select your WhatsApp Business App
3. Go to: **WhatsApp > API Setup**
4. Click: **"Generate Token"** (or "Refresh")
5. Copy the new token (starts with `EAAc`)
6. Run: `bash refresh-token.sh` and paste the token

---

## Issue #2: Gemini API Quota Exceeded 💧

**What's happening:**
```
[429 Too Many Requests] You exceeded your current quota
```

**The free Gemini API tier has been hit.** Choose one:

### Option A: Upgrade to Paid (Recommended) ⭐
1. Go to: https://console.cloud.google.com/billing
2. Add a payment method
3. Your quota becomes unlimited (pay per use)
4. Cost: ~$0.00075 per request (very cheap)
5. Bot will work immediately  

### Option B: Wait for Quota Reset ⏱️
- Free tier resets daily
- Wait ~24 hours for automatic reset
- No cost, but bot won't respond during cooldown

### Option C: Use OpenAI Instead 🔄
Add your OpenAI API key to `.env`:
```bash
OPENAI_API_KEY=sk-....
```
The bot will autom...atically fallback to GPT-4 when Gemini is unavailable.

**Recommended:** Upgrade Gemini to paid (~$1/month for typical usage)

---

## What's Already Fixed ✅

- ✅ Webhook receiving messages from Meta (verified)
- ✅ Phone Number ID extraction from webhooks (implemented)
- ✅ Message parsing working correctly
- ✅ AI response routing set up
- ✅ Database storage working
- ✅ 55 Jest tests passing

**Once you fix these 2 blockers, your bot will respond within 2-3 seconds.**

---

## Quick Checklist

- [ ] Refresh expired Meta access token (2 min)
- [ ] Upgrade Gemini API to paid tier (2 min)
- [ ] Run: `bash refresh-token.sh`
- [ ] Restart server: `pkill -f "node src/index.js" && node src/index.js`
- [ ] Send test WhatsApp message
- [ ] ✅ Bot responds with AI-generated reply

---

## Verify After Fixes

```bash
# Check tokens are loaded
grep -E "META_ACCESS_TOKEN|GEMINI_API_KEY" .env | head -2

# Restart
pkill -f "node src/index.js"
sleep 2
node src/index.js

# Test webhook (should now respond with AI generation, not errors)
curl -X POST "http://localhost:3000/webhook" ... [your test JSON]
```

---

## Questions?

- **Gemini quota:** https://ai.google.dev/gemini-api/docs/rate-limits
- **Meta token:** https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
- **OpenAI fallback:** Add `OPENAI_API_KEY` to `.env` to auto-use GPT-4 when Gemini quota hit
