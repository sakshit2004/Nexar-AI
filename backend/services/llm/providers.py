"""
Multi-provider LLM abstraction
Supports OpenAI and Anthropic with automatic fallback
"""
from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod
import time

from openai import OpenAI, OpenAIError
from anthropic import Anthropic, AnthropicError

from backend.core.config import settings
from backend.core.logging import get_logger
from backend.core.exceptions import LLMException


logger = get_logger(__name__)


class BaseLLMProvider(ABC):
    """Base class for LLM providers"""
    
    @abstractmethod
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        json_mode: bool = False
    ) -> Dict[str, Any]:
        """Generate chat completion"""
        pass


class OpenAIProvider(BaseLLMProvider):
    """OpenAI GPT provider"""
    
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not configured")
        
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
    
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        json_mode: bool = False
    ) -> Dict[str, Any]:
        """OpenAI chat completion"""
        params = {
            "model": self.model,
            "messages": messages,
            "max_tokens": max_tokens or settings.LLM_MAX_TOKENS,
            "temperature": temperature or settings.LLM_TEMPERATURE
        }
        
        if json_mode:
            params["response_format"] = {"type": "json_object"}
        
        try:
            start_time = time.time()
            
            response = self.client.chat.completions.create(**params)
            
            elapsed_ms = int((time.time() - start_time) * 1000)
            
            return {
                "content": response.choices[0].message.content,
                "tokens_used": response.usage.total_tokens,
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "model": response.model,
                "response_time_ms": elapsed_ms,
                "provider": "openai"
            }
            
        except OpenAIError as e:
            logger.error(f"OpenAI API error: {e}")
            raise LLMException(f"OpenAI error: {e}")


class AnthropicProvider(BaseLLMProvider):
    """Anthropic Claude provider"""
    
    def __init__(self):
        if not settings.ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY not configured")
        
        self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = settings.ANTHROPIC_MODEL
    
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        json_mode: bool = False
    ) -> Dict[str, Any]:
        """Anthropic chat completion"""
        
        # Convert OpenAI format to Anthropic format
        system_message = None
        anthropic_messages = []
        
        for msg in messages:
            if msg["role"] == "system":
                system_message = msg["content"]
            else:
                anthropic_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
        
        params = {
            "model": self.model,
            "messages": anthropic_messages,
            "max_tokens": max_tokens or settings.LLM_MAX_TOKENS,
            "temperature": temperature or settings.LLM_TEMPERATURE
        }
        
        if system_message:
            params["system"] = system_message
        
        try:
            start_time = time.time()
            
            response = self.client.messages.create(**params)
            
            elapsed_ms = int((time.time() - start_time) * 1000)
            
            content = response.content[0].text
            
            # Parse JSON if requested
            if json_mode:
                import json
                try:
                    json.loads(content)  # Validate JSON
                except json.JSONDecodeError:
                    logger.warning("Claude response not valid JSON, trying to extract")
            
            return {
                "content": content,
                "tokens_used": response.usage.input_tokens + response.usage.output_tokens,
                "prompt_tokens": response.usage.input_tokens,
                "completion_tokens": response.usage.output_tokens,
                "model": response.model,
                "response_time_ms": elapsed_ms,
                "provider": "anthropic"
            }
            
        except AnthropicError as e:
            logger.error(f"Anthropic API error: {e}")
            raise LLMException(f"Anthropic error: {e}")


class MultiProviderLLM:
    """
    Multi-provider LLM with automatic fallback
    Primary provider with fallback to secondary
    """
    
    def __init__(self):
        self.primary_provider = None
        self.fallback_provider = None
        
        # Initialize based on configuration
        if settings.LLM_PROVIDER == "openai":
            if settings.OPENAI_API_KEY:
                self.primary_provider = OpenAIProvider()
            if settings.ANTHROPIC_API_KEY:
                self.fallback_provider = AnthropicProvider()
        
        elif settings.LLM_PROVIDER == "anthropic":
            if settings.ANTHROPIC_API_KEY:
                self.primary_provider = AnthropicProvider()
            if settings.OPENAI_API_KEY:
                self.fallback_provider = OpenAIProvider()
        
        if not self.primary_provider:
            raise ValueError(f"No LLM provider configured for {settings.LLM_PROVIDER}")
        
        logger.info(f"LLM initialized: primary={settings.LLM_PROVIDER}, fallback={'yes' if self.fallback_provider else 'no'}")
    
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        json_mode: bool = False,
        max_retries: int = 3
    ) -> Dict[str, Any]:
        """
        Chat completion with automatic fallback
        
        Tries primary provider with retries, falls back to secondary if all fail
        """
        
        # Try primary provider
        for attempt in range(max_retries):
            try:
                result = self.primary_provider.chat_completion(
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    json_mode=json_mode
                )
                
                if json_mode and result.get("content"):
                    import json
                    try:
                        result["parsed"] = json.loads(result["content"])
                    except json.JSONDecodeError:
                        logger.warning("Failed to parse JSON response")
                        result["parsed"] = None
                
                return result
                
            except LLMException as e:
                logger.warning(f"Primary provider attempt {attempt + 1}/{max_retries} failed: {e}")
                
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                    continue
                
                # All primary retries failed, try fallback
                if self.fallback_provider:
                    logger.info("Falling back to secondary LLM provider")
                    try:
                        result = self.fallback_provider.chat_completion(
                            messages=messages,
                            max_tokens=max_tokens,
                            temperature=temperature,
                            json_mode=json_mode
                        )
                        
                        if json_mode and result.get("content"):
                            import json
                            try:
                                result["parsed"] = json.loads(result["content"])
                            except json.JSONDecodeError:
                                result["parsed"] = None
                        
                        return result
                        
                    except LLMException as fallback_error:
                        logger.error(f"Fallback provider also failed: {fallback_error}")
                
                raise LLMException(f"All LLM providers failed after {max_retries} attempts")
        
        raise LLMException("Unexpected error in chat_completion")

