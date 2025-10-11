# GrantMatch Advisor - System Architecture

## Overview

Production-grade architecture built for scale with clean separation of concerns.

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│                    (Streamlit / React)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS/REST
┌──────────────────────────▼──────────────────────────────────┐
│                      API GATEWAY                            │
│                   (FastAPI Routes)                          │
│  ┌──────────┬──────────┬─────────┬──────────┬───────────┐  │
│  │   Auth   │ Profile  │ Grants  │ Matching │ Webhooks  │  │
│  └──────────┴──────────┴─────────┴──────────┴───────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    SERVICE LAYER                            │
│  ┌────────────────┬────────────────┬───────────────────┐   │
│  │ Grant Service  │  LLM Service   │ Payment Service   │   │
│  ├────────────────┼────────────────┼───────────────────┤   │
│  │ Email Service  │  Auth Service  │  Analytics        │   │
│  └────────────────┴────────────────┴───────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                 REPOSITORY LAYER (Data Access)              │
│  ┌────────────────┬────────────────┬───────────────────┐   │
│  │ User Repo      │  Grant Repo    │  Match Repo       │   │
│  └────────────────┴────────────────┴───────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                       DATA LAYER                            │
│  ┌─────────────────────┬──────────────┬─────────────────┐  │
│  │  PostgreSQL         │  Redis       │  Object Storage │  │
│  │  (Primary Data)     │  (Cache)     │  (Files)        │  │
│  └─────────────────────┴──────────────┴─────────────────┘  │
└─────────────────────────────────────────────────────────────┘

                    EXTERNAL SERVICES
  ┌────────────┬──────────┬─────────┬───────────┬─────────┐
  │ Grants.gov │ OpenAI   │ Stripe  │ SendGrid  │ Sentry  │
  └────────────┴──────────┴─────────┴───────────┴─────────┘
```

## Directory Structure

```
backend/
├── api/                    # HTTP API layer
│   └── v1/
│       ├── routes/         # REST endpoints
│       ├── schemas/        # Request/response models
│       └── middleware/     # Auth, rate limiting
│
├── core/                   # Core utilities
│   ├── config.py          # Configuration management
│   ├── security.py        # Auth, encryption
│   ├── logging.py         # Structured logging
│   └── exceptions.py      # Custom exceptions
│
├── models/                 # Database models
│   ├── database.py        # DB connection
│   ├── user.py            # User model
│   └── grant.py           # Grant models
│
├── repositories/           # Data access layer
│   ├── base.py            # Base repository
│   ├── user_repository.py
│   └── grant_repository.py
│
├── services/               # Business logic
│   ├── grants/
│   │   ├── fetcher.py     # API data fetching
│   │   └── processor.py   # Grant processing
│   ├── llm/
│   │   ├── client.py      # LLM API wrapper
│   │   ├── prompts.py     # Prompt templates
│   │   └── matcher.py     # Grant matching
│   ├── email/
│   │   └── service.py     # Email sending
│   └── payment/
│       └── stripe_service.py
│
├── utils/                  # Utilities
└── main.py                # FastAPI app
```

## Design Patterns

### 1. Repository Pattern
- Abstracts data access logic
- Single source for database operations
- Easy to mock for testing

### 2. Service Layer Pattern
- Business logic separated from HTTP layer
- Reusable across different interfaces
- Transactional boundaries

### 3. Dependency Injection
- Database sessions injected via FastAPI Depends
- Easy to swap implementations
- Testable

### 4. Factory Pattern
- Configuration factory (`get_settings()`)
- Session factory (`SessionLocal`)

## Database Schema

### Core Tables
- **users** - User accounts
- **user_profiles** - Organization details
- **grants** - Federal grant opportunities
- **user_matches** - AI-generated matches
- **query_usage** - Rate limiting tracking
- **grant_summaries** - Cached LLM outputs

### Relationships
```
users (1) ──→ (1) user_profiles
users (1) ──→ (N) user_matches
grants (1) ──→ (N) user_matches
grants (1) ──→ (1) grant_summaries
users (1) ──→ (N) query_usage
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Get access token
- `GET /api/v1/auth/me` - Get current user

### Profile
- `GET /api/v1/profile` - Get profile
- `POST /api/v1/profile` - Create/update profile

### Grants
- `GET /api/v1/grants` - List grants
- `GET /api/v1/grants/{id}` - Get grant detail
- `GET /api/v1/grants/{id}/summary` - AI summary
- `POST /api/v1/grants/{id}/chat` - Ask questions

### Matching
- `GET /api/v1/matches` - Get matches for user
- `GET /api/v1/matches/rate-limit` - Check quota

### Webhooks
- `POST /api/v1/webhooks/stripe` - Stripe events

## Scaling Strategy

### Phase 1: MVP (0-10K users)
- Single server (FastAPI + PostgreSQL)
- SQLite → PostgreSQL migration
- Vertical scaling

### Phase 2: Growth (10K-100K users)
- Add Redis for caching
- Horizontal API scaling (load balancer)
- Database read replicas
- CDN for static assets

### Phase 3: Scale (100K+ users)
- Microservices architecture
- Separate LLM service
- Event-driven with message queue
- Multi-region deployment

## Security

### Authentication
- JWT tokens (HS256)
- Password hashing (bcrypt)
- Token expiration (30 min)

### API Security
- Rate limiting (free: 5/week, premium: 1000/day)
- CORS configuration
- SQL injection protection (SQLAlchemy ORM)
- Input validation (Pydantic)

### Data Protection
- Environment variable secrets
- Encrypted connections (TLS)
- Audit logging
- GDPR compliance ready

## Monitoring

### Logging
- Structured JSON logs (production)
- Request/response logging
- Error tracking (Sentry)

### Metrics
- Response times
- Error rates
- LLM token usage
- Database query performance

### Alerts
- High error rates
- Slow responses (>1s)
- High LLM costs
- Database connection issues

## Deployment

### Development
```bash
make dev
# or
uvicorn backend.main:app --reload
```

### Production (Docker)
```bash
make docker-build
make docker-up
```

### Cloud Platforms
- **Railway**: Auto-deploy from Git
- **Render**: One-click deployment
- **AWS**: ECS + RDS + ElastiCache
- **GCP**: Cloud Run + Cloud SQL

## Performance Targets

- **API Response**: <200ms (p95)
- **LLM Matching**: <5s for 100 grants
- **Database Queries**: <50ms
- **Cache Hit Rate**: >80%
- **Uptime**: 99.9%

## Cost Optimization

- **Caching**: Reduce LLM API calls by 80%
- **Batch Processing**: Sync grants daily, not per request
- **Connection Pooling**: Reuse DB connections
- **CDN**: Serve static assets cheaply

## Testing Strategy

- **Unit Tests**: Service layer, repositories
- **Integration Tests**: API endpoints
- **E2E Tests**: Critical user flows
- **Load Tests**: 1000 concurrent users

## Future Enhancements

- GraphQL API
- WebSocket for real-time updates
- Machine learning ranking model
- Mobile app (React Native)
- Multi-tenancy for consultants

