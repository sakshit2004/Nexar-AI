"""Saved Grant schemas"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class SavedGrantCreate(BaseModel):
    """Schema for creating a saved grant"""
    grant_id: str = Field(..., description="External grant ID")
    grant_title: str = Field(..., description="Grant title")
    grant_agency: Optional[str] = Field(None, description="Granting agency")
    grant_award_amount: Optional[str] = Field(None, description="Display award amount string as shown on grant page")
    grant_description: Optional[str] = Field(None, description="Grant description")
    grant_eligibility: Optional[str] = Field(None, description="Eligibility requirements")
    grant_cfda_number: Optional[str] = Field(None, description="CFDA number")
    grant_category: Optional[str] = Field(None, description="Grant category")
    grant_award_floor: Optional[int] = Field(None, description="Minimum award amount")
    grant_award_ceiling: Optional[int] = Field(None, description="Maximum award amount")
    grant_close_date: Optional[str] = Field(None, description="Application deadline")
    grant_open_date: Optional[str] = Field(None, description="Application open date")
    grant_url: Optional[str] = Field(None, description="Grant URL")
    user_notes: Optional[str] = Field(None, description="User's personal notes")
    user_tags: Optional[List[str]] = Field(default=[], description="User-defined tags")
    is_favorite: bool = Field(default=False, description="Mark as favorite")


class SavedGrantUpdate(BaseModel):
    """Schema for updating a saved grant"""
    user_notes: Optional[str] = Field(None, description="User's personal notes")
    user_tags: Optional[List[str]] = Field(None, description="User-defined tags")
    is_favorite: Optional[bool] = Field(None, description="Mark as favorite")
    is_archived: Optional[bool] = Field(None, description="Archive status")


class SavedGrantResponse(BaseModel):
    """Schema for saved grant responses - same field names as grant detail page for consistent display"""
    id: int
    grant_id: str
    title: str
    agency: Optional[str] = None
    description: Optional[str] = None
    eligibility: Optional[str] = None
    cfda_number: Optional[str] = None
    category: Optional[str] = None
    award_floor: Optional[int] = None
    award_ceiling: Optional[int] = None
    award_amount: Optional[str] = None  # Display string as on grant page (e.g. "$50,000 - $500,000")
    close_date: Optional[str] = None
    deadline: Optional[str] = None  # Same as close_date, for same display format as grant page
    open_date: Optional[str] = None
    url: Optional[str] = None
    user_notes: Optional[str] = None
    user_tags: List[str] = []
    is_favorite: bool = False
    is_archived: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


class SavedGrantListResponse(BaseModel):
    """Schema for listing saved grants"""
    saved_grants: List[SavedGrantResponse]
    total_count: int
    favorites_count: int
    archived_count: int


class SavedGrantStatsResponse(BaseModel):
    """Schema for saved grants statistics"""
    total_saved: int
    favorites: int
    archived: int
    by_category: dict
    by_agency: dict
    recent_saves: List[SavedGrantResponse]
