from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Finde backend-Verzeichnis (1 Ebene hoch von backend/app/config.py)
BACKEND_ROOT = Path(__file__).parent.parent
ENV_FILE = BACKEND_ROOT / ".env"

# Prüfe auch aktuelles Arbeitsverzeichnis
CURRENT_DIR_ENV = Path.cwd() / ".env"
# Verwende die erste existierende .env-Datei (absoluter Pfad)
if ENV_FILE.exists():
    _env_file = str(ENV_FILE.resolve())
elif CURRENT_DIR_ENV.exists():
    _env_file = str(CURRENT_DIR_ENV.resolve())
else:
    _env_file = ".env"


class Settings(BaseSettings):
    database_url: str | None = None
    redis_url: str | None = None

    telegram_bot_token: str | None = None
    # Kommagetrennter String aller Chat-IDs, z.B. "12345,67890"
    telegram_chat_ids: str | None = None

    kleinanzeigen_email: str | None = None
    kleinanzeigen_password: str | None = None

    secret_key: str | None = None
    debug: bool = False

    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    model_config = SettingsConfigDict(
        # env_file wird nur als Fallback verwendet, Environment-Variablen haben Priorität
        env_file=_env_file if Path(_env_file).exists() else None,
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # Ignoriere unbekannte Felder in .env
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


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    
    # Sicherheitsvalidierung: SECRET_KEY muss in Production gesetzt sein
    if not settings.secret_key:
        import structlog
        logger = structlog.get_logger(__name__)
        if not settings.debug:
            # In Production: Fehler werfen
            raise ValueError(
                "SECRET_KEY must be set in production. "
                "Please set SECRET_KEY in your .env file or environment variables."
            )
        else:
            # In Development: Warnung ausgeben
            logger.warning(
                "security_warning",
                message="SECRET_KEY is not set. Using None. This is unsafe for production!",
            )
    
    return settings


