from datetime import datetime, timezone
from typing import Any, Literal
from uuid import uuid4

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from pydantic import BaseModel, Field as PydanticField
from sqlmodel import Field, SQLModel

PriorityLiteral = Literal["low", "medium", "high", "urgent"]


class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, nullable=False)
    title: str = Field(nullable=False, max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    due_date: datetime | None = Field(
        sa_column=Column(DateTime(timezone=True), nullable=True, index=True),
        default=None,
    )
    recurrence_rule: str | None = Field(sa_column=Column(Text, nullable=True), default=None)
    recurrence_parent_id: int | None = Field(
        sa_column=Column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True),
        default=None,
    )
    priority: str = Field(
        sa_column=Column(String(10), nullable=False, server_default="medium", index=True),
        default="medium",
    )
    notes: str | None = Field(sa_column=Column(Text, nullable=True), default=None)
    reminder_offset_minutes: int | None = Field(
        sa_column=Column(Integer, nullable=True), default=None
    )


class Tag(SQLModel, table=True):
    __tablename__ = "tags"
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_tags_user_name"),)

    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(sa_column=Column(String, nullable=False, index=True))
    name: str = Field(sa_column=Column(String(50), nullable=False))
    color: str = Field(
        sa_column=Column(String(7), nullable=False, server_default="#6366f1"),
        default="#6366f1",
    )


class TaskTag(SQLModel, table=True):
    __tablename__ = "task_tags"

    task_id: int = Field(
        sa_column=Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True)
    )
    tag_id: int = Field(
        sa_column=Column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
    )


# Pydantic request/response schemas


class TagCreate(BaseModel):
    name: str = PydanticField(min_length=1, max_length=50)
    color: str = "#6366f1"


class TagRead(BaseModel):
    id: int
    name: str
    color: str

    model_config = {"from_attributes": True}


class TaskCreate(BaseModel):
    title: str = PydanticField(min_length=1, max_length=200)
    description: str | None = PydanticField(default=None, max_length=1000)
    due_date: datetime | None = None
    recurrence_rule: str | None = None
    priority: PriorityLiteral = "medium"
    tag_ids: list[int] = []
    notes: str | None = PydanticField(default=None, max_length=5000)
    reminder_offset_minutes: int | None = None


class TaskUpdate(BaseModel):
    title: str | None = PydanticField(default=None, min_length=1, max_length=200)
    description: str | None = PydanticField(default=None, max_length=1000)
    completed: bool | None = None
    due_date: datetime | None = None
    recurrence_rule: str | None = None
    priority: PriorityLiteral | None = None
    tag_ids: list[int] | None = None
    notes: str | None = PydanticField(default=None, max_length=5000)
    reminder_offset_minutes: int | None = None


class TaskRead(BaseModel):
    id: int
    user_id: str
    title: str
    description: str | None
    completed: bool
    created_at: datetime
    updated_at: datetime
    due_date: datetime | None = None
    recurrence_rule: str | None = None
    recurrence_parent_id: int | None = None
    priority: str = "medium"
    tags: list[TagRead] = []
    notes: str | None = None
    reminder_offset_minutes: int | None = None

    model_config = {"from_attributes": True}


class CompleteTaskResponse(TaskRead):
    next_occurrence: "TaskRead | None" = None


# Phase 4: Analytics models


class WeeklyPoint(BaseModel):
    date: str  # "YYYY-MM-DD"
    completed: int


class StatsResponse(BaseModel):
    total: int
    completed: int
    pending: int
    overdue: int
    completion_rate: float
    weekly: list[WeeklyPoint]


# Phase 3: Chat models


class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"

    id: str = Field(
        sa_column=Column(String(36), primary_key=True),
        default_factory=lambda: str(uuid4()),
    )
    user_id: str = Field(sa_column=Column(String, nullable=False, index=True))
    created_at: datetime = Field(
        sa_column=Column(DateTime, nullable=False),
        default_factory=lambda: datetime.now(timezone.utc),
    )
    updated_at: datetime = Field(
        sa_column=Column(DateTime, nullable=False),
        default_factory=lambda: datetime.now(timezone.utc),
    )


class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: str = Field(
        sa_column=Column(String(36), primary_key=True),
        default_factory=lambda: str(uuid4()),
    )
    conversation_id: str = Field(
        sa_column=Column(
            String(36),
            ForeignKey("conversations.id"),
            nullable=False,
            index=True,
        ),
    )
    user_id: str = Field(sa_column=Column(String, nullable=False, index=True))
    role: str = Field(sa_column=Column(String, nullable=False))  # "user" | "assistant" | "tool"
    content: str = Field(sa_column=Column(Text, nullable=False))
    tool_calls_json: str | None = Field(sa_column=Column(Text, nullable=True), default=None)
    created_at: datetime = Field(
        sa_column=Column(DateTime, nullable=False),
        default_factory=lambda: datetime.now(timezone.utc),
    )


# Phase 3: Chat Pydantic schemas


class ToolCallResult(BaseModel):
    tool: str
    args: dict[str, Any]
    result: Any


class ChatRequest(BaseModel):
    message: str = PydanticField(min_length=1, max_length=5000)
    conversation_id: str | None = None
    user_name: str | None = None
    user_email: str | None = None


class ChatResponse(BaseModel):
    response: str
    tool_calls: list[ToolCallResult]
    conversation_id: str


class ConversationRead(BaseModel):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MessageRead(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    tool_calls_json: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
