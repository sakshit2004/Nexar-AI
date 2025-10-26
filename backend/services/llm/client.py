"""
LLM client with multi-provider support (OpenAI + Anthropic)
"""
from typing import List, Dict, Any, Optional

from backend.core.config import settings
from backend.core.logging import get_logger
from backend.services.llm.providers import MultiProviderLLM


logger = get_logger(__name__)


class LLMClient:
    """Multi-provider LLM client (OpenAI + Anthropic with fallback)"""
    
    def __init__(self):
        self.provider = MultiProviderLLM()
        self.max_tokens = settings.LLM_MAX_TOKENS
        self.temperature = settings.LLM_TEMPERATURE
    
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        json_mode: bool = False,
        max_retries: int = 3
    ) -> Dict[str, Any]:
        """
        Call LLM with automatic provider fallback
        
        Args:
            messages: List of message dicts with role and content
            max_tokens: Override default max tokens
            temperature: Override default temperature
            json_mode: Enable JSON response format
            max_retries: Number of retries on failure
        
        Returns:
            Dict with response content and metadata
        """
        result = self.provider.chat_completion(
            messages=messages,
            max_tokens=max_tokens or self.max_tokens,
            temperature=temperature or self.temperature,
            json_mode=json_mode,
            max_retries=max_retries
        )
        
        logger.info(
            f"LLM call successful ({result.get('provider')}) "
            f"(tokens={result['tokens_used']}, time={result['response_time_ms']}ms)"
        )
        
        return result
    
    def generate_embedding(self, text: str, model: str = "text-embedding-3-small") -> List[float]:
        """Generate embedding vector for text (OpenAI only)"""
        try:
            from openai import OpenAI
            if not settings.OPENAI_API_KEY:
                raise LLMException("Embeddings require OpenAI API key")
            
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.embeddings.create(
                model=model,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            raise LLMException(f"Embedding error: {e}")

