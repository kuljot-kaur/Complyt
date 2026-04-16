import logging
import json
import uuid
import sys

def get_logger():
    logger = logging.getLogger("complyt_logger")
    logger.setLevel(logging.INFO)

    # All logs to stdout for Promtail
    handler = logging.StreamHandler(sys.stdout)

    # Standardized JSON formatter
    class JSONFormatter(logging.Formatter):
        def format(self, record):
            log_record = {
                "time": self.formatTime(record, self.datefmt),
                "level": record.levelname,
                "message": record.msg % record.args if record.args else record.msg,
            }
            # Merge extra kwargs from log calls
            if hasattr(record, "extra_data"):
                log_record.update(record.extra_data)
            return json.dumps(log_record)

    handler.setFormatter(JSONFormatter())
    logger.addHandler(handler)
    # Don't propagate to root logger to avoid double logging
    logger.propagate = False
    return logger

logger = get_logger()

def log_info(message, **kwargs):
    logger.info(message, extra={"extra_data": kwargs})

def log_error(message, **kwargs):
    logger.error(message, extra={"extra_data": kwargs})

def generate_request_id():
    return str(uuid.uuid4())
