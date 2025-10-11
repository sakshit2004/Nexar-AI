"""
Grant data fetcher - pulls from Grants.gov APIs
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, date
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from backend.core.config import settings
from backend.core.logging import get_logger
from backend.core.exceptions import ExternalAPIException


logger = get_logger(__name__)


class GrantsFetcher:
    """Fetch grants from external APIs with retry logic"""
    
    def __init__(self):
        self.session = self._create_session()
    
    def _create_session(self) -> requests.Session:
        """Create requests session with retry logic"""
        session = requests.Session()
        
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET"]
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        return session
    
    def fetch_from_grants_gov(self, rows: int = 1000) -> List[Dict[str, Any]]:
        """Fetch from Grants.gov API"""
        logger.info(f"Fetching grants from Grants.gov (rows={rows})")
        
        url = f"{settings.GRANTS_GOV_BASE_URL}/search/"
        params = {
            "rows": rows,
            "sortBy": "closeDate|ASC",
            "status": "forecasted|posted"
        }
        
        headers = {}
        if settings.GRANTS_GOV_API_KEY:
            headers["Authorization"] = f"Bearer {settings.GRANTS_GOV_API_KEY}"
        
        try:
            response = self.session.get(url, params=params, headers=headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            hits = data.get("opportunityHits", [])
            
            logger.info(f"Retrieved {len(hits)} grants from Grants.gov")
            return hits
            
        except Exception as e:
            logger.error(f"Failed to fetch from Grants.gov: {e}")
            raise ExternalAPIException(f"Grants.gov API error: {e}")
    
    def fetch_from_simpler_grants(self, limit: int = 1000) -> List[Dict[str, Any]]:
        """Fetch from Simpler.Grants.gov API"""
        if not settings.SIMPLER_GRANTS_API_KEY:
            logger.warning("Simpler.Grants.gov API key not configured")
            return []
        
        logger.info(f"Fetching grants from Simpler.Grants.gov (limit={limit})")
        
        url = f"{settings.SIMPLER_GRANTS_BASE_URL}/opportunities"
        headers = {"X-Api-Key": settings.SIMPLER_GRANTS_API_KEY}
        params = {"limit": limit}
        
        try:
            response = self.session.get(url, headers=headers, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            opportunities = data.get("data", [])
            
            logger.info(f"Retrieved {len(opportunities)} grants from Simpler.Grants.gov")
            return opportunities
            
        except Exception as e:
            logger.error(f"Failed to fetch from Simpler.Grants.gov: {e}")
            raise ExternalAPIException(f"Simpler.Grants.gov API error: {e}")
    
    def fetch_grants(self, source: str = "auto") -> List[Dict[str, Any]]:
        """
        Fetch grants from configured source
        
        Args:
            source: 'grants_gov', 'simpler', or 'auto' (try simpler first, fallback to grants_gov)
        """
        if source == "simpler":
            return self.fetch_from_simpler_grants()
        
        if source == "grants_gov":
            return self.fetch_from_grants_gov()
        
        # Auto: try simpler first
        if settings.SIMPLER_GRANTS_API_KEY:
            try:
                return self.fetch_from_simpler_grants()
            except ExternalAPIException:
                logger.warning("Simpler.Grants.gov failed, falling back to Grants.gov")
        
        return self.fetch_from_grants_gov()
    
    def normalize_grant_data(self, raw_grant: Dict[str, Any], source: str) -> Dict[str, Any]:
        """Normalize grant data from different sources"""
        if source == "grants_gov":
            return self._normalize_grants_gov(raw_grant)
        elif source == "simpler":
            return self._normalize_simpler_grants(raw_grant)
        else:
            raise ValueError(f"Unknown source: {source}")
    
    def _normalize_grants_gov(self, grant: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize Grants.gov format"""
        return {
            "id": grant.get("opportunityId"),
            "title": grant.get("opportunityTitle", ""),
            "agency": grant.get("agency", ""),
            "description": grant.get("description", ""),
            "eligibility": grant.get("eligibility", ""),
            "cfda_number": grant.get("cfda"),
            "opportunity_category": grant.get("opportunityCategory"),
            "funding_activity": grant.get("categoryOfFundingActivity"),
            "award_floor": grant.get("awardFloor"),
            "award_ceiling": grant.get("awardCeiling"),
            "open_date": self._parse_date(grant.get("openDate")),
            "close_date": self._parse_date(grant.get("closeDate")),
            "full_text": self._build_full_text(grant),
            "source": "grants_gov",
            "last_synced_at": datetime.utcnow()
        }
    
    def _normalize_simpler_grants(self, grant: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize Simpler.Grants.gov format"""
        # Adjust based on actual API response structure
        return {
            "id": grant.get("opportunity_id"),
            "title": grant.get("opportunity_title", ""),
            "agency": grant.get("agency_name", ""),
            "description": grant.get("summary_description", ""),
            "eligibility": grant.get("applicant_eligibility_description", ""),
            "cfda_number": grant.get("assistance_listing_number"),
            "opportunity_category": grant.get("opportunity_category"),
            "funding_activity": grant.get("category_of_funding_activity"),
            "award_floor": grant.get("award_floor"),
            "award_ceiling": grant.get("award_ceiling"),
            "open_date": self._parse_date(grant.get("posted_date")),
            "close_date": self._parse_date(grant.get("close_date")),
            "full_text": self._build_full_text(grant),
            "source": "simpler",
            "last_synced_at": datetime.utcnow()
        }
    
    def _parse_date(self, date_str: Optional[str]) -> Optional[date]:
        """Parse date string to date object"""
        if not date_str:
            return None
        
        try:
            # Try common formats
            for fmt in ["%Y-%m-%d", "%m/%d/%Y", "%Y-%m-%dT%H:%M:%S"]:
                try:
                    return datetime.strptime(date_str[:10], fmt).date()
                except ValueError:
                    continue
            return None
        except Exception:
            return None
    
    def _build_full_text(self, grant: Dict[str, Any]) -> str:
        """Build searchable full text from grant data"""
        parts = []
        
        for key in ["opportunityTitle", "opportunity_title", "title"]:
            if grant.get(key):
                parts.append(grant[key])
                break
        
        for key in ["description", "summary_description"]:
            if grant.get(key):
                parts.append(grant[key])
                break
        
        for key in ["eligibility", "applicant_eligibility_description"]:
            if grant.get(key):
                parts.append(grant[key])
                break
        
        return "\n\n".join(parts)

