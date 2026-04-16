"""
config.py — Logging & environment configuration for the AI pipeline
"""

import logging
import logging.handlers
import os
from pathlib import Path
import contextvars

request_id_var: contextvars.ContextVar[str] = contextvars.ContextVar("request_id", default="-")

class RequestIdFilter(logging.Filter):
    def filter(self, record):
        record.request_id = request_id_var.get()
        return True

# Load environment variables from .env file (project root)
try:
    from dotenv import load_dotenv
    # Find project root (.env should be there)
    current_dir = Path(__file__).parent  # app/
    project_root = current_dir.parent.parent  # project root
    env_file = project_root / ".env"
    if env_file.exists():
        load_dotenv(env_file)
    else:
        # Fall back to searching current dir and parent
        load_dotenv()
except ImportError:
    pass  # python-dotenv not installed, fall back to system env vars

# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------

def setup_logging(log_dir: str = "/tmp/complyt_logs", level: int = logging.INFO) -> None:
    """
    Configure logging for all pipeline modules.
    
    Args:
        log_dir: Directory to write log files to.
        level: Logging level (default: INFO).
    """
    log_path = Path(log_dir)
    log_path.mkdir(parents=True, exist_ok=True)

    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # File handler — rotating logs
    file_handler = logging.handlers.RotatingFileHandler(
        log_path / "pipeline.log",
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5,
    )
    file_handler.setLevel(level)

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(level)

    # Formatter
    formatter = logging.Formatter(
        "[%(asctime)s] [%(request_id)s] [%(name)s] [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    req_filter = RequestIdFilter()
    file_handler.addFilter(req_filter)
    console_handler.addFilter(req_filter)

    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)


# ---------------------------------------------------------------------------
# Environment variables
# ---------------------------------------------------------------------------

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
TEMP_DIR = os.environ.get("TEMP_DIR", "/tmp/complyt")
LOG_DIR = os.environ.get("LOG_DIR", "/tmp/complyt_logs")

# Person B infra settings
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./complyt.db")
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "./uploads")
MAX_FILE_SIZE_BYTES = int(os.environ.get("MAX_FILE_SIZE_BYTES", str(25 * 1024 * 1024)))

JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-secret-only")
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.environ.get("JWT_EXPIRE_MINUTES", "60"))
FERNET_KEY = os.environ.get("FERNET_KEY", "")

# Ensure temp directory exists
Path(TEMP_DIR).mkdir(parents=True, exist_ok=True)
Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Supported file extensions for document upload
SUPPORTED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".tif", ".webp"}

# OCR confidence threshold
OCR_MIN_CONFIDENCE = 0.5

# Gemini model to use
GEMINI_MODEL = "gemini-1.5-flash"

# Token safety cap for Gemini prompts (avoid hitting token limits)
GEMINI_TOKEN_CAP = 12_000

# Error severity levels
SEVERITY_ERROR = "error"
SEVERITY_WARNING = "warning"

# Compliance score thresholds
COMPLIANCE_SCORE_EXCELLENT = 90
COMPLIANCE_SCORE_GOOD = 75
COMPLIANCE_SCORE_FAIR = 50
