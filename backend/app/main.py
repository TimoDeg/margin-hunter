from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import api_router
from .config import get_settings
from .database import Base, engine


logger = structlog.get_logger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # DB-Tabellen sicherstellen (für frühe Entwicklung; später durch Alembic ersetzen)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    logger.info("startup", event="backend_started")
    yield
    logger.info("shutdown", event="backend_stopped")


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


