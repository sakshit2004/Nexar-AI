import pytest
import sys
import os
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
import unittest.mock

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.main import app
from backend.services.llm.client import LLMClient

@pytest.fixture
def client():
    """FastAPI test client"""
    return TestClient(app)

@pytest.fixture
def mock_llm_provider():
    """Mock for MultiProviderLLM"""
    return MagicMock()

@pytest.fixture
def mock_llm_client(mock_llm_provider):
    """LLMClient with mocked provider"""
    # Patch MultiProviderLLM to prevent real initialization (avoid API key checks)
    with unittest.mock.patch("backend.services.llm.client.MultiProviderLLM") as MockProvider:
        client = LLMClient()
        client.provider = mock_llm_provider
        return client
