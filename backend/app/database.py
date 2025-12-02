from collections.abc import AsyncGenerator

from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import get_settings


settings = get_settings()


class Base(DeclarativeBase):
    pass


# Async Engine für FastAPI (asyncpg Driver)
if settings.database_url:
    engine = create_async_engine(settings.database_url, echo=settings.debug, future=True)
    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
else:
    engine = None
    AsyncSessionLocal = None


# Sync Engine für Celery (psycopg2 Driver)
# WICHTIG: Celery benötigt sync SQLAlchemy!
if settings.database_url_sync:
    sync_engine = create_engine(settings.database_url_sync, echo=settings.debug, future=True)
    SyncSessionLocal = sessionmaker(bind=sync_engine, autocommit=False, autoflush=False)
else:
    sync_engine = None
    SyncSessionLocal = None


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Async Session für FastAPI Endpoints."""
    if AsyncSessionLocal is None:
        raise RuntimeError("Database not configured. Please set DATABASE_URL in your .env file.")
    async with AsyncSessionLocal() as session:
        yield session


def get_sync_session():
    """Sync Session für Celery Tasks.
    
    WICHTIG: Verwende diese Funktion nur in Celery Tasks!
    Für FastAPI Endpoints: verwende get_session() (async).
    """
    if SyncSessionLocal is None:
        raise RuntimeError(
            "Sync database not configured. Please set DATABASE_URL_SYNC in your .env file."
        )
    session = SyncSessionLocal()
    try:
        yield session
    finally:
        session.close()


