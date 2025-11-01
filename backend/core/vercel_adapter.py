"""
Vercel deployment adapter
Handles serverless-specific configurations
"""
import os
from backend.core.config import settings


def is_vercel() -> bool:
    """Check if running on Vercel"""
    return os.getenv("VERCEL") == "1"


def configure_for_vercel():
    """Apply Vercel-specific configurations"""
    if is_vercel():
        # Use shorter timeouts for serverless
        settings.LLM_TIMEOUT = 25  # Vercel has 30s timeout
        
        # Log to stdout (Vercel captures this)
        settings.LOG_LEVEL = "INFO"

