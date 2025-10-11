"""Grant schemas"""
from pydantic import BaseModel, computed_field
from typing import Optional, List
from datetime import date


class GrantResponse(BaseModel):
    id: str
    title: str
    agency: str
    description: Optional[str]
    eligibility: Optional[str] = None
    cfda_number: Optional[str] = None
    opportunity_category: Optional[str] = None
    award_floor: Optional[int] = None
    award_ceiling: Optional[int] = None
    close_date: Optional[date] = None
    open_date: Optional[date] = None
    
    # Computed fields for frontend compatibility
    @computed_field
    @property
    def category(self) -> Optional[str]:
        return self.opportunity_category
    
    @computed_field
    @property
    def deadline(self) -> Optional[str]:
        return self.close_date.isoformat() if self.close_date else None
    
    @computed_field
    @property
    def posted_date(self) -> Optional[str]:
        return self.open_date.isoformat() if self.open_date else None
    
    @computed_field
    @property
    def award_amount(self) -> Optional[str]:
        if self.award_ceiling:
            return f"Up to ${self.award_ceiling:,}"
        if self.award_floor:
            return f"From ${self.award_floor:,}"
        return "Amount varies"
    
    @computed_field
    @property  
    def url(self) -> str:
        return f"https://grants.gov/search-results-detail/{self.id}"
    
    class Config:
        from_attributes = True


class GrantMatchResponse(BaseModel):
    grant_id: str
    title: str
    agency: str
    score: int
    reasoning: str
    match_factors: List[str]
    barriers: List[str]
    close_date: Optional[str]
    award_range: Optional[str]


class GrantSummaryResponse(BaseModel):
    purpose: str
    eligibility: List[str]
    requirements: List[str]
    deadline: Optional[str]
    red_flags: List[str]


class ChatRequest(BaseModel):
    question: str
    chat_history: Optional[List[dict]] = None

