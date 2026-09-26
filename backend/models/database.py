"""SQLAlchemy engine + session + init helpers."""
from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from config import settings

# SQLite needs check_same_thread=False for FastAPI request threads
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    pass


def init_db() -> None:
    """Create all tables. Safe to call on every startup."""
    # Import models so they register with Base.metadata
    from . import case  # noqa: F401
    from sqlalchemy import inspect, text

    Base.metadata.create_all(bind=engine)

    # Safe migration: ensure optional new columns exist if table was previously created
    with engine.connect() as conn:
        inspector = inspect(engine)
        if "cases" in inspector.get_table_names():
            existing_cols = {col["name"] for col in inspector.get_columns("cases")}
            if "sharpness_status" not in existing_cols:
                conn.execute(text("ALTER TABLE cases ADD COLUMN sharpness_status VARCHAR"))
                conn.commit()


def get_db():
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
