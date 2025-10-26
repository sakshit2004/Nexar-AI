"""Webhook routes for external services"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.orm import Session
import stripe

from backend.models.database import get_db
from backend.core.config import settings
from backend.core.logging import get_logger
from backend.services.payment.stripe_service import StripeService


logger = get_logger(__name__)
router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
    db: Session = Depends(get_db)
):
    """Handle Stripe webhook events"""
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Stripe webhooks not configured"
        )
    
    payload = await request.body()
    
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payload"
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid signature"
        )
    
    # Handle event
    stripe_service = StripeService(db)
    
    try:
        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            stripe_service.handle_checkout_completed(session)
            logger.info(f"Handled checkout.session.completed")
            
        elif event["type"] == "customer.subscription.updated":
            subscription = event["data"]["object"]
            stripe_service.handle_subscription_updated(subscription)
            logger.info(f"Handled customer.subscription.updated")
            
        elif event["type"] == "customer.subscription.deleted":
            subscription = event["data"]["object"]
            stripe_service.handle_subscription_updated(subscription)
            logger.info(f"Handled customer.subscription.deleted")
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Webhook handler error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook processing failed"
        )

