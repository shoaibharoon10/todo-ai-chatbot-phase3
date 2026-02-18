---
name: Neon DB Connection
description: Setup Neon PostgreSQL connection.
trigger: setup neon db
---

# Neon DB Connection Skill

## Purpose

Set up a production-ready connection from a FastAPI backend to a Neon PostgreSQL database using SQLModel (SQLAlchemy under the hood). This includes engine creation, session management, connection pooling, SSL configuration, and a health-check endpoint to verify connectivity.

## Instructions

When triggered, execute the following steps in order:

### Step 1: Install Dependencies

Add to `requirements.txt`:

```
sqlmodel>=0.0.14
psycopg2-binary>=2.9.9
python-dotenv>=1.0.0
```

Run:

```bash
pip install sqlmodel psycopg2-binary python-dotenv
```

### Step 2: Configure Environment Variables

Add to `backend/.env.example`:

```env
# Neon PostgreSQL connection string
# Format: postgresql://user:password@ep-xxxx.region.aws.neon.tech/dbname?sslmode=require
DATABASE_URL=postgresql://user:password@ep-example.us-east-2.aws.neon.tech/neondb?sslmode=require

# Connection pool settings (optional overrides)
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=10
DB_POOL_TIMEOUT=30
```

> **Critical:** Neon requires `sslmode=require` in the connection string. Connections without SSL will be rejected.

### Step 3: Write `backend/db.py`

Create the database module:

```python
import os
from collections.abc import Generator

from dotenv import load_dotenv
from sqlmodel import Session, SQLModel, create_engine

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
DATABASE_URL: str = os.environ["DATABASE_URL"]
DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "5"))
DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "10"))
DB_POOL_TIMEOUT: int = int(os.getenv("DB_POOL_TIMEOUT", "30"))

# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------
engine = create_engine(
    DATABASE_URL,
    echo=False,                     # Set True for SQL logging during dev
    pool_size=DB_POOL_SIZE,
    max_overflow=DB_MAX_OVERFLOW,
    pool_timeout=DB_POOL_TIMEOUT,
    pool_pre_ping=True,             # Reconnect on stale connections
    connect_args={
        "sslmode": "require",       # Enforce SSL for Neon
    },
)


# ---------------------------------------------------------------------------
# Session dependency
# ---------------------------------------------------------------------------
def get_session() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a SQLModel session.

    Usage:
        @router.get("/items")
        def list_items(session: Session = Depends(get_session)):
            return session.exec(select(Item)).all()
    """
    with Session(engine) as session:
        yield session


# ---------------------------------------------------------------------------
# Table creation
# ---------------------------------------------------------------------------
def create_db_and_tables() -> None:
    """Create all tables defined by SQLModel metadata."""
    SQLModel.metadata.create_all(engine)
```

### Step 4: Define a Sample Model

Create `backend/models.py` (or add to existing):

```python
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class Task(SQLModel, table=True):
    """Task model — scoped to a user via user_id."""

    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(max_length=255, index=True)
    description: Optional[str] = Field(default=None)
    status: str = Field(default="pending", index=True)
    user_id: str = Field(index=True)  # FK to auth user
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
```

### Step 5: Integrate in `backend/main.py`

Wire up the database connection and health check:

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends
from sqlmodel import Session, text

from backend.db import create_db_and_tables, get_session


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables. Shutdown: nothing special needed (pool closes)."""
    create_db_and_tables()
    yield


app = FastAPI(title="Phase2 API", lifespan=lifespan)


# ---------------------------------------------------------------------------
# Health check — verifies Neon connectivity
# ---------------------------------------------------------------------------
@app.get("/health")
def health_check(session: Session = Depends(get_session)):
    """Return OK if the database connection is alive."""
    result = session.exec(text("SELECT 1")).one()
    return {
        "status": "healthy",
        "database": "connected",
        "result": result,
    }
```

### Step 6: Usage in Route Handlers

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from backend.auth import get_current_user
from backend.db import get_session
from backend.models import Task

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("/")
def list_tasks(
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Return tasks belonging to the authenticated user."""
    tasks = session.exec(
        select(Task).where(Task.user_id == user_id)
    ).all()
    return tasks


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_task(
    title: str,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Create a new task scoped to the authenticated user."""
    task = Task(title=title, user_id=user_id)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task
```

## File Output

| File | Action | Description |
|---|---|---|
| `backend/db.py` | Created | Engine, `get_session` dependency, `create_db_and_tables` |
| `backend/models.py` | Created | SQLModel `Task` model with `user_id` scoping |
| `backend/main.py` | Updated | Lifespan hook for table creation, `/health` endpoint |
| `backend/.env.example` | Updated | `DATABASE_URL`, pool config variables |
| `requirements.txt` | Updated | `sqlmodel`, `psycopg2-binary`, `python-dotenv` |

## Neon-Specific Notes

| Topic | Detail |
|---|---|
| **SSL** | Always required. Include `?sslmode=require` in the connection string or set via `connect_args`. |
| **Connection pooling** | Neon has built-in connection pooling. Use the pooled connection string (`-pooler` endpoint) for high-traffic apps. |
| **Cold starts** | Neon serverless databases may have cold-start latency (~1-2s). `pool_pre_ping=True` handles reconnections gracefully. |
| **Branching** | Neon supports database branching. Use separate `DATABASE_URL` values per environment (dev/staging/prod). |
| **Connection limits** | Free tier: 100 concurrent connections. Use `DB_POOL_SIZE=5` and `DB_MAX_OVERFLOW=10` to stay within limits. |

## Connection String Formats

```
# Direct connection (for migrations, admin)
postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# Pooled connection (for application traffic)
postgresql://user:password@ep-xxxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## Testing the Connection

After starting the server, verify:

```bash
# Start the backend
uvicorn backend.main:app --reload

# Test health endpoint
curl http://localhost:8000/health
```

Expected response:

```json
{
  "status": "healthy",
  "database": "connected",
  "result": 1
}
```

## Validation Checklist

- [ ] `backend/db.py` exists with `create_engine` using `DATABASE_URL` from environment
- [ ] `sslmode=require` is enforced (via connection string or `connect_args`)
- [ ] `pool_pre_ping=True` is set to handle Neon cold starts
- [ ] `get_session()` is a generator yielding `Session` and properly closing it
- [ ] `create_db_and_tables()` is called in the FastAPI lifespan hook
- [ ] `/health` endpoint verifies database connectivity with `SELECT 1`
- [ ] `DATABASE_URL` is loaded from `.env` (never hardcoded)
- [ ] `requirements.txt` includes `sqlmodel` and `psycopg2-binary`
- [ ] Pool size defaults stay within Neon free-tier limits (5 + 10 overflow)
