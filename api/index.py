"""
Vercel serverless entry point for FastAPI
"""
from backend.main import app

# Vercel expects 'app' or 'handler'
handler = app

