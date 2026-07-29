"""
Application startup orchestration.

These are the ordered pre-flight steps the container entrypoint (`bootstrap.py`)
runs before the API is allowed to serve traffic:

    1. validate_production_config()  — fail fast on insecure production config
    2. wait_for_database()           — block until the database accepts connections
    3. run_migrations()              — bring the schema to head (Postgres via Alembic)

Every failure raises ``StartupError``. The entrypoint converts that into a
non-zero process exit so the container terminates instead of serving against a
missing or outdated schema. Nothing here mutates the configuration layer,
authentication, or business logic — it only sequences existing pieces.
"""

from __future__ import annotations

import os
import time

from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.pool import NullPool

from app.core.config import settings

BANNER_WIDTH = 49


class StartupError(RuntimeError):
    """Raised when a startup step fails; the entrypoint exits non-zero on this."""


# ── banner helpers ────────────────────────────────────────────────────────────

def _rule(char: str = "=") -> None:
    print(char * BANNER_WIDTH, flush=True)


def banner(*lines: str) -> None:
    _rule()
    for line in lines:
        print(f" {line}", flush=True)
    _rule()


# ── config validation (relocated from app.main; behaviour unchanged) ──────────

def validate_production_config() -> None:
    """Refuse to start in production with insecure/absent configuration.

    Keeps production fail-closed: a blank NEXTAUTH_SECRET would otherwise drop
    the auth dependency into IP-keyed no-auth dev mode, and default DB
    credentials must never reach production.
    """
    if not settings.is_production:
        return

    problems: list[str] = []
    if not settings.nextauth_secret:
        problems.append("NEXTAUTH_SECRET is required in production (auth would fail open)")
    if "watchtower:watchtower@" in settings.database_url:
        problems.append("DATABASE_URL uses the default 'watchtower:watchtower' credentials")

    if problems:
        raise StartupError(
            "Refusing to start in production with insecure configuration:\n  - "
            + "\n  - ".join(problems)
        )


# ── database readiness ────────────────────────────────────────────────────────

def _env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except (TypeError, ValueError):
        return default


def _env_float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, str(default)))
    except (TypeError, ValueError):
        return default


def wait_for_database() -> None:
    """Block until the database accepts a connection, using capped exponential backoff.

    ``depends_on`` in Compose only guarantees the DB *container* has started, not
    that Postgres is *accepting connections* — there is a gap of a few seconds
    while Postgres initialises. This closes that gap deterministically.

    Tunable via env (no config-layer changes): DB_WAIT_MAX_ATTEMPTS (30),
    DB_WAIT_BASE_DELAY (0.5s), DB_WAIT_MAX_DELAY (5s).
    """
    max_attempts = _env_int("DB_WAIT_MAX_ATTEMPTS", 30)
    base_delay = _env_float("DB_WAIT_BASE_DELAY", 0.5)
    max_delay = _env_float("DB_WAIT_MAX_DELAY", 5.0)

    is_sqlite = settings.database_url.startswith("sqlite")
    connect_args = {} if is_sqlite else {"connect_timeout": 5}
    engine = create_engine(settings.database_url, poolclass=NullPool, connect_args=connect_args)

    print("Checking database...", flush=True)
    try:
        for attempt in range(1, max_attempts + 1):
            try:
                with engine.connect() as conn:
                    conn.execute(text("SELECT 1"))
                print(f"  Database reachable (attempt {attempt})", flush=True)
                return
            except OperationalError as exc:
                if attempt == max_attempts:
                    raise StartupError(
                        f"Database not reachable after {max_attempts} attempts: {exc.orig}"
                    ) from exc
                delay = min(base_delay * (2 ** (attempt - 1)), max_delay)
                print(
                    f"  Not ready (attempt {attempt}/{max_attempts}); retrying in {delay:.1f}s",
                    flush=True,
                )
                time.sleep(delay)
    finally:
        engine.dispose()


# ── migrations ────────────────────────────────────────────────────────────────

def run_migrations() -> None:
    """Upgrade the schema to ``head``.

    Postgres is migrated with Alembic (``alembic upgrade head``). SQLite is used
    only for local dev/tests, where ``alembic/env.py`` intentionally refuses to
    run online — there the schema is owned by ``create_all`` (AUTO_CREATE_DB).
    """
    print("Running migrations...", flush=True)

    if settings.database_url.startswith("sqlite"):
        print(
            "  SQLite detected - schema managed by create_all (dev); skipping Alembic",
            flush=True,
        )
        if settings.auto_create_db:
            from app.db.session import init_db

            init_db()
        return

    # Imported lazily so `app.main` import (and tests) never pull in Alembic.
    from alembic import command
    from alembic.config import Config

    try:
        cfg = Config("alembic.ini")
        command.upgrade(cfg, "head")
    except Exception as exc:  # Alembic surfaces many exception types
        raise StartupError(f"alembic upgrade head failed: {exc}") from exc

    print("  Migration successful", flush=True)


# ── orchestration ─────────────────────────────────────────────────────────────

def run_startup_sequence(*, migrate: bool = True) -> None:
    """Run the full pre-flight in order. Raises ``StartupError`` on any failure."""
    banner("WatchTower Startup", f"Environment : {settings.environment}")
    validate_production_config()
    wait_for_database()
    if migrate:
        run_migrations()
    else:
        print("Migrations skipped for this process (RUN_MIGRATIONS=false)", flush=True)
