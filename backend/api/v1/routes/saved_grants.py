"""Saved Grants routes"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.models.database import get_db
from backend.api.v1.schemas.saved_grant import (
    SavedGrantCreate, 
    SavedGrantUpdate, 
    SavedGrantResponse,
    SavedGrantListResponse,
    SavedGrantStatsResponse
)
from backend.api.v1.middleware.auth import get_current_user
from backend.repositories.saved_grant_repository import SavedGrantRepository
from backend.models.user import User
from backend.core.logging import get_logger

router = APIRouter(prefix="/saved-grants", tags=["Saved Grants"])
logger = get_logger(__name__)


@router.post("", response_model=SavedGrantResponse, status_code=status.HTTP_201_CREATED)
def save_grant(
    grant_data: SavedGrantCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save a grant to user's collection"""
    try:
        repo = SavedGrantRepository(db)
        
        # Check if grant is already saved
        if repo.is_grant_saved(current_user.id, grant_data.grant_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Grant is already saved"
            )
        
        # Save the grant
        saved_grant = repo.save_grant(current_user.id, grant_data.dict())
        
        logger.info(f"Grant {grant_data.grant_id} saved by user {current_user.id}")
        
        return SavedGrantResponse.model_validate(saved_grant.to_dict())
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving grant: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save grant: {str(e)}"
        )


@router.get("", response_model=SavedGrantListResponse)
def list_saved_grants(
    include_archived: bool = Query(default=False, description="Include archived grants"),
    favorites_only: bool = Query(default=False, description="Show only favorites"),
    limit: int = Query(default=50, le=100, description="Maximum number of results"),
    offset: int = Query(default=0, ge=0, description="Number of results to skip"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's saved grants"""
    try:
        repo = SavedGrantRepository(db)
        
        # Get saved grants
        saved_grants = repo.get_user_saved_grants(
            user_id=current_user.id,
            include_archived=include_archived,
            favorites_only=favorites_only,
            limit=limit,
            offset=offset
        )
        
        # Get counts
        all_grants = repo.get_user_saved_grants(current_user.id, include_archived=True)
        total_count = len(all_grants)
        favorites_count = len([g for g in all_grants if g.is_favorite])
        archived_count = len([g for g in all_grants if g.is_archived])
        
        return SavedGrantListResponse(
            saved_grants=[SavedGrantResponse.model_validate(g.to_dict()) for g in saved_grants],
            total_count=total_count,
            favorites_count=favorites_count,
            archived_count=archived_count
        )
    
    except Exception as e:
        logger.error(f"Error listing saved grants: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list saved grants: {str(e)}"
        )


@router.get("/stats", response_model=SavedGrantStatsResponse)
def get_saved_grants_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get statistics for user's saved grants"""
    try:
        repo = SavedGrantRepository(db)
        stats = repo.get_user_stats(current_user.id)
        
        # Get recent saves (last 5)
        recent_saves = repo.get_user_saved_grants(
            user_id=current_user.id,
            include_archived=False,
            limit=5
        )
        
        return SavedGrantStatsResponse(
            total_saved=stats["total_saved"],
            favorites=stats["favorites"],
            archived=stats["archived"],
            by_category=stats["by_category"],
            by_agency=stats["by_agency"],
            recent_saves=[SavedGrantResponse.model_validate(g.to_dict()) for g in recent_saves]
        )
    
    except Exception as e:
        logger.error(f"Error getting saved grants stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get stats: {str(e)}"
        )


@router.get("/search")
def search_saved_grants(
    q: str = Query(..., description="Search query"),
    include_archived: bool = Query(default=False, description="Include archived grants"),
    limit: int = Query(default=50, le=100, description="Maximum number of results"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search saved grants"""
    try:
        repo = SavedGrantRepository(db)
        
        results = repo.search_saved_grants(
            user_id=current_user.id,
            query=q,
            include_archived=include_archived,
            limit=limit
        )
        
        return {
            "saved_grants": [SavedGrantResponse.model_validate(g.to_dict()) for g in results],
            "query": q,
            "count": len(results)
        }
    
    except Exception as e:
        logger.error(f"Error searching saved grants: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search saved grants: {str(e)}"
        )


@router.get("/{saved_grant_id}", response_model=SavedGrantResponse)
def get_saved_grant(
    saved_grant_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific saved grant"""
    try:
        repo = SavedGrantRepository(db)
        saved_grant = repo.get_saved_grant_by_id(saved_grant_id, current_user.id)
        
        if not saved_grant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saved grant not found"
            )
        
        return SavedGrantResponse.model_validate(saved_grant.to_dict())
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting saved grant: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get saved grant: {str(e)}"
        )


@router.put("/{saved_grant_id}", response_model=SavedGrantResponse)
def update_saved_grant(
    saved_grant_id: int,
    update_data: SavedGrantUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a saved grant"""
    try:
        repo = SavedGrantRepository(db)
        
        # Filter out None values
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        
        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No update data provided"
            )
        
        updated_grant = repo.update_saved_grant(saved_grant_id, current_user.id, update_dict)
        
        if not updated_grant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saved grant not found"
            )
        
        logger.info(f"Saved grant {saved_grant_id} updated by user {current_user.id}")
        
        return SavedGrantResponse.model_validate(updated_grant.to_dict())
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating saved grant: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update saved grant: {str(e)}"
        )


@router.post("/{saved_grant_id}/toggle-favorite", response_model=SavedGrantResponse)
def toggle_favorite(
    saved_grant_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle favorite status of a saved grant"""
    try:
        repo = SavedGrantRepository(db)
        
        updated_grant = repo.toggle_favorite(saved_grant_id, current_user.id)
        
        if not updated_grant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saved grant not found"
            )
        
        logger.info(f"Favorite status toggled for grant {saved_grant_id} by user {current_user.id}")
        
        return SavedGrantResponse.model_validate(updated_grant.to_dict())
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling favorite: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to toggle favorite: {str(e)}"
        )


@router.post("/{saved_grant_id}/archive")
def archive_saved_grant(
    saved_grant_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Archive a saved grant (soft delete)"""
    try:
        repo = SavedGrantRepository(db)
        
        success = repo.archive_saved_grant(saved_grant_id, current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saved grant not found"
            )
        
        logger.info(f"Grant {saved_grant_id} archived by user {current_user.id}")
        
        return {"message": "Grant archived successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error archiving saved grant: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to archive grant: {str(e)}"
        )


@router.delete("/{saved_grant_id}")
def delete_saved_grant(
    saved_grant_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Permanently delete a saved grant"""
    try:
        repo = SavedGrantRepository(db)
        
        success = repo.delete_saved_grant(saved_grant_id, current_user.id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saved grant not found"
            )
        
        logger.info(f"Grant {saved_grant_id} deleted by user {current_user.id}")
        
        return {"message": "Grant deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting saved grant: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete grant: {str(e)}"
        )


@router.get("/check/{grant_id}")
def check_grant_saved(
    grant_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if a grant is already saved by the user"""
    try:
        repo = SavedGrantRepository(db)
        is_saved = repo.is_grant_saved(current_user.id, grant_id)
        
        return {
            "grant_id": grant_id,
            "is_saved": is_saved
        }
    
    except Exception as e:
        logger.error(f"Error checking if grant is saved: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check grant status: {str(e)}"
        )
