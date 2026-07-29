from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select

from app.api.schemas import CheckResult, Monitor
from app.db.models import CheckResultModel, MonitorModel
from app.db.session import SessionLocal


def _to_monitor(model: MonitorModel) -> Monitor:
    return Monitor(
        id=model.id,
        name=model.name,
        url=model.url,
        method=model.method,
        headers=model.headers,
        expected_status=model.expected_status,
        json_schema=model.json_schema,
        timeout_seconds=model.timeout_seconds,
        latency_ms_threshold=model.latency_ms_threshold,
        schedule_seconds=model.schedule_seconds,
        webhook_url=model.webhook_url,
        created_at=model.created_at,
        current_state=model.current_state,
        last_run_at=model.last_run_at,
        user_id=model.user_id,
    )


def _to_result(model: CheckResultModel) -> CheckResult:
    return CheckResult(
        run_id=model.run_id,
        monitor_id=model.monitor_id,
        status=model.status,
        latency_ms=model.latency_ms,
        status_code=model.status_code,
        error_message=model.error_message,
        response_sample=model.response_sample,
        validated_at=model.validated_at,
    )


class DatabaseStore:
    def _populate_latency(self, session, monitors: list[Monitor]) -> None:
        ids = [str(m.id) for m in monitors]
        subq = (
            select(
                CheckResultModel.monitor_id,
                func.max(CheckResultModel.validated_at).label("max_at"),
            )
            .where(CheckResultModel.monitor_id.in_(ids))
            .group_by(CheckResultModel.monitor_id)
            .subquery()
        )
        rows = session.execute(
            select(CheckResultModel.monitor_id, CheckResultModel.latency_ms)
            .join(
                subq,
                (CheckResultModel.monitor_id == subq.c.monitor_id)
                & (CheckResultModel.validated_at == subq.c.max_at),
            )
        ).all()
        latency_map = {row.monitor_id: row.latency_ms for row in rows}
        for m in monitors:
            m.last_latency_ms = latency_map.get(str(m.id))

    def add_monitor(self, monitor: Monitor) -> Monitor:
        data = monitor.model_dump()
        data["url"] = str(monitor.url)
        data["id"] = str(monitor.id)
        data.pop("last_run_at", None)
        data.pop("last_latency_ms", None)
        with SessionLocal() as session:
            model = MonitorModel(**data)
            session.add(model)
            session.commit()
            session.refresh(model)
            return _to_monitor(model)

    def list_monitors(self, user_id: str) -> list[Monitor]:
        with SessionLocal() as session:
            items = session.scalars(
                select(MonitorModel).where(MonitorModel.user_id == user_id)
            ).all()
            monitors = [_to_monitor(item) for item in items]
            if monitors:
                self._populate_latency(session, monitors)
            return monitors

    def get_monitor(self, monitor_id: UUID, user_id: str) -> Monitor | None:
        """Return monitor only if it belongs to user_id — returns None otherwise (404, not 403)."""
        with SessionLocal() as session:
            model = session.get(MonitorModel, str(monitor_id))
            if not model or model.user_id != user_id:
                return None
            monitor = _to_monitor(model)
            self._populate_latency(session, [monitor])
            return monitor

    def get_monitor_unchecked(self, monitor_id: UUID) -> Monitor | None:
        """Internal use only (workers). No user_id check."""
        with SessionLocal() as session:
            model = session.get(MonitorModel, str(monitor_id))
            return _to_monitor(model) if model else None

    def add_result(self, result: CheckResult) -> None:
        data = result.model_dump()
        data["run_id"] = str(result.run_id)
        data["monitor_id"] = str(result.monitor_id)
        with SessionLocal() as session:
            model = CheckResultModel(**data)
            session.add(model)
            session.commit()

    def list_results(
        self, user_id: str, monitor_id: UUID | None = None
    ) -> list[CheckResult]:
        """Return results only for monitors owned by user_id (per-tenant isolation)."""
        with SessionLocal() as session:
            stmt = (
                select(CheckResultModel)
                .join(
                    MonitorModel,
                    CheckResultModel.monitor_id == MonitorModel.id,
                )
                .where(MonitorModel.user_id == user_id)
            )
            if monitor_id is not None:
                stmt = stmt.where(CheckResultModel.monitor_id == str(monitor_id))
            items = session.scalars(stmt).all()
            return [_to_result(item) for item in items]

    def list_scheduled_due(self, now: datetime | None = None) -> list[Monitor]:
        now = now or datetime.now(timezone.utc)
        with SessionLocal() as session:
            items = session.scalars(
                select(MonitorModel).where(MonitorModel.schedule_seconds.is_not(None))
            ).all()
            due = []
            for item in items:
                if item.schedule_seconds is None:
                    continue
                if item.last_run_at is None:
                    due.append(item)
                    continue
                if item.last_run_at <= now - timedelta(seconds=item.schedule_seconds):
                    due.append(item)
            return [_to_monitor(item) for item in due]

    def mark_monitor_run(self, monitor_id: UUID, run_at: datetime | None = None) -> None:
        run_at = run_at or datetime.now(timezone.utc)
        with SessionLocal() as session:
            model = session.get(MonitorModel, str(monitor_id))
            if model:
                model.last_run_at = run_at
                session.commit()

    def get_monitor_alert_config(self, monitor_id: UUID) -> tuple[str, str | None]:
        with SessionLocal() as session:
            model = session.get(MonitorModel, str(monitor_id))
            if not model:
                return "UP", None
            return model.current_state, model.webhook_url

    def set_monitor_state(self, monitor_id: UUID, state: str) -> None:
        with SessionLocal() as session:
            model = session.get(MonitorModel, str(monitor_id))
            if model:
                model.current_state = state
                session.commit()

    def increment_consecutive_failures(self, monitor_id: UUID) -> int:
        with SessionLocal() as session:
            model = session.get(MonitorModel, str(monitor_id))
            if not model:
                return 1
            model.consecutive_failures += 1
            session.commit()
            return model.consecutive_failures

    def reset_consecutive_failures(self, monitor_id: UUID) -> None:
        with SessionLocal() as session:
            model = session.get(MonitorModel, str(monitor_id))
            if model and model.consecutive_failures != 0:
                model.consecutive_failures = 0
                session.commit()

    def delete_monitor(self, monitor_id: UUID, user_id: str) -> bool:
        """Delete only if the monitor belongs to user_id."""
        with SessionLocal() as session:
            model = session.get(MonitorModel, str(monitor_id))
            if not model or model.user_id != user_id:
                return False
            session.delete(model)
            session.commit()
            return True


STORE = DatabaseStore()
