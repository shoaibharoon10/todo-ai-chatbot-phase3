from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case as sa_case
from sqlmodel import Session, select

from auth import get_current_user
from db import get_session
from models import CompleteTaskResponse, Tag, TagRead, Task, TaskCreate, TaskRead, TaskTag, TaskUpdate
from recurrence import compute_next_occurrence

router = APIRouter(prefix="/api")


def enrich_task_with_tags(task: Task, session: Session) -> TaskRead:
    """Return a TaskRead populated with the task's associated tags."""
    tags = session.exec(
        select(Tag).join(TaskTag, TaskTag.tag_id == Tag.id).where(TaskTag.task_id == task.id)
    ).all()
    data = task.model_dump()
    data["tags"] = [TagRead.model_validate(t) for t in tags]
    return TaskRead(**data)


# GET /api/tasks — list all tasks for authenticated user
@router.get("/tasks", response_model=list[TaskRead])
def list_tasks(
    status: str = Query("all"),
    sort: str = Query("newest"),
    overdue: bool = Query(False),
    priority: str | None = Query(None),
    tag: int | None = Query(None),
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    statement = select(Task).where(Task.user_id == user_id)

    # Status filter
    if status == "pending":
        statement = statement.where(Task.completed == False)  # noqa: E712
    elif status == "completed":
        statement = statement.where(Task.completed == True)  # noqa: E712

    # Priority filter
    if priority is not None:
        if priority not in {"low", "medium", "high", "urgent"}:
            raise HTTPException(status_code=422, detail=f"Invalid priority: {priority}")
        statement = statement.where(Task.priority == priority)

    # Sort
    if sort == "oldest":
        statement = statement.order_by(Task.created_at.asc())
    elif sort == "title":
        statement = statement.order_by(Task.title.asc())
    elif sort == "priority":
        priority_weight = sa_case(
            (Task.priority == "urgent", 4),
            (Task.priority == "high", 3),
            (Task.priority == "medium", 2),
            (Task.priority == "low", 1),
            else_=2,
        )
        statement = statement.order_by(priority_weight.desc())
    else:
        statement = statement.order_by(Task.created_at.desc())

    # Overdue filter — incomplete tasks with due_date in the past
    if overdue:
        statement = statement.where(
            Task.due_date < datetime.now(timezone.utc),
            Task.completed == False,  # noqa: E712
        )

    # Tag filter
    if tag is not None:
        statement = statement.join(TaskTag, TaskTag.task_id == Task.id).where(TaskTag.tag_id == tag)

    tasks = session.exec(statement).all()
    return [enrich_task_with_tags(t, session) for t in tasks]


# POST /api/tasks — create new task
@router.post("/tasks", response_model=TaskRead, status_code=201)
def create_task(
    data: TaskCreate,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    now = datetime.now(timezone.utc)
    task = Task(
        user_id=user_id,
        title=data.title,
        description=data.description,
        due_date=data.due_date,
        recurrence_rule=data.recurrence_rule,
        priority=data.priority,
        created_at=now,
        updated_at=now,
    )
    session.add(task)
    session.flush()  # get task.id before inserting tag links

    for tag_id in (data.tag_ids or []):
        tag_obj = session.exec(
            select(Tag).where(Tag.id == tag_id, Tag.user_id == user_id)
        ).first()
        if tag_obj:
            session.add(TaskTag(task_id=task.id, tag_id=tag_obj.id))

    session.commit()
    session.refresh(task)
    return enrich_task_with_tags(task, session)


# GET /api/tasks/{task_id} — get single task
@router.get("/tasks/{task_id}", response_model=TaskRead)
def get_task(
    task_id: int,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    task = session.exec(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return enrich_task_with_tags(task, session)


# PUT /api/tasks/{task_id} — update task
@router.put("/tasks/{task_id}", response_model=TaskRead)
def update_task(
    task_id: int,
    data: TaskUpdate,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    task = session.exec(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = data.model_dump(exclude_unset=True)
    tag_ids = update_data.pop("tag_ids", None)

    for key, value in update_data.items():
        setattr(task, key, value)
    task.updated_at = datetime.now(timezone.utc)
    session.add(task)

    # Replace tags if tag_ids provided
    if tag_ids is not None:
        existing_links = session.exec(
            select(TaskTag).where(TaskTag.task_id == task.id)
        ).all()
        for link in existing_links:
            session.delete(link)
        session.flush()
        for tag_id in tag_ids:
            tag_obj = session.exec(
                select(Tag).where(Tag.id == tag_id, Tag.user_id == user_id)
            ).first()
            if tag_obj:
                session.add(TaskTag(task_id=task.id, tag_id=tag_obj.id))

    session.commit()
    session.refresh(task)
    return enrich_task_with_tags(task, session)


# DELETE /api/tasks/{task_id} — delete task
@router.delete("/tasks/{task_id}", status_code=204)
def delete_task(
    task_id: int,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    task = session.exec(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    session.delete(task)
    session.commit()


# PATCH /api/tasks/{task_id}/complete — toggle completed; creates next occurrence for recurring tasks
@router.patch("/tasks/{task_id}/complete", response_model=CompleteTaskResponse)
def toggle_task(
    task_id: int,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    task = session.exec(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    was_completed = task.completed
    task.completed = not task.completed
    task.updated_at = datetime.now(timezone.utc)

    session.add(task)
    session.commit()
    session.refresh(task)

    # Recurrence — only when transitioning incomplete → complete
    next_task: Task | None = None
    if task.completed and not was_completed and task.recurrence_rule and task.due_date:
        next_due = compute_next_occurrence(task.recurrence_rule, task.due_date)
        if next_due:
            now = datetime.now(timezone.utc)
            parent_id = task.recurrence_parent_id or task.id
            next_task = Task(
                user_id=task.user_id,
                title=task.title,
                description=task.description,
                recurrence_rule=task.recurrence_rule,
                recurrence_parent_id=parent_id,
                priority=task.priority,
                due_date=next_due,
                created_at=now,
                updated_at=now,
            )
            session.add(next_task)
            session.commit()
            session.refresh(next_task)

    task_read = enrich_task_with_tags(task, session)
    next_read = TaskRead.model_validate(next_task) if next_task else None
    return CompleteTaskResponse(**task_read.model_dump(), next_occurrence=next_read)
