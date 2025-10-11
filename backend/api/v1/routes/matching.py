"""Grant matching routes"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from backend.models.database import get_db
from backend.api.v1.schemas.grant import GrantMatchResponse
from backend.api.v1.middleware.auth import get_current_user
from backend.api.v1.middleware.rate_limit import check_rate_limit, get_rate_limit_status
from backend.services.llm.matcher import GrantMatcher
from backend.models.user import User


router = APIRouter(prefix="/matches", tags=["Matching"])


@router.get("", response_model=List[GrantMatchResponse])
def get_matches(
    limit: int = Query(default=100, le=500),
    min_score: int = Query(default=50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get grant matches for current user's profile
    
    This triggers AI matching if not already done
    """
    # Check rate limit
    check_rate_limit(current_user, "match")
    
    matcher = GrantMatcher(db)
    
    try:
        matches = matcher.match_grants_for_user(
            user_id=current_user.id,
            limit=limit,
            min_score=min_score
        )
        
        return matches
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/rate-limit")
def get_rate_limit_info(
    current_user: User = Depends(get_current_user)
):
    """Get current rate limit status"""
    return get_rate_limit_status(current_user)

