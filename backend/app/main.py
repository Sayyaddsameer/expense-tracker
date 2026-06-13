"""
FastAPI application entry point.
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import create_tables
from app.routers.expenses import router as expenses_router


def create_app() -> FastAPI:
    """Application factory — creates and configures the FastAPI instance."""

    app = FastAPI(
        title="Expense Tracker API",
        description=(
            "REST API for the mobile expense tracker. Persists scanned receipt "
            "data, infers spending categories, generates monthly summaries, and "
            "exports data as CSV."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # -----------------------------------------------------------------
    # CORS — allow the React Native dev client and any frontend origin
    # -----------------------------------------------------------------
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # -----------------------------------------------------------------
    # Routers
    # -----------------------------------------------------------------
    app.include_router(expenses_router)

    # -----------------------------------------------------------------
    # Startup event — create tables if they don't exist
    # -----------------------------------------------------------------
    @app.on_event("startup")
    def on_startup():
        create_tables()

    # -----------------------------------------------------------------
    # Health-check endpoint (used by Docker healthcheck)
    # -----------------------------------------------------------------
    @app.get("/health", tags=["infra"], summary="Service health check")
    def health():
        return JSONResponse({"status": "healthy"})

    # -----------------------------------------------------------------
    # Root endpoint
    # -----------------------------------------------------------------
    @app.get("/", tags=["infra"], summary="API root")
    def root():
        return {
            "name": "Expense Tracker API",
            "version": "1.0.0",
            "docs": "/docs",
        }

    return app


app = create_app()
