import os
from uuid import UUID

import pytest
from httpx import ASGITransport, AsyncClient

os.environ["CELERY_ALWAYS_EAGER"] = "true"
os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["AUTO_CREATE_DB"] = "true"
# Force auth off so the suite is hermetic regardless of a local .env that may
# set NEXTAUTH_SECRET (env vars outrank the .env file in pydantic-settings).
# With no secret, get_current_user is a no-op keyed on client IP.
os.environ["NEXTAUTH_SECRET"] = ""

from app.api.schemas import CheckResult
from app.db.session import init_db
from app.main import app
from app.services.storage import STORE


def dummy_enqueue_check(monitor, run_id, reason=None):
    result = CheckResult(
        run_id=run_id,
        monitor_id=monitor.id,
        status="pass",
        latency_ms=25.0,
        status_code=200,
        response_sample={"status": "ok"},
    )
    STORE.add_result(result)
    return result


@pytest.mark.asyncio
async def test_create_and_run_monitor(monkeypatch):
    monkeypatch.setattr("app.scheduler.scheduler.enqueue_check", dummy_enqueue_check)
    init_db()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        payload = {
            "name": "health",
            "url": "https://example.com/health",
            "method": "GET",
            "expected_status": 200,
        }

        response = await client.post("/monitors", json=payload)
        assert response.status_code == 200
        monitor_id = UUID(response.json()["id"])

        run_response = await client.post(f"/monitors/{monitor_id}/run")
        assert run_response.status_code == 200

        # Results are user-scoped; fetch them via the API for this tenant.
        results_response = await client.get(f"/results?monitor_id={monitor_id}")
        assert results_response.status_code == 200
        assert len(results_response.json()["results"]) == 1
