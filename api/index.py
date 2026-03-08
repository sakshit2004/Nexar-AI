"""
Vercel serverless entry point for FastAPI
Ensures project root is on sys.path so "backend" can be imported when the function runs from api/.
"""
import sys
from pathlib import Path

# Project root (parent of api/) so "from backend.main import app" works
_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from backend.main import app

# Vercel expects 'app' or 'handler'
handler = app

