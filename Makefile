# Nexar AI - Makefile
# Quick commands for development and deployment

.PHONY: help install dev build test lint

help:
	@echo "Nexar AI - Make Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install       Install frontend dependencies"
	@echo "  make dev           Run development server"
	@echo "  make build         Build for production"
	@echo "  make test          Run tests"
	@echo "  make lint          Run linters"

install:
	npm install

dev:
	npm run dev

build:
	npm run build

test:
	npm run test

lint:
	npm run lint

# Vercel deployment
vercel-deploy:
	vercel --prod

vercel-dev:
	vercel dev

vercel-env:
	@echo "Set these in Vercel Dashboard -> Settings -> Environment Variables:"
	@echo ""
	@echo "Required (Auth):"
	@echo "  NEXTAUTH_SECRET        (generate: openssl rand -base64 32)"
	@echo "  NEXTAUTH_URL           (e.g. https://your-app.vercel.app)"
	@echo ""
	@echo "Required (LLM - at least one):"
	@echo "  OPENAI_API_KEY"
	@echo "  ANTHROPIC_API_KEY"
	@echo "  LLM_PROVIDER           (openai or anthropic)"
	@echo ""
	@echo "Required (Redis - manual Upstash setup):"
	@echo "  UPSTASH_REDIS_REST_URL"
	@echo "  UPSTASH_REDIS_REST_TOKEN"
	@echo ""
	@echo "  OR if using Vercel + Upstash integration:"
	@echo "  KV_REST_API_URL"
	@echo "  KV_REST_API_TOKEN"
	@echo ""
	@echo "Optional:"
	@echo "  RESEND_API_KEY         (deadline alert emails)"
	@echo "  CRON_SECRET            (secures the /api/cron/deadline-check route)"
	@echo "  NEXT_PUBLIC_DEBUG"

