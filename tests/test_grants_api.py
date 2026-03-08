import pytest
from unittest.mock import patch, MagicMock

def test_list_grants(client):
    """Test listing grants endpoint"""
    # Mock WebSearchService
    with patch("backend.api.v1.routes.grants.WebSearchService") as MockService:
        mock_instance = MockService.return_value
        mock_instance.search_grants.return_value = {
            "grants": [{"id": "1", "title": "Test Grant"}],
            "provider": "openai",
            "response_time_ms": 100
        }
        
        response = client.get("/api/v1/grants")
        
        assert response.status_code == 200
        data = response.json()
        assert "grants" in data
        assert len(data["grants"]) == 1
        assert data["grants"][0]["title"] == "Test Grant"

def test_search_grants(client):
    """Test searching grants endpoint"""
    with patch("backend.api.v1.routes.grants.WebSearchService") as MockService:
        mock_instance = MockService.return_value
        mock_instance.search_grants.return_value = {
            "grants": [],
            "provider": "openai",
            "response_time_ms": 100
        }
        
        response = client.get("/api/v1/grants/search?q=test")
        
        assert response.status_code == 200
        mock_instance.search_grants.assert_called_once()
        call_args = mock_instance.search_grants.call_args[1]
        assert "test" in call_args["query"]

def test_get_grant_details_success(client):
    """Test getting specific grant details (session miss → search_grants → store → return)."""
    with patch("backend.api.v1.routes.grants.WebSearchService") as MockService:
        mock_instance = MockService.return_value
        mock_instance.search_grants.return_value = {
            "grants": [{
                "id": "123456",
                "title": "Specific Grant",
                "agency": "Test Agency",
                "opportunity_number": "123456",
                "url": "https://grants.gov/example",
            }],
            "provider": "openai",
            "response_time_ms": 100,
        }
        response = client.get("/api/v1/grants/123456")
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Specific Grant"
        assert data["id"] == "123456"

def test_get_grant_not_found(client):
    """Test getting non-existent grant"""
    with patch("backend.api.v1.routes.grants.WebSearchService") as MockService:
        mock_instance = MockService.return_value
        # Mock search returning empty list
        mock_instance.search_grants.return_value = {
            "grants": [],
            "provider": "openai",
            "response_time_ms": 100
        }
        
        response = client.get("/api/v1/grants/999999")
        
        assert response.status_code == 404
