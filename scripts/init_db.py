#!/usr/bin/env python3
"""
Initialize database - create all tables
Run once before first launch
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.models.database import init_db
from backend.core.logging import setup_logging, get_logger


setup_logging()
logger = get_logger(__name__)


def main():
    logger.info("Initializing database...")
    
    try:
        init_db()
        logger.info("✅ Database initialized successfully!")
        logger.info("All tables created")
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

