"""
Vercel serverless entry point for FastAPI
Ensures project root is on sys.path so "backend" can be imported when the function runs from api/.
When called via Next.js proxy, restores the original path from X-Original-URL so FastAPI routes correctly.
"""
import sys
from pathlib import Path
from urllib.parse import urlparse

# Project root (parent of api/) so "from backend.main import app" works
_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from backend.main import app


class OriginalPathMiddleware:
    """ASGI middleware: restore path and query from X-Original-URL (set by Next.js proxy)."""
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


# So requests proxied from Next.js with X-Original-URL hit the correct FastAPI route
handler = OriginalPathMiddleware(app)

