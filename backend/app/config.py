from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "SODA KANBA API"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/soda_kanba"
    redis_url: str = "redis://localhost:6379/0"

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    aws_region: str = "us-east-1"
    s3_bucket: str = "soda-kanba-attachments"
    s3_endpoint_url: str | None = None
    ses_from_email: str = "noreply@soda-kanba.local"
    frontend_url: str = "http://localhost:5173"

    presigned_url_expire_seconds: int = 900


@lru_cache
def get_settings() -> Settings:
    return Settings()
