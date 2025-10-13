"""
User model
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum as SQLEnum, ForeignKey, JSON, Text
from sqlalchemy.sql import func
from datetime import datetime
import enum

from backend.models.database import Base


class UserTier(str, enum.Enum):
    FREE = "free"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    
    tier = Column(SQLEnum(UserTier), default=UserTier.FREE, nullable=False)
    
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    stripe_customer_id = Column(String(255), nullable=True, unique=True)
    stripe_subscription_id = Column(String(255), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, tier={self.tier})>"


class UserProfile(Base):
    """User profile for personalized grant matching"""
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Organization details
    organization_name = Column(String(255), nullable=True)
    organization_type = Column(String(100), nullable=True)  # Nonprofit, University, Government, etc.
    
    # Focus areas for grant matching
    focus_areas = Column(JSON, nullable=True)  # List of focus areas
    
    # Location
    location_city = Column(String(100), nullable=True)
    location_state = Column(String(50), nullable=True)
    location_county = Column(String(100), nullable=True)
    location_zip = Column(String(20), nullable=True)
    
    # Grant preferences
    grant_amount_min = Column(Integer, nullable=True)
    grant_amount_max = Column(Integer, nullable=True)
    
    # Additional context for AI matching
    keywords = Column(JSON, nullable=True)  # List of keywords
    description = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    def __repr__(self):
        return f"<UserProfile(user_id={self.user_id}, org={self.organization_name})>"

