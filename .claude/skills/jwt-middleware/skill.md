---
name: JWT Middleware for FastAPI
description: Add JWT verification middleware to backend.
trigger: setup jwt middleware
---

# JWT Middleware Skill

## Purpose

Set up JWT-based authentication middleware for a FastAPI backend. This skill creates a reusable dependency that verifies Bearer tokens, extracts user identity, and enforces authentication on protected routes.

## Instructions

When triggered, execute the following steps in order:

### Step 1: Install Dependencies

Ensure the following packages are present in the backend's `requirements.txt` (or `pyproject.toml`):

```
PyJWT>=2.8.0
python-dotenv>=1.0.0
```

Run `pip install PyJWT python-dotenv` if not already installed.

### Step 2: Configure Environment Variables

Add to `backend/.env.example` (never commit actual secrets):

```env
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=30
```

### Step 3: Write `backend/auth.py`

Create the authentication module with the following components:

```python
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
JWT_SECRET_KEY: str = os.environ["JWT_SECRET_KEY"]
JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_MINUTES: int = int(os.getenv("JWT_EXPIRATION_MINUTES", "30"))

security_scheme = HTTPBearer()


# ---------------------------------------------------------------------------
# Token helpers
# ---------------------------------------------------------------------------
def create_access_token(user_id: str, extra_claims: Optional[dict] = None) -> str:
    """Create a signed JWT containing the user_id as the 'sub' claim."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(minutes=JWT_EXPIRATION_MINUTES),
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and verify a JWT. Raises HTTPException 401 on failure."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> str:
    """
    FastAPI dependency that extracts and verifies the Bearer token.

    Returns the user_id (the 'sub' claim) for use in route handlers.

    Usage:
        @router.get("/items")
        async def list_items(user_id: str = Depends(get_current_user)):
            items = db.query(Item).filter(Item.user_id == user_id).all()
            return items
    """
    payload = decode_access_token(credentials.credentials)
    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id
```

### Step 4: Apply to Routes

Protect any route by adding `Depends(get_current_user)`:

```python
from fastapi import APIRouter, Depends
from backend.auth import get_current_user

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("/")
async def list_tasks(user_id: str = Depends(get_current_user)):
    """Return only tasks belonging to the authenticated user."""
    # Filter queries by user_id for tenant isolation
    tasks = await db.fetch_all(
        "SELECT * FROM tasks WHERE user_id = :uid", {"uid": user_id}
    )
    return tasks


@router.post("/")
async def create_task(task: TaskCreate, user_id: str = Depends(get_current_user)):
    """Create a task scoped to the authenticated user."""
    new_task = await db.execute(
        "INSERT INTO tasks (title, user_id) VALUES (:title, :uid)",
        {"title": task.title, "uid": user_id},
    )
    return new_task
```

For applying auth globally to an entire router:

```python
# All routes under this router require authentication
protected_router = APIRouter(
    dependencies=[Depends(get_current_user)],
)
```

### Step 5: User-Scoped Query Filtering

All database queries on user-owned resources **must** include the `user_id` filter:

```python
# Correct — scoped to authenticated user
items = db.query(Item).filter(Item.user_id == user_id).all()

# WRONG — returns all users' data
items = db.query(Item).all()
```

This ensures tenant isolation: User A never sees User B's data.

## File Output

| File | Action |
|---|---|
| `backend/auth.py` | Created — JWT decode, `get_current_user` dependency |
| `backend/.env.example` | Updated — `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `JWT_EXPIRATION_MINUTES` |
| `requirements.txt` | Updated — `PyJWT`, `python-dotenv` added |

## Error Response Format

All auth failures return a consistent 401 response:

```json
{
  "detail": "Token has expired."
}
```

With header:

```
WWW-Authenticate: Bearer
```

| Scenario | Status | Detail |
|---|---|---|
| Missing `Authorization` header | 403 | Not authenticated (FastAPI default) |
| Expired token | 401 | Token has expired. |
| Malformed / invalid token | 401 | Invalid authentication token. |
| Token missing `sub` claim | 401 | Token missing subject claim. |

## Validation Checklist

- [ ] `PyJWT` is listed in dependencies
- [ ] `JWT_SECRET_KEY` is loaded from environment (never hardcoded)
- [ ] `decode_access_token` raises `HTTPException(401)` on expired or invalid tokens
- [ ] `get_current_user` returns `user_id` (the `sub` claim)
- [ ] Protected routes use `Depends(get_current_user)` and filter queries by `user_id`
- [ ] `.env.example` documents all required JWT env vars
- [ ] No secrets committed to version control

## Security Notes

- Rotate `JWT_SECRET_KEY` periodically; use a 256-bit random value in production.
- Keep token expiration short (15–30 minutes); use refresh tokens for longer sessions.
- Always validate the `sub` claim exists before trusting the token.
- Use HTTPS in production to prevent token interception.
- Never log or expose full tokens in error messages.
