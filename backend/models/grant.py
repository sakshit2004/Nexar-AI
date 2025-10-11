"""
Grant-related models
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, Date, JSON, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from backend.models.database import Base


class Grant(Base):
    __tablename__ = "grants"
    
    id = Column(String(255), primary_key=True)  # opportunity_id from Grants.gov
    title = Column(String(500), nullable=False, index=True)
    agency = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    eligibility = Column(Text, nullable=True)
    
    cfda_number = Column(String(50), nullable=True, index=True)
    opportunity_category = Column(String(100), nullable=True)
    funding_activity = Column(String(255), nullable=True)
    
    award_floor = Column(Integer, nullable=True)
    award_ceiling = Column(Integer, nullable=True)
    
    open_date = Column(Date, nullable=True)
    close_date = Column(Date, nullable=False, index=True)
    
    # Cached full text for LLM
    full_text = Column(Text, nullable=True)
    
    # Metadata
    source = Column(String(50), default="grants_gov", nullable=False)
    last_synced_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    __table_args__ = (
        Index("idx_grant_close_date_agency", "close_date", "agency"),
    )


class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    organization_type = Column(String(100), nullable=True)
    focus_areas = Column(JSON, nullable=True)  # Array of strings
    location_state = Column(String(50), nullable=True)
    location_county = Column(String(100), nullable=True)
    grant_amount_min = Column(Integer, nullable=True)
    grant_amount_max = Column(Integer, nullable=True)
    keywords = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    user = relationship("User", backref="profile")


class UserMatch(Base):
    __tablename__ = "user_matches"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    grant_id = Column(String(255), ForeignKey("grants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    score = Column(Integer, nullable=False)  # 1-100
    reasoning = Column(Text, nullable=True)
    match_factors = Column(JSON, nullable=True)  # Array of strings
    barriers = Column(JSON, nullable=True)  # Array of strings
    
    viewed = Column(Integer, default=0, nullable=False)  # View count
    saved = Column(Integer, default=0, nullable=False)  # 1 if saved
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    grant = relationship("Grant")
    user = relationship("User", backref="matches")
    
    __table_args__ = (
        Index("idx_user_match_score", "user_id", "score"),
    )


class QueryUsage(Base):
    __tablename__ = "query_usage"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    query_type = Column(String(50), nullable=False)  # 'match', 'summary', 'chat'
    grant_id = Column(String(255), nullable=True)
    query_text = Column(Text, nullable=True)
    
    tokens_used = Column(Integer, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    user = relationship("User", backref="queries")
    
    __table_args__ = (
        Index("idx_user_query_date", "user_id", "created_at"),
    )


class GrantSummary(Base):
    __tablename__ = "grant_summaries"
    
    id = Column(Integer, primary_key=True, index=True)
    grant_id = Column(String(255), ForeignKey("grants.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    
    summary_text = Column(Text, nullable=False)
    purpose = Column(Text, nullable=True)
    eligibility_bullets = Column(JSON, nullable=True)
    requirements_bullets = Column(JSON, nullable=True)
    red_flags = Column(JSON, nullable=True)
    
    generated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    grant = relationship("Grant", backref="summary")

