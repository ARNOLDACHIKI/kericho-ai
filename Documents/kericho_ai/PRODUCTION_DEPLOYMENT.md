# Production Deployment Guide

Complete guide for deploying Kericho AI to production on various platforms.

---

## Table of Contents

1. [Pre-Deployment Review](#pre-deployment-review)
2. [Railway Deployment](#railway-deployment)
3. [Render Deployment](#render-deployment)
4. [AWS Lambda + RDS](#aws-lambda--rds)
5. [Self-Hosted (Linode/DigitalOcean/VPS)](#self-hosted)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Pre-Deployment Review

### Code Readiness
- [ ] All tests passing locally: `node utils/test-webhook.js` → 5/5 tests
- [ ] No console.log() in production code (use logger)
- [ ] All error handling in place
- [ ] No hardcoded URLs/API keys
- [ ] Code reviewed by another team member

### Configuration Readiness
- [ ] `.env` file prepared for production
- [ ] `NODE_ENV=production`
- [ ] `WHATSAPP_VERIFY_TOKEN` changed to secure random string
- [ ] `WHATSAPP_ACCESS_TOKEN` tested and valid
- [ ] `OPENAI_API_KEY` tested and valid
- [ ] `DATABASE_URL` points to production database
- [ ] All environment variables secure (not in git)

### Database Readiness
- [ ] PostgreSQL provisioned in production environment
- [ ] Database user created with appropriate permissions
- [ ] SSL/TLS enabled for database connections
- [ ] Backup strategy configured
- [ ] Initial schema migrated: `npm run prisma:migrate deploy`
- [ ] Initial data seeded: `npm run prisma:seed`
- [ ] Backup verified

### Security Readiness
- [ ] SSL/TLS certificate obtained for domain
- [ ] Certificate is valid and not self-signed
- [ ] CORS configured appropriately
- [ ] Rate limiting implemented
- [ ] No secrets in git history: `git log --all -p | grep -i "EAAC\|sk-"`
- [ ] Security headers enabled (Helmet)

---

## Railway Deployment

Railway is the quickest way to deploy (5 minutes).

### Step 1: Create Railway Account

```
1. Go to https://railway.app
2. Sign up with GitHub account
3. Authorize Railway to access your GitHub
```

### Step 2: Create New Project

```
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your kericho_ai repository
4. Authorize Railway to install GitHub app
```

### Step 3: Add PostgreSQL Service

```
1. Click "Add Plugin" → PostgreSQL
2. Railway creates database automatically
3. Database credentials shown in environment
4. PostgreSQL available at $DATABASE_URL
```

### Step 4: Configure Environment Variables

```
1. In Railway dashboard, click "kericho-ai" project
2. Go to "Variables" tab
3. Add all variables from your production .env:

   NODE_ENV=production
   PORT=3000
   APP_BASE_URL=https://your-project-name.up.railway.app
   
   DATABASE_URL=[auto-filled by Railway PostgreSQL]
   
   WHATSAPP_PROVIDER=meta
   WHATSAPP_VERIFY_TOKEN=<your-secure-token>
   WHATSAPP_ACCESS_TOKEN=EAAC...
   WHATSAPP_PHONE_NUMBER_ID=123456789
   
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-3.5-turbo
   
   DEFAULT_LANGUAGE=en
   LOG_LEVEL=info
```

### Step 5: Deploy

```
1. Click "Deploy" button
2. Wait for build to complete (1-2 minutes)
3. See deployment logs in real-time
4. Get public URL from Railway dashboard
5. Example: https://kericho-ai.up.railway.app
```

### Step 6: Run Migrations

Railway deploys automatically, but you need to run migrations once:

```
1. In Railway dashboard, click project
2. Click "Shell" tab
3. Run migrations:
   npm run prisma:migrate deploy
4. Run seed:
   npm run prisma:seed
5. Close shell
```

### Step 7: Update Meta Webhook

```
1. Go to Meta Developer Dashboard
2. WhatsApp Setup → Configuration → Webhooks
3. Update Callback URL: https://your-project-name.up.railway.app/webhook
4. Verify Token: Should match WHATSAPP_VERIFY_TOKEN in Railway
5. Save
```

### Step 8: Test Deployment

```bash
curl https://your-project-name.up.railway.app/api/health

# Should return:
# {"status":"ok","database":"connected","timestamp":"..."}
```

### Railway Advantages
✅ Easiest setup (5 minutes)  
✅ Auto-deploys on git push  
✅ Free tier available  
✅ PostgreSQL included  
✅ SSL/HTTPS automatic  
✅ Environment file management built-in  

### Railway Limitations
❌ Free tier has 5 project limit  
❌ Paid tiers start at $5/month  

---

## Render Deployment

Alternative to Railway with similar ease.

### Step 1: Create Render Account

```
1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render
```

### Step 2: Create New Web Service

```
1. Dashboard → Create → Web Service
2. Connect GitHub repository
3. Select kericho_ai repository
4. Click Connect
```

### Step 3: Configure Service

```
Name: kericho-ai
Environment: Node
Build Command: npm install
Start Command: npm start

Plan: Free (or Starter)
```

### Step 4: Add PostgreSQL Database

```
1. Dashboard → Create → PostgreSQL
2. Database: kericho_ai
3. User: postgres
4. Plan: Free
5. Create
```

### Step 5: Connect Database to Web Service

```
1. In Web Service settings
2. Go to Environment tab
3. Add variable: DATABASE_URL
4. Value: (copy from PostgreSQL service page)
```

### Step 6: Add All Environment Variables

```
Same as Railway setup above
```

### Step 7: Deploy & Run Migrations

```
1. Render auto-deploys on git push
2. Wait for build (2-3 minutes)
3. Get URL: https://kericho-ai.onrender.com

Run migrations:
1. Go to Web Service → Shell
2. npm run prisma:migrate deploy
3. npm run prisma:seed
```

### Step 8: Update Meta Webhook

```
Callback URL: https://kericho-ai.onrender.com/webhook
```

### Render Advantages
✅ Easy setup  
✅ Free tier with limitations  
✅ PostgreSQL free tier (100MB)  
✅ Auto-deploys  

### Render Limitations
❌ Free web service sleeps after 15 min inactivity  
❌ Free DB only 100MB (not enough for production)  
❌ Paid tiers start at $7/month (web) + $15/month (DB)  

---

## AWS Lambda + RDS

For serverless, high-performance deployment.

### Pros
✅ Pay only for usage  
✅ Highly scalable  
✅ AWS managed services  
✅ Good for variable traffic  

### Cons
❌ More complex setup  
❌ Cold start latency (1-3 seconds)  
❌ RDS minimum cost (~$15/month)  

### Setup (Advanced)

```bash
# This requires Node.js streaming support and AWS Lambda handler
# Not recommended for beginners

# Install serverless framework
npm install -g serverless
npm install serverless-http

# Create Lambda handler
# See serverless.yml configuration
# Deploy with: serverless deploy

# Configure RDS PostgreSQL
# Use AWS RDS console
# VPC security groups for Lambda

# Update ENV variables in Lambda
# Set DATABASE_URL to RDS endpoint
```

---

## Self-Hosted

Deploy to your own VPS (DigitalOcean, Linode, AWS EC2, etc.)

### Step 1: Provision VPS

```
Choose OS: Ubuntu 22.04 LTS
Version: Latest
Size: 2GB RAM minimum (1GB may run out of memory)
Region: Closest to users
```

### Step 2: Connect to Server

```bash
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install Nginx (reverse proxy)
apt install -y nginx

# Install PM2 (process manager)
npm install -g pm2
```

### Step 3: Set Up PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Inside psql:
CREATE DATABASE kericho_ai;
CREATE USER kericho WITH ENCRYPTED PASSWORD 'your-strong-password';
ALTER ROLE kericho SET client_encoding TO 'utf8';
ALTER ROLE kericho SET default_transaction_isolation TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE kericho_ai TO kericho;
\q
```

### Step 4: Clone and Set Up Application

```bash
# Create app directory
mkdir -p /var/www/kericho_ai
cd /var/www/kericho_ai

# Clone repository
git clone <your-repo> .

# Install dependencies
npm install

# Create .env file
nano .env

# Add all production variables:
NODE_ENV=production
DATABASE_URL=postgresql://kericho:your-strong-password@localhost:5432/kericho_ai
WHATSAPP_PROVIDER=meta
WHATSAPP_VERIFY_TOKEN=<secure-token>
WHATSAPP_ACCESS_TOKEN=EAAC...
WHATSAPP_PHONE_NUMBER_ID=123456789
OPENAI_API_KEY=sk-...
PORT=3000
```

### Step 5: Run Migrations

```bash
npm run prisma:migrate deploy
npm run prisma:seed
```

### Step 6: Set Up PM2

```bash
# Create PM2 ecosystem config
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: "kericho-ai",
    script: "src/index.js",
    instances: 1,
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production"
    },
    error_file: "logs/err.log",
    out_file: "logs/out.log",
    log_file: "logs/combined.log",
    time_format: "YYYY-MM-DD HH:mm:ss Z"
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js

# Set to restart on reboot
pm2 startup
pm2 save
```

### Step 7: Set Up Nginx

```bash
# Create Nginx config
cat > /etc/nginx/sites-available/kericho_ai << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL certificate (use Certbot or Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/kericho_ai /etc/nginx/sites-enabled/

# Test Nginx
nginx -t

# Restart Nginx
systemctl restart nginx
```

### Step 8: Set Up SSL with Let's Encrypt

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get certificate
certbot certonly --nginx -d your-domain.com

# Auto-renew (runs automatically)
systemctl enable certbot.timer
systemctl start certbot.timer
```

### Step 9: Configure Firewall

```bash
# Enable UFW
ufw enable

# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Verify
ufw status
```

### Step 10: Monitor & Logs

```bash
# View PM2 logs
pm2 logs

# View Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Monitor system resources
pm2 monit

# Check SSL certificate expiry
certbot certificates
```

### Self-Hosted Advantages
✅ Full control  
✅ Predictable costs ($5-15/month)  
✅ No cold starts  
✅ Fast response times  

### Self-Hosted Disadvantages
❌ You manage everything  
❌ Security is your responsibility  
❌ Need to handle backups  
❌ Need to handle updates/patches  
❌ Requires Linux admin knowledge  

---

## Post-Deployment Verification

### 1. Health Check

```bash
curl https://your-domain.com/api/health

# Should return (within 2 seconds):
# {"status":"ok","database":"connected","timestamp":"..."}
```

### 2. Webhook Verification

```bash
curl "https://your-domain.com/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"

# Should return:
# test123
```

### 3. Send Test Message

Via WhatsApp:
```
1. Send message from your phone
2. Should get response within 5-10 seconds
3. Check server logs for success
```

### 4. Verify Database

```bash
# Connect to production database
psql $DATABASE_URL

# Check tables
\dt

# Check messages
SELECT * FROM "ConversationMessage" LIMIT 5;

# Exit
\q
```

### 5. Monitor for 24 Hours

- [ ] No error spikes in logs
- [ ] Response times consistent
- [ ] Database queries fast
- [ ] No memory leaks (memory stable)
- [ ] Backup completed successfully

---

## Monitoring & Maintenance

### Set Up Monitoring

```bash
# Recommended: DataDog, New Relic, or AppDynamics
npm install dd-trace

# Or use open source: Prometheus
npm install prom-client

# Or use platform monitoring (Railway/Render built-in)
```

### Health Check Monitoring

```bash
# Set up external monitoring (UptimeRobot, etc.)
# Monitor: https://your-domain.com/api/health
# Frequency: Every 5 minutes
# Alert if response time > 5 seconds or status != ok
```

### Database Maintenance

```bash
# Weekly: Analyze query performance
psql $DATABASE_URL -c "ANALYZE;"

# Monthly: Vacuum (cleanup)
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# Monthly: Check backups
# Verify automatic backups completed
# Test restore procedure
```

### Log Rotation

```bash
# If self-hosted, set up logrotate
cat > /etc/logrotate.d/kericho_ai << 'EOF'
/var/www/kericho_ai/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 nodejs nodejs
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}
EOF
```

### Security Updates

```bash
# Weekly: Update dependencies
npm update

# Monthly: Security audits
npm audit
npm audit fix

# As needed: Critical patches
git pull origin main
npm install
npm run prisma:migrate deploy
pm2 restart kericho-ai
```

### Database Backups

```bash
# Daily automated backup (set up in hosting platform)
# For self-hosted:

# Create backup script
cat > /usr/local/bin/backup-kericho.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/kericho_ai"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump $DATABASE_URL > "$BACKUP_DIR/backup_$DATE.sql"
gzip "$BACKUP_DIR/backup_$DATE.sql"

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/backup_$DATE.sql.gz"
EOF

chmod +x /usr/local/bin/backup-kericho.sh

# Schedule with cron (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-kericho.sh") | crontab -
```

### Capacity Planning

Monitor and plan for growth:

```bash
# Monthly review:
# - Message volume trends
# - Storage usage
# - Database size
# - API response times
# - Error rates

# Upgrade criteria:
# - Memory usage > 75%
# - Storage usage > 80%
# - Response time > 2 seconds
# - Error rate > 1%
```

---

## Troubleshooting Production Issues

### 502 Bad Gateway Error

```
Cause: Backend not responding
Fix:
1. Check if application crashed: pm2 logs
2. Check database connection: psql $DATABASE_URL
3. Restart application: pm2 restart kericho-ai
4. Check resource usage: free -h, df -h
```

### Database Connection Timeout

```
Cause: Database overloaded or unreachable
Fix:
1. Check database status
2. Check connection pool size
3. Restart database service
4. Scale up database size
```

### High Memory Usage

```
Cause: Memory leak or traffic spike
Fix:
1. Check logs for memory usage pattern:
   pm2 monit
2. Identify source of leak (webhook, AI calls, etc)
3. Restart application if memory > 80%:
   pm2 restart kericho-ai
4. Update code with fix
```

### Slow Response Times

```
Cause: Database queries slow, AI timeouts, etc
Fix:
1. Check database performance:
   psql $DATABASE_URL -c "EXPLAIN ANALYZE <query>"
2. Add database indexes if needed
3. Optimize queries
4. Scale up OpenAI model if needed
5. Add caching layer (Redis)
```

---

## Deployment Checklist Summary

- [ ] Code reviewed and tested locally
- [ ] Environment variables configured
- [ ] Database provisioned and migrated
- [ ] SSL/TLS certificate installed
- [ ] Application deployed
- [ ] Migrations run successfully
- [ ] Health endpoint responds
- [ ] Webhook verification working
- [ ] Test message sent and received
- [ ] Logs reviewed for errors
- [ ] Monitoring configured
- [ ] Backups verified
- [ ] Team trained on ops
- [ ] Go-live approval obtained
- [ ] Post-deployment support plan established

---

**Deployment Guide Version:** 1.0  
**Last Updated:** 2024  
**Tested On:** Railway, Render, self-hosted Ubuntu 22.04
