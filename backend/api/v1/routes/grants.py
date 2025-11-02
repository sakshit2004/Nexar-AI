"""Grant routes - Real-time grant discovery using web search"""
from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional, Dict, Any

from backend.services.llm.web_search import WebSearchService
from backend.core.user_helper import get_current_user_simple
from backend.core.logging import get_logger


router = APIRouter(prefix="/grants", tags=["Grants"])
logger = get_logger(__name__)


@router.get("/recommended")
def get_recommended_grants(
    q: Optional[str] = Query(default=None, description="Personalized search query based on user profile"),
    limit: int = Query(default=10, le=50)
) -> Dict[str, Any]:
    """
    Get personalized grant recommendations
    
    Uses web search to find grants matching the user's interests.
    If a query is provided, it's assumed to be personalized based on user profile.
    """
    current_user = get_current_user_simple()
    
    # Build personalized search query
    # If query is provided, it's personalized; otherwise use default
    search_query = q if q else "federal grants USA"
    is_personalized = q is not None and q != "federal grants USA" and len(q) > len("federal grants USA")
    
    logger.info(f"Grant recommendations for user {current_user.id}: '{search_query}' (personalized: {is_personalized})")
    
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
            "personalized": is_personalized,
            "response_time_ms": result["response_time_ms"],
            "errors": result.get("errors")
        }
    
    except Exception as e:
        logger.error(f"Recommended grants error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get recommendations: {str(e)}"
        )


@router.get("/search")
def search_grants(
    q: Optional[str] = Query(default="", description="Search query for grants"),
    category: Optional[str] = Query(default=None, description="Category filter (e.g., Education, Health, Environment)"),
    limit: int = Query(default=10, le=50, description="Max number of results"),
    provider: str = Query(default="auto", description="Search provider: 'openai', 'claude', or 'auto'")
) -> Dict[str, Any]:
    """
    Real-time federal grant search using web search

    Searches the live web for current federal grant opportunities using web search tools.
    """
    current_user = get_current_user_simple()
    
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


@router.get("")
def list_grants(
    limit: int = Query(default=20, le=50)
) -> Dict[str, Any]:
    """List current federal grants using real-time web search"""
    current_user = get_current_user_simple()
    
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
    grant_id: str
) -> Dict[str, Any]:
    """
    Get detailed information about a specific grant
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
        
        # Construct proper URL - use the existing web_search instance to construct valid URLs
        grant_url = web_search._construct_grant_url(grant)
        
        # Double-check: never allow page-not-found URLs
        if 'page-not-found' in grant_url.lower():
            # Fallback: construct a search URL based on opportunity number or title
            opportunity_number = grant.get("opportunity_number", grant_id)
            if opportunity_number:
                import urllib.parse
                encoded_opp = urllib.parse.quote(opportunity_number)
                grant_url = f"https://grants.gov/web/grants/search-grants.html?keywords={encoded_opp}"
            elif grant.get("title"):
                import urllib.parse
                keywords = ' '.join(grant.get("title", "").split()[:3])
                encoded_keywords = urllib.parse.quote(keywords)
                grant_url = f"https://grants.gov/web/grants/search-grants.html?keywords={encoded_keywords}"
            else:
                grant_url = "https://grants.gov/web/grants/search-grants.html"
        
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
            "url": grant_url,  # Use constructed URL
            "opportunity_number": grant.get("opportunity_number", grant_id),
            "ai_summary": None,  # Will be generated when user clicks "Generate Summary"
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
    grant_id: str
) -> Dict[str, Any]:
    """
    Get analysis and summary of a specific grant

    Provides plain-English summary, eligibility analysis, and recommendations.
    """
    current_user = get_current_user_simple()
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
        
        # Calculate match score (simple default scoring)
        match_score = 75  # Default score
        recommendation = "This grant appears to be a good match for your organization."
        
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

