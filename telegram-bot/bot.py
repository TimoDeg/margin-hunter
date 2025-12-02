from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    telegram_bot_token: str
    # Kommagetrennter String aller Chat-IDs, z.B. "12345,67890"
    telegram_chat_ids: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    @property
    def telegram_chat_ids_list(self) -> list[int]:
        """Parse kommagetrennte Chat-IDs in eine Integer-Liste."""
        return [
            int(chat_id.strip())
            for chat_id in self.telegram_chat_ids.split(",")
            if chat_id.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()


async def send_notification(bot, message: str) -> None:
    """
    Sende eine Nachricht an alle konfigurierten Chat-IDs.

    `bot` ist eine Instanz deines Telegram-Bots (z.B. aus python-telegram-bot oder aiogram),
    die eine async-Methode `send_message(chat_id=..., text=...)` besitzt.
    """
    settings = get_settings()
    for chat_id in settings.telegram_chat_ids_list:
        await bot.send_message(chat_id=chat_id, text=message)


