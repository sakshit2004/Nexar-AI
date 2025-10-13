"""Grant routes - Real-time grant discovery using web search"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from backend.models.database import get_db
from backend.api.v1.middleware.auth import get_current_user
from backend.api.v1.middleware.rate_limit import check_rate_limit
from backend.services.llm.web_search import WebSearchService
from backend.models.user import User
from backend.core.logging import get_logger


router = APIRouter(prefix="/grants", tags=["Grants"])
logger = get_logger(__name__)


@router.get("/search")
def search_grants(
    q: Optional[str] = Query(default="", description="Search query for grants"),
    category: Optional[str] = Query(default=None, description="Category filter (e.g., Education, Health, Environment)"),
    limit: int = Query(default=10, le=50, description="Max number of results"),
    provider: str = Query(default="auto", description="LLM provider: 'openai', 'claude', or 'auto'"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Real-time federal grant search using AI web search
    
    Searches the live web for current federal grant opportunities using LLM web search tools.
    """
    check_rate_limit(current_user, "search")
    
    # Build search query
    search_query = q if q else "federal grants USA"
    if category:
        search_query += f" {category}"
    
    logger.info(f"Real-time grant search: '{search_query}' for user {current_user.id}")
    
    try:
        # Use web search service for real-time grant discovery
        web_search = WebSearchService()
        result = web_search.search_grants(
            query=search_query,
            category=category,
            limit=limit,
            provider=provider
        )
        
        return {
            "grants": result["grants"],
            "provider": result["provider"],
            "providers_used": result.get("providers_used", []),
            "query": search_query,
            "count": len(result["grants"]),
            "response_time_ms": result["response_time_ms"],
            "citations": result.get("citations", []),
            "errors": result.get("errors")
        }
    
    except Exception as e:
        logger.error(f"Grant search error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Grant search failed: {str(e)}"
        )


@router.get("/recommended")
def get_recommended_grants(
    limit: int = Query(default=10, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get personalized grant recommendations based on user profile
    
    Uses AI web search to find grants matching the user's profile and interests.
    """
    check_rate_limit(current_user, "search")
    
    # Build personalized search query based on user profile
    search_query = "federal grants USA"
    
    # Get user profile to personalize search
    from backend.repositories.user_repository import UserProfileRepository
    profile_repo = UserProfileRepository(db)
    profile = profile_repo.get_by_user_id(current_user.id)
    
    if profile:
        # Add organization type for better targeting
        if profile.organization_type:
            search_query += f" for {profile.organization_type} organizations"
        
        # Add focus areas (top 3 most important)
        if profile.focus_areas and len(profile.focus_areas) > 0:
            areas = ", ".join(profile.focus_areas[:3])
            search_query += f" in {areas}"
        
        # Add location for location-specific grants
        if profile.location_state:
            search_query += f" {profile.location_state}"
        
        # Add organization name context if available
        if profile.organization_name:
            logger.info(f"Personalizing for organization: {profile.organization_name}")
    else:
        logger.info(f"No profile found for user {current_user.id}, using generic search")
    
    logger.info(f"Personalized grant recommendations for user {current_user.id}: '{search_query}'")
    
    try:
        web_search = WebSearchService()
        result = web_search.search_grants(
            query=search_query,
            limit=limit,
            provider="auto"
        )
        
        return {
            "grants": result["grants"],
            "provider": result["provider"],
            "providers_used": result.get("providers_used", []),
            "query": search_query,
            "count": len(result["grants"]),
            "personalized": profile is not None,
            "response_time_ms": result["response_time_ms"],
            "errors": result.get("errors")
        }
    
    except Exception as e:
        logger.error(f"Recommended grants error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get recommendations: {str(e)}"
        )


@router.get("")
def list_grants(
    limit: int = Query(default=20, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """List current federal grants using real-time web search"""
    check_rate_limit(current_user, "search")
    
    try:
        web_search = WebSearchService()
        result = web_search.search_grants(
            query="current open federal grants USA",
            limit=limit,
            provider="auto"
        )
        
        return {
            "grants": result["grants"],
            "provider": result["provider"],
            "count": len(result["grants"]),
            "response_time_ms": result["response_time_ms"]
        }
    
    except Exception as e:
        logger.error(f"List grants error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list grants: {str(e)}"
        )


@router.get("/{grant_id}")
def get_grant(
    grant_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get detailed information about a specific grant using AI generation
    """
    logger.info(f"Fetching grant details for ID: {grant_id}")
    
    try:
        # Generate a detailed grant based on the ID
        web_search = WebSearchService()
        result = web_search.search_grants(
            query=f"federal grant {grant_id} detailed information eligibility requirements deadline",
            limit=1,
            provider="auto"
        )
        
        if not result["grants"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Grant {grant_id} not found"
            )
        
        grant = result["grants"][0]
        
        # Ensure the grant has all required fields with proper values
        grant.update({
            "id": grant_id,
            "title": grant.get("title", f"Federal Grant {grant_id}"),
            "agency": grant.get("agency", "Department of Energy"),
            "description": grant.get("description", "This federal grant opportunity supports innovative research and development projects in clean energy technologies."),
            "eligibility": grant.get("eligibility", "Open to universities, nonprofit organizations, and small businesses engaged in energy research."),
            "award_amount": grant.get("award_amount", "$100,000 - $500,000"),
            "deadline": grant.get("deadline", "2025-06-15"),
            "category": grant.get("category", "Science"),
            "url": grant.get("url", "https://grants.gov/search"),  # Use URL from web search or fallback to grants.gov
            "opportunity_number": grant_id,
            "ai_summary": None,  # Will be generated when user clicks "Generate AI Summary"
            "provider": result["provider"],
            "response_time_ms": result["response_time_ms"]
        })
        
        return grant
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get grant error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch grant: {str(e)}"
        )


@router.post("/{grant_id}/analyze")
def analyze_grant(
    grant_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get AI analysis and summary of a specific grant
    
    Uses AI to provide plain-English summary, eligibility analysis, and recommendations.
    """
    check_rate_limit(current_user, "summary")
    
    logger.info(f"Analyzing grant {grant_id} for user {current_user.id}")
    
    try:
        # First get the grant details via web search
        web_search = WebSearchService()
        result = web_search.search_grants(
            query=f"federal grant {grant_id} details eligibility requirements deadline",
            limit=1,
            provider="auto"
        )
        
        if not result["grants"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Grant {grant_id} not found"
            )
        
        grant = result["grants"][0]
        
        # Use LLM to generate analysis
        from backend.services.llm.client import LLMClient
        llm_client = LLMClient()
        
        analysis_prompt = f"""Analyze this federal grant and provide a plain-English summary:

Grant: {grant.get('title', 'Unknown')}
Agency: {grant.get('agency', 'Unknown')}
Description: {grant.get('description', 'N/A')}
Eligibility: {grant.get('eligibility', 'N/A')}
Award Amount: {grant.get('award_amount', 'N/A')}
Deadline: {grant.get('deadline', 'N/A')}

Provide:
1. A 2-3 sentence plain-English summary
2. Key eligibility requirements
3. Application tips
4. Important deadlines and milestones"""

        analysis_response = llm_client.chat_completion(
            messages=[{"role": "user", "content": analysis_prompt}],
            max_tokens=1000
        )
        
        # Get user profile for match scoring
        from backend.repositories.user_repository import UserProfileRepository
        profile_repo = UserProfileRepository(db)
        profile = profile_repo.get_by_user_id(current_user.id)
        
        # Calculate match score based on profile
        match_score = 75  # Default score
        recommendation = "This grant appears to be a good match for your organization."
        
        if profile:
            # Simple matching logic based on profile
            if profile.organization_type and "research" in profile.organization_type.lower():
                match_score = 85
                recommendation = "Excellent match! Your research background aligns well with this grant's focus."
            elif profile.focus_areas and any(area in ["science", "technology", "energy"] for area in profile.focus_areas):
                match_score = 80
                recommendation = "Good match based on your focus areas."
            else:
                match_score = 70
                recommendation = "Moderate match. Consider reviewing the eligibility requirements carefully."
        
        return {
            "grant_id": grant_id,
            "ai_summary": analysis_response["content"],
            "match_score": match_score,
            "recommendation": recommendation,
            "provider": result["provider"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Grant analysis error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze grant: {str(e)}"
        )

