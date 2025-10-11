"""Grant routes"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.models.database import get_db
from backend.api.v1.schemas.grant import GrantResponse, GrantMatchResponse, GrantSummaryResponse, ChatRequest
from backend.api.v1.middleware.auth import get_current_user
from backend.api.v1.middleware.rate_limit import check_rate_limit
from backend.services.grants.processor import GrantProcessor
from backend.services.llm.matcher import GrantMatcher
from backend.repositories.grant_repository import QueryUsageRepository
from backend.models.user import User


router = APIRouter(prefix="/grants", tags=["Grants"])


@router.get("/search", response_model=List[GrantResponse])
def search_grants(
    q: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    min_amount: Optional[int] = Query(default=None),
    max_amount: Optional[int] = Query(default=None),
    agency: Optional[str] = None,
    limit: int = Query(default=100, le=1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search grants with filters"""
    processor = GrantProcessor(db)
    
    # For now, return all active grants (implement actual search later)
    grants = processor.get_active_grants(limit=limit)
    
    # Filter by category if provided
    if category and grants:
        grants = [g for g in grants if g.get('category', '').lower() == category.lower()]
    
    return grants


@router.get("/recommended", response_model=List[GrantResponse])
def get_recommended_grants(
    limit: int = Query(default=10, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get personalized grant recommendations"""
    processor = GrantProcessor(db)
    
    # For now, return active grants (implement AI matching later)
    grants = processor.get_active_grants(limit=limit)
    
    return grants


@router.get("", response_model=List[GrantResponse])
def list_grants(
    limit: int = Query(default=100, le=1000),
    agency: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List active grants"""
    processor = GrantProcessor(db)
    
    if agency:
        grants = processor.search_grants(agency=agency, limit=limit)
    else:
        grants = processor.get_active_grants(limit=limit)
    
    return grants


@router.get("/{grant_id}", response_model=GrantResponse)
def get_grant(
    grant_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get grant by ID"""
    processor = GrantProcessor(db)
    grant = processor.get_grant_by_id(grant_id)
    
    if not grant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grant not found"
        )
    
    return grant


@router.get("/{grant_id}/summary", response_model=GrantSummaryResponse)
def get_grant_summary(
    grant_id: str,
    force: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get plain-English grant summary"""
    # Check rate limit
    check_rate_limit(current_user, "summary")
    
    matcher = GrantMatcher(db)
    
    try:
        summary = matcher.generate_summary(grant_id, force_regenerate=force)
        return summary
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post("/{grant_id}/chat")
def chat_about_grant(
    grant_id: str,
    data: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Ask questions about a grant"""
    # Check rate limit
    check_rate_limit(current_user, "chat")
    
    matcher = GrantMatcher(db)
    
    try:
        answer = matcher.chat_about_grant(
            grant_id=grant_id,
            user_question=data.question,
            chat_history=data.chat_history
        )
        
        return {
            "answer": answer,
            "grant_id": grant_id
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

