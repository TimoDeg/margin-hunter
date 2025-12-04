import redis
import json
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)

settings = get_settings()

try:
    redis_client = redis.Redis.from_url(settings.redis_url)
    redis_client.ping()
    logger.info("✅ Redis connected")
except Exception as e:
    logger.error(f"❌ Redis connection failed: {e}")
    redis_client = None


def set_scraper_status(product_id: int, status: dict):
    """Speichere Scraper-Status mit 1h Expiry"""
    if not redis_client:
        return
    key = f"scraper:status:{product_id}"
    try:
        redis_client.setex(key, 3600, json.dumps(status))
    except Exception as e:
        logger.error(f"Error setting scraper status: {e}")


def get_scraper_status(product_id: int):
    """Hole Scraper-Status"""
    if not redis_client:
        return None
    key = f"scraper:status:{product_id}"
    try:
        val = redis_client.get(key)
        return json.loads(val) if val else None
    except Exception as e:
        logger.error(f"Error getting scraper status: {e}")
        return None


def get_all_scraper_statuses():
    """Hole alle Scraper-Status"""
    if not redis_client:
        return {}
    try:
        keys = redis_client.keys("scraper:status:*")
        return {k.decode(): json.loads(redis_client.get(k)) for k in keys}
    except Exception as e:
        logger.error(f"Error getting all statuses: {e}")
        return {}

