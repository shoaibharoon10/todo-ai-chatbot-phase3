from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from auth import get_current_user
from db import get_session
from models import Task, TaskCreate, TaskRead, TaskUpdate

router = APIRouter(prefix="/api")


# T011: GET /api/tasks — list all tasks for authenticated user
@router.get("/tasks", response_model=list[TaskRead])
def list_tasks(
    status: str = Query("all"),
    sort: str = Query("newest"),
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    statement = select(Task).where(Task.user_id == user_id)

    # T018: Status filter
    if status == "pending":
        statement = statement.where(Task.completed == False)  # noqa: E712
    elif status == "completed":
        statement = statement.where(Task.completed == True)  # noqa: E712

    # T019: Sort parameter
    if sort == "oldest":
        statement = statement.order_by(Task.created_at.asc())
    elif sort == "title":
        statement = statement.order_by(Task.title.asc())
    else:
        statement = statement.order_by(Task.created_at.desc())

    tasks = session.exec(statement).all()
    return tasks


# T012: POST /api/tasks — create new task
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
        created_at=now,
        updated_at=now,
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


# T013: GET /api/tasks/{task_id} — get single task
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
    return task


# T014: PUT /api/tasks/{task_id} — update task
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
    for key, value in update_data.items():
        setattr(task, key, value)
    task.updated_at = datetime.now(timezone.utc)

    session.add(task)
    session.commit()
    session.refresh(task)
    return task


# T015: DELETE /api/tasks/{task_id} — delete task
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


# T016: PATCH /api/tasks/{task_id}/complete — toggle completed
@router.patch("/tasks/{task_id}/complete", response_model=TaskRead)
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

    task.completed = not task.completed
    task.updated_at = datetime.now(timezone.utc)

    session.add(task)
    session.commit()
    session.refresh(task)
    return task
