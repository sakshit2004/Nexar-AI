"""Rate limiting middleware"""
from fastapi import HTTPException, status, Request
from datetime import datetime, timedelta
from typing import Dict
from collections import defaultdict

from backend.core.config import settings
from backend.models.user import User, UserTier


# In-memory rate limit store (use Redis in production)
_rate_limit_store: Dict[int, Dict[str, datetime]] = defaultdict(dict)


def check_rate_limit(user: User, operation: str = "query") -> None:
    """
    Check if user has exceeded rate limit
    
    Raises:
        HTTPException if limit exceeded
    """
    if not settings.RATE_LIMIT_ENABLED:
        return
    
    # Premium users have higher limits
    if user.tier == UserTier.PREMIUM:
        limit = 1000  # Daily limit
        window = timedelta(days=1)
    else:
        limit = 5  # Weekly limit for free users
        window = timedelta(weeks=1)
    
    # Check rate limit
    user_key = user.id
    now = datetime.utcnow()
    
    # Clean old entries
    if user_key in _rate_limit_store:
        _rate_limit_store[user_key] = {
            k: v for k, v in _rate_limit_store[user_key].items()
            if now - v < window
        }
    
    # Count recent requests
    recent_requests = len(_rate_limit_store[user_key])
    
    if recent_requests >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Upgrade to Premium for unlimited queries."
        )
    
    # Record this request
    request_id = f"{operation}_{now.timestamp()}"
    _rate_limit_store[user_key][request_id] = now


def get_rate_limit_status(user: User) -> Dict[str, any]:
    """Get current rate limit status for user"""
    if user.tier == UserTier.PREMIUM:
        return {
            "limit": 1000,
            "remaining": 1000,
            "window": "daily",
            "resets_at": None
        }
    
    # Free tier - weekly limit
    now = datetime.utcnow()
    week_start = now - timedelta(weeks=1)
    
    if user.id in _rate_limit_store:
        recent = [
            v for v in _rate_limit_store[user.id].values()
            if v > week_start
        ]
        used = len(recent)
    else:
        used = 0
    
    return {
        "limit": 5,
        "remaining": max(0, 5 - used),
        "window": "weekly",
        "resets_at": (week_start + timedelta(weeks=1)).isoformat()
    }

