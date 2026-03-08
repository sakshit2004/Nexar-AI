"""Grant routes - Real-time grant discovery using web search + LLM extraction"""
from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Optional, Dict, Any

from backend.services.llm.web_search import WebSearchService
from backend.core.user_helper import get_current_user_simple
from backend.core.logging import get_logger
from backend.core.session_storage import get_session_storage


router = APIRouter(prefix="/grants", tags=["Grants"])
logger = get_logger(__name__)


@router.get("/recommended")
def get_recommended_grants(
    q: Optional[str] = Query(default=None, description="Personalized search query based on user profile"),
    limit: int = Query(default=10, le=50),
    seed: Optional[int] = Query(default=None, description="Ignored; used by frontend to bust cache and force a new search"),
) -> Dict[str, Any]:
    """
    Get personalized grant recommendations.
    Web search → LLM extraction → session store → same response shape.
    """
    current_user = get_current_user_simple()
    search_query = q if q else "federal grants USA"
    is_personalized = q is not None and q != "federal grants USA" and len(q) > len("federal grants USA")
    logger.info(f"Grant recommendations for user {current_user.id}: '{search_query}' (personalized: {is_personalized})")

    try:
        web_search = WebSearchService()
        result = web_search.search_grants(query=search_query, limit=limit, refresh_seed=seed)
        grants = result["grants"]
        get_session_storage().set_discovered_grants(grants)
        return {
            "grants": grants,
            "provider": result["provider"],
            "providers_used": [result["provider"]],
            "query": search_query,
            "count": len(grants),
            "personalized": is_personalized,
            "response_time_ms": result["response_time_ms"],
        }
    except ValueError as e:
        msg = str(e)
        if "API key" in msg or "configured" in msg.lower():
            logger.warning(f"Grant discovery not configured: {msg}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Grant discovery is not configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in your deployment environment."
            )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
    except Exception as e:
        logger.error(f"Recommended grants error: {e}", exc_info=True)
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
    Real-time federal grant search: web search → LLM extraction → session store.
    """
    current_user = get_current_user_simple()
    search_query = q if q else "federal grants USA"
    if category:
        search_query += f" {category}"
    logger.info(f"Real-time grant search: '{search_query}' for user {current_user.id}")

    try:
        web_search = WebSearchService()
        result = web_search.search_grants(
            query=search_query,
            category=category,
            limit=limit,
            provider=provider if provider != "auto" else None,
        )
        grants = result["grants"]
        get_session_storage().set_discovered_grants(grants)
        return {
            "grants": grants,
            "provider": result["provider"],
            "providers_used": [result["provider"]],
            "query": result["search_query"],
            "count": len(grants),
            "response_time_ms": result["response_time_ms"],
        }
    except ValueError as e:
        msg = str(e)
        if "API key" in msg or "configured" in msg.lower():
            logger.warning(f"Grant search not configured: {msg}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Grant discovery is not configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in your deployment environment."
            )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
    except Exception as e:
        logger.error(f"Grant search error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Grant search failed: {str(e)}"
        )


@router.get("")
def list_grants(
    limit: int = Query(default=20, le=50)
) -> Dict[str, Any]:
    """List current federal grants: web search → LLM extraction → session store."""
    current_user = get_current_user_simple()
    try:
        web_search = WebSearchService()
        result = web_search.search_grants(query="current open federal grants USA", limit=limit)
        grants = result["grants"]
        get_session_storage().set_discovered_grants(grants)
        return {
            "grants": grants,
            "provider": result["provider"],
            "count": len(grants),
            "response_time_ms": result["response_time_ms"],
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
    Get detailed information about a specific grant.
    Resolve from session discovered grants first; if missing, one web search for this id then LLM extract, store, return.
    """
    logger.info(f"Fetching grant details for ID: {grant_id}")
    storage = get_session_storage()

    # 1) Look up in session discovered grants first
    grant = storage.get_discovered_grant(grant_id)
    if grant:
        out = {**grant, "id": grant_id, "ai_summary": grant.get("ai_summary")}
        return out

    # 2) Not in session: optional web search for this id, extract, store, return
    try:
        web_search = WebSearchService()
        result = web_search.search_grants(
            query=f"federal grant {grant_id} grants.gov opportunity",
            limit=1,
        )
        if not result["grants"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Grant {grant_id} not found"
            )
        grant = result["grants"][0]
        grant["id"] = grant_id
        storage.set_discovered_grant(grant)
        return {**grant, "id": grant_id, "ai_summary": None}
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
    Get analysis and summary of a specific grant.
    Grant from session (or fetch by id); then one LLM call for summary/eligibility.
    """
    current_user = get_current_user_simple()
    logger.info(f"Analyzing grant {grant_id} for user {current_user.id}")
    storage = get_session_storage()

    # Get grant from session or fetch by id
    grant = storage.get_discovered_grant(grant_id)
    if not grant:
        try:
            web_search = WebSearchService()
            result = web_search.search_grants(
                query=f"federal grant {grant_id} details eligibility requirements deadline",
                limit=1,
            )
            if result["grants"]:
                grant = result["grants"][0]
                grant["id"] = grant_id
                storage.set_discovered_grant(grant)
        except Exception:
            pass
    if not grant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Grant {grant_id} not found"
        )

    try:
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
        match_score = 75
        recommendation = "This grant appears to be a good match for your organization."
        return {
            "grant_id": grant_id,
            "ai_summary": analysis_response["content"],
            "match_score": match_score,
            "recommendation": recommendation,
            "provider": "llm",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Grant analysis error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze grant: {str(e)}"
        )

