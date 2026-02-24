import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlmodel import SQLModel

from db import engine
from routes.chat import router as chat_router
from routes.stats import router as stats_router
from routes.tags import router as tags_router
from routes.tasks import router as task_router

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_tasks_due_date ON tasks (due_date)"))
        conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_rule TEXT"))
        conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_parent_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL"))
        conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(10) NOT NULL DEFAULT 'medium'"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_tasks_priority ON tasks (priority)"))
        conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes TEXT"))
        conn.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_offset_minutes INTEGER"))
        conn.commit()
    yield


app = FastAPI(title="TaskFlow API", version="1.0.0", lifespan=lifespan)

# CORS: allow frontend origin from env, fallback to localhost for dev
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(task_router)
app.include_router(chat_router)
app.include_router(tags_router)
app.include_router(stats_router)
