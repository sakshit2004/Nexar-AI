"""
Vercel serverless entry for FastAPI at /api/backend (avoids conflict with Next.js handling /api/index).
Same logic as index.py: path restoration from X-Original-URL.
"""
import sys
from pathlib import Path
from urllib.parse import urlparse

_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from backend.main import app


class OriginalPathMiddleware:
    def __init__(self, asgi_app):
        self.asgi_app = asgi_app

    async def __call__(self, scope, receive, send):
        if scope.get("type") == "http":
            headers = dict(scope.get("headers", []))
            original = headers.get(b"x-original-url")
            if original:
                try:
                    url = urlparse(original.decode("latin-1"))
                    scope["path"] = url.path or scope["path"]
                    scope["query_string"] = (url.query.encode("utf-8") if url.query else b"")
                except Exception:
                    pass
        await self.asgi_app(scope, receive, send)


handler = OriginalPathMiddleware(app)
