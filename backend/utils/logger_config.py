import logging
import os
from logging.handlers import RotatingFileHandler
from pathlib import Path
from datetime import datetime

def setup_logging():
    """Configure structured logging for the application."""

    # Create logs directory if it doesn't exist
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)

    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    log_file = logs_dir / f"backend_{datetime.now().strftime('%Y%m%d')}.log"

    # Create logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level))

    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(getattr(logging, log_level))
    console_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)

    # File handler with rotation
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=10 * 1024 * 1024,  # 10MB
        backupCount=5,
    )
    file_handler.setLevel(getattr(logging, log_level))
    file_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - [%(funcName)s:%(lineno)d] - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    file_handler.setFormatter(file_formatter)
    root_logger.addHandler(file_handler)

    # Log startup
    root_logger.info(f"Logging initialized at level {log_level}")
    root_logger.info(f"Log file: {log_file}")

    return root_logger


def get_logger(name: str):
    """Get a logger instance for a module."""
    return logging.getLogger(name)
