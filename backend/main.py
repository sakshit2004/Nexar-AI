"""
Main FastAPI application
Production-ready with middleware, error handling, and monitoring
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time

from backend.core.config import settings
from backend.core.logging import setup_logging, get_logger
from backend.core.exceptions import GrantMatchException

# API routes - Simplified: no auth, no profile, no payments
from backend.api.v1.routes import grants, saved_grants


# Setup logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info("Session-based storage (no database)")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS if not settings.DEBUG else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# GZip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests"""
    start_time = time.time()
    
    # Log request
    logger.info(f"→ {request.method} {request.url.path}")
    
    # Process request
    response = await call_next(request)
    
    # Log response
    duration = int((time.time() - start_time) * 1000)
    logger.info(
        f"← {request.method} {request.url.path} "
        f"status={response.status_code} duration={duration}ms"
    )
    
    # Add timing header
    response.headers["X-Process-Time"] = str(duration)
    
    return response


# Global exception handler
@app.exception_handler(GrantMatchException)
async def grantmatch_exception_handler(request: Request, exc: GrantMatchException):
    """Handle custom exceptions"""
    logger.error(f"GrantMatch exception: {exc}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc)}
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions. In production, still return real error for /api/v1 so you can see it in Network tab."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    is_api_v1 = request.url.path.startswith("/api/v1/")
    show_detail = not settings.is_production or is_api_v1
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc) if show_detail else "Internal server error"}
    )


# Health check
@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/api/docs" if settings.DEBUG else None
    }


# Include routers - Simplified scope: grants and saved grants only
app.include_router(grants.router, prefix=settings.API_V1_PREFIX)
app.include_router(saved_grants.router, prefix=settings.API_V1_PREFIX)
# Auth and profile routes removed - using hardcoded user
# Payment routes removed - no payment processing needed


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )

# Vercel serverless handler
handler = app

