# Deployment Guide 🌍

Deploy the Kericho Healthcare WhatsApp Assistant to free hosting platforms.

## Architecture for Deployment

```
Your Computer (local development)
    ↓ Push to GitHub
GitHub Repository
    ↓ Auto-deploy from
Free Hosting Platform (Render/Railway/Fly.io)
    ↓ Connected to
PostgreSQL (Neon, Supabase, Render Postgres, Railway Postgres)
    ↓
WhatsApp (Baileys for dev or Meta Cloud API webhook)
```

## Option 1: Render.com (Recommended - Easiest)

### Step 1: Push Code to GitHub

```bash
cd /home/lod/Documents/kericho_ai

# Initialize git repo (if not already done)
git init
git remote add origin https://github.com/YOUR_USERNAME/kericho_ai.git

# Commit and push
git add .
git commit -m "Initial Kericho AI setup"
git branch -M main
git push -u origin main
```

### Step 2: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub
3. Connect your GitHub account

### Step 3: Deploy

1. Dashboard → New → Web Service
2. Connect your `kericho_ai` repository
3. Configure:
   - **Name**: `kericho-ai-assistant`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Region**: Choose closest to Kericho (Africa recommended)
   - **Plan**: Free

### Step 4: Add Environment Variables

1. After creating service, go to **Environment**
2. Add these variables:
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://user:password@host:5432/kericho_ai?schema=public
   OPENAI_API_KEY=your-api-key (optional)
   DEFAULT_LANGUAGE=en
   PORT=3000
   WHATSAPP_PROVIDER=meta
   WHATSAPP_VERIFY_TOKEN=your-verify-token
   WHATSAPP_ACCESS_TOKEN=your-meta-token
   WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
   ```

3. Click **Save Changes** → Auto-deploys!

### Step 5: Get Your Public URL

After deployment completes:
- Your app is live at: `https://kericho-ai-assistant.onrender.com`
- Test it: `curl https://kericho-ai-assistant.onrender.com`

### Important: Keep Service Active

Render free tier goes to sleep after 15 minutes of inactivity. To keep it alive:
- Use a "pinger" service (e.g., https://uptimerobot.com)
- Or upgrade to Starter tier ($7/month)

---

## Option 2: Railway.app

### Step 1: Push Code to GitHub

(Same as Option 1 above)

### Step 2: Create Railway Account

1. Go to https://railway.app
2. Sign up with GitHub
3. Connect your GitHub account

### Step 3: Deploy

1. Dashboard → New → Deploy from GitHub
2. Select your `kericho_ai` repository
3. Railway auto-detects Node.js

### Step 4: Add PostgreSQL

1. Click **+ Add** → Select **PostgreSQL**
2. Railway creates a Postgres instance
3. Connection string auto-added to environment

### Step 5: Add Other Variables

In **Variables** tab, add:
```
OPENAI_API_KEY=your-api-key (optional)
DEFAULT_LANGUAGE=en
NODE_ENV=production
```

### Step 6: Monitor Deployment

- Dashboard shows deployment status
- Logs appear in real-time
- Free tier: $5/month credit

---

## Option 3: Fly.io

### Step 1: Install Fly CLI

```bash
# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh

# Windows
iwr https://fly.io/install.ps1 -useb | iex
```

### Step 2: Authenticate

```bash
flyctl auth login
```

### Step 3: Initialize Fly App

```bash
cd /home/lod/Documents/kericho_ai
flyctl launch

# When prompted:
# - App Name: kericho-ai (or choose your own)
# - Region: Choose closest to Kenya
# - Postgres/Redis: No
```

### Step 4: Set Secrets

```bash
flyctl secrets set DATABASE_URL="your-postgres-url"
flyctl secrets set OPENAI_API_KEY="your-api-key"
flyctl secrets set DEFAULT_LANGUAGE="en"
```

### Step 5: Deploy

```bash
flyctl deploy
```

Access your app: `https://kericho-ai.fly.dev`

---

## Important: Set Up PostgreSQL

All platforms need a cloud PostgreSQL database if you are not running locally. Here's how:

### Create Free PostgreSQL Database

1. Go to https://neon.tech or https://supabase.com
2. Sign up for free
3. Create new project "Kericho"
4. Create a free Postgres database
5. Create database user:
   - Username: `kericho_user`
   - Password: Generate secure password
6. Get connection string:
   - Copy URI: `postgresql://kericho_user:password@host:5432/kericho_ai?schema=public`

### Whitelist IP (Important!)

For cloud deployment:
1. Go to Network Access
2. Click "Add IP Address"
3. Choose "Allow access from anywhere" (0.0.0.0/0)
   - ⚠️ For production, use specific IP instead

---

## Post-Deployment Checklist

- [ ] Server is running: `curl https://your-domain.com`
- [ ] Health check passes: `curl https://your-domain.com/api/health`
- [ ] PostgreSQL connected: Check logs
- [ ] Environment variables set correctly
- [ ] QR code generation working
- [ ] Can send test message from WhatsApp

## Monitoring & Logs

### Render
- Dashboard → Logs tab

### Railway
- Dashboard → Logs tab

### Fly.io
```bash
flyctl logs
```

## Common Issues

### "PostgreSQL connection timeout"
- Check the connection string is correct
- Verify DATABASE_URL is correct
- Test connection locally first

### "Service crashes on startup"
- Check environment variables are set
- Look at logs for specific errors
- Ensure MONGODB_URI doesn't have special characters (URL encode them)

### "QR code not generating"
- WhatsApp connection requires consistent state
- Check `.auth` folder persists between deployments
- May need persistent storage (see platform docs)

---

## Cost Analysis

| Platform | Free Tier | Notes |
|----------|-----------|-------|
| **Render** | $0.10/hour on-demand | Sleeps after 15 min inactivity on free |
| **Railway** | $5/month credit | Never sleeps, charges overages |
| **Fly.io** | $3 min/month | Never sleeps, unlimited build |
| **PostgreSQL** | Free tiers vary | Plenty for development |

**Cheapest Option**: Railway ($5/month) or Fly.io ($3/month) + Atlas free

---

## Scaling Up

When production usage grows:

1. **Render**: Upgrade to Starter/Standard plan
2. **Railway**: Increase instance size ($7-20/month)
3. **Fly.io**: Increase machine size
4. **Database**: Upgrade your Postgres plan if you outgrow the free tier

---

## CI/CD Automation

All platforms auto-deploy when you push to GitHub:

```bash
# Update on deployed version
git add .
git commit -m "Update health content"
git push origin main

# Automatically deploys to your chosen platform!
```

---

## Support & Debugging

### 24/7 Logs
```
Render: https://dashboard.render.com → Service → Logs
Railway: https://railway.app → Project → Logs
Fly.io: flyctl logs -f
```

### Manual Redeploy

```
Render: Click "Manual Deploy"
Railway: Auto on push or click "Trigger Deploy"
Fly.io: flyctl deploy
```

### Environment Variable Issues

Make sure no quotes around values:
```
✅ DATABASE_URL=postgresql://user:pass@host:5432/kericho_ai?schema=public
❌ DATABASE_URL="postgresql://user:pass@host:5432/kericho_ai?schema=public"
```

---

## Next Steps After Deployment

1. **Monitor Performance**: Set up error tracking (Sentry is free)
2. **Backup Database**: Use your provider's backup/export tools
3. **Update Health Content**: Edit JSON files and push to GitHub
4. **Scale if Needed**: Upgrade plan when free tier is full

**Your Kericho AI assistant is now live! 🎉**
