from datetime import datetime, timezone

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
