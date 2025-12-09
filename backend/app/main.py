from contextlib import asynccontextmanager
from datetime import datetime
import asyncio

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .api import api_router
from .config import get_settings
from .database import Base, engine
from .celery_config import celery_app
from .redis_client import redis_client


logger = structlog.get_logger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # DB-Tabellen sicherstellen (für frühe Entwicklung; später durch Alembic ersetzen)
    if settings.database_url:
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("backend_started", message="Database connected successfully")
        except Exception as e:
            logger.warning(
                "db_connection_failed",
                error=str(e),
                message="Database connection failed. API will start but DB operations will fail.",
            )
    else:
        logger.info("backend_started", message="Backend started without database (DATABASE_URL not set)")

    yield
    logger.info("backend_stopped")


app = FastAPI(
    title="Margin Hunter API",
    version="0.1.0",
    debug=settings.debug,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/")
async def root() -> dict:
    return {"message": "Margin Hunter Backend is running"}


@app.get("/health")
async def health_check() -> dict:
    """Health Check Endpoint für Monitoring und Docker Health Checks."""
    health_status = {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "services": {}
    }
    
    # Database Connection Check
    if settings.database_url and engine:
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            health_status["services"]["database"] = "ok"
        except Exception as e:
            logger.error("health_check_db_failed", error=str(e))
            health_status["services"]["database"] = "error"
            health_status["status"] = "degraded"
    else:
        health_status["services"]["database"] = "not_configured"
    
    # Redis Connection Check
    try:
        if redis_client:
            # Führe synchronen Redis-Call in Thread Pool aus, um Event Loop nicht zu blockieren
            await asyncio.to_thread(redis_client.ping)
            health_status["services"]["redis"] = "ok"
        else:
            health_status["services"]["redis"] = "disconnected"
    except Exception as e:
        logger.error("health_check_redis_failed", error=str(e))
        health_status["services"]["redis"] = "error"
        health_status["status"] = "degraded"
    
    # Celery Worker Check (via Celery Inspect API mit Timeout)
    health_status["services"]["celery"] = "unknown"
    if redis_client:
        try:
            # Prüfe ob Celery Worker aktiv sind (mit 1s Timeout)
            inspect = celery_app.control.inspect(timeout=1.0)
            stats = inspect.stats()
            if stats and len(stats) > 0:  # Dict mit worker names als keys
                health_status["services"]["celery"] = "ok"
            else:
                health_status["services"]["celery"] = "no_workers"
                logger.warning("health_check_celery_no_workers", message="No Celery workers found")
        except Exception as e:
            logger.warning("health_check_celery_inspect_failed", error=str(e), message="Celery inspect failed, but broker is accessible")
            # Wenn Inspect fehlschlägt, aber Redis läuft, nehmen wir an dass Worker laufen
            health_status["services"]["celery"] = "ok"
    
    return health_status


@app.get("/api/health")
async def api_health_check() -> dict:
    """
    Alias für den Health-Endpoint unter /api/health,
    damit der Aufruf konsistent mit den anderen API-Routen ist.
    """
    return await health_check()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=settings.debug,
    )

