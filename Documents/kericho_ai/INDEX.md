# Project Index & Navigation 📚

Your complete guide to the Kericho Healthcare WhatsApp Assistant.

## 📖 Documentation Files

### Getting Started
- **[QUICKSTART.md](./QUICKSTART.md)** ⭐ **START HERE**
  - 5-minute setup guide
  - Step-by-step instructions
  - Test the bot immediately

### Main Documentation
- **[README.md](./README.md)** - Complete project overview
  - Features & capabilities
  - Architecture diagram
  - Installation & deployment
  - Configuration guide

### Evidence Workspace
- **[Evidence Center](/evidence)** - Live screenshot workspace for the remaining verification items
  - Webhook configuration
  - System architecture
  - Storage design
  - Topic/menu and conversation-flow previews

### Advanced Topics
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical deep dive
  - System architecture diagram
  - Data flow examples
  - Database schema
  - Service descriptions
  - Message processing walkthrough

- **[CURRENT_ARCHITECTURE.md](./CURRENT_ARCHITECTURE.md)** - Current runtime architecture
  - Express webhook flow
  - AI fallback chain
  - Queue/scheduler path
  - Operational components

- **[STORAGE_DESIGN.md](./STORAGE_DESIGN.md)** - Current database and analytics design
  - Prisma models
  - Conversation history
  - Session and analytics sources

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide
  - Deploy to Render (easiest)
  - Deploy to Railway
  - Deploy to Fly.io
  - PostgreSQL setup
  - Cost analysis

- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Problem solving
  - Common issues & solutions
  - Debugging techniques
  - Log analysis
  - Getting help

---

## 📁 Project Structure

### Source Code (`src/`)

#### Core Application
```
src/
├── index.js                    Main server & message router
├── config/
│   └── env.js                 Environment variables validation
├── lib/
│   ├── logger.js              Pino logging setup
│   └── prisma.js              PostgreSQL connection via Prisma
├── models/
│   ├── User.js                User data schema
│   ├── Chat.js                Chat history schema
│   └── HealthContent.js       Health content schema
└── utils/
    └── text.js                Text processing helpers
```

#### Services (Business Logic)
```
src/services/
├── whatsappService.js         Baileys WhatsApp integration
├── aiService.js               OpenAI integration
├── knowledgeBaseService.js    KB search & matching
├── responseService.js         Response orchestration
└── safetyService.js           Safety checks & disclaimers
```

#### Data Files
```
src/data/
├── healthKnowledgeBase.json   Health topics & content
└── frequentlyAsked.json       FAQ database
```

### Configuration Files
```
.env                           Local environment variables
.env.example                   Template for .env
docker-compose.yml             Local development services
package.json                   Dependencies & scripts
prisma.config.ts               (legacy, can be removed)
```

---

## 🚀 Quick Reference

### Starting the Server
```bash
cd /home/lod/Documents/kericho_ai

# Install dependencies (first time only)
npm install

# Start PostgreSQL (in separate terminal)
# OR use a managed PostgreSQL connection string in .env

# Start server in dev mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

### Testing the Bot
1. Check logs: `✅ Baileys WhatsApp connection initiated`
2. Scan QR code with WhatsApp on your phone
3. Send any health message to yourself on WhatsApp
4. Receive instant response!

### Key Endpoints
| URL | Purpose |
|-----|---------|
| `http://localhost:3000/` | Server status |
| `http://localhost:3000/api/health` | Health check |
| `http://localhost:3000/qr` | QR code status |
| `http://localhost:3000/api/chat/:phoneNumber` | Chat history |

### Common Commands
```bash
# Development with live reload
npm run dev

# Production mode
npm start

# View logs (from another terminal)
tail -f .env  # Or check console output

# Stop server
Ctrl+C

# Check PostgreSQL
psql "postgresql://postgres:postgres@localhost:5432/kericho_ai?schema=public"
```

---

## 🔧 Configuration Guide

### 1. Environment Variables (.env)

**Required**:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kericho_ai?schema=public
WHATSAPP_PROVIDER=baileys
DEFAULT_LANGUAGE=en
```

**Optional**:
```env
OPENAI_API_KEY=sk-...  # For AI responses
OPENAI_MODEL=gpt-3.5-turbo
```

### 2. Adding Health Topics

Edit `src/data/healthKnowledgeBase.json`:
```json
{
  "your_topic": [
    {
      "id": "unique-id",
      "title": "Topic Title",
      "keywords": ["word1", "word2"],
      "content": "English content",
      "contentSwahili": "Swahili content",
      "sources": ["WHO", "Ministry"]
    }
  ]
}
```

### 3. Adding FAQs

Edit `src/data/frequentlyAsked.json`:
```json
[
  {
    "category": "Topic Category",
    "questions": [
      {
        "q": "User question?",
        "a": "Answer here"
      }
    ]
  }
]
```

---

## 📊 Data Models

### User
- Phone number (unique)
- Language preference (en/sw)
- Message count
- Last message timestamp

### Chat
- Phone number (indexed)
- User message
- Assistant response
- Category/topic
- Response source (KB/AI/fallback)
- Timestamp

### HealthContent
- ID, title, keywords
- English & Swahili content
- Sources & disclaimers
- Tags

---

## 🔐 Safety & Security

### Built-in Protections
✅ Disclaimer on every response
✅ Emergency detection & escalation
✅ Never prescribes medications
✅ Always recommends professional care
✅ Bilingual accessibility
✅ Non-diagnostic responses only

### Production Recommendations
- Enable rate limiting
- Add input validation
- Implement GDPR data deletion
- Regular security audits
- Monitor for abuse patterns

---

## 📈 Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] .env with PostgreSQL DATABASE_URL
- [ ] Platform account created (Render/Railway/Fly)
- [ ] Environment variables configured on platform
- [ ] Service deployed successfully
- [ ] Health endpoint responding: `curl https://your-domain.com/api/health`
- [ ] WhatsApp connected (QR scanned)
- [ ] Test message sent and received
- [ ] Logs accessible from platform dashboard

---

## 🐛 Debugging & Monitoring

### View Logs
```bash
# Development
npm run dev  # All logs in terminal

# Production (platform-specific)
# Render: Dashboard → Logs
# Railway: Dashboard → Logs  
# Fly.io: flyctl logs -f
```

### Check Database
```bash
# PostgreSQL local
psql "postgresql://postgres:postgres@localhost:5432/kericho_ai?schema=public"
> db.users.find()
> db.chats.findOne()

# Managed PostgreSQL
psql "postgresql://..."
> use kericho_ai
> db.chats.count()
```

### Test Services Independently
```bash
# Test KB matching
node -e "const {findKnowledgeResponse}=require('./src/services/knowledgeBaseService');console.log(findKnowledgeResponse('malaria'))"

# Test AI (if configured)
node -e "require('openai'); console.log('OpenAI OK')"

# Test DB connection
mongosh "your-connection-string"
```

---

## 📱 WhatsApp Message Format

### What Works
```
✅ Text messages
✅ Emoji support
✅ Any language (detected automatically)
✅ Multiple messages in a row
```

### What Doesn't (Yet)
```
❌ Images
❌ Voice messages
❌ Video
❌ File attachments
```

---

## 💰 Cost Breakdown

### Free Options
| Component | Provider | Cost |
|-----------|----------|------|
| Backend | Render/Railway/Fly | Free-$5/mo |
| Database | PostgreSQL free tier | Varies by provider |
| Code Hosting | GitHub | Free |
| **Total** | | **$0-5/month** |

### With AI Feature
| Component | Cost |
|-----------|------|
| Backend | $5-10/month |
| Database | $9-57/month |
| OpenAI API | ~$5-20/month* |
| **Total** | **$19-87/month** |

*Depends on usage

---

## 🎯 Usage Statistics

### What the System Tracks
- User phone numbers
- Message content & responses
- Response category & source
- Timestamps
- Language preference

### What We Don't Track
- ❌ Personal identifiable information (beyond phone)
- ❌ Location data
- ❌ Device information
- ❌ IP addresses

---

## 🔗 External Resources

### Official Docs
- [Baileys (WhatsApp)](https://github.com/WhiskeySockets/Baileys)
- [Prisma](https://www.prisma.io/)
- [Express.js](https://expressjs.com/)
- [OpenAI API](https://platform.openai.com/docs)
- [Pino Logger](https://getpino.io/)

### Hosting Platforms
- [Render.com](https://render.com) - Recommended
- [Railway.app](https://railway.app)
- [Fly.io](https://fly.io)

### Databases
- [Neon](https://neon.tech/)
- [Supabase](https://supabase.com/)

### AI Services
- [OpenAI Platform](https://platform.openai.com/)
- [OpenAI Pricing](https://openai.com/pricing)

---

## ❓ FAQ

**Q: Can I use this without OpenAI?**
A: Yes! Knowledge base works completely standalone. OpenAI is optional.

**Q: Does it work offline?**
A: No, WhatsApp requires internet connection. System needs cloud deployment.

**Q: How many users can it support?**
A: Free tier: ~100 users. Scale with paid plans.

**Q: Is this HIPAA/GDPR compliant?**
A: Not automatically. Requires additional security measures for healthcare data.

**Q: Can I add more languages?**
A: Yes! Add keywords to language detection and translations to KB.

**Q: Is the code open source?**
A: Yes, MIT license. Use and modify freely.

**Q: What's the difference between Baileys and Meta API?**
A: Baileys uses WhatsApp Web (no approval needed), Meta API is official but requires business registration.

---

## 📞 Support & Community

### Issues & Questions
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review logs carefully (`npm run dev`)
3. Check GitHub issues/discussions
4. Test each component independently

### Contributing
We welcome contributions! Areas to improve:
- Additional health topics
- Voice message support
- Better multilingual support
- Integration with health facilities
- Mobile app version

---

## 🚀 Next Steps

1. **Day 1**: Follow [QUICKSTART.md](./QUICKSTART.md)
2. **Day 2**: Deploy to Render using [DEPLOYMENT.md](./DEPLOYMENT.md)
3. **Week 1**: Customize health content in `src/data/`
4. **Month 1**: Gather user feedback and iterate

---

## 📝 License

MIT License - Use this freely for any purpose, commercial or non-commercial.

---

## 🙏 Acknowledgments

Built for the residents of Kericho County, Kenya.

**References**:
- WHO Health Guidance
- Ministry of Health Kenya
- Kenya National Bureau of Statistics
- Local health community feedback

---

**Last Updated**: April 29, 2026
**Version**: 1.0.0
**Status**: Production Ready ✅

For the latest updates, check the repository.
