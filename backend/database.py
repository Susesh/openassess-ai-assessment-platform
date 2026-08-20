from dotenv import load_dotenv
import os
import logging

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./openassess.db",  # Default to SQLite for local development
)

# Fallback to SQLite if PostgreSQL is not available
try:
    from sqlalchemy import create_engine
    test_engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    with test_engine.connect():
        pass
except Exception:
    print("PostgreSQL not available, falling back to SQLite")
    DATABASE_URL = "sqlite:///./openassess.db"

from sqlalchemy import create_engine, event, pool
from sqlalchemy.orm import sessionmaker, declarative_base

logger = logging.getLogger(__name__)

# Create engine with connection pooling optimizations
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True,  # Test connections before reusing
        echo=False,
    )
else:
    engine = create_engine(
        DATABASE_URL,
        poolclass=pool.QueuePool,
        pool_size=20,  # Number of connections to keep in pool
        max_overflow=10,  # Additional connections above pool_size
        pool_pre_ping=True,  # Test connections before reusing
        pool_recycle=1800,  # Recycle connections after 30 minutes (reduced from 1 hour)
        echo=False,  # Set to True to debug SQL queries
    )

@event.listens_for(engine, "connect")
def receive_connect(dbapi_conn, connection_record):
    """Set connection pool timeout and isolation level."""
    if not DATABASE_URL.startswith("sqlite"):
        dbapi_conn.set_isolation_level("READ COMMITTED")



@event.listens_for(engine, "close")
def receive_close(dbapi_conn, connection_record):
    """Called when a connection is returned to the pool."""
    pass

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Provide a DB session with proper transaction management and error handling."""
    db = SessionLocal()
    try:
        yield db
        # Commit any pending transactions
        if db.is_active:
            db.commit()
    except Exception as e:
        # Rollback on any error
        if db.is_active:
            try:
                db.rollback()
            except Exception as rollback_error:
                logger.error(f"Rollback failed: {rollback_error}")
        logger.error(f"Database error in session: {e}")
        raise
    finally:
        # Always close the session
        try:
            db.close()
        except Exception as close_error:
            logger.warning(f"Error closing session: {close_error}")


# Quick connection test — run: python database.py
if __name__ == "__main__":
    try:
        with engine.connect() as conn:
            print("Database connected successfully!")
    except Exception as e:
        print(f"Connection failed: {e}")
