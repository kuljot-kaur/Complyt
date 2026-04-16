import logging
import random
import string

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_otp(email: str, otp: str):
        """
        Mock email delivery. In a production environment, 
        this would interface with SendGrid, AWS SES, or an SMTP server.
        """
        logger.info("--------------------------------------------------")
        logger.info(f"📧 [MOCK EMAIL] To: {email}")
        logger.info(f"🔑 Your Complyt AI Verification Code: {otp}")
        logger.info("--------------------------------------------------")
        
        # For pure console visibility when running in docker
        print(f"\n >>> [MOCK EMAIL] OTP for {email}: {otp} <<<\n")

def generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))
