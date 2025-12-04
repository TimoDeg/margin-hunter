from celery import Celery
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)

settings = get_settings()

celery_app = Celery(
    "margin_hunter",
    broker=settings.redis_url or "redis://localhost:6379/0",
    backend=settings.redis_url or "redis://localhost:6379/1"
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,
    worker_prefetch_multiplier=1,
)

@celery_app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')

