"""Saved Grant repository for database operations"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from typing import List, Optional, Dict, Any
from datetime import datetime

from backend.models.saved_grant import SavedGrant
from backend.repositories.base import BaseRepository


class SavedGrantRepository(BaseRepository[SavedGrant]):
    """Repository for saved grant operations"""
    
    def __init__(self, db: Session):
        super().__init__(SavedGrant, db)
    
    def save_grant(
        self, 
        user_id: int, 
        grant_data: Dict[str, Any]
    ) -> SavedGrant:
        """Save a grant for a user"""
        # Check if grant is already saved by this user
        existing = self.db.query(SavedGrant).filter(
            and_(
                SavedGrant.user_id == user_id,
                SavedGrant.grant_id == grant_data["grant_id"]
            )
        ).first()
        
        if existing:
            # Update existing saved grant
            for key, value in grant_data.items():
                if hasattr(existing, key) and value is not None:
                    setattr(existing, key, value)
            existing.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(existing)
            return existing
        
        # Create new saved grant
        saved_grant = SavedGrant(
            user_id=user_id,
            **grant_data
        )
        self.db.add(saved_grant)
        self.db.commit()
        self.db.refresh(saved_grant)
        return saved_grant
    
    def get_user_saved_grants(
        self, 
        user_id: int, 
        include_archived: bool = False,
        favorites_only: bool = False,
        limit: int = 50,
        offset: int = 0
    ) -> List[SavedGrant]:
        """Get saved grants for a user"""
        query = self.db.query(SavedGrant).filter(SavedGrant.user_id == user_id)
        
        if not include_archived:
            query = query.filter(SavedGrant.is_archived == False)
        
        if favorites_only:
            query = query.filter(SavedGrant.is_favorite == True)
        
        return query.order_by(desc(SavedGrant.created_at)).offset(offset).limit(limit).all()
    
    def get_saved_grant_by_id(self, saved_grant_id: int, user_id: int) -> Optional[SavedGrant]:
        """Get a specific saved grant by ID for a user"""
        return self.db.query(SavedGrant).filter(
            and_(
                SavedGrant.id == saved_grant_id,
                SavedGrant.user_id == user_id
            )
        ).first()
    
    def update_saved_grant(
        self, 
        saved_grant_id: int, 
        user_id: int, 
        update_data: Dict[str, Any]
    ) -> Optional[SavedGrant]:
        """Update a saved grant"""
        saved_grant = self.get_saved_grant_by_id(saved_grant_id, user_id)
        if not saved_grant:
            return None
        
        for key, value in update_data.items():
            if hasattr(saved_grant, key) and value is not None:
                setattr(saved_grant, key, value)
        
        saved_grant.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(saved_grant)
        return saved_grant
    
    def delete_saved_grant(self, saved_grant_id: int, user_id: int) -> bool:
        """Delete a saved grant"""
        saved_grant = self.get_saved_grant_by_id(saved_grant_id, user_id)
        if not saved_grant:
            return False
        
        self.db.delete(saved_grant)
        self.db.commit()
        return True
    
    def archive_saved_grant(self, saved_grant_id: int, user_id: int) -> bool:
        """Archive a saved grant (soft delete)"""
        saved_grant = self.get_saved_grant_by_id(saved_grant_id, user_id)
        if not saved_grant:
            return False
        
        saved_grant.is_archived = True
        saved_grant.updated_at = datetime.utcnow()
        self.db.commit()
        return True
    
    def toggle_favorite(self, saved_grant_id: int, user_id: int) -> Optional[SavedGrant]:
        """Toggle favorite status of a saved grant"""
        saved_grant = self.get_saved_grant_by_id(saved_grant_id, user_id)
        if not saved_grant:
            return None
        
        saved_grant.is_favorite = not saved_grant.is_favorite
        saved_grant.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(saved_grant)
        return saved_grant
    
    def get_user_stats(self, user_id: int) -> Dict[str, Any]:
        """Get statistics for user's saved grants"""
        # Total saved grants
        total_saved = self.db.query(SavedGrant).filter(
            and_(
                SavedGrant.user_id == user_id,
                SavedGrant.is_archived == False
            )
        ).count()
        
        # Favorites count
        favorites = self.db.query(SavedGrant).filter(
            and_(
                SavedGrant.user_id == user_id,
                SavedGrant.is_favorite == True,
                SavedGrant.is_archived == False
            )
        ).count()
        
        # Archived count
        archived = self.db.query(SavedGrant).filter(
            and_(
                SavedGrant.user_id == user_id,
                SavedGrant.is_archived == True
            )
        ).count()
        
        # Category breakdown
        category_stats = self.db.query(
            SavedGrant.grant_category,
            func.count(SavedGrant.id).label('count')
        ).filter(
            and_(
                SavedGrant.user_id == user_id,
                SavedGrant.is_archived == False,
                SavedGrant.grant_category.isnot(None)
            )
        ).group_by(SavedGrant.grant_category).all()
        
        # Agency breakdown
        agency_stats = self.db.query(
            SavedGrant.grant_agency,
            func.count(SavedGrant.id).label('count')
        ).filter(
            and_(
                SavedGrant.user_id == user_id,
                SavedGrant.is_archived == False,
                SavedGrant.grant_agency.isnot(None)
            )
        ).group_by(SavedGrant.grant_agency).all()
        
        return {
            "total_saved": total_saved,
            "favorites": favorites,
            "archived": archived,
            "by_category": {cat: count for cat, count in category_stats},
            "by_agency": {agency: count for agency, count in agency_stats}
        }
    
    def search_saved_grants(
        self, 
        user_id: int, 
        query: str,
        include_archived: bool = False,
        limit: int = 50
    ) -> List[SavedGrant]:
        """Search saved grants by title, description, or tags"""
        search_filter = and_(
            SavedGrant.user_id == user_id,
            or_(
                SavedGrant.grant_title.ilike(f"%{query}%"),
                SavedGrant.grant_description.ilike(f"%{query}%"),
                SavedGrant.grant_agency.ilike(f"%{query}%"),
                SavedGrant.user_notes.ilike(f"%{query}%")
            )
        )
        
        if not include_archived:
            search_filter = and_(search_filter, SavedGrant.is_archived == False)
        
        return self.db.query(SavedGrant).filter(search_filter).order_by(
            desc(SavedGrant.created_at)
        ).limit(limit).all()
    
    def is_grant_saved(self, user_id: int, grant_id: str) -> bool:
        """Check if a grant is already saved by the user"""
        return self.db.query(SavedGrant).filter(
            and_(
                SavedGrant.user_id == user_id,
                SavedGrant.grant_id == grant_id,
                SavedGrant.is_archived == False
            )
        ).first() is not None
