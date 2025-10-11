#!/usr/bin/env python3
"""
Sync grants from Grants.gov API
Run this daily via cron job
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.models.database import SessionLocal
from backend.services.grants.processor import GrantProcessor
from backend.core.logging import setup_logging, get_logger


setup_logging()
logger = get_logger(__name__)


def main():
    logger.info("Starting grant sync...")
    
    db = SessionLocal()
    
    try:
        processor = GrantProcessor(db)
        stats = processor.sync_grants(source="auto")
        
        logger.info(f"✅ Sync complete: {stats}")
        
    except Exception as e:
        logger.error(f"❌ Sync failed: {e}")
        sys.exit(1)
        
    finally:
        db.close()


if __name__ == "__main__":
    main()

