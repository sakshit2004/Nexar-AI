"""
Vercel serverless entry point for FastAPI.
Lives at frontend/api/backend.py; rootDirectory is "frontend" in Vercel project settings.
includeFiles bundles ../backend/** (the repo-root backend/ package) into the function.
Vercel rewrites /api/v1/:path* → /api/backend.
"""
import sys
import traceback
from pathlib import Path
from urllib.parse import urlparse

_import_error: str | None = None

# Vercel CWD is the rootDirectory (frontend/).
# buildCommand copies ../backend into frontend/ so backend/ is at frontend/backend/.
# For local dev, backend/ is two levels up (repo root).
for _candidate in [
    Path(__file__).resolve().parent.parent,         # frontend/ — after buildCommand copy
    Path(__file__).resolve().parent.parent.parent,  # repo root — local dev
]:
    if (_candidate / "backend").is_dir() and str(_candidate) not in sys.path:
        sys.path.insert(0, str(_candidate))

try:
    from backend.main import app
except Exception:
    _import_error = traceback.format_exc()
    app = None  # type: ignore


class RewritePathMiddleware:
    """Restore the original /api/v1/... path that Vercel rewrote to /api/backend."""

    def __init__(self, asgi_app):
        self.asgi_app = asgi_app

    async def __call__(self, scope, receive, send):
        if scope.get("type") == "http":
            import json as _json

            if _import_error is not None:
                body = _json.dumps({"detail": f"Python import error:\n{_import_error}"}).encode()
                await send({
                    "type": "http.response.start",
                    "status": 500,
                    "headers": [
                        [b"content-type", b"application/json"],
                        [b"content-length", str(len(body)).encode()],
                    ],
                })
                await send({"type": "http.response.body", "body": body})
                return

            headers = {k: v for k, v in scope.get("headers", [])}

            # Vercel passes the original path in x-vercel-rewrite-path
            rewrite_path = (
                headers.get(b"x-vercel-rewrite-path")
                or headers.get(b"x-forwarded-path")
            )
            if rewrite_path:
                try:
                    decoded = rewrite_path.decode("latin-1")
                    if decoded.startswith("http"):
                        parsed = urlparse(decoded)
                        scope["path"] = parsed.path or scope["path"]
                        scope["query_string"] = parsed.query.encode("utf-8") if parsed.query else scope.get("query_string", b"")
                    else:
                        parts = decoded.split("?", 1)
                        scope["path"] = parts[0] or scope["path"]
                        if len(parts) > 1:
                            scope["query_string"] = parts[1].encode("utf-8")
                except Exception:
                    pass

        await self.asgi_app(scope, receive, send)


handler = RewritePathMiddleware(app)
