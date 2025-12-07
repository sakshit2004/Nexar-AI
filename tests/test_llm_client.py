import pytest
from unittest.mock import MagicMock, patch
from backend.services.llm.client import LLMClient

def test_llm_client_initialization():
    """Test LLM client initialization"""
    with patch("backend.services.llm.client.MultiProviderLLM"):
        # We patch MultiProviderLLM to simply return a MagicMock when instantiated
        client = LLMClient()
        assert client.provider is not None
        assert client.max_tokens is not None

def test_chat_completion_success():
    """Test successful chat completion"""
    with patch("backend.services.llm.client.MultiProviderLLM") as MockProviderFn:
        # Setup mock provider instance
        mock_provider_instance = MockProviderFn.return_value
        
        expected_response = {
            "content": "Test response",
            "provider": "openai",
            "tokens_used": 100,
            "response_time_ms": 500
        }
        mock_provider_instance.chat_completion.return_value = expected_response
        
        # Instantiate client
        client = LLMClient()
        
        # Call method
        messages = [{"role": "user", "content": "Hello"}]
        result = client.chat_completion(messages)
        
        # Verify
        assert result == expected_response
        mock_provider_instance.chat_completion.assert_called_once()

def test_chat_completion_with_overrides():
    """Test chat completion with parameter overrides"""
    with patch("backend.services.llm.client.MultiProviderLLM") as MockProviderFn:
        mock_provider_instance = MockProviderFn.return_value
        mock_provider_instance.chat_completion.return_value = {}
        
        client = LLMClient()
        
        # Call with overrides
        messages = [{"role": "user", "content": "Hello"}]
        client.chat_completion(
            messages=messages,
            max_tokens=500,
            temperature=0.7,
            json_mode=True,
            max_retries=1
        )
        
        # Verify overrides passed to provider
        mock_provider_instance.chat_completion.assert_called_once_with(
            messages=messages,
            max_tokens=500,
            temperature=0.7,
            json_mode=True,
            max_retries=1
        )
