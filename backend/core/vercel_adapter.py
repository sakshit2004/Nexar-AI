"""
Vercel deployment adapter
Handles serverless-specific configurations
"""
import os
from backend.core.config import settings


def is_vercel() -> bool:
    """Check if running on Vercel"""
    return os.getenv("VERCEL") == "1"


def get_database_url() -> str:
    """
    Get database URL for Vercel
    Use PostgreSQL connection string from environment
    """
    if is_vercel():
        # Vercel requires external database (PostgreSQL)
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            raise ValueError(
                "DATABASE_URL environment variable required on Vercel. "
                "Add PostgreSQL database in Vercel dashboard."
            )
        return db_url
    return settings.DATABASE_URL


def configure_for_vercel():
    """Apply Vercel-specific configurations"""
    if is_vercel():
        # Disable features that don't work in serverless
        settings.GRANTS_SYNC_ENABLED = False
        
        # Use shorter timeouts
        settings.LLM_TIMEOUT = 25  # Vercel has 30s timeout
        
        # Log to stdout (Vercel captures this)
        settings.LOG_LEVEL = "INFO"

