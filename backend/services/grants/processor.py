"""
Grant processor - business logic for grant operations
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from backend.repositories.grant_repository import GrantRepository
from backend.services.grants.fetcher import GrantsFetcher
from backend.core.logging import get_logger


logger = get_logger(__name__)


class GrantProcessor:
    """Process and manage grants"""
    
    def __init__(self, db: Session):
        self.db = db
        self.grant_repo = GrantRepository(db)
        self.fetcher = GrantsFetcher()
    
    def sync_grants(self, source: str = "auto") -> Dict[str, int]:
        """
        Sync grants from external API
        
        Returns:
            Stats about the sync operation
        """
        logger.info(f"Starting grant sync (source={source})")
        
        # Fetch raw grants
        raw_grants = self.fetcher.fetch_grants(source=source)
        
        # Determine actual source used
        actual_source = "grants_gov" if not raw_grants else (
            "simpler" if "opportunity_id" in raw_grants[0] else "grants_gov"
        )
        
        # Normalize and upsert
        created = 0
        updated = 0
        errors = 0
        
        for raw_grant in raw_grants:
            try:
                normalized = self.fetcher.normalize_grant_data(raw_grant, actual_source)
                
                existing = self.grant_repo.get(normalized["id"])
                if existing:
                    self.grant_repo.upsert_grant(normalized)
                    updated += 1
                else:
                    self.grant_repo.upsert_grant(normalized)
                    created += 1
                    
            except Exception as e:
                logger.error(f"Failed to process grant: {e}")
                errors += 1
        
        stats = {
            "total_fetched": len(raw_grants),
            "created": created,
            "updated": updated,
            "errors": errors,
            "source": actual_source
        }
        
        logger.info(f"Grant sync complete: {stats}")
        return stats
    
    def get_active_grants(self, limit: int = 1000) -> List[Dict[str, Any]]:
        """Get active grants (close date in future)"""
        grants = self.grant_repo.get_active_grants(limit=limit)
        return [self._grant_to_dict(g) for g in grants]
    
    def search_grants(
        self,
        query: Optional[str] = None,
        agency: Optional[str] = None,
        min_amount: Optional[int] = None,
        max_amount: Optional[int] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Search grants with filters"""
        grants = self.grant_repo.search_grants(
            query=query,
            agency=agency,
            min_amount=min_amount,
            max_amount=max_amount,
            limit=limit
        )
        return [self._grant_to_dict(g) for g in grants]
    
    def get_grant_by_id(self, grant_id: str) -> Optional[Dict[str, Any]]:
        """Get single grant"""
        grant = self.grant_repo.get(grant_id)
        return self._grant_to_dict(grant) if grant else None
    
    def _grant_to_dict(self, grant) -> Dict[str, Any]:
        """Convert grant model to dict"""
        return {
            "id": grant.id,
            "title": grant.title,
            "agency": grant.agency,
            "description": grant.description,
            "eligibility": grant.eligibility,
            "cfda_number": grant.cfda_number,
            "opportunity_category": grant.opportunity_category,
            "funding_activity": grant.funding_activity,
            "award_floor": grant.award_floor,
            "award_ceiling": grant.award_ceiling,
            "open_date": grant.open_date.isoformat() if grant.open_date else None,
            "close_date": grant.close_date.isoformat() if grant.close_date else None,
            "full_text": grant.full_text,
            "source": grant.source,
            "last_synced_at": grant.last_synced_at.isoformat() if grant.last_synced_at else None
        }

