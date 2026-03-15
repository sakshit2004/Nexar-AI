# Contributing to Nexar-AI

First off, thank you for taking the time to contribute to Nexar-AI! This project is part of the [MLH Fellowship](https://fellowship.mlh.io/) Open Source track, and contributions from the community are what make it genuinely useful for nonprofits and small businesses trying to find federal funding.

This document covers everything you need to know: how to report bugs, propose features, set up your local environment, write code that passes review, and get your pull request merged.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [What We're Building](#what-were-building)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Your First Contribution](#your-first-contribution)
  - [Pull Requests](#pull-requests)
- [Local Development Setup](#local-development-setup)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running Without Redis](#running-without-redis)
  - [Running With Redis (Full Stack)](#running-with-redis-full-stack)
- [Project Structure](#project-structure)
- [Styleguides](#styleguides)
  - [TypeScript & React](#typescript--react)
  - [API Routes](#api-routes)
  - [Git Commit Messages](#git-commit-messages)
  - [Branch Naming](#branch-naming)
- [Testing](#testing)
- [Environment Variables Reference](#environment-variables-reference)
- [Issue & PR Labels](#issue--pr-labels)
- [Questions?](#questions)

---

## Code of Conduct

By participating in this project, you agree to be respectful, constructive, and inclusive. Harassment of any kind will not be tolerated. If you witness or experience unacceptable behavior, please open an issue or contact the maintainers directly.

---

## What We're Building

Nexar-AI is a full-stack Next.js 15 application. There is no separate backend — all server logic runs as Next.js API routes deployed on Vercel. The key moving parts are:

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router, Turbopack), React 19, Tailwind CSS v4, shadcn/ui |
| Auth | NextAuth.js v5 (credentials-only, JWT sessions) |
| Storage | Upstash Redis (users, profiles, saved grants, 24h grant cache) |
| AI / LLM | OpenAI `gpt-4o-search-preview` + `gpt-4o-mini`, Anthropic `claude-3-5-haiku` |
| Email | Resend (grant deadline alerts via Vercel Cron) |
| Tests | Vitest + Testing Library + jsdom |

Understanding this stack before contributing will help you get your PR merged faster.

---

## How Can I Contribute?

### Reporting Bugs

Before filing a bug report, please search [existing issues](https://github.com/sakshit2004/Nexar-AI/issues) to avoid duplicates.

**To file a bug report**, open a [new issue](https://github.com/sakshit2004/Nexar-AI/issues/new?template=bug_report.md) and include:

1. **What you did** — exact steps to reproduce (include the URL, page, and any inputs you used).
2. **What you expected** — describe the correct behavior.
3. **What actually happened** — paste the error message, console output, or a screenshot.
4. **Environment** — browser, OS, Node.js version, and whether you're running locally or on a deployed instance.
5. **Which service failed** — if the bug is in grant search or analysis, note whether you're using OpenAI or Anthropic (`LLM_PROVIDER` env var) and whether Redis is connected.

Good bug reports include the exact LLM response or Redis key that caused the issue, not just "it didn't work."

---

### Suggesting Features

Feature requests are welcome, especially if they directly improve the grant discovery experience for nonprofits or align with the MLH Fellowship learning objectives.

**To suggest a feature**, open a [new issue](https://github.com/sakshit2004/Nexar-AI/issues/new?template=feature_request.md) and include:

1. **The problem you're solving** — who is affected and how often.
2. **Your proposed solution** — describe the behavior from the user's perspective.
3. **Alternatives you considered** — why your approach is the best fit for this stack.
4. **Impact on existing features** — does it touch the LLM prompt, Redis schema, NextAuth config, or cron job?

Please do not open a feature request for the Python/FastAPI backend — that path is not actively developed. All features should work within the Next.js API route architecture.

---

### Your First Contribution

If you're new to the codebase, start with issues labelled:

- [`good first issue`](https://github.com/sakshit2004/Nexar-AI/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) — well-scoped tasks requiring a few file changes and a test.
- [`help wanted`](https://github.com/sakshit2004/Nexar-AI/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) — tasks where maintainer bandwidth is limited and external contributions are actively welcome.
- [`documentation`](https://github.com/sakshit2004/Nexar-AI/issues?q=is%3Aissue+is%3Aopen+label%3Adocumentation) — README, inline comments, or JSDoc improvements.

Good areas to start if no labelled issues exist:

- **UI polish** — the search and dashboard pages have known layout edge cases on mobile.
- **Test coverage** — `tests/` is sparse; adding Vitest tests for `lib/grant-utils.ts` or `lib/validation.ts` is immediately mergeable.
- **Error messages** — the grant detail page shows a generic error when a grant is not found in Redis or `sessionStorage`; a more actionable message would help users.

---

### Pull Requests

All code contributions go through pull requests. Here is the full process:

1. **Fork** the repository and create your branch from `main`.
2. **Follow the branch naming convention** (see [Branch Naming](#branch-naming)).
3. **Make your changes** — keep each PR focused on a single concern. Do not mix refactoring with feature work.
4. **Ensure `npm run build` passes with zero TypeScript and ESLint errors** before pushing:
   ```bash
   cd app
   npm run type-check
   npm run lint
   npm run build
   ```
5. **Run the test suite**:
   ```bash
   npm test
   ```
6. **Write or update tests** if your change affects a function in `lib/` or an API route.
7. **Open a pull request against `main`** with:
   - A clear title following the commit message format.
   - A description of *what* changed and *why* (not just *how*).
   - A reference to the issue it closes (e.g. `Closes #42`).
   - A note on how you tested it (local, Vercel preview, specific LLM provider used).

**PRs that touch the LLM prompt (`lib/grant-utils.ts` → `EXTRACTION_PROMPT`)** must include before/after examples of the grant JSON output, since prompt changes can silently break the parser.

**PRs that touch the Redis key schema** must update the key table in the README's Authentication & Storage section.

A maintainer will review within a few days. Please respond to review comments within a week or the PR may be closed.

---

## Local Development Setup

### Prerequisites

- **Node.js** v18 or later (`node --version`)
- **npm** v9 or later (comes with Node.js)
- **An OpenAI API key** or **Anthropic API key** (at least one required — grant search and analysis will not work without one)
- **An Upstash Redis database** — login, registration, saved grants, and profiles all require it. Free tier at [upstash.com](https://upstash.com) is sufficient.

### Installation

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/Nexar-AI.git
cd Nexar-AI/app

# 2. Install dependencies
npm install

# 3. Copy the environment template
cp .env.example .env.local

# 4. Fill in .env.local — at minimum these are required:
#    NEXTAUTH_SECRET   (generate: openssl rand -base64 32)
#    NEXTAUTH_URL      (http://localhost:3000)
#    OPENAI_API_KEY    (or ANTHROPIC_API_KEY + LLM_PROVIDER=anthropic)
#    UPSTASH_REDIS_REST_URL
#    UPSTASH_REDIS_REST_TOKEN

# 5. (Optional) Seed the demo account into Redis
npx tsx scripts/seed-demo-user.ts

# 6. Start the dev server with Turbopack
npm run dev
```

The app runs at `http://localhost:3000`.

### Running Without Redis

**Login and registration require Redis.** The auth system (`lib/auth.ts`) calls `hgetall user:{email}` on every sign-in and returns `null` (fails closed) if Redis is unreachable — there are no hardcoded fallback credentials.

Without Redis, only the public landing page (`/`) and the unauthenticated grant search API (`GET /api/v1/grants/search`) work. Every authenticated feature (dashboard, saved grants, profile, grant detail with AI analysis) requires a valid session, which requires Redis.

**For local development, Upstash Redis is required.** The free tier handles the full app with no limits that matter for development.

### Running With Redis (Full Stack)

1. Create a free Redis database at [upstash.com](https://upstash.com) (or connect via [Vercel Integrations → Upstash](https://vercel.com/integrations/upstash)).
2. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` from the Upstash console into `app/.env.local`.
3. Run the seed script to create the demo account:
   ```bash
   npx tsx scripts/seed-demo-user.ts
   ```
4. Start the server: `npm run dev`

---

## Project Structure

```
Nexar-AI/
├── app/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/              # NextAuth handler, register, account delete
│   │   │   ├── cron/              # deadline-check (daily 9 AM UTC via Vercel Cron)
│   │   │   └── v1/
│   │   │       ├── grants/        # search, recommended, [id], [id]/analyze
│   │   │       ├── profile/       # GET + PUT organization profile
│   │   │       └── saved/         # GET + POST + DELETE saved grants
│   │   ├── dashboard/             # Auth-gated home; personalized grant recommendations
│   │   ├── grants/[id]/           # Grant detail; AI summary + eligibility scoring
│   │   ├── login/                 # NextAuth credentials sign-in
│   │   ├── onboarding/            # 7-step wizard for new users
│   │   ├── profile/               # Organization profile editor
│   │   ├── register/              # Account creation with password strength meter
│   │   ├── saved/                 # Bookmarked grants list
│   │   ├── search/                # Natural language search with category filter
│   │   └── providers.tsx          # SessionProvider + QueryClient + ThemeProvider + SessionSync
│   ├── components/
│   │   ├── ui/                    # shadcn/ui primitives (Button, Card, Badge, Input)
│   │   ├── Navbar.tsx             # Scroll-aware nav; shows auth links when signed in
│   │   ├── ThemeToggle.tsx
│   │   ├── OnboardingTour.tsx     # Interactive step-by-step feature tour
│   │   └── landing/
│   │       └── GrantVisualization.tsx
│   ├── lib/
│   │   ├── auth.ts                # NextAuth v5 config (Credentials provider, JWT)
│   │   ├── kv.ts                  # Lazy Upstash Redis client (supports both env var naming conventions)
│   │   ├── grant-cache.ts         # Grant interface + Redis cache helpers (24h TTL)
│   │   ├── grant-utils.ts         # EXTRACTION_PROMPT + searchWithOpenAI/Anthropic + parsers
│   │   ├── email.ts               # sendDeadlineAlert via Resend
│   │   ├── api.ts                 # Client-side API wrappers (grantsApi, matchingApi, savedGrantsApi)
│   │   ├── store.ts               # Zustand auth store (mirrors NextAuth session)
│   │   ├── profile-store.ts       # Zustand organization profile store
│   │   ├── saved-grants-store.ts  # Zustand saved grants store with optimistic UI
│   │   └── validation.ts          # Email + password strength validation
│   ├── scripts/
│   │   └── seed-demo-user.ts      # Seeds admin@mlh.com into Redis
│   ├── types/
│   │   └── next-auth.d.ts         # Extends Session type with id field
│   └── .env.example
├── tests/                         # Vitest test files
├── vercel.json                    # Repo root — function timeouts + cron schedule
└── CONTRIBUTING.md
```

**Key files to understand before making changes:**

| File | Why it matters |
|---|---|
| `lib/grant-utils.ts` | The LLM prompt and JSON parser live here — most grant-related bugs start here |
| `lib/kv.ts` | All Redis access goes through this — change the client config here, not in individual routes |
| `lib/auth.ts` | Auth logic; changes here affect every authenticated route |
| `app/api/v1/grants/search/route.ts` | The main grant search endpoint; calls `searchWithOpenAI` or `searchWithAnthropic` |
| `app/api/v1/grants/[id]/analyze/route.ts` | Two-stage LLM analysis (summary + eligibility scoring) |
| `app/api/cron/deadline-check/route.ts` | Daily email alerts — requires `CRON_SECRET` bearer token |

---

## Styleguides

### TypeScript & React

- **Strict TypeScript** — no `any` types. If you're unsure of the type, use `unknown` and narrow it.
- **Use the `Grant` interface from `lib/grant-cache.ts`** for all grant data — do not define local grant types in component files.
- **Server components vs. client components** — prefer Server Components for pages that don't need interactivity. Add `"use client"` only when you need hooks, event handlers, or browser APIs.
- **Zustand stores are for client state only** — do not call store methods from API routes or server components.
- **`cn()` from `lib/utils.ts`** for all conditional Tailwind class merging — never string-concatenate class names directly.
- **shadcn/ui components** are preferred over raw HTML elements for all interactive UI (Button, Input, Card, Badge). Do not install additional UI libraries.
- **TanStack Query** for all data fetching in page components — do not use `useEffect` + `fetch` directly.

### API Routes

- All API routes live under `app/api/` and follow Next.js App Router conventions (`route.ts`, named exports `GET`, `POST`, etc.).
- **Authentication**: Protected routes must call `auth()` from `lib/auth.ts` at the top and return 401 if the session is null.
- **Redis errors must not crash the route** — wrap all `kv.*` calls in try/catch and return a meaningful HTTP error or graceful fallback.
- **LLM calls belong in `lib/grant-utils.ts`**, not inline in route handlers. If you're calling OpenAI or Anthropic directly in a route file, move the logic to a utility function first.
- **Never log API keys, user emails, or grant data** to the console in production paths.
- Routes that call LLMs must have `maxDuration: 60` set in `vercel.json` — the default Vercel timeout of 10 seconds is not enough.

### Git Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short summary>

[optional body — wrap at 72 chars]

[optional footer: Closes #issue]
```

**Types:**

| Type | When to use |
|---|---|
| `feat` | A new feature visible to users |
| `fix` | A bug fix |
| `refactor` | Code restructuring with no behavior change |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `docs` | Documentation only |
| `chore` | Dependency bumps, config, CI |

**Scopes** (optional but helpful): `search`, `analyze`, `auth`, `saved`, `profile`, `onboarding`, `cron`, `ui`, `llm`, `redis`

Examples:
```
feat(search): add pagination support to grant search results

fix(analyze): handle Redis cache miss in analyze route using request body

docs: update architecture diagram to show sessionStorage grant flow

test(validation): add edge cases for password strength scoring
```

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Fix bug" not "Fixes bug")
- Keep the first line under 72 characters
- Reference issues in the footer: `Closes #42` or `Refs #17`

### Branch Naming

```
<type>/<short-description-in-kebab-case>
```

| Branch | Purpose |
|---|---|
| `feat/grant-pagination` | New feature |
| `fix/analyze-redis-miss` | Bug fix |
| `docs/update-architecture-diagram` | Documentation |
| `refactor/extract-llm-client` | Refactoring |
| `test/grant-utils-parser` | Tests only |
| `chore/bump-nextjs-15-6` | Dependency or config update |

Never commit directly to `main`. Always work on a branch and open a PR.

---

## Testing

Tests live in `tests/` and use [Vitest](https://vitest.dev/) with `@testing-library/react` and `jsdom`.

```bash
# Run all tests once
npm test

# Watch mode during development
npm run test:watch
```

**What to test:**

- `lib/grant-utils.ts` — `parseGrantsJson` and `normalizeGrant` are pure functions and should have unit tests covering malformed LLM output, missing fields, and edge-case JSON formats.
- `lib/validation.ts` — `validatePassword` and `isValidEmail` have clear input/output contracts; all edge cases should be covered.
- `lib/grant-cache.ts` — `hasFutureDeadline` logic (past dates, future dates, empty strings, unparseable formats).
- Page components — use `@testing-library/react` to test conditional rendering (auth guards, loading states, error states).

**What not to test:**

- Next.js routing itself — that is framework behavior.
- Upstash Redis or OpenAI API calls directly — mock `lib/kv.ts` and `lib/grant-utils.ts` at the module level using Vitest's `vi.mock()`.
- The Vercel Cron trigger mechanism — test only the route handler logic in isolation.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXTAUTH_SECRET` | Yes | JWT signing secret. Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Full app URL. Use `http://localhost:3000` locally |
| `OPENAI_API_KEY` | One of these | For `gpt-4o-search-preview` (grant search) and `gpt-4o-mini` (summaries) |
| `ANTHROPIC_API_KEY` | One of these | For `claude-3-5-haiku-latest` with `web_search_20250305` |
| `LLM_PROVIDER` | Yes | `openai` (default) or `anthropic` |
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash Redis REST endpoint URL |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash Redis REST token |
| `RESEND_API_KEY` | Optional | Enables deadline alert emails. Free tier: 100 emails/day |
| `CRON_SECRET` | Optional | Bearer token Vercel sends with cron job requests |

See [`app/.env.example`](app/.env.example) for the full annotated reference.

---

## Issue & PR Labels

| Label | Meaning |
|---|---|
| `bug` | Something is broken or behaves incorrectly |
| `enhancement` | A new feature or improvement to existing behavior |
| `good first issue` | Well-scoped, low-risk — good for first-time contributors |
| `help wanted` | Maintainer bandwidth is limited; external contributions actively welcome |
| `documentation` | README, CONTRIBUTING, inline comments, or JSDoc |
| `llm` | Changes to the LLM prompt, provider logic, or response parsing |
| `redis` | Changes to the Redis key schema, TTL, or KV client |
| `auth` | Changes to NextAuth config, session handling, or user management |
| `ui` | Frontend-only changes (components, styling, animations) |
| `cron` | Changes to the deadline-check cron job or email logic |
| `duplicate` | Already tracked in another issue |
| `wontfix` | Out of scope or intentionally not addressed |

---

## Questions?

- **General questions about the codebase** — open a [GitHub Discussion](https://github.com/sakshit2004/Nexar-AI/discussions) or comment on a relevant issue.
- **Something broken locally** — check the [README's Getting Started section](README.md#-getting-started) first, especially the Redis requirement.
- **MLH Fellowship questions** — visit [fellowship.mlh.io](https://fellowship.mlh.io/).

Thank you for contributing to Nexar-AI. Every contribution — bug report, test, documentation fix, or feature — makes the tool more useful for the nonprofits and small businesses that depend on it.
