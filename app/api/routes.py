from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.api.schemas import CheckResult, Monitor, MonitorCreate, MonitorList, ResultList, RunRequest
from app.core.auth import CurrentUser, get_current_user
from app.core.limiter import limiter
from app.scheduler.scheduler import run_monitor
from app.services.storage import STORE

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/monitors", response_model=Monitor)
@limiter.limit("10/minute")
async def create_monitor(
    request: Request,
    payload: MonitorCreate,
    current_user: CurrentUser = Depends(get_current_user),
) -> Monitor:
    monitor = Monitor(**payload.model_dump(), user_id=current_user.id)
    return STORE.add_monitor(monitor)


@router.get("/monitors", response_model=MonitorList)
@limiter.limit("60/minute")
async def list_monitors(
    request: Request,
    current_user: CurrentUser = Depends(get_current_user),
) -> MonitorList:
    return MonitorList(monitors=STORE.list_monitors(current_user.id))


@router.delete("/monitors/{monitor_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("60/minute")
async def delete_monitor(
    request: Request,
    monitor_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
) -> None:
    deleted = STORE.delete_monitor(monitor_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Monitor not found")


@router.post("/monitors/{monitor_id}/run", response_model=CheckResult | None)
@limiter.limit("60/minute")
async def run_monitor_now(
    request: Request,
    monitor_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    payload: RunRequest | None = None,
) -> CheckResult | None:
    monitor = STORE.get_monitor(monitor_id, current_user.id)
    if not monitor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Monitor not found")
    return run_monitor(monitor, reason=(payload.reason if payload else None))


@router.get("/results", response_model=ResultList)
@limiter.limit("60/minute")
async def list_results(
    request: Request,
    monitor_id: UUID | None = None,
    current_user: CurrentUser = Depends(get_current_user),
) -> ResultList:
    return ResultList(results=STORE.list_results(current_user.id, monitor_id))
