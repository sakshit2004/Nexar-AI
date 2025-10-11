# GrantMatch Advisor - Makefile
# Quick commands for development and deployment

.PHONY: help install dev test lint format docker-build docker-up docker-down deploy

help:
	@echo "GrantMatch Advisor - Make Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install       Install dependencies"
	@echo "  make dev           Run development server"
	@echo "  make test          Run tests"
	@echo "  make lint          Run linters"
	@echo "  make format        Format code"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build  Build Docker images"
	@echo "  make docker-up     Start Docker containers"
	@echo "  make docker-down   Stop Docker containers"
	@echo ""
	@echo "Database:"
	@echo "  make init-db       Initialize database"
	@echo "  make sync-grants   Sync grants from API"

install:
	pip install -r requirements.txt

dev:
	uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

test:
	pytest tests/ -v --cov=backend

lint:
	flake8 backend/
	mypy backend/

format:
	black backend/
	black tests/

docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

init-db:
	python scripts/init_db.py

sync-grants:
	python scripts/sync_grants.py

# Vercel deployment
vercel-deploy:
	vercel --prod

vercel-dev:
	vercel dev

vercel-env:
	@echo "Set these in Vercel Dashboard → Settings → Environment Variables:"
	@echo ""
	@echo "Required:"
	@echo "  OPENAI_API_KEY"
	@echo "  SECRET_KEY"
	@echo "  JWT_SECRET"
	@echo "  DATABASE_URL (PostgreSQL)"
	@echo ""
	@echo "Optional:"
	@echo "  SENDGRID_API_KEY"
	@echo "  STRIPE_SECRET_KEY"
	@echo "  SIMPLER_GRANTS_API_KEY"

