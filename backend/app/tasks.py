from celery import shared_task
from app.celery_config import celery_app
from app.redis_client import set_scraper_status, get_scraper_status
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def test_celery_task(self):
    """Test Task - läuft erfolgreich, wenn Celery funktioniert"""
    try:
        logger.info("✅ Test Celery Task läuft")
        return {"status": "success", "timestamp": datetime.now().isoformat()}
    except Exception as exc:
        logger.error(f"❌ Test Celery Task fehlgeschlagen: {exc}")
        raise self.retry(exc=exc, countdown=5)


@shared_task(bind=True, max_retries=3)
def update_redis_test(self):
    """Test Task - schreibe in Redis"""
    try:
        set_scraper_status(999, {
            "status": "test",
            "timestamp": datetime.now().isoformat(),
            "message": "Redis funktioniert!"
        })
        logger.info("✅ Redis Test erfolgreich")
        return {"status": "redis_ok"}
    except Exception as exc:
        logger.error(f"❌ Redis Test fehlgeschlagen: {exc}")
        raise self.retry(exc=exc, countdown=5)

