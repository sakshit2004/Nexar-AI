"""
In-memory session storage for saved grants
No database persistence - data is lost when server restarts
"""
from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid


class SessionStorage:
    """Simple in-memory storage for saved grants and discovered grants per session"""
    
    def __init__(self):
        # Store saved grants by session_id (could use request session ID)
        # For simplicity, we'll use a single global session for now
        self._storage: Dict[str, Dict[str, Any]] = {}
        # Discovered grants from web search (session_id -> grant_id -> grant_dict)
        self._discovered_grants: Dict[str, Dict[str, Dict[str, Any]]] = {}
        self._global_session_id = "default_session"
    
    def get_session_id(self) -> str:
        """Get the current session ID (hardcoded for now)"""
        return self._global_session_id
    
    def save_grant(self, grant_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save a grant to the session. Reads grant_* keys from API and stores same format as grant detail page."""
        session_id = self.get_session_id()
        
        if session_id not in self._storage:
            self._storage[session_id] = {}
        
        grant_id = grant_data.get("grant_id", str(uuid.uuid4()))
        
        # Check if already saved
        if grant_id in self._storage[session_id]:
            raise ValueError("Grant is already saved")
        
        # Map from API grant_* keys to stored shape (same as grant detail page display)
        close_date = grant_data.get("grant_close_date") or grant_data.get("close_date") or ""
        award_floor = grant_data.get("grant_award_floor")
        award_ceiling = grant_data.get("grant_award_ceiling")
        award_amount = grant_data.get("grant_award_amount") or grant_data.get("award_amount")
        if not award_amount and (award_floor is not None or award_ceiling is not None):
            if award_floor is not None and award_ceiling is not None:
                award_amount = f"${award_floor:,} - ${award_ceiling:,}"
            elif award_ceiling is not None:
                award_amount = f"Up to ${award_ceiling:,}"
            elif award_floor is not None:
                award_amount = f"From ${award_floor:,}"
        
        now = datetime.utcnow().isoformat()
        saved_grant = {
            "id": len(self._storage[session_id]) + 1,
            "grant_id": grant_id,
            "title": grant_data.get("grant_title") or grant_data.get("title", ""),
            "agency": grant_data.get("grant_agency") or grant_data.get("agency", ""),
            "description": grant_data.get("grant_description") or grant_data.get("description", ""),
            "eligibility": grant_data.get("grant_eligibility") or grant_data.get("eligibility", ""),
            "cfda_number": grant_data.get("grant_cfda_number") or grant_data.get("opportunity_number", ""),
            "category": grant_data.get("grant_category") or grant_data.get("category", ""),
            "award_floor": award_floor,
            "award_ceiling": award_ceiling,
            "award_amount": award_amount or "",
            "close_date": close_date,
            "deadline": close_date,
            "open_date": grant_data.get("grant_open_date") or grant_data.get("open_date", ""),
            "url": grant_data.get("grant_url") or grant_data.get("url", ""),
            "user_notes": grant_data.get("user_notes") or grant_data.get("notes", ""),
            "user_tags": grant_data.get("user_tags") or [],
            "is_favorite": grant_data.get("is_favorite", False),
            "created_at": now,
            "updated_at": now,
        }
        
        self._storage[session_id][grant_id] = saved_grant
        return saved_grant
    
    def get_saved_grants(
        self,
        favorites_only: bool = False,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get saved grants for the session"""
        session_id = self.get_session_id()
        
        if session_id not in self._storage:
            return []
        
        grants = list(self._storage[session_id].values())
        
        # Filter by favorites
        if favorites_only:
            grants = [g for g in grants if g.get("is_favorite", False)]
        
        # Sort by created_at (most recent first)
        grants.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        # Apply pagination
        return grants[offset:offset + limit]
    
    def get_saved_grant_by_id(self, saved_grant_id: int) -> Optional[Dict[str, Any]]:
        """Get a specific saved grant by ID"""
        session_id = self.get_session_id()
        
        if session_id not in self._storage:
            return None
        
        for grant in self._storage[session_id].values():
            if grant["id"] == saved_grant_id:
                return grant
        
        return None
    
    def is_grant_saved(self, grant_id: str) -> bool:
        """Check if a grant is already saved"""
        session_id = self.get_session_id()
        
        if session_id not in self._storage:
            return False
        
        return grant_id in self._storage[session_id]
    
    def update_saved_grant(self, saved_grant_id: int, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a saved grant"""
        session_id = self.get_session_id()
        
        if session_id not in self._storage:
            return None
        
        # Find the grant by ID
        grant_to_update = None
        grant_id_key = None
        
        for grant_id, grant in self._storage[session_id].items():
            if grant["id"] == saved_grant_id:
                grant_to_update = grant
                grant_id_key = grant_id
                break
        
        if not grant_to_update:
            return None
        
        # Update fields (avoid overwriting id, grant_id, created_at)
        for key, value in update_data.items():
            if key not in ("id", "grant_id", "created_at"):
                grant_to_update[key] = value
        grant_to_update["updated_at"] = datetime.utcnow().isoformat()
        
        return grant_to_update
    
    def toggle_favorite(self, saved_grant_id: int) -> Optional[Dict[str, Any]]:
        """Toggle favorite status"""
        grant = self.get_saved_grant_by_id(saved_grant_id)
        if not grant:
            return None
        
        grant["is_favorite"] = not grant.get("is_favorite", False)
        grant["updated_at"] = datetime.utcnow().isoformat()
        return grant
    
    def delete_saved_grant(self, saved_grant_id: int) -> bool:
        """Permanently delete a saved grant"""
        session_id = self.get_session_id()
        
        if session_id not in self._storage:
            return False
        
        # Find and remove
        grant_id_to_remove = None
        for grant_id, grant in self._storage[session_id].items():
            if grant["id"] == saved_grant_id:
                grant_id_to_remove = grant_id
                break
        
        if grant_id_to_remove:
            del self._storage[session_id][grant_id_to_remove]
            return True
        
        return False
    
    def search_saved_grants(
        self,
        query: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Search saved grants by query"""
        grants = self.get_saved_grants(limit=1000)
        
        query_lower = query.lower()
        results = []
        
        for grant in grants:
            # Simple text search in title, description, agency, category
            if (query_lower in grant.get("title", "").lower() or
                query_lower in grant.get("description", "").lower() or
                query_lower in grant.get("agency", "").lower() or
                query_lower in grant.get("category", "").lower()):
                results.append(grant)
        
        return results[:limit]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics for saved grants"""
        grants = list(self.get_saved_grants(limit=1000))
        
        total = len(grants)
        favorites = len([g for g in grants if g.get("is_favorite", False)])
        
        # Count by category
        by_category: Dict[str, int] = {}
        for grant in grants:
            category = grant.get("category", "Uncategorized")
            by_category[category] = by_category.get(category, 0) + 1
        
        # Count by agency
        by_agency: Dict[str, int] = {}
        for grant in grants:
            agency = grant.get("agency", "Unknown")
            by_agency[agency] = by_agency.get(agency, 0) + 1
        
        return {
            "total_saved": total,
            "favorites": favorites,
            "by_category": by_category,
            "by_agency": by_agency
        }

    # --- Discovered grants (from web search → LLM extraction) ---

    def set_discovered_grants(self, grants: List[Dict[str, Any]]) -> None:
        """Store discovered grants for the session (merge by id)."""
        session_id = self.get_session_id()
        if session_id not in self._discovered_grants:
            self._discovered_grants[session_id] = {}
        for g in grants:
            gid = g.get("id")
            if gid:
                self._discovered_grants[session_id][gid] = dict(g)

    def get_discovered_grant(self, grant_id: str) -> Optional[Dict[str, Any]]:
        """Get a single discovered grant by id."""
        session_id = self.get_session_id()
        if session_id not in self._discovered_grants:
            return None
        return self._discovered_grants[session_id].get(grant_id)

    def set_discovered_grant(self, grant: Dict[str, Any]) -> None:
        """Store one discovered grant (e.g. from get-by-id fetch)."""
        session_id = self.get_session_id()
        if session_id not in self._discovered_grants:
            self._discovered_grants[session_id] = {}
        gid = grant.get("id")
        if gid:
            self._discovered_grants[session_id][gid] = dict(grant)


# Global singleton instance
_session_storage = SessionStorage()


def get_session_storage() -> SessionStorage:
    """Get the global session storage instance"""
    return _session_storage

