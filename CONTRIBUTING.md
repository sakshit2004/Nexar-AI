# Contributing to Nexar AI

Nexar AI is an open-source, AI-powered federal grant discovery app built with Next.js 15, NextAuth.js v5, and Upstash Redis. It runs entirely as Next.js API routes on Vercel — no Python backend, no separate services.

## Prerequisites

- Node.js 18 or later
- A Vercel account (free tier works)
- An OpenAI API key **or** an Anthropic API key (for grant discovery and analysis)
- An Upstash Redis database (for grant cache, saved grants, and user profiles — free tier works; connect via Vercel Integrations → Upstash)
- A Resend account (for deadline alert emails — free tier works)

## Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/your-org/nexar-ai.git
cd nexar-ai/frontend

# 2. Install dependencies
npm install

# 3. Copy env template and fill in your keys
cp .env.example .env.local
# Edit .env.local — at minimum set NEXTAUTH_SECRET, NEXTAUTH_URL, and one LLM key

# 4. Seed the demo user into Redis (requires KV env vars to be set)
npx tsx scripts/seed-demo-user.ts

# 5. Start the dev server
npm run dev
```

The app will be available at http://localhost:3000.

Sign in with the MLH demo account: `admin@mlh.com` / `mlh`

## Running Locally Without KV

If you don't have Upstash Redis configured, the app still runs — it falls back to hardcoded demo credentials for login. Grant cache, saved grants, and profiles won't persist, but LLM search and analysis will work as long as you have an API key.

## Running KV Locally (Upstash)

1. Create a free Redis database at [upstash.com](https://upstash.com) or via [Vercel Integrations → Upstash](https://vercel.com/integrations/upstash).
2. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from the Upstash console into `.env.local`.
3. Run the seed script: `npx tsx scripts/seed-demo-user.ts`

## Project Structure

```
frontend/
  app/                   Next.js App Router pages and API routes
    api/v1/              Grant search, saved grants, profile, cron
    api/auth/            NextAuth.js handler
  lib/                   Shared utilities (auth, kv, grant-cache, stores)
  components/            UI components (shadcn/ui based)
  scripts/               One-off scripts (seed-demo-user.ts)
  types/                 TypeScript augmentations
```

## Submitting a Pull Request

1. Fork the repository and create a feature branch: `git checkout -b feat/my-feature`
2. Make your changes; ensure `npm run build` passes with zero errors.
3. Run tests: `npm test`
4. Open a pull request against `main` with a clear description of what you changed and why.

Please keep PRs focused — one feature or bug fix per PR.

## Environment Variables

See `frontend/.env.example` for a complete reference of all required and optional environment variables.
