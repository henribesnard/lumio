"""Configuration centralisée via pydantic-settings."""

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- Base de données ---
    database_url: str = "postgresql+asyncpg://lumio:lumio@db:5432/lumio"
    database_url_sync: str = "postgresql://lumio:lumio@db:5432/lumio"

    # --- Sécurité ---
    session_secret: str = "CHANGE_ME_IN_PRODUCTION"
    public_url: str = "https://lumio.wezon.fr"

    # --- Mistral ---
    mistral_api_key: str = ""
    mistral_tutor_model: str = "mistral-small-latest"
    mistral_medium_model: str = "mistral-medium-latest"
    mistral_guard_model: str = "mistral-small-latest"
    mistral_moderation_model: str = "mistral-moderation-latest"

    # --- Ports ---
    frontend_port: int = 3100
    backend_port: int = 8100

    # --- Rétention ---
    conversation_retention_days: int = 365

    # --- Limites par défaut ---
    default_quota_messages_day: int = 50
    default_quota_tokens_day: int = 50000

    # --- Sessions ---
    admin_session_max_age: int = 43200  # 12 h
    kid_session_inactivity: int = 7200  # 2 h
    device_cookie_max_age: int = 7776000  # 90 j

    # --- Rate limiting ---
    pin_max_attempts: int = 5
    pin_lockout_seconds: int = 900  # 15 min
    admin_max_attempts: int = 5
    admin_lockout_seconds: int = 900  # 15 min
    ip_pin_rate_limit: int = 20  # /15 min
    ip_pin_rate_window: int = 900

    # --- Agent ---
    max_child_message_length: int = 1000
    summary_threshold: int = 20
    learner_notes_interval: int = 10
    tutor_temperature: float = 0.4
    max_rewrite_count: int = 1
    mistral_timeout: int = 30
    mistral_max_retries: int = 2

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
