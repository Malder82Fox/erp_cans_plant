"""Application configuration using Pydantic settings."""
from __future__ import annotations

from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    app_name: str = Field(default="ERP Platform")
    environment: str = Field(default="development")
    database_url: str = Field(default="sqlite:///./erp.db", alias="DATABASE_URL")
    secret_key: str = Field(default="insecure-default-key", alias="SECRET_KEY")
    access_token_expire_minutes: int = Field(default=30, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_minutes: int = Field(default=60 * 24 * 7, alias="REFRESH_TOKEN_EXPIRE_MINUTES")
    algorithm: str = Field(default="HS256")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Return cached application settings instance."""

    return Settings()
