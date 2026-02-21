from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from pydantic import BaseModel, Field as PydanticField
from sqlmodel import Field, SQLModel


class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, nullable=False)
    title: str = Field(nullable=False, max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Pydantic request/response schemas


class TaskCreate(BaseModel):
    title: str = PydanticField(min_length=1, max_length=200)
    description: str | None = PydanticField(default=None, max_length=1000)


class TaskUpdate(BaseModel):
    title: str | None = PydanticField(default=None, min_length=1, max_length=200)
    description: str | None = PydanticField(default=None, max_length=1000)
    completed: bool | None = None


class TaskRead(BaseModel):
    id: int
    user_id: str
    title: str
    description: str | None
    completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


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
