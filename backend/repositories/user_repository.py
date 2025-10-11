"""
User repository - data access for users
"""
from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime

from backend.models.user import User, UserTier
from backend.models.grant import UserProfile
from backend.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    """User-specific data access"""
    
    def __init__(self, db: Session):
        super().__init__(User, db)
    
    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()
    
    def get_by_stripe_customer_id(self, customer_id: str) -> Optional[User]:
        """Get user by Stripe customer ID"""
        return self.db.query(User).filter(User.stripe_customer_id == customer_id).first()
    
    def create_user(
        self,
        email: str,
        hashed_password: str,
        full_name: Optional[str] = None
    ) -> User:
        """Create new user"""
        user = User(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            tier=UserTier.FREE,
            is_active=True,
            is_verified=False
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def update_tier(self, user_id: int, tier: UserTier) -> Optional[User]:
        """Update user tier"""
        user = self.get(user_id)
        if user:
            user.tier = tier
            self.db.commit()
            self.db.refresh(user)
        return user
    
    def update_last_login(self, user_id: int) -> None:
        """Update last login timestamp"""
        user = self.get(user_id)
        if user:
            user.last_login_at = datetime.utcnow()
            self.db.commit()
    
    def verify_email(self, user_id: int) -> Optional[User]:
        """Mark email as verified"""
        user = self.get(user_id)
        if user:
            user.is_verified = True
            self.db.commit()
            self.db.refresh(user)
        return user


class UserProfileRepository(BaseRepository[UserProfile]):
    """User profile data access"""
    
    def __init__(self, db: Session):
        super().__init__(UserProfile, db)
    
    def get_by_user_id(self, user_id: int) -> Optional[UserProfile]:
        """Get profile by user ID"""
        return self.db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    
    def upsert_profile(self, user_id: int, profile_data: dict) -> UserProfile:
        """Create or update user profile"""
        profile = self.get_by_user_id(user_id)
        
        if profile:
            for key, value in profile_data.items():
                setattr(profile, key, value)
        else:
            profile = UserProfile(user_id=user_id, **profile_data)
            self.db.add(profile)
        
        self.db.commit()
        self.db.refresh(profile)
        return profile

