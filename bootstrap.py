"""
Container entrypoint for the WatchTower API service.

Runs the ordered startup sequence — validate production config, wait for the
database, apply Alembic migrations — and **only if every step succeeds** hands
off to Uvicorn. Any failure prints a clear banner and exits non-zero so the
container terminates (Compose/K8s then restarts it) instead of serving traffic
against a missing or outdated schema.

Usage (Docker): the app image's CMD is `python bootstrap.py`.
Local dev keeps using `uvicorn app.main:app --reload` directly and never
touches this file — see docs/handbook for the rationale.

Env:
  RUN_MIGRATIONS   "true" (default) to apply migrations here; "false" to only
                   validate + wait (e.g. a process that must not migrate).
"""

from __future__ import annotations

import os
import sys

from app.core.config import settings
from app.core.startup import StartupError, banner, run_startup_sequence


def _run_migrations_enabled() -> bool:
    return os.getenv("RUN_MIGRATIONS", "true").strip().lower() in {"1", "true", "yes"}


def main() -> None:
    try:
        run_startup_sequence(migrate=_run_migrations_enabled())
    except StartupError as exc:
        banner("WatchTower startup FAILED", "Reason:", *str(exc).splitlines(), "Container exiting.")
        sys.exit(1)

    print("Starting FastAPI...", flush=True)
    banner("WatchTower Ready")

    # Import here (after migrations) so any import-time failure is still caught
    # before we claim the app is starting. Uvicorn replaces this process's event
    # loop and becomes the long-running foreground process (clean signal handling).
    import uvicorn

    uvicorn.run("app.main:app", host=settings.api_host, port=settings.api_port)


if __name__ == "__main__":
    main()
