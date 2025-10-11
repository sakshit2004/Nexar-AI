"""
Grant repository - data access for grants
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from datetime import datetime, date

from backend.models.grant import Grant, UserMatch, QueryUsage, GrantSummary
from backend.repositories.base import BaseRepository


class GrantRepository(BaseRepository[Grant]):
    """Grant-specific data access"""
    
    def __init__(self, db: Session):
        super().__init__(Grant, db)
    
    def get_active_grants(self, limit: int = 1000) -> List[Grant]:
        """Get grants with future close dates"""
        today = date.today()
        return (
            self.db.query(Grant)
            .filter(Grant.close_date >= today)
            .order_by(Grant.close_date.asc())
            .limit(limit)
            .all()
        )
    
    def get_by_agency(self, agency: str, limit: int = 100) -> List[Grant]:
        """Get grants by agency"""
        return (
            self.db.query(Grant)
            .filter(Grant.agency == agency)
            .order_by(Grant.close_date.desc())
            .limit(limit)
            .all()
        )
    
    def search_grants(
        self,
        query: Optional[str] = None,
        agency: Optional[str] = None,
        min_amount: Optional[int] = None,
        max_amount: Optional[int] = None,
        limit: int = 100
    ) -> List[Grant]:
        """Search grants with filters"""
        filters = []
        
        if query:
            filters.append(
                or_(
                    Grant.title.ilike(f"%{query}%"),
                    Grant.description.ilike(f"%{query}%")
                )
            )
        
        if agency:
            filters.append(Grant.agency == agency)
        
        if min_amount:
            filters.append(Grant.award_floor >= min_amount)
        
        if max_amount:
            filters.append(Grant.award_ceiling <= max_amount)
        
        query_obj = self.db.query(Grant)
        
        if filters:
            query_obj = query_obj.filter(and_(*filters))
        
        return query_obj.order_by(Grant.close_date.asc()).limit(limit).all()
    
    def upsert_grant(self, grant_data: dict) -> Grant:
        """Create or update grant"""
        grant = self.get(grant_data["id"])
        
        if grant:
            for key, value in grant_data.items():
                setattr(grant, key, value)
            grant.last_synced_at = datetime.utcnow()
        else:
            grant = Grant(**grant_data)
            self.db.add(grant)
        
        self.db.commit()
        self.db.refresh(grant)
        return grant
    
    def bulk_upsert_grants(self, grants_data: List[dict]) -> int:
        """Bulk insert/update grants"""
        count = 0
        for grant_data in grants_data:
            self.upsert_grant(grant_data)
            count += 1
        return count


class UserMatchRepository(BaseRepository[UserMatch]):
    """User match data access"""
    
    def __init__(self, db: Session):
        super().__init__(UserMatch, db)
    
    def get_user_matches(
        self,
        user_id: int,
        min_score: int = 0,
        limit: int = 100
    ) -> List[UserMatch]:
        """Get matches for user"""
        return (
            self.db.query(UserMatch)
            .filter(
                and_(
                    UserMatch.user_id == user_id,
                    UserMatch.score >= min_score
                )
            )
            .order_by(desc(UserMatch.score))
            .limit(limit)
            .all()
        )
    
    def get_match(self, user_id: int, grant_id: str) -> Optional[UserMatch]:
        """Get specific match"""
        return (
            self.db.query(UserMatch)
            .filter(
                and_(
                    UserMatch.user_id == user_id,
                    UserMatch.grant_id == grant_id
                )
            )
            .first()
        )
    
    def create_match(self, match_data: dict) -> UserMatch:
        """Create new match"""
        match = UserMatch(**match_data)
        self.db.add(match)
        self.db.commit()
        self.db.refresh(match)
        return match
    
    def increment_view_count(self, match_id: int) -> None:
        """Increment view count"""
        match = self.get(match_id)
        if match:
            match.viewed += 1
            self.db.commit()
    
    def toggle_save(self, match_id: int) -> bool:
        """Toggle save status"""
        match = self.get(match_id)
        if match:
            match.saved = 1 if match.saved == 0 else 0
            self.db.commit()
            return match.saved == 1
        return False


class QueryUsageRepository(BaseRepository[QueryUsage]):
    """Query usage tracking"""
    
    def __init__(self, db: Session):
        super().__init__(QueryUsage, db)
    
    def log_query(self, usage_data: dict) -> QueryUsage:
        """Log a query"""
        usage = QueryUsage(**usage_data)
        self.db.add(usage)
        self.db.commit()
        self.db.refresh(usage)
        return usage
    
    def get_user_query_count(
        self,
        user_id: int,
        since: datetime
    ) -> int:
        """Count queries since date"""
        return (
            self.db.query(QueryUsage)
            .filter(
                and_(
                    QueryUsage.user_id == user_id,
                    QueryUsage.created_at >= since
                )
            )
            .count()
        )


class GrantSummaryRepository(BaseRepository[GrantSummary]):
    """Grant summary caching"""
    
    def __init__(self, db: Session):
        super().__init__(GrantSummary, db)
    
    def get_by_grant_id(self, grant_id: str) -> Optional[GrantSummary]:
        """Get cached summary"""
        return (
            self.db.query(GrantSummary)
            .filter(GrantSummary.grant_id == grant_id)
            .first()
        )
    
    def upsert_summary(self, summary_data: dict) -> GrantSummary:
        """Create or update summary"""
        summary = self.get_by_grant_id(summary_data["grant_id"])
        
        if summary:
            for key, value in summary_data.items():
                setattr(summary, key, value)
            summary.generated_at = datetime.utcnow()
        else:
            summary = GrantSummary(**summary_data)
            self.db.add(summary)
        
        self.db.commit()
        self.db.refresh(summary)
        return summary

