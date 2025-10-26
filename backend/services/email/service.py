"""
Email service using SendGrid
"""
from typing import List, Optional, Dict, Any
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
import html

from backend.core.config import settings
from backend.core.logging import get_logger
from backend.core.exceptions import ExternalAPIException


logger = get_logger(__name__)


class EmailService:
    """Production email service with templates"""
    
    def __init__(self):
        if settings.SENDGRID_API_KEY:
            self.client = SendGridAPIClient(settings.SENDGRID_API_KEY)
            self.from_email = settings.SENDGRID_FROM_EMAIL
        else:
            self.client = None
            logger.warning("SendGrid not configured - emails will not be sent")
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        plain_content: Optional[str] = None
    ) -> bool:
        """
        Send email
        
        Args:
            to_email: Recipient email
            subject: Email subject
            html_content: HTML body
            plain_content: Plain text fallback
        
        Returns:
            True if sent successfully
        """
        if not self.client:
            logger.warning(f"Email not sent (SendGrid not configured): {subject} to {to_email}")
            return False
        
        try:
            message = Mail(
                from_email=self.from_email,
                to_emails=to_email,
                subject=subject,
                html_content=html_content,
                plain_text_content=plain_content or html.unescape(html_content)
            )
            
            response = self.client.send(message)
            
            if response.status_code in [200, 202]:
                logger.info(f"Email sent to {to_email}: {subject}")
                return True
            else:
                logger.error(f"Email failed (status {response.status_code}): {to_email}")
                return False
                
        except Exception as e:
            logger.error(f"Email error: {e}")
            raise ExternalAPIException(f"SendGrid error: {e}")
    
    def send_welcome_email(self, to_email: str, user_name: str) -> bool:
        """Send welcome email to new user"""
        subject = f"Welcome to {settings.APP_NAME}!"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Welcome to GrantMatch Advisor! 🎉</h1>
            
            <p>Hi {user_name},</p>
            
            <p>Thanks for signing up! You now have access to:</p>
            
            <ul>
                <li>✅ AI-powered grant matching</li>
                <li>✅ Plain-English grant summaries</li>
                <li>✅ 5 free queries per week</li>
                <li>✅ Weekly grant alerts</li>
            </ul>
            
            <p><strong>Next steps:</strong></p>
            <ol>
                <li>Complete your organization profile</li>
                <li>Get matched with federal grants instantly</li>
                <li>Ask questions about grants via our AI assistant</li>
            </ol>
            
            <p>
                <a href="{settings.APP_URL}/profile" 
                   style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Complete Your Profile →
                </a>
            </p>
            
            <p>Questions? Just reply to this email.</p>
            
            <p>Best,<br>The GrantMatch Team</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="font-size: 12px; color: #6b7280;">
                You're receiving this because you signed up for GrantMatch Advisor.
            </p>
        </body>
        </html>
        """
        
        return self.send_email(to_email, subject, html_content)
    
    def send_match_alert(
        self,
        to_email: str,
        user_name: str,
        matches: List[Dict[str, Any]]
    ) -> bool:
        """Send grant match alert"""
        count = len(matches)
        subject = f"{count} New Grant{'s' if count != 1 else ''} Match Your Profile"
        
        grants_html = ""
        for match in matches[:5]:  # Top 5
            grants_html += f"""
            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                <h3 style="margin-top: 0; color: #1f2937;">
                    {match['title']}
                </h3>
                <p style="color: #6b7280; margin: 8px 0;">
                    <strong>Agency:</strong> {match['agency']}<br>
                    <strong>Score:</strong> {match['score']}/100 | 
                    <strong>Deadline:</strong> {match.get('close_date', 'TBD')}
                </p>
                <p style="margin: 12px 0;">{match.get('reasoning', '')}</p>
                <a href="{settings.APP_URL}/grants/{match['grant_id']}" 
                   style="color: #2563eb; text-decoration: none;">
                    View Details →
                </a>
            </div>
            """
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">New Grants Match Your Profile!</h1>
            
            <p>Hi {user_name},</p>
            
            <p>We found <strong>{count} new federal grant{'s' if count != 1 else ''}</strong> that match your organization:</p>
            
            {grants_html}
            
            <p>
                <a href="{settings.APP_URL}/matches" 
                   style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    See All Matches →
                </a>
            </p>
            
            <p>Best,<br>The GrantMatch Team</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="font-size: 12px; color: #6b7280;">
                <a href="{settings.APP_URL}/settings/alerts" style="color: #6b7280;">Manage alert preferences</a> | 
                <a href="{settings.APP_URL}/settings/unsubscribe" style="color: #6b7280;">Unsubscribe</a>
            </p>
        </body>
        </html>
        """
        
        return self.send_email(to_email, subject, html_content)
    
    def send_verification_email(self, to_email: str, verification_token: str) -> bool:
        """Send email verification link"""
        verification_url = f"{settings.APP_URL}/verify-email?token={verification_token}"
        
        subject = "Verify Your Email Address"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Verify Your Email</h1>
            
            <p>Click the button below to verify your email address:</p>
            
            <p>
                <a href="{verification_url}" 
                   style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Verify Email →
                </a>
            </p>
            
            <p style="font-size: 14px; color: #6b7280;">
                Or copy and paste this link:<br>
                <code style="background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">{verification_url}</code>
            </p>
            
            <p style="font-size: 12px; color: #6b7280;">
                This link expires in 24 hours.
            </p>
        </body>
        </html>
        """
        
        return self.send_email(to_email, subject, html_content)
    
    def send_upgrade_confirmation(self, to_email: str, user_name: str) -> bool:
        """Send premium upgrade confirmation"""
        subject = "Welcome to GrantMatch Premium! 🎉"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">You're Now Premium! 🚀</h1>
            
            <p>Hi {user_name},</p>
            
            <p>Your Premium subscription is now active. You now have:</p>
            
            <ul>
                <li>✅ <strong>Unlimited queries</strong> - No more weekly limits</li>
                <li>✅ <strong>Daily grant alerts</strong> - Never miss an opportunity</li>
                <li>✅ <strong>PDF/CSV exports</strong> - Download your matches</li>
                <li>✅ <strong>Priority support</strong> - Faster response times</li>
            </ul>
            
            <p>
                <a href="{settings.APP_URL}/matches" 
                   style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Explore Your Matches →
                </a>
            </p>
            
            <p>Thank you for supporting GrantMatch Advisor!</p>
            
            <p>Best,<br>The GrantMatch Team</p>
        </body>
        </html>
        """
        
        return self.send_email(to_email, subject, html_content)

