"""
Saved Grant model for user bookmarks
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from backend.models.database import Base


class SavedGrant(Base):
    """User's saved/bookmarked grants"""
    __tablename__ = "saved_grants"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Grant information (stored as JSON for flexibility)
    grant_id = Column(String(255), nullable=False, index=True)  # External grant ID
    grant_title = Column(String(500), nullable=False)
    grant_agency = Column(String(255), nullable=True)
    grant_description = Column(Text, nullable=True)
    grant_eligibility = Column(Text, nullable=True)
    grant_cfda_number = Column(String(50), nullable=True)
    grant_category = Column(String(100), nullable=True)
    grant_award_floor = Column(Integer, nullable=True)
    grant_award_ceiling = Column(Integer, nullable=True)
    grant_close_date = Column(String(50), nullable=True)  # Store as string for flexibility
    grant_open_date = Column(String(50), nullable=True)
    grant_url = Column(String(500), nullable=True)
    
    # User's notes and tags
    user_notes = Column(Text, nullable=True)
    user_tags = Column(JSON, nullable=True)  # List of user-defined tags
    
    # Metadata
    is_favorite = Column(Boolean, default=False, nullable=False)
    is_archived = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Relationship
    user = relationship("User", back_populates="saved_grants")
    
    def __repr__(self):
        return f"<SavedGrant(id={self.id}, user_id={self.user_id}, grant_title={self.grant_title[:50]}...)>"
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "grant_id": self.grant_id,
            "title": self.grant_title,
            "agency": self.grant_agency,
            "description": self.grant_description,
            "eligibility": self.grant_eligibility,
            "cfda_number": self.grant_cfda_number,
            "category": self.grant_category,
            "award_floor": self.grant_award_floor,
            "award_ceiling": self.grant_award_ceiling,
            "close_date": self.grant_close_date,
            "open_date": self.grant_open_date,
            "url": self.grant_url,
            "user_notes": self.user_notes,
            "user_tags": self.user_tags or [],
            "is_favorite": self.is_favorite,
            "is_archived": self.is_archived,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
