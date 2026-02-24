# TaskFlow AI

A full-stack AI-powered task manager with natural-language chatbot, offline-first PWA, and rich task management features. Built across three phases using Spec-Driven Development.

## Features

| Phase | Feature | Description |
|-------|---------|-------------|
| 1 | Console App | CLI todo app (Python) |
| 2 | Full-Stack | Task CRUD, auth, responsive UI |
| 3 | AI Chatbot | Natural-language commands via Cohere tool-use |
| 4 (005) | Due Dates | Due date picker, overdue highlighting, badge display |
| 4 (006) | Notifications | Browser push notifications for due tasks (VAPID) |
| 4 (007) | Priorities | Low / Medium / High priority with color-coded badges |
| 4 (008) | Tags | Color-tagged tasks with multi-select filter |
| 4 (009) | Recurring Tasks | Daily / Weekday / Weekly / Monthly recurrence (python-rrule) |
| 4 (010) | Progress Analytics | Recharts dashboard: completion rate, priority breakdown, tag chart |
| 4 (011) | Offline PWA | idb-keyval read cache + FIFO write queue; flush on reconnect |
| 4 (012) | Task Notes | Freeform notes (up to 5000 chars) per task, collapsible in card |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui |
| Backend | Python 3.12, FastAPI, SQLModel ORM |
| Database | Neon Serverless PostgreSQL |
| Auth | Better Auth (email/password) + JWT plugin (HS256) |
| AI/LLM | Cohere API (Command models) with tool-use / function-calling |
| Offline | idb-keyval (IndexedDB), next-pwa (service worker) |
| Charts | Recharts |

## Project Structure

```
├── backend/               # FastAPI application (port 8000)
│   ├── main.py            # App entry, lifespan DB migrations, CORS
│   ├── models.py          # SQLModel ORM + Pydantic schemas
│   ├── db.py              # Neon engine + session dependency
│   ├── auth.py            # JWT verification middleware
│   ├── routes/
│   │   ├── tasks.py       # CRUD endpoints
│   │   ├── tags.py        # Tag CRUD endpoints
│   │   ├── stats.py       # Analytics/dashboard endpoint
│   │   └── chat.py        # Cohere chat + tool-use endpoint
│   └── tools/
│       └── task_tools.py  # Stateless MCP tool wrappers
├── frontend/              # Next.js application (port 3000)
│   ├── src/app/           # App Router pages (auth, tasks, chat, analytics)
│   ├── src/components/
│   │   ├── features/      # Task, chat, layout components
│   │   └── ui/            # shadcn primitives
│   └── src/lib/           # api.ts, auth-client.ts, task-cache.ts, action-queue.ts
├── specs/                 # Spec-Driven Development artifacts (spec, plan, tasks)
├── history/               # Prompt History Records (PHRs) + ADRs
└── .specify/              # Spec-Kit Plus templates and scripts
```

## Environment Variables

### Backend — `backend/.env`

```env
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
BETTER_AUTH_SECRET=your-256-bit-secret    # must match frontend
JWT_SECRET_KEY=your-256-bit-secret        # must match frontend
CORS_ORIGINS=http://localhost:3000
CO_API_KEY=your-cohere-api-key
```

### Frontend — `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-256-bit-secret    # must match backend
BETTER_AUTH_URL=http://localhost:3000
JWT_SECRET_KEY=your-256-bit-secret        # must match backend
DATABASE_URL=postgresql://user:password@host/db?sslmode=require
```

> `BETTER_AUTH_SECRET` and `JWT_SECRET_KEY` must be **identical** on both sides.

Copy the example files to get started:

```bash
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

## Running Locally

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev       # http://localhost:3000
```

### Windows (PowerShell runner)

```powershell
.\run_project.ps1
```

Starts both backend and frontend concurrently in separate windows.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/sign-in/email` | Sign in |
| POST | `/api/auth/sign-up/email` | Sign up |
| GET | `/api/tasks` | List tasks (filters: status, priority, tag, search) |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/{id}` | Update task |
| DELETE | `/api/tasks/{id}` | Delete task |
| GET | `/api/tags` | List tags |
| POST | `/api/tags` | Create tag |
| DELETE | `/api/tags/{id}` | Delete tag |
| GET | `/api/stats/dashboard` | Analytics (completion rate, streaks, breakdown) |
| POST | `/api/{user_id}/chat` | AI chat with Cohere tool-use |

All endpoints except auth require `Authorization: Bearer <jwt>`.

## AI Chatbot — Example Commands

| Message | Action |
|---------|--------|
| `Add task: Buy groceries due tomorrow` | Creates task with due date |
| `List my high priority tasks` | Filters and returns tasks |
| `Mark task 3 as done` | Toggles completion |
| `Add recurring daily task: Morning standup` | Creates task with `FREQ=DAILY` |
| `Add note to task 5: Call client at 3 pm` | Adds notes to existing task |
| `Show all tasks tagged work` | Filters by tag |
| `Add urgent task: Deploy hotfix with high priority` | Creates high-priority task |

## Offline / PWA

- Installs as a PWA (manifest.json + service worker via next-pwa).
- Tasks are cached in IndexedDB after every successful fetch.
- When offline: cached task list served with amber "Offline" banner.
- Writes while offline (create / update / delete / toggle) are queued in IndexedDB.
- On reconnect: queue flushed automatically (FIFO, last-write-wins); toast confirms sync count.
- Service worker is disabled in development (`NODE_ENV=development`).

## Development Workflow (Spec-Driven Development)

```
/sp.specify   →   /sp.plan   →   /sp.tasks   →   /sp.implement
```

1. Write/update spec (`specs/<feature>/spec.md`)
2. Generate architecture plan (`/sp.plan`)
3. Break into testable tasks (`/sp.tasks`)
4. Implement via Claude Code (`/sp.implement` or manual)

All significant architectural decisions are recorded in `history/adr/`.
