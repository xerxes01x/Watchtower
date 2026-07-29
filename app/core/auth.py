from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import jwt
from fastapi import Header, HTTPException, Request, status

from app.core.config import settings


@dataclass
class CurrentUser:
    id: str
    email: str = ""
    name: str = ""


# ── Legacy gate (non-monitor routes) ─────────────────────────────────────────

def _validate_jwt(token: str) -> None:
    try:
        jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            audience=settings.jwt_audience or None,
            issuer=settings.jwt_issuer or None,
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid JWT") from exc


def require_auth(
    x_api_key: Optional[str] = Header(default=None, alias="x-api-key"),
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
) -> None:
    api_key_enabled = bool(settings.api_auth_token)
    jwt_enabled = bool(settings.jwt_secret)

    if not api_key_enabled and not jwt_enabled:
        return

    if api_key_enabled and x_api_key == settings.api_auth_token:
        return

    if jwt_enabled and authorization:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() == "bearer" and token:
            _validate_jwt(token)
            return

    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")


# ── Per-user dependency (monitor routes) ─────────────────────────────────────

def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
) -> CurrentUser:
    """
    Decode the NextAuth-issued HS256 JWT and return the authenticated user.
    Also stamps request.state.user_id so the slowapi key function can read
    it without re-decoding the JWT.

    When NEXTAUTH_SECRET is not configured in a non-production environment
    (local dev / CI) the dependency is a no-op and returns a synthetic dev user
    keyed on client IP. In production a missing secret fails closed — the
    application also refuses to start (see app.main._validate_production_config),
    so this branch is defence-in-depth.
    """
    if not settings.nextauth_secret:
        if settings.is_production:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication is not configured",
            )
        ip = request.client.host if request.client else "dev"
        request.state.user_id = ip
        return CurrentUser(id=ip)

    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    try:
        payload = jwt.decode(token, settings.nextauth_secret, algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        ) from exc

    user_id = payload.get("sub", "")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing sub claim"
        )

    user = CurrentUser(
        id=user_id,
        email=payload.get("email", ""),
        name=payload.get("name", ""),
    )
    # Load-bearing: slowapi key function reads this in Phase 3.5
    request.state.user_id = user.id
    return user
