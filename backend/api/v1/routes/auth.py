"""Authentication routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.models.database import get_db
from backend.api.v1.schemas.auth import UserRegister, UserLogin, Token, UserResponse
from backend.api.v1.middleware.auth import get_current_user
from backend.repositories.user_repository import UserRepository
from backend.core.security import hash_password, verify_password, create_access_token
from backend.services.email.service import EmailService


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    data: UserRegister,
    db: Session = Depends(get_db)
):
    """Register new user"""
    user_repo = UserRepository(db)
    
    # Check if user exists
    existing = user_repo.get_by_email(data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    hashed_pw = hash_password(data.password)
    user = user_repo.create_user(
        email=data.email,
        hashed_password=hashed_pw,
        full_name=data.full_name
    )
    
    # Send welcome email
    email_service = EmailService()
    try:
        email_service.send_welcome_email(user.email, user.full_name or "there")
    except Exception:
        pass  # Don't fail registration if email fails
    
    return user


@router.post("/login", response_model=Token)
def login(
    data: UserLogin,
    db: Session = Depends(get_db)
):
    """Login and get access token"""
    user_repo = UserRepository(db)
    
    user = user_repo.get_by_email(data.email)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Update last login
    user_repo.update_last_login(user.id)
    
    # Create token
    token = create_access_token({"sub": str(user.id), "email": user.email})
    
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user = Depends(get_current_user)
):
    """Get current user info"""
    return current_user


@router.post("/logout")
def logout():
    """Logout (client should discard token)"""
    return {"message": "Logged out successfully"}

