"""Profile schemas"""
from pydantic import BaseModel, EmailStr
from typing import List, Optional


class ProfileCreate(BaseModel):
    full_name: Optional[str] = None
    organization_name: Optional[str] = None
    organization_type: Optional[str] = None
    focus_areas: Optional[List[str]] = []
    location_state: Optional[str] = None
    location_county: Optional[str] = None
    grant_amount_min: Optional[int] = None
    grant_amount_max: Optional[int] = None
    keywords: Optional[List[str]] = []


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    email: EmailStr
    full_name: str
    subscription_tier: str
    organization_name: Optional[str] = None
    organization_type: Optional[str] = None
    focus_areas: List[str] = []
    location_state: Optional[str] = None
    location_county: Optional[str] = None
    grant_amount_min: Optional[int] = None
    grant_amount_max: Optional[int] = None
    keywords: Optional[List[str]] = []
    
    class Config:
        from_attributes = True

