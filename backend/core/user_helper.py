"""
Simple hardcoded user for session-based app (no authentication)
"""
from typing import Dict, Any

# Hardcoded user - no authentication needed
HARDCODED_USER = {
    "id": 1,
    "email": "user@example.com",
    "full_name": "Demo User",
    "tier": "premium"  # Give premium tier for unlimited searches
}


def get_hardcoded_user() -> Dict[str, Any]:
    """Get the hardcoded user"""
    return HARDCODED_USER.copy()


class MockUser:
    """Mock user object to match existing User model interface"""
    
    def __init__(self):
        self.id = HARDCODED_USER["id"]
        self.email = HARDCODED_USER["email"]
        self.full_name = HARDCODED_USER["full_name"]
        self.tier = MockTier(HARDCODED_USER["tier"])
    
    def __dict__(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "tier": self.tier.value
        }


class MockTier:
    """Mock tier enum"""
    def __init__(self, value: str):
        self.value = value


def get_current_user_simple():
    """Get the hardcoded user (no auth required)"""
    return MockUser()

