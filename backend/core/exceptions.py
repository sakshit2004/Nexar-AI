"""
Custom exceptions for the application
"""


class GrantMatchException(Exception):
    """Base exception"""
    pass


class DatabaseException(GrantMatchException):
    """Database operation failed"""
    pass


class ValidationException(GrantMatchException):
    """Input validation failed"""
    pass


class AuthenticationException(GrantMatchException):
    """Authentication failed"""
    pass


class AuthorizationException(GrantMatchException):
    """Authorization failed"""
    pass


class RateLimitException(GrantMatchException):
    """Rate limit exceeded"""
    pass


class ExternalAPIException(GrantMatchException):
    """External API call failed"""
    pass


class LLMException(GrantMatchException):
    """LLM service error"""
    pass


class PaymentException(GrantMatchException):
    """Payment processing error"""
    pass


class ResourceNotFoundException(GrantMatchException):
    """Resource not found"""
    pass

