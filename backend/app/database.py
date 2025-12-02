from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from .config import get_settings


settings = get_settings()


class Base(DeclarativeBase):
    pass


# Engine nur erstellen, wenn DATABASE_URL gesetzt ist
if settings.database_url:
    engine = create_async_engine(settings.database_url, echo=settings.debug, future=True)
    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
else:
    engine = None
    AsyncSessionLocal = None


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    if AsyncSessionLocal is None:
        raise RuntimeError("Database not configured. Please set DATABASE_URL in your .env file.")
    async with AsyncSessionLocal() as session:
        yield session


