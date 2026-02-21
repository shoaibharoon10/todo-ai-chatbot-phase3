from datetime import datetime, timezone

from sqlmodel import Session, select

from models import Task


def add_task(
    session: Session, user_id: str, title: str, description: str | None = None
) -> dict:
    """Create a new task for the user. Returns the created task dict."""
    now = datetime.now(timezone.utc)
    task = Task(
        user_id=user_id,
        title=title[:200],
        description=description[:1000] if description else None,
        created_at=now,
        updated_at=now,
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "completed": task.completed,
        "created_at": task.created_at.isoformat(),
    }


def list_tasks(
    session: Session,
    user_id: str,
    status: str | None = None,
    sort: str | None = None,
) -> list[dict]:
    """List tasks for the user with optional status filter and sort order."""
    statement = select(Task).where(Task.user_id == user_id)

    if status == "pending":
        statement = statement.where(Task.completed == False)  # noqa: E712
    elif status == "completed":
        statement = statement.where(Task.completed == True)  # noqa: E712

    if sort == "oldest":
        statement = statement.order_by(Task.created_at.asc())
    elif sort == "title":
        statement = statement.order_by(Task.title.asc())
    else:
        statement = statement.order_by(Task.created_at.desc())

    tasks = session.exec(statement).all()
    return [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "completed": t.completed,
            "created_at": t.created_at.isoformat(),
        }
        for t in tasks
    ]


def complete_task(session: Session, user_id: str, task_id: int) -> dict:
    """Toggle a task's completion status. Returns updated task or error dict."""
    task = session.exec(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    ).first()
    if not task:
        return {"error": f"Task with id {task_id} not found"}

    task.completed = not task.completed
    task.updated_at = datetime.now(timezone.utc)
    session.add(task)
    session.commit()
    session.refresh(task)
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "completed": task.completed,
        "created_at": task.created_at.isoformat(),
    }


def delete_task(session: Session, user_id: str, task_id: int) -> dict:
    """Delete a task by id. Returns confirmation or error dict."""
    task = session.exec(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    ).first()
    if not task:
        return {"error": f"Task with id {task_id} not found"}

    session.delete(task)
    session.commit()
    return {"deleted": True, "task_id": task_id}


def update_task(
    session: Session,
    user_id: str,
    task_id: int,
    title: str | None = None,
    description: str | None = None,
    completed: bool | None = None,
) -> dict:
    """Update a task's fields. Only provided fields are changed. Returns updated task or error dict."""
    task = session.exec(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    ).first()
    if not task:
        return {"error": f"Task with id {task_id} not found"}

    if title is not None:
        task.title = title[:200]
    if description is not None:
        task.description = description[:1000]
    if completed is not None:
        task.completed = completed
    task.updated_at = datetime.now(timezone.utc)

    session.add(task)
    session.commit()
    session.refresh(task)
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "completed": task.completed,
        "created_at": task.created_at.isoformat(),
    }
