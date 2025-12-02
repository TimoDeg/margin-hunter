from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    redis_url: str

    telegram_bot_token: str | None = None
    telegram_chat_id: str | None = None

    kleinanzeigen_email: str | None = None
    kleinanzeigen_password: str | None = None

    secret_key: str
    debug: bool = False

    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()


