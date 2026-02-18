# Quickstart: Backend Task API

## Prerequisites

- Python 3.11+ installed
- Neon PostgreSQL database provisioned
- Frontend running at http://localhost:3000 (for JWT token generation)

## Setup

### 1. Create backend directory

```bash
cd hackathon-todo  # or project root
mkdir backend
cd backend
```

### 2. Create virtual environment

```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` — Neon PostgreSQL connection string (with `?sslmode=require`)
- `BETTER_AUTH_SECRET` — Must match the frontend's `JWT_SECRET_KEY` value exactly

### 5. Start the server

```bash
uvicorn main:app --reload --port 8000
```

The server starts at http://localhost:8000. The `task` table is created automatically on first request.

## Verify

### Check server health

```bash
curl http://localhost:8000/docs
```

Opens FastAPI's interactive Swagger UI.

### Test with JWT token

1. Log in via the frontend at http://localhost:3000/login
2. Open browser DevTools → Application → Cookies/Storage to find the JWT token
3. Or check Network tab for API calls to find the Authorization header
4. Test the API:

```bash
curl -H "Authorization: Bearer <your-token>" http://localhost:8000/api/tasks
```

Expected: `200 OK` with `[]` (empty task list for new user)

### Test CRUD flow

```bash
# Create
curl -X POST http://localhost:8000/api/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Task", "description": "Hello world"}'

# List
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/tasks

# Toggle complete
curl -X PATCH http://localhost:8000/api/tasks/1/complete \
  -H "Authorization: Bearer <token>"

# Update
curl -X PUT http://localhost:8000/api/tasks/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Task"}'

# Delete
curl -X DELETE http://localhost:8000/api/tasks/1 \
  -H "Authorization: Bearer <token>"
```

## Full-Stack Integration

Run both services in separate terminals:

```bash
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: Backend
cd backend && uvicorn main:app --reload --port 8000
```

Then use the frontend UI to create, edit, toggle, and delete tasks. All operations should persist to the Neon database and be visible across page refreshes.
