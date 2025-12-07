# Nexar-AI

**Grant Discovery Platform for Nonprofits and Small Businesses**

> Find federal grants in 5 minutes, not 5 hours. Plain-English summaries, intelligent matching, and instant answers.

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites

- Python 3.11+
- OpenAI API key ([$5 minimum](https://platform.openai.com/api-keys))

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/nexar-ai.git
cd nexar-ai

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

# 6. Run the backend
python -m backend.main

# 7. Run the frontend (New terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 in your browser. Done! 🎉

---

## 📋 What's Included

This repository contains everything to launch **Nexar-AI**:

- ✅ **API Configuration** (`env.example`) - All required API keys with setup instructions
- ✅ **Setup Guide** (`API_SETUP_GUIDE.md`) - Step-by-step for each API
- ✅ **Configuration System** (`config.py`) - Centralized settings management
- ✅ **API Validator** (`test_apis.py`) - Test all connections
- ✅ **Dependencies** (`requirements.txt`) - Python packages

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
│   ├── ARCHITECTURE.md        # System design
│   └── API_SETUP_GUIDE.md     # API setup
│
├── scripts/                    # Utility scripts
│   ├── init_db.py            # Initialize database
│   ├── sync_grants.py        # Daily grant sync
│   └── test_apis.py          # API validator
│
├── frontend/                   # Next.js Frontend
├── tests/                      # Test suite
├── docker/                     # Docker configs
│
├── Dockerfile                 # Production image
├── docker-compose.yml         # Multi-container setup
├── Makefile                   # Quick commands
├── README.md                  # This file
└── requirements.txt           # Dependencies
```

---

## 🎯 Features

- [x] **Smart Profile Builder** - 5 questions, 3 minutes to complete
- [x] **Intelligent Grant Matching** - Fit scores (1-100) for every grant
- [x] **Plain-English Summaries** - No more jargon or bureaucratic language
- [x] **Chat Interface** - Ask anything about a grant, get instant answers
- [x] **Email Alerts** - Weekly digest of new matching grants
- [x] **Freemium Model** - 5 queries/week free, unlimited for $9.99/month

---

## 🛠️ Tech Stack

| Component | Technology | Why? |
|-----------|------------|------|
| **Frontend** | Next.js | React framework, production-ready |
| **Backend** | Python 3.11+ | Text processing, data analysis |
| **Database** | SQLite | Perfect for <10K users, easy scaling |
| **Text Processing** | Advanced NLP | Natural language processing for grant matching |
| **Grant Data** | Grants.gov API | Official federal source, free |
| **Email** | SendGrid | 100 emails/day free tier |
| **Payments** | Stripe | Industry standard, easy integration |

---

## 📄 License

See [`LICENSE`](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Grants.gov** for providing free public API access
- **Technology Partners** for making grant discovery accessible
- **Next.js** for the modern frontend framework

---

## 📧 Contact

Questions? Suggestions? Found a bug?

- **Email:** your-email@example.com
- **LinkedIn:** [Your Profile](#)
- **Issues:** [GitHub Issues](#)

---

**Nexar-AI** - Federal Grants, Explained Like a Friend
