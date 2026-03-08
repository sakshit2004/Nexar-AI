"""
Grant discovery using native LLM web search tools.

- Anthropic: uses `web_search_20250305` tool built into the Claude API.
- OpenAI: uses the `web_search` tool via the Responses API (gpt-4o-search-preview
  for Chat Completions or gpt-4o via Responses API).

A single LLM call does both the web search and the extraction into the canonical
grant schema. No third-party search provider (Tavily, Serper, etc.) is needed.
"""
from typing import List, Dict, Any, Optional
import time
import json
import re
from datetime import date, datetime

from openai import OpenAI
from anthropic import Anthropic

from backend.core.config import settings
from backend.core.logging import get_logger
from backend.core.exceptions import LLMException
from backend.api.v1.schemas.grant import normalize_to_discovered_schema


logger = get_logger(__name__)


def _deadline_after_today(g: Dict[str, Any]) -> bool:
    """Return True if grant has no deadline or deadline is on or after today."""
    raw = g.get("deadline")
    if not raw or not isinstance(raw, str):
        return True
    s = raw.strip()[:10]
    if not s:
        return True
    try:
        d = datetime.strptime(s, "%Y-%m-%d").date()
        return d >= date.today()
    except ValueError:
        return True


CANONICAL_FIELDS = (
    "id, title, agency, description, eligibility, award_amount, deadline, "
    "category, url, opportunity_number"
)

EXTRACTION_PROMPT = """You are a federal grant discovery assistant. Use your web search capability to find REAL, currently open federal grant opportunities matching the query.

For each grant found, extract a JSON object with EXACTLY these fields (all strings):
- id: stable identifier derived from opportunity_number or a slug from title+agency
- title: official grant title
- agency: full federal agency name (e.g. "National Science Foundation", "U.S. Department of Education")
- description: 2-3 sentence description of the grant purpose
- eligibility: who can apply (e.g. "Nonprofit organizations, universities, state/local governments")
- award_amount: funding range (e.g. "$50,000 - $500,000") or "Varies" if unknown
- deadline: application deadline in YYYY-MM-DD format, or empty string if unknown
- category: one of [Education, Health, Environment, Science, Arts, Community Development, Agriculture, Technology]
- url: real URL from search results pointing to the grant (grants.gov or agency site); never make up URLs
- opportunity_number: official opportunity/CFDA number if found, otherwise empty string

Return ONLY a valid JSON array of such objects — no markdown, no explanation, no wrapper object.
If fewer than {limit} real federal grants can be found, return what you found (never invent grants).
Search query: {query}
Find up to {limit} real, currently open federal grant opportunities."""


class WebSearchService:
    """Grant discovery using native web search tools built into OpenAI and Anthropic."""

    def __init__(self):
        self.openai_client = None
        self.anthropic_client = None

        if settings.OPENAI_API_KEY:
            self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
        if settings.ANTHROPIC_API_KEY:
            self.anthropic_client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        if not self.openai_client and not self.anthropic_client:
            raise ValueError("At least one LLM API key must be configured for grant discovery")

    # Seed-based variety phrases so each refresh uses a different search angle (avoids same results every time)
    _VARIETY_PHRASES = [
        "museums libraries archives",
        "STEM science education research",
        "arts culture humanities",
        "community development youth",
        "technology innovation open source",
        "student programs workforce",
    ]

    def search_grants(
        self,
        query: str,
        category: Optional[str] = None,
        limit: int = 10,
        provider: Optional[str] = None,
        refresh_seed: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Use native LLM web search → extraction → canonical grant schema.
        provider: "openai", "anthropic", or None (uses settings.LLM_PROVIDER).
        refresh_seed: when set, appends a variety phrase to the query so each refresh returns different results.
        """
        start_time = time.time()
        effective_provider = (provider or settings.LLM_PROVIDER or "openai").lower()
        if effective_provider in ("claude", "claude-3", "claude-3-haiku"):
            effective_provider = "anthropic"

        # Expand short/category-like queries so web search returns more results (e.g. "Technology" -> "open federal grants technology innovation")
        base = (query or "").strip()
        if base and len(base.split()) <= 2 and base.lower() not in ("federal grants", "federal grant"):
            search_query = f"open federal grants for {base} USA"
        else:
            search_query = f"{query} federal grant {category}".strip() if category else f"{query} federal grant"
        if refresh_seed is not None and refresh_seed > 0:
            phrase = self._VARIETY_PHRASES[refresh_seed % len(self._VARIETY_PHRASES)]
            search_query = f"{search_query} {phrase}"

        try:
            if effective_provider == "openai" and self.openai_client:
                grants = self._search_with_openai(search_query, limit)
                used_provider = "openai"
            elif self.anthropic_client:
                grants = self._search_with_anthropic(search_query, limit)
                used_provider = "anthropic"
            elif self.openai_client:
                grants = self._search_with_openai(search_query, limit)
                used_provider = "openai"
            else:
                raise LLMException("No LLM client available")
        except Exception as e:
            logger.error(f"Grant web search failed ({effective_provider}): {e}")
            # Try the other provider as fallback
            try:
                if effective_provider == "openai" and self.anthropic_client:
                    logger.info("Falling back to Anthropic web search")
                    grants = self._search_with_anthropic(search_query, limit)
                    used_provider = "anthropic (fallback)"
                elif self.openai_client:
                    logger.info("Falling back to OpenAI web search")
                    grants = self._search_with_openai(search_query, limit)
                    used_provider = "openai (fallback)"
                else:
                    raise
            except Exception as e2:
                logger.error(f"Fallback also failed: {e2}")
                elapsed_ms = int((time.time() - start_time) * 1000)
                return {
                    "provider": effective_provider,
                    "grants": [],
                    "search_query": search_query,
                    "response_time_ms": elapsed_ms,
                    "count": 0,
                }

        normalized = [normalize_to_discovered_schema(g) for g in grants]
        normalized = [g for g in normalized if _deadline_after_today(g)][:limit]
        elapsed_ms = int((time.time() - start_time) * 1000)
        logger.info(f"Grant search ({used_provider}): {len(normalized)} grants in {elapsed_ms}ms")
        return {
            "provider": used_provider,
            "grants": normalized,
            "search_query": search_query,
            "response_time_ms": elapsed_ms,
            "count": len(normalized),
        }

    def _search_with_anthropic(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """
        Single Anthropic API call with the native web_search tool.
        Claude searches the web and returns extracted grant JSON.
        """
        prompt = EXTRACTION_PROMPT.format(query=query, limit=limit)

        # Use claude-haiku-4-5 if available (faster), else fall back to configured model
        # web_search_20250305 is supported on claude-3-5-haiku-latest and newer
        model = settings.ANTHROPIC_MODEL
        # Ensure we use a model that supports web search
        if "claude-3-haiku-20240307" in model:
            # Old haiku doesn't support web search; use a supported model
            model = "claude-3-5-haiku-latest"

        resp = self.anthropic_client.messages.create(
            model=model,
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}],
            tools=[{"type": "web_search_20250305", "name": "web_search", "max_uses": 5}],
        )

        # Extract text from response (Claude may use tool_use blocks followed by text)
        text_content = ""
        for block in resp.content:
            if hasattr(block, "text"):
                text_content += block.text
        return self._parse_grants_json(text_content)

    def _search_with_openai(self, query: str, limit: int) -> List[Dict[str, Any]]:
        """
        Single OpenAI call using web search.
        Uses gpt-4o-search-preview (Chat Completions) which has built-in web search.
        Falls back to Responses API if the model doesn't support chat completions with search.
        """
        prompt = EXTRACTION_PROMPT.format(query=query, limit=limit)

        # gpt-4o-search-preview supports web search in Chat Completions API
        # It does not need tool definitions — web search is automatic
        try:
            resp = self.openai_client.chat.completions.create(
                model="gpt-4o-search-preview",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=4000,
            )
            content = resp.choices[0].message.content or ""
            return self._parse_grants_json(content)
        except Exception as e:
            logger.warning(f"gpt-4o-search-preview failed, trying Responses API: {e}")

        # Fallback: Responses API with web_search tool + configured model
        try:
            resp = self.openai_client.responses.create(
                model=settings.OPENAI_MODEL,
                input=prompt,
                tools=[{"type": "web_search"}],
            )
            # Responses API returns output as a list of items
            text_content = ""
            for item in resp.output:
                if hasattr(item, "content"):
                    for c in item.content:
                        if hasattr(c, "text"):
                            text_content += c.text
                elif hasattr(item, "text"):
                    text_content += item.text
            return self._parse_grants_json(text_content)
        except Exception as e2:
            logger.warning(f"Responses API also failed: {e2}")
            raise LLMException(f"OpenAI web search failed: {e2}")

    def _parse_grants_json(self, content: str) -> List[Dict[str, Any]]:
        """Parse LLM response (which may include search result text) into grant dicts."""
        if not content:
            return []
        content = content.strip()
        # Strip markdown code block if present
        if content.startswith("```"):
            content = re.sub(r"^```(?:json)?\s*", "", content)
            content = re.sub(r"\s*```\s*$", "", content)
        try:
            start = content.find("[")
            end = content.rfind("]") + 1
            if start >= 0 and end > start:
                arr = json.loads(content[start:end])
                if isinstance(arr, list):
                    return [g for g in arr if isinstance(g, dict)]
            data = json.loads(content)
            if isinstance(data, list):
                return [g for g in data if isinstance(g, dict)]
            if isinstance(data, dict) and "grants" in data:
                return [g for g in data["grants"] if isinstance(g, dict)]
            if isinstance(data, dict) and any(
                k in data for k in ("id", "title", "agency")
            ):
                return [data]
        except json.JSONDecodeError as e:
            logger.warning(f"Could not parse LLM JSON from web search response: {e}")
        return []
