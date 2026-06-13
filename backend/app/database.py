"""
Database configuration and session management.
Supports both SQLite (default/development) and PostgreSQL (production).
"""

import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import StaticPool
from dotenv import load_dotenv

load_dotenv()


def get_database_url() -> str:
    """
    Build the database URL from environment variables.
    Falls back to SQLite if DATABASE_URL is not provided.
    """
    url = os.getenv("DATABASE_URL")
    if url:
        return url
    # Default to SQLite for local development
    db_path = os.getenv("SQLITE_PATH", "./expenses.db")
    return f"sqlite:///{db_path}"


DATABASE_URL = get_database_url()

# Engine configuration differs between SQLite and PostgreSQL
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, _connection_record):
        """Enable foreign key enforcement in SQLite."""
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=int(os.getenv("DB_POOL_SIZE", "5")),
        max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "10")),
    )


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


def get_db():
    """
    FastAPI dependency that provides a database session.
    Ensures the session is properly closed after each request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all tables defined in ORM models (used at startup)."""
    from app import orm_models  # noqa: F401 – import triggers table registration
    Base.metadata.create_all(bind=engine)
