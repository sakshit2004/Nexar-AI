"""Saved Grants routes - Session-based storage (no database)"""
from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional

from backend.api.v1.schemas.saved_grant import (
    SavedGrantCreate, 
    SavedGrantUpdate, 
    SavedGrantResponse,
    SavedGrantListResponse,
    SavedGrantStatsResponse
)
from backend.core.session_storage import get_session_storage
from backend.core.user_helper import get_current_user_simple
from backend.core.logging import get_logger

router = APIRouter(prefix="/saved-grants", tags=["Saved Grants"])
logger = get_logger(__name__)


@router.post("", response_model=SavedGrantResponse, status_code=status.HTTP_201_CREATED)
def save_grant(
    grant_data: SavedGrantCreate
):
    """Save a grant to session collection"""
    try:
        current_user = get_current_user_simple()
        storage = get_session_storage()
        
        # Check if grant is already saved
        if storage.is_grant_saved(grant_data.grant_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Grant is already saved"
            )
        
        # Save the grant
        saved_grant = storage.save_grant(grant_data.dict())
        
        logger.info(f"Grant {grant_data.grant_id} saved by user {current_user.id}")
        
        return SavedGrantResponse.model_validate(saved_grant)
    
    except ValueError as e:
        # Handle "already saved" error
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
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
    favorites_only: bool = Query(default=False, description="Show only favorites"),
    limit: int = Query(default=50, le=100, description="Maximum number of results"),
    offset: int = Query(default=0, ge=0, description="Number of results to skip")
):
    """Get session's saved grants"""
    try:
        current_user = get_current_user_simple()
        storage = get_session_storage()
        
        saved_grants = storage.get_saved_grants(
            favorites_only=favorites_only,
            limit=limit,
            offset=offset
        )
        
        all_grants = storage.get_saved_grants(limit=1000)
        total_count = len(all_grants)
        favorites_count = len([g for g in all_grants if g.get("is_favorite", False)])
        
        return SavedGrantListResponse(
            saved_grants=[SavedGrantResponse.model_validate(g) for g in saved_grants],
            total_count=total_count,
            favorites_count=favorites_count
        )
    
    except Exception as e:
        logger.error(f"Error listing saved grants: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list saved grants: {str(e)}"
        )


@router.get("/stats", response_model=SavedGrantStatsResponse)
def get_saved_grants_stats():
    """Get statistics for session's saved grants"""
    try:
        current_user = get_current_user_simple()
        storage = get_session_storage()
        
        stats = storage.get_stats()
        
        recent_saves = storage.get_saved_grants(limit=5)
        
        return SavedGrantStatsResponse(
            total_saved=stats["total_saved"],
            favorites=stats["favorites"],
            by_category=stats["by_category"],
            by_agency=stats["by_agency"],
            recent_saves=[SavedGrantResponse.model_validate(g) for g in recent_saves]
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
    limit: int = Query(default=50, le=100, description="Maximum number of results")
):
    """Search saved grants"""
    try:
        current_user = get_current_user_simple()
        storage = get_session_storage()
        
        results = storage.search_saved_grants(query=q, limit=limit)
        
        return {
            "saved_grants": [SavedGrantResponse.model_validate(g) for g in results],
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
    saved_grant_id: int
):
    """Get a specific saved grant"""
    try:
        current_user = get_current_user_simple()
        storage = get_session_storage()
        
        saved_grant = storage.get_saved_grant_by_id(saved_grant_id)
        
        if not saved_grant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saved grant not found"
            )
        
        return SavedGrantResponse.model_validate(saved_grant)
    
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
    update_data: SavedGrantUpdate
):
    """Update a saved grant"""
    try:
        current_user = get_current_user_simple()
        storage = get_session_storage()
        
        # Filter out None values
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        
        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No update data provided"
            )
        
        updated_grant = storage.update_saved_grant(saved_grant_id, update_dict)
        
        if not updated_grant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saved grant not found"
            )
        
        logger.info(f"Saved grant {saved_grant_id} updated by user {current_user.id}")
        
        return SavedGrantResponse.model_validate(updated_grant)
    
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
    saved_grant_id: int
):
    """Toggle favorite status of a saved grant"""
    try:
        current_user = get_current_user_simple()
        storage = get_session_storage()
        
        updated_grant = storage.toggle_favorite(saved_grant_id)
        
        if not updated_grant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Saved grant not found"
            )
        
        logger.info(f"Favorite status toggled for grant {saved_grant_id} by user {current_user.id}")
        
        return SavedGrantResponse.model_validate(updated_grant)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling favorite: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to toggle favorite: {str(e)}"
        )


@router.delete("/{saved_grant_id}")
def delete_saved_grant(
    saved_grant_id: int
):
    """Permanently delete a saved grant"""
    try:
        current_user = get_current_user_simple()
        storage = get_session_storage()
        
        success = storage.delete_saved_grant(saved_grant_id)
        
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
    grant_id: str
):
    """Check if a grant is already saved"""
    try:
        current_user = get_current_user_simple()
        storage = get_session_storage()
        
        is_saved = storage.is_grant_saved(grant_id)
        
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
