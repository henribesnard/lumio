"""Lumio — FastAPI application entry point."""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import admin, auth, kid
from app.api.schemas import HealthResponse
from app.auth.sessions import verify_csrf
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="Lumio API",
    description="Tuteur IA pour enfants — API backend",
    version="0.1.0",
    docs_url="/api/docs" if not settings.public_url else None,
    redoc_url=None,
    openapi_url="/api/openapi.json",
)

# ---------------------------------------------------------------------------
# CORS — same origin only
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.public_url],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "X-CSRF-Token"],
)


# ---------------------------------------------------------------------------
# CSRF middleware for state-changing requests
# ---------------------------------------------------------------------------
CSRF_SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
CSRF_EXEMPT_PATHS = {"/api/health", "/api/auth/admin/login", "/api/auth/kid/login"}


@app.middleware("http")
async def csrf_middleware(request: Request, call_next):
    if (
        request.method not in CSRF_SAFE_METHODS
        and request.url.path not in CSRF_EXEMPT_PATHS
        and request.url.path.startswith("/api/")
    ) and not verify_csrf(request):
        return JSONResponse(
            status_code=403,
            content={
                "error": {
                    "code": "csrf_failed",
                    "message": "Vérification CSRF échouée.",
                }
            },
        )
    response = await call_next(request)
    return response


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(kid.router)


@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse()
