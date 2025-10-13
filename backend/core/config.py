"""
Production Configuration Management
Environment-based settings with validation
"""
from functools import lru_cache
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import Field, validator


class Settings(BaseSettings):
    """Application settings with validation"""
    
    # Application
    APP_NAME: str = "GrantMatch Advisor"
    APP_VERSION: str = "1.0.0"
    APP_URL: str = Field(default="http://localhost:8000", env="APP_URL")
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=False, env="DEBUG")
    API_V1_PREFIX: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = Field(..., env="SECRET_KEY")
    JWT_SECRET: str = Field(..., env="JWT_SECRET")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALLOWED_HOSTS: List[str] = ["*"]
    
    # Database
    DATABASE_URL: str = Field(default="sqlite:///./grantmatch.db", env="DATABASE_URL")
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    
    # Redis (for caching & rate limiting)
    REDIS_URL: Optional[str] = Field(default=None, env="REDIS_URL")
    CACHE_TTL: int = 3600
    
    # Grants APIs
    GRANTS_GOV_API_KEY: Optional[str] = Field(default=None, env="GRANTS_GOV_API_KEY")
    GRANTS_GOV_BASE_URL: str = "https://www.grants.gov/grantsws/rest/opportunities"
    SIMPLER_GRANTS_API_KEY: Optional[str] = Field(default=None, env="SIMPLER_GRANTS_API_KEY")
    SIMPLER_GRANTS_BASE_URL: str = "https://api.simpler.grants.gov/v1"
    
    # LLM Configuration
    LLM_PROVIDER: str = Field(default="openai", env="LLM_PROVIDER")  # "openai" or "anthropic"
    
    # OpenAI (Primary)
    OPENAI_API_KEY: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    # Anthropic Claude (Fallback)
    ANTHROPIC_API_KEY: Optional[str] = Field(default=None, env="ANTHROPIC_API_KEY")
    ANTHROPIC_MODEL: str = "claude-3-haiku-20240307"
    
    # Common LLM settings
    LLM_MAX_TOKENS: int = 2000
    LLM_TEMPERATURE: float = 0.3
    LLM_TIMEOUT: int = 30
    
    @property
    def active_llm_key(self) -> Optional[str]:
        """Get the active LLM API key based on provider"""
        if self.LLM_PROVIDER == "anthropic":
            return self.ANTHROPIC_API_KEY
        return self.OPENAI_API_KEY
    
    # Email
    SENDGRID_API_KEY: Optional[str] = Field(default=None, env="SENDGRID_API_KEY")
    SENDGRID_FROM_EMAIL: str = Field(default="noreply@yourdomain.com", env="SENDGRID_FROM_EMAIL")
    SENDGRID_FROM_NAME: str = Field(default="GrantMatch Advisor", env="SENDGRID_FROM_NAME")
    
    # Stripe
    STRIPE_PUBLISHABLE_KEY: Optional[str] = Field(default=None, env="STRIPE_PUBLISHABLE_KEY")
    STRIPE_SECRET_KEY: Optional[str] = Field(default=None, env="STRIPE_SECRET_KEY")
    STRIPE_WEBHOOK_SECRET: Optional[str] = Field(default=None, env="STRIPE_WEBHOOK_SECRET")
    STRIPE_PREMIUM_PRICE_ID: Optional[str] = Field(default=None, env="STRIPE_PREMIUM_PRICE_ID")
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    FREE_TIER_RATE_LIMIT: str = "5/week"
    PREMIUM_TIER_RATE_LIMIT: str = "1000/day"
    
    # Feature Flags
    FREE_TIER_QUERIES_PER_WEEK: int = 5
    PREMIUM_TIER_QUERIES_PER_WEEK: int = 9999
    GRANT_CACHE_TTL: int = 86400  # 24 hours in seconds
    SUMMARY_CACHE_TTL: int = 604800  # 7 days in seconds
    GRANTS_SYNC_ENABLED: bool = True
    GRANTS_SYNC_HOUR: int = 2  # 2 AM
    
    ENABLE_EMAIL_ALERTS: bool = True
    ENABLE_PAYMENTS: bool = True
    ENABLE_ANALYTICS: bool = True
    
    # Monitoring
    SENTRY_DSN: Optional[str] = Field(default=None, env="SENTRY_DSN")
    LOG_LEVEL: str = "INFO"
    
    @validator("ENVIRONMENT")
    def validate_environment(cls, v):
        allowed = ["development", "staging", "production"]
        if v not in allowed:
            raise ValueError(f"ENVIRONMENT must be one of {allowed}")
        return v
    
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"
    
    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"
    
    class Config:
        env_file = ["config/.env", ".env"]  # Check config/.env first, then root .env
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields in .env file


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance"""
    return Settings()


settings = get_settings()

