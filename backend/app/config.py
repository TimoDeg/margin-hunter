from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings

# Finde Projekt-Root (2 Ebenen hoch von backend/app/config.py)
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
ENV_FILE = PROJECT_ROOT/ "backend" / ".env"


class Settings(BaseSettings):
    database_url: str
    redis_url: str

    telegram_bot_token: str | None = None
    # Kommagetrennter String aller Chat-IDs, z.B. "12345,67890"
    telegram_chat_ids: str | None = None

    kleinanzeigen_email: str | None = None
    kleinanzeigen_password: str | None = None

    secret_key: str
    debug: bool = False

    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    class Config:
        env_file = str(ENV_FILE) if ENV_FILE.exists() else ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

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


@lru_cache
def get_settings() -> Settings:
    return Settings()


