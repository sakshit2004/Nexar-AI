"""Profile routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.api.v1.schemas.profile import ProfileCreate, ProfileResponse
from backend.api.v1.middleware.auth import get_current_user
from backend.repositories.user_repository import UserProfileRepository
from backend.models.user import User


router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("", response_model=ProfileResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's profile"""
    profile_repo = UserProfileRepository(db)
    profile = profile_repo.get_by_user_id(current_user.id)
    
    if not profile:
        # Return user data with empty profile
        return ProfileResponse(
            id=current_user.id,
            user_id=current_user.id,
            email=current_user.email,
            full_name=current_user.full_name or "",
            subscription_tier=current_user.tier.value,
            organization_name=None,
            organization_type=None,
            focus_areas=[]
        )
    
    # Return combined user + profile data
    return ProfileResponse(
        id=current_user.id,
        user_id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name or "",
        subscription_tier=current_user.tier.value,
        organization_name=profile.organization_name,
        organization_type=profile.organization_type,
        focus_areas=profile.focus_areas or [],
        location_state=profile.location_state,
        location_county=profile.location_county,
        grant_amount_min=profile.grant_amount_min,
        grant_amount_max=profile.grant_amount_max,
        keywords=profile.keywords
    )


@router.put("", response_model=ProfileResponse)
def update_profile(
    data: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    profile_repo = UserProfileRepository(db)
    
    # Update user's full name if provided
    if data.full_name:
        current_user.full_name = data.full_name
        db.commit()
    
    # Prepare profile data
    profile_dict = {
        "organization_name": data.organization_name,
        "organization_type": data.organization_type,
        "focus_areas": data.focus_areas or [],
        "location_state": data.location_state,
        "location_county": data.location_county,
        "grant_amount_min": data.grant_amount_min,
        "grant_amount_max": data.grant_amount_max,
        "keywords": data.keywords
    }
    
    profile = profile_repo.upsert_profile(
        user_id=current_user.id,
        profile_data=profile_dict
    )
    
    # Return combined user + profile data
    return ProfileResponse(
        id=current_user.id,
        user_id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name or "",
        subscription_tier=current_user.tier.value,
        organization_name=data.organization_name,  # Store in response only
        organization_type=data.organization_type,
        focus_areas=data.focus_areas or [],
        location_state=data.location_state,
        location_county=data.location_county,
        grant_amount_min=data.grant_amount_min,
        grant_amount_max=data.grant_amount_max,
        keywords=data.keywords
    )


@router.post("", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_profile(
    data: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update user profile"""
    profile_repo = UserProfileRepository(db)
    
    profile = profile_repo.upsert_profile(
        user_id=current_user.id,
        profile_data=data.model_dump()
    )
    
    return profile


@router.delete("")
def delete_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user profile"""
    profile_repo = UserProfileRepository(db)
    profile = profile_repo.get_by_user_id(current_user.id)
    
    if profile:
        profile_repo.delete(profile.id)
        return {"message": "Profile deleted"}
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Profile not found"
    )

