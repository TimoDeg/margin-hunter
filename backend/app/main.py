from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from .api import api_router
from .config import get_settings
from .database import Base, engine


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
    health_status = {"status": "ok"}
    
    # Database Connection Check
    if settings.database_url and engine:
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            health_status["database"] = "connected"
        except Exception as e:
            logger.error("health_check_db_failed", error=str(e))
            health_status["database"] = "disconnected"
            health_status["status"] = "degraded"
    else:
        health_status["database"] = "not_configured"
    
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

