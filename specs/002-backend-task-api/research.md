# Research: Backend Task API

**Feature**: 002-backend-task-api | **Date**: 2026-02-12

## R1: JWT Verification Library

**Decision**: PyJWT 2.9+
**Rationale**: Constitution mandates PyJWT for backend JWT verification. HS256 symmetric algorithm with shared secret matches the frontend's Better Auth JWT plugin configuration.
**Alternatives considered**:
- `python-jose` — more features but heavier, PyJWT sufficient for HS256
- `authlib` — full OAuth2 framework, overkill for simple token verification

## R2: Database Driver for Neon PostgreSQL

**Decision**: psycopg2-binary
**Rationale**: Standard PostgreSQL driver for SQLAlchemy/SQLModel. The `-binary` variant includes pre-compiled C extensions, avoiding system-level build dependencies. Neon is wire-compatible with standard PostgreSQL.
**Alternatives considered**:
- `asyncpg` — async driver, but SQLModel's sync Session is simpler and sufficient for this scale
- `psycopg[binary]` (v3) — newer but SQLModel/SQLAlchemy support for psycopg3 is still maturing

## R3: Connection Pooling for Neon Serverless

**Decision**: SQLAlchemy built-in pool with `pool_pre_ping=True`
**Rationale**: Neon serverless may close idle connections after inactivity. `pool_pre_ping=True` issues a lightweight `SELECT 1` before reusing a connection to detect stale connections. Additional settings: `pool_size=5`, `max_overflow=10` for reasonable concurrency.
**Alternatives considered**:
- External connection pooler (PgBouncer) — unnecessary, Neon has built-in pooling at the `-pooler` endpoint
- No pooling — risky with serverless; stale connections cause errors

## R4: Request/Response Validation

**Decision**: Pydantic BaseModel subclasses in models.py alongside SQLModel
**Rationale**: FastAPI natively integrates with Pydantic for request validation and OpenAPI schema generation. SQLModel extends Pydantic's BaseModel, so both ORM models and API schemas can coexist in one file. Separate request models (TaskCreate, TaskUpdate) prevent mass-assignment vulnerabilities.
**Alternatives considered**:
- Using SQLModel classes directly for request validation — risky, exposes internal fields (id, user_id, timestamps)
- Separate `schemas.py` file — unnecessary file for 3-4 small classes

## R5: CORS Configuration

**Decision**: FastAPI CORSMiddleware with explicit origin list
**Rationale**: Frontend runs at `http://localhost:3000` and needs to make cross-origin API calls. CORSMiddleware with `allow_origins=["http://localhost:3000"]`, `allow_credentials=True`, and `allow_methods=["*"]` enables this securely.
**Alternatives considered**:
- `allow_origins=["*"]` — too permissive for production
- Proxy through Next.js API routes — adds unnecessary complexity

## R6: JWT Issuer/Audience Verification

**Decision**: Verify `iss="taskflow-web"` and `aud="taskflow-api"` in PyJWT decode
**Rationale**: The frontend Better Auth JWT plugin sets `issuer: "taskflow-web"` and `audience: "taskflow-api"` (see `frontend/src/lib/auth.ts`). Verifying these claims prevents token misuse from other services sharing the same secret. PyJWT supports this natively via `options` parameter.
**Alternatives considered**:
- Skip issuer/audience verification — less secure, tokens from any source would be accepted
- Custom claim verification — unnecessary, PyJWT handles it

## R7: Timestamp Handling

**Decision**: SQLModel `Field(default_factory=datetime.utcnow)` for created_at, manual update for updated_at
**Rationale**: SQLModel/SQLAlchemy `default_factory` sets `created_at` automatically on INSERT. For `updated_at`, a `@event.listens_for` hook or manual update in each route handler ensures the timestamp is refreshed on every modification. Manual update in routes is simpler and more explicit.
**Alternatives considered**:
- PostgreSQL `DEFAULT NOW()` and triggers — database-level, but SQLModel's `create_all` doesn't easily add triggers
- SQLAlchemy `onupdate` parameter — works for `updated_at` but requires careful Column definition
