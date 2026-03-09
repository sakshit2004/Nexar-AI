"""
Vercel serverless entry for FastAPI at /api/backend.
Vercel rewrites /api/v1/:path* → /api/backend, so Vercel passes the original
path in the "x-vercel-rewrite-path" header (or we read it from X-Forwarded-Path).
We restore scope["path"] so FastAPI routes to /api/v1/... correctly.
"""
import sys
import traceback
from pathlib import Path
from urllib.parse import urlparse

_import_error: str | None = None

_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

try:
    from backend.main import app
except Exception as _e:
    _import_error = traceback.format_exc()
    app = None  # type: ignore


class RewritePathMiddleware:
    """Restore the original /api/v1/... path that Vercel rewrote to /api/backend."""

    def __init__(self, asgi_app):
        self.asgi_app = asgi_app

    async def __call__(self, scope, receive, send):
        if scope.get("type") == "http":
            import json as _json

            # If import failed, return error immediately with full traceback
            if _import_error is not None:
                async def _send_error(_):
                    pass
                body = _json.dumps({"detail": f"Python import error:\n{_import_error}"}).encode()
                await send({"type": "http.response.start", "status": 500, "headers": [
                    [b"content-type", b"application/json"],
                    [b"content-length", str(len(body)).encode()],
                ]})
                await send({"type": "http.response.body", "body": body})
                return

            headers = {k: v for k, v in scope.get("headers", [])}

            # region agent log
            import time as _t
            _hdr_dump = {k.decode("latin-1"): v.decode("latin-1") for k, v in scope.get("headers", []) if k.startswith(b"x-")}
            try:
                with open("/tmp/debug-3936c1.log", "a") as _f:
                    _f.write(_json.dumps({"sessionId":"3936c1","hypothesisId":"rewrite-path","location":"backend.py:call","message":"incoming scope","data":{"path":scope.get("path"),"query":scope.get("query_string",b"").decode("utf-8",errors="replace"),"x_headers":_hdr_dump},"timestamp":int(_t.time()*1000)}) + "\n")
            except Exception:
                pass
            # endregion

            # Vercel sets x-vercel-rewrite-path to the original path before rewrite
            rewrite_path = (
                headers.get(b"x-vercel-rewrite-path")
                or headers.get(b"x-original-url")
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

            # region agent log
            try:
                with open("/tmp/debug-3936c1.log", "a") as _f:
                    _f.write(_json.dumps({"sessionId":"3936c1","hypothesisId":"rewrite-path","location":"backend.py:after-restore","message":"path after restore","data":{"path":scope.get("path"),"query":scope.get("query_string",b"").decode("utf-8",errors="replace"),"rewrite_path_found": rewrite_path is not None},"timestamp":int(_t.time()*1000)}) + "\n")
            except Exception:
                pass
            # endregion

        await self.asgi_app(scope, receive, send)


handler = RewritePathMiddleware(app)
