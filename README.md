# Watchtower

Watchtower is a production-focused API monitoring and reliability platform.

It continuously checks APIs in production, validates response correctness (status + schema), tracks latency, stores run results, and sends alerts when anomalies are detected.

---

## What this project uses

### Core framework and runtime
- `fastapi==0.110.0` — management API and control plane.
- `uvicorn[standard]==0.27.1` — ASGI server for FastAPI.
- `pydantic==2.6.4` + `pydantic-settings==2.2.1` — strongly typed models and env-based config.

### Monitoring + execution
- `httpx==0.27.0` — HTTP client for endpoint checks.
- `celery==5.3.6` — distributed task queue for monitor execution.
- `redis==5.0.3` — Celery broker/result backend.
- `jsonschema==4.21.1` — schema validation of API responses.
- `sqlalchemy==2.0.35` — database access layer.
- `alembic==1.13.1` — database migrations.
- `psycopg2-binary==2.9.9` — Postgres driver.
- `pyjwt==2.8.0` — JWT validation (optional).

### Observability
- `prometheus-client==0.20.0` — custom metrics instrumentation.
- `prometheus-fastapi-instrumentator==7.0.0` — FastAPI metrics endpoint.
- Grafana + Prometheus via Docker Compose for dashboards and visualization.

### Logging, alerts, and reliability
- `structlog==24.1.0` — structured logs for production observability.
- `sentry-sdk==1.41.0` — error telemetry (optional).
- webhook alerting using `httpx` through `alerts.py`.

### Testing
- `pytest==8.1.1`
- `pytest-asyncio==0.23.6`

All currently installed project dependencies are listed in `requirements.txt` and documented above.

---

## Architecture (how it works)

1. You create a monitor via FastAPI (`POST /monitors`).
2. Scheduler/executor pushes a run payload to Celery.
3. Celery worker performs the real API request so use it carefully.
4. Validation engine runs:
	- expected HTTP status check
	- JSON schema check (if provided)
	- latency threshold check
5. Result is stored and exposed by API.
6. Metrics are exported to Prometheus and visualized in Grafana.
7. On failure, webhook alerts are triggered.
8. Celery Beat periodically dispatches scheduled monitors.

### Layered design
- **Control plane:** `app/api/*`, `app/main.py`
- **Execution layer:** `worker/*`, `app/executor/*`
- **Validation engine:** `app/validators/*`
- **Observability:** `app/metrics.py`, `infra/prometheus/*`, `infra/grafana/*`
- **Storage:** Postgres (SQLAlchemy) with Alembic migrations

---

## Project structure

```
Watchtower/
├── app/
│   ├── api/                  # REST endpoints + schemas
│   ├── core/                 # config + logging
│   ├── executor/             # task enqueue client
│   ├── scheduler/            # schedule/run orchestration
│   ├── services/             # storage abstraction
│   ├── validators/           # pluggable validation rules
│   ├── main.py               # FastAPI app factory
│   └── metrics.py            # Prometheus metrics
├── worker/
│   ├── celery_app.py         # Celery app configuration
│   └── tasks.py              # monitor execution task
├── infra/
│   ├── docker/               # app + worker Dockerfiles
│   ├── prometheus/           # scrape config
│   └── grafana/              # dashboard + provisioning
├── tests/                    # API + validator tests
├── docs/architecture.md      # architecture notes
├── docker-compose.yml        # local full stack
├── requirements.txt
├── .env.example              # env template for local/prod config
└── README.md
```

---

## Environment configuration

Use `.env.example` as template:

1. Copy `.env.example` to `.env`.
2. Set real values for secrets and endpoints.

Important variables:
- `API_AUTH_TOKEN` (recommended in production)
- `JWT_SECRET` / `JWT_ISSUER` / `JWT_AUDIENCE` (optional JWT auth)
- `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`
- `RESULT_WEBHOOK_URL` (for real-time failure notifications)
- `PROMETHEUS_METRICS_PATH` (default `/metrics`)
- `CELERY_ALWAYS_EAGER` (`true` for local tests, `false` for distributed mode)
- `DATABASE_URL` (Postgres in production)
- `AUTO_CREATE_DB` (dev-only schema auto-create)
- `SCHEDULER_POLL_INTERVAL_SECONDS` (Celery Beat schedule)

---

## Run locally (Python only)

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python main.py
```

API available at `http://localhost:8000`.

If you want to run each service separately, use:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
celery -A worker.celery_app worker --loglevel=INFO -Q default
celery -A worker.celery_app beat --loglevel=INFO
```

---

## Run with Docker Compose (recommended)

```bash
docker compose up --build
```

Services:
- FastAPI: `http://localhost:8000`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000`

Docker Compose also starts Redis, Postgres, the Celery worker, and Celery Beat.

Grafana dashboards and Prometheus datasource are auto-provisioned from:
- `infra/grafana/provisioning/*`
- `infra/grafana/dashboards/watchtower.json`

---

## Database migrations (Postgres)

Run once after `DATABASE_URL` is set:

```bash
alembic upgrade head
```

For development without Postgres, set `AUTO_CREATE_DB=true` to auto-create tables in SQLite.

---

## API usage examples

1. Create a monitor: `POST /monitors`
2. Run monitor now: `POST /monitors/{id}/run`
3. List monitors: `GET /monitors`
4. List results: `GET /results`
5. Health check: `GET /health`

If `API_AUTH_TOKEN` is set, send `x-api-key` header.

If JWT is configured, send `Authorization: Bearer <token>`.

---

## Testing

```bash
pytest -q
```

Current tests cover:
- API monitor creation + immediate run
- validator behavior (status, schema, latency)

---

## Production-readiness checklist

- Apply Alembic migrations: `alembic upgrade head`.
- Add periodic scheduling via Celery Beat / APScheduler.
- Add retry policy with exponential backoff and dead-letter strategy.
- Secure API with API key or JWT and TLS.
- Keep `/metrics` internal or protected.
- Store secrets in a managed secret store (not in Git).
- Add SLO/SLA dashboards and alert routing rules.

---

## Notes

- This scaffold is intentionally modular so custom validators can be added without changing worker execution logic.
- Advanced anomaly detection can be added as a separate module (e.g., rolling baseline or ML model) without changing API contracts.
