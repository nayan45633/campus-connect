from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Determine engine parameters dynamically
db_url = settings.sync_database_url
engine_kwargs = {"pool_pre_ping": True}

if "sqlite" in db_url:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_size"] = settings.DB_POOL_SIZE
    engine_kwargs["max_overflow"] = settings.DB_MAX_OVERFLOW
    # psycopg 3 connection timeout in connect_args
    engine_kwargs["connect_args"] = {"connect_timeout": settings.DB_TIMEOUT_SECONDS}

engine = create_engine(db_url, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a SQLAlchemy database session
    and guarantees it is closed when the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> dict:
    """
    Safely probes the database with a fast ping (SELECT 1).
    Catches all connection errors so the health endpoint remains responsive.
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {
            "status": "connected",
            "reachable": True,
            "message": "Database ping query succeeded.",
        }
    except Exception as exc:
        logger.warning(f"Database connection check failed: {exc}")
        return {
            "status": "unavailable",
            "reachable": False,
            "message": f"Database is currently unreachable: {str(exc)}",
        }
