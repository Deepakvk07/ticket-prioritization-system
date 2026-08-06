"""
Email Service — Free Gmail SMTP notifications using Python's built-in smtplib.
Zero cost, no paid third-party APIs required.
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import get_settings

logger = logging.getLogger(__name__)


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Send an HTML email via Gmail SMTP using App Password."""
    settings = get_settings()

    if not settings.smtp_user or not settings.smtp_password:
        logger.warning(
            "SMTP credentials not configured. Skipping email notification to %s. "
            "Add SMTP_USER and SMTP_PASSWORD in backend/.env to enable free Gmail sending.",
            to_email
        )
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_user}>"
        msg["To"] = to_email

        html_part = MIMEText(html_body, "html", "utf-8")
        msg.attach(html_part)

        # Connect to Gmail SMTP (Port 587 with TLS)
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_user, [to_email], msg.as_string())

        logger.info("Successfully sent email notification to %s: '%s'", to_email, subject)
        return True
    except Exception as e:
        logger.error("Failed to send email notification to %s: %s", to_email, str(e))
        return False


def send_ticket_created_email(to_email: str, customer_name: str, ticket_code: str, ticket_subject: str, priority: str):
    """Notify customer when a new ticket is submitted and triaged."""
    if not to_email:
        return

    track_url = f"{get_settings().frontend_url}/track"
    priority_color = "#ef4444" if priority == "Critical" else "#f97316" if priority == "High" else "#3b82f6"

    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f7fa; margin: 0; padding: 20px; color: #1e293b;">
        <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 32px; color: #ffffff;">
                <div style="font-size: 1.25rem; font-weight: 800; letter-spacing: -0.02em;">TicketFlow AI</div>
                <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">Smart Enterprise Support System</div>
            </div>
            
            <div style="padding: 32px;">
                <h2 style="font-size: 1.3rem; margin-top: 0; color: #0f172a;">Ticket #{ticket_code} Received</h2>
                <p style="font-size: 0.95rem; line-height: 1.6; color: #475569;">
                    Hi <strong>{customer_name or 'Customer'}</strong>,<br>
                    Your support request has been received and automatically triaged by our neural engine.
                </p>

                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 20px 0;">
                    <div style="font-size: 0.78rem; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">Subject</div>
                    <div style="font-weight: 700; font-size: 1.05rem; color: #0f172a; margin-bottom: 12px;">{ticket_subject}</div>
                    
                    <div style="display: flex; gap: 16px;">
                        <div>
                            <span style="font-size: 0.78rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Priority: </span>
                            <span style="font-weight: 700; color: {priority_color};">{priority}</span>
                        </div>
                    </div>
                </div>

                <p style="font-size: 0.9rem; color: #64748b;">Our engineering team is actively reviewing your issue and will respond shortly.</p>

                <div style="margin-top: 28px; text-align: center;">
                    <a href="{track_url}" style="display: inline-block; padding: 12px 28px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 0.9rem;">
                        Track Ticket Status Live →
                    </a>
                </div>
            </div>

            <div style="background: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 0.78rem; color: #94a3b8;">
                TicketFlow AI Support System &bull; Automatic Notification
            </div>
        </div>
    </body>
    </html>
    """
    send_email(to_email, f"[{ticket_code}] Support Request Received: {ticket_subject}", html)


def send_activity_reply_email(to_email: str, customer_name: str, ticket_code: str, ticket_subject: str, author_name: str, reply_content: str):
    """Notify customer when an agent posts a reply to their ticket."""
    if not to_email:
        return

    track_url = f"{get_settings().frontend_url}/track"

    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f7fa; margin: 0; padding: 20px; color: #1e293b;">
        <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px 32px; color: #ffffff;">
                <div style="font-size: 1.25rem; font-weight: 800; letter-spacing: -0.02em;">TicketFlow AI</div>
                <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">Support Notification</div>
            </div>
            
            <div style="padding: 32px;">
                <h2 style="font-size: 1.2rem; margin-top: 0; color: #0f172a;">New Response on Ticket #{ticket_code}</h2>
                <p style="font-size: 0.95rem; color: #475569;">
                    Hi <strong>{customer_name or 'Customer'}</strong>,<br>
                    <strong>{author_name or 'Support Specialist'}</strong> has posted a response to your ticket:
                </p>

                <div style="background: #f0f7ff; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 16px; margin: 18px 0; font-size: 0.92rem; color: #1e3a8a; line-height: 1.6; white-space: pre-wrap;">
                    {reply_content}
                </div>

                <div style="margin-top: 28px; text-align: center;">
                    <a href="{track_url}" style="display: inline-block; padding: 12px 28px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 0.9rem;">
                        View Full Discussion &amp; Reply →
                    </a>
                </div>
            </div>

            <div style="background: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 0.78rem; color: #94a3b8;">
                TicketFlow AI Support System
            </div>
        </div>
    </body>
    </html>
    """
    send_email(to_email, f"Re: [{ticket_code}] New response from Support Team", html)
