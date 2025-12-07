# Nexar-AI - Simplified Backend

A simplified FastAPI backend for searching and managing federal grants. Session-based storage with no authentication or database persistence.

## Architecture

```
backend/
├── api/
│   └── v1/
│       ├── routes/
│       │   ├── grants.py          # Grant search endpoints
│       │   └── saved_grants.py    # Saved grants (session-based)
│       └── schemas/
│           ├── grant.py           # Grant data schemas
│           └── saved_grant.py     # Saved grant schemas
│
├── core/
│   ├── config.py                  # Application configuration
│   ├── session_storage.py      # In-memory session storage
│   ├── user_helper.py            # Hardcoded user (no auth)
│   ├── logging.py                 # Logging setup
│   └── exceptions.py             # Custom exceptions
│
├── services/
│   └── llm/
│       ├── client.py              # Text processing API wrapper
│       ├── providers.py           # Text processing providers
│       ├── prompts.py             # Prompt templates
│       └── web_search.py          # Web search for grants
│
└── main.py                        # FastAPI application
```

## Key Features

### 🔍 Grant Search
- Real-time federal grant search using web search
- Intelligent grant discovery
- Filter by category, agency, amount
- Detailed grant analysis and summaries

### 💾 Session Storage
- In-memory storage for saved grants
- No database required
- Data persists during session (lost on server restart)

### 🔧 Text Processing Integration
- Multi-provider text processing support
- Automatic failover between providers
- Advanced grant analysis and recommendations

## API Endpoints

### Grants
- `GET /api/v1/grants/search` - Search for grants
- `GET /api/v1/grants` - List current grants
- `GET /api/v1/grants/{grant_id}` - Get grant details
- `GET /api/v1/grants/recommended` - Get recommendations
- `POST /api/v1/grants/{grant_id}/analyze` - Grant analysis

### Saved Grants
- `POST /api/v1/saved-grants` - Save a grant
- `GET /api/v1/saved-grants` - List saved grants
- `GET /api/v1/saved-grants/search` - Search saved grants
- `GET /api/v1/saved-grants/stats` - Get statistics
- `PUT /api/v1/saved-grants/{id}` - Update saved grant
- `DELETE /api/v1/saved-grants/{id}` - Delete saved grant

## Environment Variables

```bash
# Application
APP_URL=http://localhost:8000
ENVIRONMENT=development
DEBUG=True

# Text Processing Configuration
TEXT_PROCESSING_PROVIDER=default
PROCESSING_API_KEY=your-key-here

# Optional
# CORS_ORIGINS=http://localhost:3000
```

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. Run the server:
```bash
python -m backend.main
# or
uvicorn backend.main:app --reload
```

## What's Simplified

- ✅ **No Authentication** - Hardcoded user, no JWT tokens
- ✅ **No Database** - Session-based in-memory storage
- ✅ **No Payments** - No Stripe integration
- ✅ **No Email** - No email service
- ✅ **Minimal Dependencies** - Only what's needed for grants

## Session Storage

Saved grants are stored in memory and will be lost when:
- The server restarts
- The application is redeployed
- The process is terminated

This is intentional for the simplified architecture - perfect for demos and single-session use cases.
