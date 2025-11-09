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
    password_hash_scheme: str = Field(default="bcrypt", alias="PASSWORD_HASH_SCHEME")
    password_min_length: int = Field(default=10, alias="PASSWORD_MIN_LENGTH")
    password_require_uppercase: bool = Field(default=True, alias="PASSWORD_REQUIRE_UPPERCASE")
    password_require_lowercase: bool = Field(default=True, alias="PASSWORD_REQUIRE_LOWERCASE")
    password_require_digit: bool = Field(default=True, alias="PASSWORD_REQUIRE_DIGIT")
    password_require_special: bool = Field(default=True, alias="PASSWORD_REQUIRE_SPECIAL")
    login_rate_limit_per_minute: int = Field(default=5, alias="LOGIN_RATE_LIMIT_PER_MINUTE")
    login_rate_limit_window_minutes: int = Field(default=1, alias="LOGIN_RATE_LIMIT_WINDOW_MINUTES")
    user_soft_delete_enabled: bool = Field(default=True, alias="USER_SOFT_DELETE_ENABLED")
    seed_root_password: str | None = Field(default=None, alias="SEED_ROOT_PASSWORD")
    seed_admin_password: str | None = Field(default=None, alias="SEED_ADMIN_PASSWORD")
    seed_user_password: str | None = Field(default=None, alias="SEED_USER_PASSWORD")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Return cached application settings instance."""

    return Settings()
