from functools import lru_cache

import structlog
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict
from telegram import Bot


logger = structlog.get_logger(__name__)


class Settings(BaseSettings):
    telegram_bot_token: str | None = None
    # Kommagetrennter String aller Chat-IDs, z.B. "12345,67890"
    telegram_chat_ids: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def telegram_chat_ids_list(self) -> list[int]:
        """Parse kommagetrennte Chat-IDs in eine Integer-Liste."""
        if not self.telegram_chat_ids:
            return []
        return [
            int(chat_id.strip())
            for chat_id in self.telegram_chat_ids.split(",")
            if chat_id.strip()
        ]

    @property
    def is_configured(self) -> bool:
        return bool(self.telegram_bot_token and self.telegram_chat_ids_list)


@lru_cache
def get_settings() -> Settings:
    return Settings()


_bot: Bot | None = None


def get_bot() -> Bot:
    settings = get_settings()
    global _bot
    if _bot is None:
        if not settings.telegram_bot_token:
            raise RuntimeError("TELEGRAM_BOT_TOKEN ist nicht gesetzt")
        _bot = Bot(token=settings.telegram_bot_token)
    return _bot


async def send_notification(message: str) -> None:
    """
    Sende eine Nachricht an alle konfigurierten Chat-IDs.
    """
    settings = get_settings()
    if not settings.is_configured:
        logger.warning(
            "telegram_not_configured",
            message="Telegram-Bot ist nicht konfiguriert, Nachricht wird verworfen.",
        )
        return

    bot = get_bot()
    for chat_id in settings.telegram_chat_ids_list:
        try:
            await bot.send_message(chat_id=chat_id, text=message)
        except Exception as exc:  # pragma: no cover - defensive
            logger.error(
                "telegram_send_failed",
                chat_id=chat_id,
                error=str(exc),
            )


class NotifyPayload(BaseModel):
    message: str


app = FastAPI(title="Margin Hunter Telegram Bot")


@app.get("/health")
async def health() -> dict:
    settings = get_settings()
    return {
        "configured": settings.is_configured,
        "chat_ids": settings.telegram_chat_ids_list,
    }


@app.post("/notify")
async def notify(payload: NotifyPayload) -> dict:
    settings = get_settings()
    if not settings.is_configured:
        raise HTTPException(status_code=503, detail="Telegram-Bot ist nicht konfiguriert")

    await send_notification(payload.message)
    return {"detail": "Notification sent"}


