# Pre-Launch Validation Checklist

Use this checklist before going live with Kericho AI. Each section builds on the previous one.

---

## Phase 1: Environment & Dependencies (Day 1)

### Code Repository
- [ ] Code cloned/installed from GitHub
- [ ] `git status` shows clean working tree (no uncommitted changes)
- [ ] `.env` file created from `.env.example`
- [ ] `.env` file added to `.gitignore` (credentials not committed)
- [ ] No AWS keys, API tokens in code comments

### Node.js & NPM
- [ ] Node.js version 20+ installed: `node --version` → v20+
- [ ] npm version 9+ installed: `npm --version` → v9+
- [ ] `npm install` completed without errors
- [ ] `package.json` dependencies match current codebase
- [ ] No npm warnings on `npm install`

### Project Structure
- [ ] All required directories exist: `src/`, `prisma/`, `routes/`, `services/`
- [ ] All required files present: `index.js`, `schema.prisma`, `.env`
- [ ] No build artifacts from development (`dist/`, `build/`, `.next/`)
- [ ] `node_modules/` is gitignored

---

## Phase 2: Database Configuration (Day 1)

### PostgreSQL Database
- [ ] PostgreSQL 14+ accessible (local or managed)
- [ ] Connection string obtained: `postgresql://...`
- [ ] Connection string format verified (no typos)
- [ ] Database exists or will auto-create
- [ ] User has permissions to create tables/indexes

### Prisma Schema
- [ ] `prisma/schema.prisma` contains valid syntax
- [ ] Datasource provider is `postgresql`
- [ ] `DATABASE_URL` environment variable referenced
- [ ] All models defined: User, ConversationMessage, KnowledgeArticle
- [ ] Indexes defined for query performance

### Database Migrations
- [ ] `npm run prisma:generate` successful
- [ ] `npm run prisma:migrate dev` or `npm run prisma:migrate deploy` successful
- [ ] No "Outstanding migrations" warnings
- [ ] Schema verified in database: `psql → \dt`

### Database Seeding
- [ ] `npm run prisma:seed` completed successfully
- [ ] 8 knowledge articles confirmed present
- [ ] No duplicate key errors
- [ ] Both English and Kiswahili content verified

---

## Phase 3: Environment Variables (Day 1)

### Server Configuration
- [ ] `NODE_ENV` set: `development` or `production`
- [ ] `PORT` set: typically `3000`
- [ ] `APP_BASE_URL` set correctly
- [ ] `LOG_LEVEL` set: `info` (or `debug` for development)

### Database Configuration
- [ ] `DATABASE_URL` set with valid PostgreSQL connection string
- [ ] Connection tested: `npm run dev` shows "✅ Database connected"
- [ ] No "connection refused" errors

### WhatsApp Configuration
- [ ] `WHATSAPP_PROVIDER` set to: `baileys` (dev) or `meta` (production)
- [ ] `WHATSAPP_VERIFY_TOKEN` set to secure random string (not default)
- [ ] If `meta`: `WHATSAPP_ACCESS_TOKEN` starts with `EAAC`
- [ ] If `meta`: `WHATSAPP_PHONE_NUMBER_ID` is numeric and from Meta dashboard
- [ ] API version `WHATSAPP_API_VERSION` corresponds to Meta account

### OpenAI Configuration
- [ ] `OPENAI_API_KEY` starts with `sk-` (if using AI)
- [ ] `OPENAI_MODEL` is valid: `gpt-3.5-turbo`, `gpt-4`, etc.
- [ ] API key tested (credentials are valid)
- [ ] Account has positive balance/quota

### Application Settings
- [ ] `DEFAULT_LANGUAGE` is `en` or `sw`
- [ ] `EMERGENCY_CONTACT_TEXT` is set and appropriate

---

## Phase 4: Server Startup (Day 2)

### Development Server
- [ ] Start with `npm run dev`
- [ ] Logs show: "✅ Database connected"
- [ ] Logs show: "🚀 Server listening on port 3000"
- [ ] No error messages in console
- [ ] Startup time < 10 seconds

### Production Server (Optional Local Test)
- [ ] `export NODE_ENV=production`
- [ ] Start with `npm start`
- [ ] Verify startup successful
- [ ] Verify port binding correct

### Server Logs
- [ ] Logging configured correctly
- [ ] Logs are readable and informative
- [ ] Log level appropriate for environment
- [ ] No spam/excessive logging

---

## Phase 5: API Endpoints (Day 2)

### Health Check Endpoint
- [ ] `GET /api/health` returns 200
- [ ] Response includes: `status`, `database`, `timestamp`
- [ ] `database: "connected"` confirmed
- [ ] Response time < 100ms

### Webhook Verification Endpoint
- [ ] `GET /webhook?hub.mode=subscribe&hub.verify_token=<TOKEN>&hub.challenge=<CHALLENGE>`
- [ ] Returns 200 with challenge value as response body
- [ ] Wrong token returns 403 Forbidden
- [ ] Missing parameters return 400 Bad Request

### Webhook Message Endpoint
- [ ] `POST /webhook` accepts JSON payload
- [ ] Returns 200 OK immediately (doesn't wait for processing)
- [ ] Creates database records for message and response
- [ ] Handles malformed JSON with error response
- [ ] Response sent asynchronously to WhatsApp

### Endpoint Tests
- [ ] All tests pass: `node utils/test-webhook.js`
- [ ] Test results show: 5/5 tests passed
- [ ] No test errors or warnings

---

## Phase 6: Database & Knowledge Base (Day 2)

### Database Tables
- [ ] Table "User" exists with correct schema
- [ ] Table "ConversationMessage" exists
- [ ] Table "KnowledgeArticle" exists
- [ ] All columns present with correct types
- [ ] Primary keys defined
- [ ] Foreign keys working

### Knowledge Base Content
- [ ] At least 8 articles seeded
- [ ] Each article has: topic, title, content_en, content_sw
- [ ] Keywords defined for each topic
- [ ] No duplicate topics
- [ ] Content is medically accurate and appropriate

### Database Queries Work
- [ ] Can select from User table
- [ ] Can select from ConversationMessage table
- [ ] Can select from KnowledgeArticle table
- [ ] Indexes working (queries < 100ms)

---

## Phase 7: WhatsApp Integration (Day 2-3)

### Meta Cloud API Configuration
- [ ] Meta app created in Developer Dashboard
- [ ] WhatsApp Product added to app
- [ ] Business Phone Number assigned
- [ ] Phone Number ID noted
- [ ] Webhook registered in Meta dashboard
- [ ] Callback URL points to your server (https://)
- [ ] Verify Token matches `WHATSAPP_VERIFY_TOKEN`
- [ ] Subscribed to "messages" webhook field
- [ ] Access Token generated and stored in .env

### Webhook Verification (Meta)
- [ ] Meta dashboard shows "Webhooks configured" ✓
- [ ] "Webhooks verified" status shows ✓
- [ ] Green indicator for webhook health
- [ ] No errors in webhook logs

### Message Sending Setup
- [ ] Access Token has permission to send messages
- [ ] Phone Number ID is associated with token
- [ ] Test message sends without error
- [ ] Meta logs show successful delivery

### Message Receiving Setup
- [ ] Webhook field "messages" subscribed
- [ ] Test message from WhatsApp triggers webhook
- [ ] Webhook received by your /webhook endpoint
- [ ] Response processed and message stored

---

## Phase 8: Content & Responses (Day 3)

### Knowledge Base Search
- [ ] Query "malaria symptoms" returns malaria article
- [ ] Query "maternal health" returns maternal health article
- [ ] Response in user's language (en/sw)
- [ ] Keywords matching is case-insensitive
- [ ] Response includes source attribution

### AI Integration (If Enabled)
- [ ] Query not matching KB falls back to OpenAI
- [ ] OpenAI response is healthcare-appropriate
- [ ] Response includes disclaimer ("not a doctor")
- [ ] Response includes recommendation to see professional
- [ ] Response is within 150 tokens
- [ ] Temperature is appropriate (0.3 = focused)

### Error Handling
- [ ] Invalid message doesn't crash application
- [ ] Malformed payload returns error without exposing internals
- [ ] Database connection loss handled gracefully
- [ ] OpenAI timeout handled gracefully
- [ ] User sees appropriate fallback message

---

## Phase 9: Security (Day 3)

### Environment Variables
- [ ] No secrets in source code
- [ ] No API keys in git history
- [ ] `.env` never committed to git
- [ ] Production .env different from development
- [ ] All required secrets are set

### Webhook Verification
- [ ] `WHATSAPP_VERIFY_TOKEN` is strong (not default/simple)
- [ ] Verify token checked before processing messages
- [ ] Invalid tokens rejected with 403
- [ ] Webhook signature validation in place

### Database Security
- [ ] Database credentials not in logs
- [ ] No SQL injection possible (using Prisma/ORM)
- [ ] Database backups scheduled (if managed service)
- [ ] Database connection uses SSL/TLS

### API Security
- [ ] HTTPS/SSL certificate valid (production)
- [ ] CORS configured appropriately
- [ ] Helmet security headers enabled
- [ ] No unnecessary logging of sensitive data
- [ ] Rate limiting implemented

---

## Phase 10: Monitoring & Logging (Day 3)

### Application Logs
- [ ] Logs captured to file (production)
- [ ] Log rotation configured
- [ ] Error logs separate from info logs
- [ ] Logs include timestamp, level, message
- [ ] No sensitive data in logs (tokens, API keys)

### Database Logs
- [ ] Database query logs available (if needed)
- [ ] Slow query logs monitored
- [ ] Connection pool monitored
- [ ] Backup logs reviewed

### Monitoring
- [ ] Health endpoint monitored (every 5 min)
- [ ] Error rates monitored
- [ ] Response time monitored
- [ ] Database connectivity monitored
- [ ] Webhooks received/processed monitored

### Alerting
- [ ] Alert on server down
- [ ] Alert on database connection lost
- [ ] Alert on high error rate (>5%)
- [ ] Alert on slow response time (>5s)
- [ ] Alert recipients configured

---

## Phase 11: Performance (Day 4)

### Response Times
- [ ] Health check: < 100ms
- [ ] Webhook verification: < 100ms
- [ ] Webhook message receive: return 200 in < 1s
- [ ] Message processing: respond to user < 5s (KB) or < 10s (AI)

### Resource Usage
- [ ] Memory usage stable (< 200MB)
- [ ] CPU usage normal during operation (< 50%)
- [ ] Database connections pooled (< 10)
- [ ] No memory leaks after 1 hour runtime

### Scalability
- [ ] Can handle 10 concurrent messages
- [ ] Can handle 100 messages/minute
- [ ] Queue system working (if implemented)
- [ ] Rate limiting configured

---

## Phase 12: Testing (Day 4)

### Test Coverage
- [ ] Health endpoint tested
- [ ] Webhook verification tested
- [ ] Invalid token tested
- [ ] Message receiving tested
- [ ] Knowledge base search tested
- [ ] AI fallback tested

### Test Results
- [ ] All automated tests passing
- [ ] Manual tests passing
- [ ] Real WhatsApp message tested
- [ ] Error scenarios tested

### Test Documentation
- [ ] Test procedures documented
- [ ] Manual testing steps written
- [ ] Expected results documented
- [ ] Known limitations noted

---

## Phase 13: Documentation (Day 4)

### Code Documentation
- [ ] Code comments explain complex logic
- [ ] Function signatures documented (JSDoc)
- [ ] Configuration options documented
- [ ] Error handling documented

### User Documentation
- [ ] README.md complete and accurate
- [ ] API_DOCUMENTATION.md up to date
- [ ] SETUP_GUIDE.env complete
- [ ] TROUBLESHOOTING.md helpful
- [ ] ARCHITECTURE.md describes system

### Operational Documentation
- [ ] Deployment procedure documented
- [ ] Backup/recovery procedure documented
- [ ] Monitoring dashboard documented
- [ ] Emergency contacts documented
- [ ] Runbook for common issues

---

## Phase 14: Backup & Recovery (Day 4)

### Database Backups
- [ ] Backup procedure tested
- [ ] Database can be restored from backup
- [ ] Backup schedule configured
- [ ] Backup retention policy set
- [ ] Off-site backup copy (if possible)

### Disaster Recovery
- [ ] Recovery time objective (RTO) defined
- [ ] Recovery point objective (RPO) defined
- [ ] Failover procedure documented
- [ ] Failover tested
- [ ] Team trained on recovery

### Version Control
- [ ] Code committed to git
- [ ] Release tags created
- [ ] Change log maintained
- [ ] Previous versions can be deployed

---

## Phase 15: Go-Live Checklist (Day 5)

### Pre-Launch (24 hours before)
- [ ] All tests passing
- [ ] All checklist items complete
- [ ] Team trained on operation
- [ ] Monitoring configured and tested
- [ ] Backup verified working
- [ ] Communication plan established

### Launch Day
- [ ] Start time confirmed with team
- [ ] Database backed up before launch
- [ ] Server scaled to expected load
- [ ] Monitoring dashboard open
- [ ] Team on standby
- [ ] Public announcement sent (if applicable)
- [ ] Meta webhook activated
- [ ] First test message verified

### Post-Launch (24 hours after)
- [ ] No critical errors in logs
- [ ] Response times acceptable
- [ ] Message processing working
- [ ] Database stable
- [ ] Team report issues
- [ ] Usage metrics collected
- [ ] Performance baseline established

---

## Sign-Off

- [ ] Developer: ___________________ Date: ___________
- [ ] Operations: ___________________ Date: ___________
- [ ] Project Manager: ___________________ Date: ___________

---

## Escalation Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Technical Lead | | | |
| DevOps | | | |
| Database Admin | | | |
| Product Manager | | | |
| Emergency | | | |

---

## Known Issues

List any known issues that are acceptable for launch:

1. Issue: _____________
   Impact: _____________
   Workaround: _____________
   Timeline to fix: _____________

---

## Success Metrics

Define what "success" looks like:

- [ ] 99.5% uptime (< 21.6 minutes downtime/month)
- [ ] 95th percentile response time < 2 seconds
- [ ] Error rate < 0.1%
- [ ] User satisfaction > 4.0/5.0
- [ ] Message delivery rate > 99%

---

**Checklist Version:** 1.0  
**Last Updated:** 2024  
**Next Review:** [Date]
