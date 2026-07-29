from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.routes import router
from app.core.config import settings
from app.core.limiter import limiter
from app.core.logging import configure_logging
from app.db.session import init_db


def _validate_production_config() -> None:
    """Fail fast if the app is booted in production with insecure/absent config.

    Keeps production fail-closed: a blank NEXTAUTH_SECRET would otherwise drop
    the auth dependency into IP-keyed no-auth dev mode. Default DB credentials
    are also rejected so the bundled Postgres password can't ship to prod.
    """
    if not settings.is_production:
        return

    problems: list[str] = []
    if not settings.nextauth_secret:
        problems.append("NEXTAUTH_SECRET is required in production (auth would fail open)")
    if "watchtower:watchtower@" in settings.database_url:
        problems.append("DATABASE_URL uses the default 'watchtower:watchtower' credentials")

    if problems:
        raise RuntimeError(
            "Refusing to start in production with insecure configuration:\n  - "
            + "\n  - ".join(problems)
        )


def create_app() -> FastAPI:
    configure_logging()
    _validate_production_config()

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        if settings.auto_create_db:
            init_db()
        yield

    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    # Attach limiter so @limiter.limit() decorators can resolve it
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # Middleware order: SlowAPIMiddleware (inner) → CORSMiddleware (outer)
    # This ensures 429 responses still carry CORS headers the browser can read.
    app.add_middleware(SlowAPIMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
        allow_methods=["*"],
        allow_headers=["*"],
        allow_credentials=True,
    )

    app.include_router(router)

    Instrumentator().instrument(app).expose(app, endpoint=settings.prometheus_metrics_path)

    return app


app = create_app()
