from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# config.py lives at server/config/config.py, so .env is two levels up: server/.env
ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    # e.g. postgresql+psycopg2://user:pass@localhost:5432/docmind
    database_url: str

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30

    model_config = SettingsConfigDict(
        env_file=ENV_FILE, env_file_encoding="utf-8", extra="ignore"
    )


settings = Settings()