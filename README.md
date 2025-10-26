# GrantMatch Advisor

**AI-Powered Grant Discovery for Nonprofits and Small Businesses**

> Find federal grants in 5 minutes, not 5 hours. Plain-English summaries, intelligent matching, and instant answers—powered by GPT-4o mini.

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites

- Python 3.11+
- OpenAI API key ([$5 minimum](https://platform.openai.com/api-keys))

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/grantmatch-advisor.git
cd grantmatch-advisor

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
cp env.example .env
# Edit .env and add your OPENAI_API_KEY

# 5. Test API connections
python test_apis.py

# 6. Run the app
streamlit run app.py
```

Open http://localhost:8501 in your browser. Done! 🎉

---

## 📋 What's Included

This repository contains everything to launch **GrantMatch Advisor**:

- ✅ **Business Plan** (`BUSINESS_PLAN.md`) - Complete 3-year strategy
- ✅ **API Configuration** (`env.example`) - All required API keys with setup instructions
- ✅ **Setup Guide** (`API_SETUP_GUIDE.md`) - Step-by-step for each API
- ✅ **Configuration System** (`config.py`) - Centralized settings management
- ✅ **API Validator** (`test_apis.py`) - Test all connections
- ✅ **Dependencies** (`requirements.txt`) - Python packages

---

## 🔑 Required API Keys

### For MVP (Week 1):

1. **OpenAI API** - [Get it here](https://platform.openai.com/api-keys)
   - Used for: Grant matching, summaries, chat
   - Cost: ~$20-40/month
   
2. **Grants.gov API** - [Public endpoints](https://grants.gov/api/api-guide) (no key needed!)
   - Used for: Federal grant data
   - Cost: Free

### For Full Features (Week 2):

3. **SendGrid** - [Get it here](https://app.sendgrid.com/signup)
   - Used for: Email alerts
   - Cost: Free (100 emails/day)
   
4. **Stripe** - [Get it here](https://dashboard.stripe.com/register)
   - Used for: Premium subscriptions
   - Cost: Free (2.9% + $0.30 per transaction)

See [`docs/API_SETUP_GUIDE.md`](docs/API_SETUP_GUIDE.md) for detailed instructions.

---

## 🛠️ Tech Stack

| Component | Technology | Why? |
|-----------|------------|------|
| **Frontend** | Streamlit | Rapid prototyping, Python-native |
| **Backend** | Python 3.11+ | LLM integration, data processing |
| **Database** | SQLite | Perfect for <10K users, easy scaling |
| **LLM** | GPT-4o mini | Best price/performance ($0.15-0.60/1M tokens) |
| **Grant Data** | Grants.gov API | Official federal source, free |
| **Email** | SendGrid | 100 emails/day free tier |
| **Payments** | Stripe | Industry standard, easy integration |

**Total Cost:** $20-40/month (well under $50 budget)

---

## 📁 Project Structure

```
Nexar-AI/
├── backend/                    # FastAPI Backend
│   ├── api/v1/                # REST API routes
│   ├── core/                  # Config, security, logging
│   ├── models/                # SQLAlchemy models
│   ├── repositories/          # Data access layer
│   ├── services/              # Business logic
│   │   ├── grants/           # Grant fetching & processing
│   │   ├── llm/              # AI matching
│   │   ├── email/            # SendGrid
│   │   └── payment/          # Stripe
│   └── main.py               # FastAPI app
│
├── config/                     # Configuration
│   └── env.example            # Environment template
│
├── docs/                       # Documentation
│   ├── BUSINESS_PLAN.md       # Business strategy
│   ├── ARCHITECTURE.md        # System design
│   └── API_SETUP_GUIDE.md     # API setup
│
├── scripts/                    # Utility scripts
│   ├── init_db.py            # Initialize database
│   ├── sync_grants.py        # Daily grant sync
│   └── test_apis.py          # API validator
│
├── frontend/                   # Frontend (Future)
├── tests/                      # Test suite
├── docker/                     # Docker configs
│
├── Dockerfile                 # Production image
├── docker-compose.yml         # Multi-container setup
├── Makefile                   # Quick commands
├── README.md                  # This file
└── requirements.txt           # Dependencies
```

**Full details:** See [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md)

---

## 🎯 Features

### MVP (2-Week Launch)

- [x] **Smart Profile Builder** - 5 questions, 3 minutes to complete
- [x] **AI Grant Matching** - Fit scores (1-100) for every grant
- [x] **Plain-English Summaries** - No more jargon or bureaucratic language
- [x] **Chat Interface** - Ask anything about a grant, get instant answers
- [x] **Email Alerts** - Weekly digest of new matching grants
- [x] **Freemium Model** - 5 queries/week free, unlimited for $9.99/month

### Roadmap

**6 Months:**
- Grant bookmarks and tracking
- Team collaboration features
- Chrome extension for Grants.gov

**12 Months:**
- Private foundation grants
- State/local grants
- Mobile app (iOS/Android)

**24 Months:**
- Canada grants (NSERC, SSHRC)
- Fine-tuned language model
- B2B tier for consulting firms

---

## 💰 Business Model

### Freemium SaaS

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 5 queries/week, basic matching, weekly alerts |
| **Premium** | $9.99/mo | Unlimited queries, daily alerts, PDF exports, priority support |

### Projections

| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| **Total Users** | 10,000 | 60,000 | 200,000 |
| **Premium Users** | 500 | 4,200 | 20,000 |
| **Revenue** | $33K | $393K | $1.9M |
| **Gross Margin** | 81% | 84% | 83% |

See [`BUSINESS_PLAN.md`](BUSINESS_PLAN.md) for full financial projections.

---

## 🚦 Getting Started - Next Steps

### Day 1-2: Setup & Configuration

```bash
# 1. Get OpenAI API key
https://platform.openai.com/api-keys

# 2. Configure .env file
cp env.example .env
# Add your OPENAI_API_KEY

# 3. Test APIs
python test_apis.py

# 4. Verify configuration
python config.py
```

### Day 3-4: Database & Backend

```bash
# Initialize database
python scripts/setup_db.py

# Test grants fetching
python backend/grants_fetcher.py

# Test LLM integration
python backend/llm_service.py
```

### Day 5-7: Frontend

```bash
# Run Streamlit app
streamlit run app.py

# Test in browser
# http://localhost:8501
```

---

## 🧪 Testing

### Test All APIs

```bash
python test_apis.py
```

Expected output:
```
✅ OpenAI API working!
✅ Grants.gov API working!
⚠️  SendGrid not configured (optional)
✅ Core APIs working! You're ready to start building.
```

### Test Configuration

```bash
python config.py
```

Shows configuration status and which APIs are available.

---

## 📊 Development Timeline

### Week 1: Core Infrastructure

- **Days 1-2:** Setup, data pipeline, Grants.gov integration
- **Days 3-4:** LLM integration (matching + summaries)
- **Days 5-7:** Streamlit frontend MVP

### Week 2: Polish & Launch

- **Days 8-9:** Freemium logic, Stripe integration
- **Days 10-11:** Email alerts, SendGrid integration
- **Days 12-13:** Beta testing, bug fixes
- **Day 14:** Launch! 🚀

---

## 🐛 Troubleshooting

### "Module not found" errors

```bash
# Make sure virtual environment is activated
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

### "Invalid API Key" errors

```bash
# Test your API keys
python test_apis.py

# Check .env file exists
ls -la .env

# Verify no extra spaces in API keys
cat .env | grep API_KEY
```

### Grants.gov API not working

The public endpoints should work without a key. Try:

```bash
curl "https://www.grants.gov/grantsws/rest/opportunities/search/?rows=5"
```

If that fails, the Grants.gov API might be down. Check status or use Simpler.Grants.gov instead.

---

## 📚 Documentation

- **Project Structure:** [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md)
- **Business Plan:** [`docs/BUSINESS_PLAN.md`](docs/BUSINESS_PLAN.md)
- **Architecture:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **API Setup:** [`docs/API_SETUP_GUIDE.md`](docs/API_SETUP_GUIDE.md)
- **Backend API:** [`backend/README.md`](backend/README.md)
- **Grants.gov API:** https://grants.gov/api/api-guide
- **OpenAI Docs:** https://platform.openai.com/docs
- **FastAPI Docs:** https://fastapi.tiangolo.com

---

## 🤝 Contributing

This is currently a solo founder project. If you're interested in contributing:

1. Open an issue describing your idea
2. Fork the repository
3. Create a feature branch
4. Submit a pull request

---

## 📄 License

See [`LICENSE`](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Grants.gov** for providing free public API access
- **OpenAI** for GPT-4o mini affordability
- **Streamlit** for making Python web apps easy

---

## 📧 Contact

Questions? Suggestions? Found a bug?

- **Email:** your-email@example.com
- **LinkedIn:** [Your Profile](#)
- **Issues:** [GitHub Issues](#)

---

## ⭐ Roadmap Status

- [x] Business plan complete
- [x] API configuration setup
- [x] Tech stack defined
- [ ] Database schema implemented
- [ ] Grants fetcher built
- [ ] LLM integration complete
- [ ] Streamlit frontend MVP
- [ ] Beta testing
- [ ] Public launch

**Current Phase:** Setup & Configuration ✅  
**Next Milestone:** Backend Implementation 🚧

---

Built with ❤️ for nonprofits and small businesses making a difference.

**GrantMatch Advisor** - Federal Grants, Explained Like a Friend
