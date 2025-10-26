"""
Stripe payment service
"""
from typing import Dict, Any, Optional
import stripe
from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.core.logging import get_logger
from backend.core.exceptions import PaymentException
from backend.models.user import User, UserTier
from backend.repositories.user_repository import UserRepository


logger = get_logger(__name__)


if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY


class StripeService:
    """Stripe integration for subscriptions"""
    
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        
        if not settings.STRIPE_SECRET_KEY:
            logger.warning("Stripe not configured")
    
    def create_customer(self, user_id: int, email: str) -> str:
        """
        Create Stripe customer
        
        Returns:
            customer_id
        """
        if not settings.STRIPE_SECRET_KEY:
            raise PaymentException("Stripe not configured")
        
        try:
            customer = stripe.Customer.create(
                email=email,
                metadata={"user_id": user_id}
            )
            
            # Update user with customer ID
            user = self.user_repo.get(user_id)
            if user:
                user.stripe_customer_id = customer.id
                self.db.commit()
            
            logger.info(f"Created Stripe customer {customer.id} for user {user_id}")
            return customer.id
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe customer creation failed: {e}")
            raise PaymentException(f"Failed to create customer: {e}")
    
    def create_checkout_session(
        self,
        user_id: int,
        success_url: str,
        cancel_url: str
    ) -> Dict[str, Any]:
        """
        Create Stripe checkout session for Premium subscription
        
        Returns:
            Dict with session ID and checkout URL
        """
        if not settings.STRIPE_SECRET_KEY or not settings.STRIPE_PREMIUM_PRICE_ID:
            raise PaymentException("Stripe not configured")
        
        user = self.user_repo.get(user_id)
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        # Create customer if doesn't exist
        customer_id = user.stripe_customer_id
        if not customer_id:
            customer_id = self.create_customer(user_id, user.email)
        
        try:
            session = stripe.checkout.Session.create(
                customer=customer_id,
                mode="subscription",
                line_items=[{
                    "price": settings.STRIPE_PREMIUM_PRICE_ID,
                    "quantity": 1
                }],
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={"user_id": user_id}
            )
            
            logger.info(f"Created checkout session {session.id} for user {user_id}")
            
            return {
                "session_id": session.id,
                "checkout_url": session.url
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe checkout session failed: {e}")
            raise PaymentException(f"Failed to create checkout: {e}")
    
    def handle_checkout_completed(self, session: Dict[str, Any]) -> None:
        """Handle successful checkout"""
        user_id = int(session["metadata"]["user_id"])
        subscription_id = session.get("subscription")
        
        # Upgrade user to premium
        self.user_repo.update_tier(user_id, UserTier.PREMIUM)
        
        # Store subscription ID
        user = self.user_repo.get(user_id)
        if user:
            user.stripe_subscription_id = subscription_id
            self.db.commit()
        
        logger.info(f"User {user_id} upgraded to Premium (subscription {subscription_id})")
    
    def handle_subscription_updated(self, subscription: Dict[str, Any]) -> None:
        """Handle subscription status changes"""
        customer_id = subscription["customer"]
        status = subscription["status"]
        
        user = self.user_repo.get_by_stripe_customer_id(customer_id)
        if not user:
            logger.warning(f"User not found for customer {customer_id}")
            return
        
        if status == "active":
            self.user_repo.update_tier(user.id, UserTier.PREMIUM)
            logger.info(f"User {user.id} subscription active")
        elif status in ["canceled", "unpaid", "past_due"]:
            self.user_repo.update_tier(user.id, UserTier.FREE)
            logger.info(f"User {user.id} downgraded to Free (status: {status})")
    
    def cancel_subscription(self, user_id: int) -> bool:
        """Cancel user's subscription"""
        user = self.user_repo.get(user_id)
        if not user or not user.stripe_subscription_id:
            return False
        
        try:
            stripe.Subscription.delete(user.stripe_subscription_id)
            
            # Downgrade user
            self.user_repo.update_tier(user_id, UserTier.FREE)
            
            logger.info(f"Canceled subscription for user {user_id}")
            return True
            
        except stripe.error.StripeError as e:
            logger.error(f"Subscription cancellation failed: {e}")
            raise PaymentException(f"Failed to cancel subscription: {e}")
    
    def get_subscription_status(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get subscription details"""
        user = self.user_repo.get(user_id)
        if not user or not user.stripe_subscription_id:
            return None
        
        try:
            subscription = stripe.Subscription.retrieve(user.stripe_subscription_id)
            
            return {
                "status": subscription.status,
                "current_period_end": subscription.current_period_end,
                "cancel_at_period_end": subscription.cancel_at_period_end
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Failed to retrieve subscription: {e}")
            return None

