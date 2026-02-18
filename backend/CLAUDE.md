# Backend Development Guidelines

## Stack

- **Framework**: Python FastAPI
- **ORM**: SQLModel (SQLAlchemy-based)
- **Database**: Neon Serverless PostgreSQL via `DATABASE_URL`
- **Auth**: JWT verification with PyJWT (HS256, `BETTER_AUTH_SECRET`)
- **AI/LLM**: Cohere API (Command models) for chat + tool use

## Project Structure

```
backend/
  main.py              # FastAPI app, lifespan, CORS, router registration
  db.py                # Engine + get_session() dependency
  auth.py              # JWT verification dependency (get_current_user)
  models.py            # SQLModel table models + Pydantic schemas
  routes/
    __init__.py
    tasks.py           # Task CRUD endpoints (/api/tasks)
    chat.py            # Chat endpoint (/api/{user_id}/chat) (Phase 3)
  tools/               # MCP tool definitions for Cohere (Phase 3)
    __init__.py
    task_tools.py      # add_task, list_tasks, update_task, etc.
  requirements.txt
  .env
  .env.example
```

## Conventions

- All routes under `/api/`, JSON responses only.
- Request/response validation via Pydantic models.
- All errors via `HTTPException` (401, 404, 422, 500).
- DB connection from `DATABASE_URL` env var with SSL.
- SQLModel for ORM; `get_session()` as FastAPI dependency injection.
- User identity extracted exclusively from JWT `sub` claim.

## Phase 3: Cohere Chat Integration

- Cohere client initialized with `CO_API_KEY` env var.
- Chat endpoint: `POST /api/{user_id}/chat`
  - Receives `{ "message": "...", "conversation_id": "..." }`
  - Calls Cohere chat API with tool definitions
  - Executes tool calls against DB (reuses existing CRUD logic)
  - Returns AI response + tool results
- Tool definitions declared as Cohere-compatible function schemas.
- MCP tools are stateless wrappers around existing task operations.
- No OpenAI dependencies permitted.

## Running

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Environment Variables

See `backend/.env.example` for required variables.
