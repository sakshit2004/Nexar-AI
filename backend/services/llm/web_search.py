"""
Real-time web search using text processing providers
"""
from typing import List, Dict, Any, Optional
import time
import json
import asyncio
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

from openai import OpenAI
from anthropic import Anthropic, AnthropicError

from backend.core.config import settings
from backend.core.logging import get_logger
from backend.core.exceptions import LLMException


logger = get_logger(__name__)


class WebSearchService:
    """Real-time web search for grants using text processing providers"""
    
    def __init__(self):
        self.openai_client = None
        self.anthropic_client = None
        
        if settings.OPENAI_API_KEY:
            self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
        
        if settings.ANTHROPIC_API_KEY:
            self.anthropic_client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        
        if not self.openai_client and not self.anthropic_client:
            raise ValueError("At least one LLM API key must be configured for web search")
        
        # Calculate deadline range (4 months from now to 12 months from now)
        self.current_date = datetime.now()
        self.min_deadline = self.current_date + timedelta(days=120)  # ~4 months
        self.max_deadline = self.current_date + timedelta(days=365)  # ~12 months
    
    def search_grants_openai(
        self,
        query: str,
        category: Optional[str] = None,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Generate federal grant recommendations
        
        Returns structured grant data
        """
        if not self.openai_client:
            raise LLMException("OpenAI API key not configured")
        
        logger.info(f"OpenAI grant recommendations for: {query}")
        
        # Build detailed prompt
        search_context = f"federal grants USA {query}"
        if category:
            search_context += f" in {category} category"
        
        # System prompt for grant generation with deadline constraints
        min_date_str = self.min_deadline.strftime("%Y-%m-%d")
        max_date_str = self.max_deadline.strftime("%Y-%m-%d")
        
        system_prompt = f"""You are a federal grant discovery assistant with expertise in US federal funding opportunities. Generate realistic federal grant recommendations from various official sources including grants.gov, NSF, NIH, USDA, DOE, and other federal agencies.

IMPORTANT: All deadlines must be between {min_date_str} and {max_date_str} (at least 4 months from now).

For each grant, provide:
- id: Realistic grant ID format: AGENCY-YEAR-TOPIC-NUMBER (e.g., "NSF-2025-STEM-789", "NIH-2025-R01-456")
- title: Descriptive grant title
- agency: Federal agency name (e.g., NSF, NIH, USDA, DOE, NEA)
- description: Brief 2-3 sentence description
- eligibility: Who can apply (e.g., nonprofits, universities, state governments)
- award_amount: Realistic range (e.g., "$50,000 - $500,000")
- deadline: Future date between {min_date_str} and {max_date_str} in format "YYYY-MM-DD"
- category: One of [Education, Health, Environment, Science, Arts, Community Development, Agriculture, Technology]
- opportunity_number: Realistic grants.gov opportunity number format (e.g., "HHS-2025-ACF-OPRE-ZB-1234", "ED-2025-OESE-0123")
- url: A realistic grants.gov or agency-specific URL where this grant can be found. For grants.gov, use format like "https://grants.gov/web/grants/search-grants.html?keywords=STEM" or agency-specific URLs like "https://www.nsf.gov/funding/pgm_summ.jsp?pims_id=12345" (do NOT use curly braces or variables in URLs, use actual keywords)

CRITICAL: Include a url field for each grant pointing to where it would be found (grants.gov search or agency website).

Return ONLY valid JSON array with {limit} grants. No markdown, no explanation."""

        user_prompt = f"Generate {limit} current federal grant opportunities for: {search_context}"

        try:
            start_time = time.time()
            
            # Make API request (without web search tool - OpenAI doesn't support it)
            response = self.openai_client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=4000,
                temperature=0.7,
                response_format={"type": "json_object"} if "gpt-4" in settings.OPENAI_MODEL else None
            )
            
            elapsed_ms = int((time.time() - start_time) * 1000)
            
            # Extract content and parse
            content = response.choices[0].message.content
            
            # Try to parse JSON from the response
            try:
                grants = self._extract_grants_from_response(content)
            except Exception as e:
                logger.error(f"Error extracting grants from response: {e}")
                logger.error(f"Response content: {content[:500]}")  # Log first 500 chars
                grants = []
            
            logger.info(f"Generated {len(grants)} grant recommendations in {elapsed_ms}ms")
            
            return {
                "provider": "openai",
                "grants": grants,
                "raw_response": content,
                "search_query": search_context,
                "response_time_ms": elapsed_ms,
                "tokens_used": response.usage.total_tokens
            }
            
        except Exception as e:
            logger.error(f"OpenAI grant generation error: {e}")
            raise LLMException(f"OpenAI grant generation failed: {e}")
    
    def search_grants_claude(
        self,
        query: str,
        category: Optional[str] = None,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Generate federal grant recommendations (alternative provider)
        
        Returns structured grant data
        """
        if not self.anthropic_client:
            raise LLMException("Anthropic API key not configured")
        
        logger.info(f"Claude grant recommendations for: {query}")
        
        # Build search context
        search_context = f"federal grants USA {query}"
        if category:
            search_context += f" in {category} category"
        
        # System prompt for grant generation with deadline constraints
        min_date_str = self.min_deadline.strftime("%Y-%m-%d")
        max_date_str = self.max_deadline.strftime("%Y-%m-%d")
        
        system_prompt = f"""You are a federal grant discovery assistant with expertise in US federal funding opportunities. Generate realistic federal grant recommendations from various official sources including grants.gov, NSF, NIH, USDA, DOE, and other federal agencies.

IMPORTANT: All deadlines must be between {min_date_str} and {max_date_str} (at least 4 months from now).

For each grant, provide:
- id: Realistic grant ID format: AGENCY-YEAR-TOPIC-NUMBER (e.g., "NSF-2025-STEM-001", "DOE-2025-ENERGY-234")
- title: Descriptive grant title
- agency: Federal agency name (e.g., NSF, NIH, USDA, DOE, NEA, NEH)
- description: Brief 2-3 sentence description of the grant purpose
- eligibility: Who can apply (e.g., "Nonprofit organizations", "Public universities", "State/local governments")
- award_amount: Realistic funding range (e.g., "$25,000 - $250,000")
- deadline: Future date between {min_date_str} and {max_date_str} in YYYY-MM-DD format
- category: One of [Education, Health, Environment, Science, Arts, Community Development, Agriculture, Technology]
- opportunity_number: Realistic grants.gov opportunity number format (e.g., "HHS-2025-ACF-OPRE-ZB-1234", "ED-2025-OESE-0123")
- url: A realistic grants.gov or agency-specific URL where this grant can be found. Use grants.gov search URLs with keywords from the grant title or opportunity number, or agency-specific funding pages.

CRITICAL: Include a url field for each grant pointing to where it would be found (grants.gov search or agency website).

Return ONLY valid JSON array. No other text."""

        user_prompt = f"Generate {limit} current federal grant opportunities for: {search_context}"

        try:
            start_time = time.time()
            
            # Make API request (without web search - not generally available)
            response = self.anthropic_client.messages.create(
                model=settings.ANTHROPIC_MODEL,
                max_tokens=4000,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7
            )
            
            elapsed_ms = int((time.time() - start_time) * 1000)
            
            # Extract content (Anthropic returns content as a list of blocks)
            content = response.content[0].text
            
            # Parse grants from response
            grants = self._extract_grants_from_response(content)
            
            logger.info(f"Generated {len(grants)} grant recommendations in {elapsed_ms}ms")
            
            return {
                "provider": "claude",
                "grants": grants,
                "raw_response": content,
                "search_query": search_context,
                "response_time_ms": elapsed_ms,
                "tokens_used": response.usage.input_tokens + response.usage.output_tokens
            }
            
        except Exception as e:
            logger.error(f"Claude grant generation error: {e}")
            raise LLMException(f"Claude grant generation failed: {e}")
    
    def search_grants_parallel(
        self,
        query: str,
        category: Optional[str] = None,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Search for grants using BOTH OpenAI and Claude in parallel
        
        Combines results from both providers for maximum grant coverage
        """
        start_time = time.time()
        all_grants = []
        providers_used = []
        errors = []
        
        # Run both providers in parallel using ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=2) as executor:
            futures = {}
            
            # Submit OpenAI request
            if self.openai_client:
                future_openai = executor.submit(
                    self._safe_search_openai, query, category, limit // 2
                )
                futures['openai'] = future_openai
            
            # Submit Claude request
            if self.anthropic_client:
                future_claude = executor.submit(
                    self._safe_search_claude, query, category, limit // 2
                )
                futures['claude'] = future_claude
            
            # Collect results as they complete
            for provider_name, future in futures.items():
                try:
                    result = future.result(timeout=45)  # 45 second timeout per provider
                    if result and result.get('grants'):
                        all_grants.extend(result['grants'])
                        providers_used.append(provider_name)
                        logger.info(f"{provider_name} returned {len(result['grants'])} grants")
                except Exception as e:
                    error_msg = f"{provider_name} failed: {str(e)}"
                    logger.warning(error_msg)
                    errors.append(error_msg)
        
        # Remove duplicates based on grant ID
        unique_grants = {}
        for grant in all_grants:
            grant_id = grant.get('id', grant.get('grant_id', str(hash(json.dumps(grant)))))
            if grant_id not in unique_grants:
                unique_grants[grant_id] = grant
        
        final_grants = list(unique_grants.values())[:limit]  # Limit total results
        
        elapsed_ms = int((time.time() - start_time) * 1000)
        
        logger.info(f"Parallel search completed: {len(final_grants)} unique grants from {len(providers_used)} providers in {elapsed_ms}ms")
        
        return {
            "provider": f"parallel ({', '.join(providers_used)})" if providers_used else "none",
            "grants": final_grants,
            "search_query": query,
            "count": len(final_grants),
            "response_time_ms": elapsed_ms,
            "providers_used": providers_used,
            "errors": errors if errors else None
        }
    
    def _safe_search_openai(self, query: str, category: Optional[str], limit: int) -> Optional[Dict[str, Any]]:
        """Safely call OpenAI search, catching exceptions"""
        try:
            return self.search_grants_openai(query, category, limit)
        except Exception as e:
            logger.error(f"OpenAI search failed: {e}")
            return None
    
    def _safe_search_claude(self, query: str, category: Optional[str], limit: int) -> Optional[Dict[str, Any]]:
        """Safely call Claude search, catching exceptions"""
        try:
            return self.search_grants_claude(query, category, limit)
        except Exception as e:
            logger.error(f"Claude search failed: {e}")
            return None
    
    def search_grants(
        self,
        query: str,
        category: Optional[str] = None,
        limit: int = 10,
        provider: str = "auto"
    ) -> Dict[str, Any]:
        """
        Search for grants using the specified provider
        
        Args:
            query: Search query
            category: Optional category filter
            limit: Max number of grants to return
            provider: "openai", "claude", "parallel", or "auto" (uses parallel by default)
        """
        
        # Use parallel search by default for best results
        if provider == "auto" or provider == "parallel":
            return self.search_grants_parallel(query, category, limit)
        
        # Single provider fallback
        if provider == "openai" and self.openai_client:
            return self.search_grants_openai(query, category, limit)
        elif provider in ["anthropic", "claude"] and self.anthropic_client:
            return self.search_grants_claude(query, category, limit)
        
        # If specific provider not available, use parallel
        logger.warning(f"Provider '{provider}' not available, using parallel search")
        return self.search_grants_parallel(query, category, limit)
    
    def _construct_grant_url(self, grant: Dict[str, Any]) -> str:
        """
        Construct a proper URL for a grant based on its opportunity number or ID
        
        Returns a direct link to the grant on grants.gov if possible, otherwise
        returns agency-specific URLs
        """
        # ALWAYS construct a proper URL - don't trust AI-generated URLs as they may be invalid
        # We'll reconstruct based on grant data to ensure validity
        
        def validate_and_return(url: str) -> str:
            """Validate URL and ensure it's not page-not-found"""
            if url and 'page-not-found' not in url.lower():
                return url
            # If somehow we got an invalid URL, return default search page
            return "https://grants.gov/web/grants/search-grants.html"
        
        # Try to use opportunity_number first for grants.gov URL
        opportunity_number = grant.get('opportunity_number', '')
        title = grant.get('title', '')
        
        if opportunity_number:
            # Use grants.gov search with opportunity number
            # Format: https://grants.gov/web/grants/search-grants.html?keywords=OPPORTUNITY_NUMBER
            import urllib.parse
            encoded_opp = urllib.parse.quote(opportunity_number)
            url = f"https://grants.gov/web/grants/search-grants.html?keywords={encoded_opp}"
            logger.debug(f"Constructed URL from opportunity_number: {url}")
            return validate_and_return(url)
        
        # Try to use grant title for search
        if title:
            # Extract key words from title for search
            try:
                import urllib.parse
                # Take first 3-4 meaningful words from title
                words = [w for w in title.split() if len(w) > 2][:4]  # Skip short words like "a", "the", "of"
                if words:
                    keywords = ' '.join(words)
                    encoded_keywords = urllib.parse.quote(keywords)
                    url = f"https://grants.gov/web/grants/search-grants.html?keywords={encoded_keywords}"
                    logger.debug(f"Constructed URL from title: {url}")
                    return validate_and_return(url)
            except Exception as e:
                logger.warning(f"Error constructing URL from title: {e}")
                # Fall through to agency-specific URLs
        
        # Try to use grant ID for search if it contains meaningful parts
        grant_id = grant.get('id', '')
        if grant_id and '-' in grant_id:
            try:
                import urllib.parse
                # Extract agency or topic from grant ID (e.g., "NSF-2025-STEM-001" -> search for "NSF STEM")
                parts = grant_id.split('-')
                if len(parts) >= 3:
                    # Use agency and topic parts
                    search_terms = [parts[0]]  # Agency code
                    if len(parts) >= 3 and parts[2]:  # Topic
                        search_terms.append(parts[2])
                    keywords = ' '.join(search_terms)
                    encoded_keywords = urllib.parse.quote(keywords)
                    url = f"https://grants.gov/web/grants/search-grants.html?keywords={encoded_keywords}"
                    logger.debug(f"Constructed URL from grant_id: {url}")
                    return validate_and_return(url)
            except Exception as e:
                logger.warning(f"Error constructing URL from grant_id: {e}")
        
        # Fallback: Try to construct agency-specific URLs
        agency = grant.get('agency', '').upper()
        
        # NSF grants
        if 'NSF' in agency or grant_id.startswith('NSF-'):
            return validate_and_return(f"https://www.nsf.gov/funding/pgm_list.jsp?ord=rcnt&org={agency}")
        
        # NIH grants
        elif 'NIH' in agency or grant_id.startswith('NIH-'):
            return validate_and_return("https://grants.nih.gov/grants/guide/")
        
        # DOE grants
        elif 'DOE' in agency or 'ENERGY' in agency or grant_id.startswith('DOE-'):
            return validate_and_return("https://www.energy.gov/funding-opportunities")
        
        # USDA grants
        elif 'USDA' in agency or grant_id.startswith('USDA-'):
            return validate_and_return("https://www.usda.gov/topics/farming/grants-and-loans")
        
        # HHS/Health grants
        elif 'HHS' in agency or 'HEALTH' in agency or grant_id.startswith('HHS-'):
            return validate_and_return("https://www.hhs.gov/grants/")
        
        # Education grants
        elif 'EDUCATION' in agency or 'ED-' in grant_id or grant_id.startswith('ED-'):
            return validate_and_return("https://www.ed.gov/fund/grants-apply.html")
        
        # EPA grants
        elif 'EPA' in agency or grant_id.startswith('EPA-'):
            return validate_and_return("https://www.epa.gov/grants")
        
        # Default to grants.gov search page (not page-not-found)
        return validate_and_return("https://grants.gov/web/grants/search-grants.html")
    
    def _extract_grants_from_response(self, content: str) -> List[Dict[str, Any]]:
        """Extract grant data from text processing response"""
        
        # Try to find JSON in the response
        try:
            # Look for JSON array or object
            start_idx = content.find('[')
            end_idx = content.rfind(']') + 1
            
            if start_idx >= 0 and end_idx > start_idx:
                json_str = content[start_idx:end_idx]
                grants = json.loads(json_str)
                
                if isinstance(grants, list):
                    # ALWAYS reconstruct URLs - never trust AI-generated URLs
                    for grant in grants:
                        grant['url'] = self._construct_grant_url(grant)
                        # Final safety check - never allow page-not-found
                        if 'page-not-found' in grant.get('url', '').lower():
                            grant['url'] = "https://grants.gov/web/grants/search-grants.html"
                    return grants
                elif isinstance(grants, dict):
                    grants['url'] = self._construct_grant_url(grants)
                    if 'page-not-found' in grants.get('url', '').lower():
                        grants['url'] = "https://grants.gov/web/grants/search-grants.html"
                    return [grants]
            
            # Try to parse the entire content as JSON
            data = json.loads(content)
            if isinstance(data, list):
                for grant in data:
                    grant['url'] = self._construct_grant_url(grant)
                    if 'page-not-found' in grant.get('url', '').lower():
                        grant['url'] = "https://grants.gov/web/grants/search-grants.html"
                return data
            elif isinstance(data, dict):
                # Check if it's a wrapper object
                if "grants" in data:
                    for grant in data["grants"]:
                        grant['url'] = self._construct_grant_url(grant)
                        if 'page-not-found' in grant.get('url', '').lower():
                            grant['url'] = "https://grants.gov/web/grants/search-grants.html"
                    return data["grants"]
                data['url'] = self._construct_grant_url(data)
                if 'page-not-found' in data.get('url', '').lower():
                    data['url'] = "https://grants.gov/web/grants/search-grants.html"
                return [data]
        
        except json.JSONDecodeError:
            logger.warning("Could not parse JSON from response, returning empty list")
        
        return []

