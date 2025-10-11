"""
Grant matching service using LLM
"""
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from backend.services.llm.client import LLMClient
from backend.services.llm.prompts import get_match_prompt, get_summary_prompt, get_chat_prompt, get_checklist_prompt
from backend.repositories.grant_repository import GrantRepository, UserMatchRepository, GrantSummaryRepository
from backend.repositories.user_repository import UserProfileRepository
from backend.core.logging import get_logger
from backend.core.exceptions import LLMException


logger = get_logger(__name__)


class GrantMatcher:
    """Match grants to users using LLM"""
    
    def __init__(self, db: Session):
        self.db = db
        self.llm = LLMClient()
        self.grant_repo = GrantRepository(db)
        self.match_repo = UserMatchRepository(db)
        self.summary_repo = GrantSummaryRepository(db)
        self.profile_repo = UserProfileRepository(db)
    
    def match_grants_for_user(
        self,
        user_id: int,
        limit: int = 100,
        min_score: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Match grants to user profile
        
        Args:
            user_id: User ID
            limit: Max grants to analyze
            min_score: Minimum score to return
        
        Returns:
            List of matches sorted by score (descending)
        """
        logger.info(f"Matching grants for user {user_id}")
        
        # Get user profile
        profile = self.profile_repo.get_by_user_id(user_id)
        if not profile:
            raise ValueError(f"No profile found for user {user_id}")
        
        profile_data = {
            "organization_type": profile.organization_type,
            "focus_areas": profile.focus_areas or [],
            "location_state": profile.location_state,
            "grant_amount_min": profile.grant_amount_min or 0,
            "grant_amount_max": profile.grant_amount_max or 1000000,
            "keywords": profile.keywords
        }
        
        # Get active grants
        active_grants = self.grant_repo.get_active_grants(limit=limit)
        logger.info(f"Found {len(active_grants)} active grants to analyze")
        
        matches = []
        
        for grant in active_grants:
            try:
                # Check if match already exists
                existing_match = self.match_repo.get_match(user_id, grant.id)
                
                if existing_match:
                    matches.append({
                        "grant_id": grant.id,
                        "title": grant.title,
                        "agency": grant.agency,
                        "score": existing_match.score,
                        "reasoning": existing_match.reasoning,
                        "match_factors": existing_match.match_factors,
                        "barriers": existing_match.barriers,
                        "close_date": grant.close_date.isoformat() if grant.close_date else None,
                        "award_range": f"${grant.award_floor:,} - ${grant.award_ceiling:,}" if grant.award_floor and grant.award_ceiling else None
                    })
                    continue
                
                # Generate new match using LLM
                grant_data = {
                    "title": grant.title,
                    "agency": grant.agency,
                    "description": grant.description,
                    "eligibility": grant.eligibility,
                    "award_floor": grant.award_floor,
                    "award_ceiling": grant.award_ceiling
                }
                
                match_result = self._generate_match(profile_data, grant_data)
                
                # Store match in database
                match_record = self.match_repo.create_match({
                    "user_id": user_id,
                    "grant_id": grant.id,
                    "score": match_result["score"],
                    "reasoning": match_result["reasoning"],
                    "match_factors": match_result["match_factors"],
                    "barriers": match_result["barriers"]
                })
                
                matches.append({
                    "grant_id": grant.id,
                    "title": grant.title,
                    "agency": grant.agency,
                    "score": match_result["score"],
                    "reasoning": match_result["reasoning"],
                    "match_factors": match_result["match_factors"],
                    "barriers": match_result["barriers"],
                    "close_date": grant.close_date.isoformat() if grant.close_date else None,
                    "award_range": f"${grant.award_floor:,} - ${grant.award_ceiling:,}" if grant.award_floor and grant.award_ceiling else None
                })
                
            except Exception as e:
                logger.error(f"Failed to match grant {grant.id}: {e}")
                continue
        
        # Filter and sort
        matches = [m for m in matches if m["score"] >= min_score]
        matches.sort(key=lambda x: x["score"], reverse=True)
        
        logger.info(f"Generated {len(matches)} matches for user {user_id}")
        return matches
    
    def _generate_match(self, profile_data: dict, grant_data: dict) -> dict:
        """Generate match using LLM"""
        prompt = get_match_prompt(profile_data, grant_data)
        
        messages = [{"role": "user", "content": prompt}]
        
        response = self.llm.chat_completion(
            messages=messages,
            json_mode=True,
            max_tokens=500,
            temperature=0.3
        )
        
        if not response.get("parsed"):
            raise LLMException("Failed to parse match response")
        
        return response["parsed"]
    
    def generate_summary(self, grant_id: str, force_regenerate: bool = False) -> Dict[str, Any]:
        """
        Generate plain-English summary for a grant
        
        Args:
            grant_id: Grant ID
            force_regenerate: Ignore cached summary
        
        Returns:
            Summary data dict
        """
        # Check cache
        if not force_regenerate:
            cached = self.summary_repo.get_by_grant_id(grant_id)
            if cached:
                logger.info(f"Using cached summary for grant {grant_id}")
                return {
                    "purpose": cached.purpose,
                    "eligibility": cached.eligibility_bullets,
                    "requirements": cached.requirements_bullets,
                    "deadline": cached.grant.close_date.isoformat() if cached.grant.close_date else None,
                    "red_flags": cached.red_flags
                }
        
        # Generate new summary
        grant = self.grant_repo.get(grant_id)
        if not grant:
            raise ValueError(f"Grant {grant_id} not found")
        
        grant_data = {
            "title": grant.title,
            "agency": grant.agency,
            "description": grant.description,
            "eligibility": grant.eligibility,
            "award_floor": grant.award_floor,
            "award_ceiling": grant.award_ceiling,
            "close_date": grant.close_date.isoformat() if grant.close_date else None
        }
        
        prompt = get_summary_prompt(grant_data)
        
        messages = [{"role": "user", "content": prompt}]
        
        response = self.llm.chat_completion(
            messages=messages,
            json_mode=True,
            max_tokens=800,
            temperature=0.3
        )
        
        if not response.get("parsed"):
            raise LLMException("Failed to parse summary response")
        
        summary_data = response["parsed"]
        
        # Cache summary
        self.summary_repo.upsert_summary({
            "grant_id": grant_id,
            "summary_text": str(summary_data),
            "purpose": summary_data.get("purpose"),
            "eligibility_bullets": summary_data.get("eligibility", []),
            "requirements_bullets": summary_data.get("requirements", []),
            "red_flags": summary_data.get("red_flags", [])
        })
        
        logger.info(f"Generated summary for grant {grant_id}")
        return summary_data
    
    def chat_about_grant(
        self,
        grant_id: str,
        user_question: str,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Answer user question about a grant
        
        Args:
            grant_id: Grant ID
            user_question: User's question
            chat_history: Previous chat messages
        
        Returns:
            Answer text
        """
        grant = self.grant_repo.get(grant_id)
        if not grant:
            raise ValueError(f"Grant {grant_id} not found")
        
        grant_data = {
            "title": grant.title,
            "agency": grant.agency,
            "full_text": grant.full_text or grant.description
        }
        
        messages = get_chat_prompt(grant_data, user_question, chat_history)
        
        response = self.llm.chat_completion(
            messages=messages,
            max_tokens=600,
            temperature=0.4
        )
        
        return response["content"]

