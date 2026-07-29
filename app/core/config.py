from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Watchtower"
    environment: str = Field(default="development", alias="ENVIRONMENT")
    log_level: str = "INFO"

    # Server binding (used by the `python main.py` entrypoint)
    api_host: str = Field(default="0.0.0.0", alias="API_HOST")
    api_port: int = Field(default=8000, alias="API_PORT")
    # Port the Celery worker exposes Prometheus metrics on (scraped as worker:8001)
    worker_metrics_port: int = Field(default=8001, alias="WORKER_METRICS_PORT")

    api_auth_token: str | None = Field(default=None, alias="API_AUTH_TOKEN")
    jwt_secret: str | None = Field(default=None, alias="JWT_SECRET")
    jwt_issuer: str | None = Field(default=None, alias="JWT_ISSUER")
    jwt_audience: str | None = Field(default=None, alias="JWT_AUDIENCE")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    nextauth_secret: str | None = Field(default=None, alias="NEXTAUTH_SECRET")

    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    celery_broker_url: str = Field(default="redis://localhost:6379/1", alias="CELERY_BROKER_URL")
    celery_result_backend: str = Field(default="redis://localhost:6379/2", alias="CELERY_RESULT_BACKEND")
    celery_always_eager: bool = Field(default=False, alias="CELERY_ALWAYS_EAGER")
    worker_concurrency: int = Field(default=2, alias="WORKER_CONCURRENCY")
    scheduler_poll_interval_seconds: int = Field(default=30, alias="SCHEDULER_POLL_INTERVAL_SECONDS")

    default_request_timeout: float = Field(default=10.0, alias="DEFAULT_REQUEST_TIMEOUT")
    default_latency_ms_threshold: int = Field(default=1500, alias="DEFAULT_LATENCY_MS_THRESHOLD")
    flap_threshold: int = Field(default=3, alias="FLAP_THRESHOLD")

    cors_origins: str = Field(
        default="http://localhost:3001,http://localhost:3000",
        alias="CORS_ORIGINS",
    )
    rate_limit_redis_url: str = Field(
        default="redis://localhost:6379/3",
        alias="RATE_LIMIT_REDIS_URL",
    )

    prometheus_metrics_path: str = Field(default="/metrics", alias="PROMETHEUS_METRICS_PATH")
    sentry_dsn: str | None = Field(default=None, alias="SENTRY_DSN")

    result_webhook_url: str | None = Field(default=None, alias="RESULT_WEBHOOK_URL")

    database_url: str = Field(default="sqlite+pysqlite:///./watchtower.db", alias="DATABASE_URL")
    auto_create_db: bool = Field(default=False, alias="AUTO_CREATE_DB")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def is_production(self) -> bool:
        return self.environment.strip().lower() in {"production", "prod"}


settings = Settings()
