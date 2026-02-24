from datetime import datetime, timezone

from dateutil.rrule import rrulestr
from sqlmodel import Session, select

from models import Tag, Task, TaskTag
from recurrence import compute_next_occurrence

_VALID_PRIORITIES = {"low", "medium", "high", "urgent"}


def _parse_due_date(due_date_str: str | None) -> datetime | None:
    """Parse an ISO 8601 date string to a timezone-aware UTC datetime, or None."""
    if not due_date_str or due_date_str in ("null", "", "clear"):
        return None
    try:
        return datetime.fromisoformat(due_date_str.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return None


def add_tag(session: Session, user_id: str, name: str, color: str = "#6366f1") -> dict:
    """Create or return an existing tag for the user. Idempotent."""
    existing = session.exec(
        select(Tag).where(Tag.user_id == user_id, Tag.name == name)
    ).first()
    if existing:
        return {"id": str(existing.id), "name": existing.name, "color": existing.color}
    tag = Tag(user_id=user_id, name=name[:50], color=color[:7])
    session.add(tag)
    session.commit()
    session.refresh(tag)
    return {"id": str(tag.id), "name": tag.name, "color": tag.color}


def tag_task(session: Session, user_id: str, task_id: int, tag_name: str) -> dict:
    """Apply a tag (by name) to a task. Creates the tag if it does not exist."""
    task = session.exec(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    ).first()
    if not task:
        return {"error": f"Task with id {task_id} not found"}

    tag_result = add_tag(session, user_id, tag_name)
    tag_id = int(tag_result["id"])

    existing_link = session.exec(
        select(TaskTag).where(TaskTag.task_id == task_id, TaskTag.tag_id == tag_id)
    ).first()
    if not existing_link:
        session.add(TaskTag(task_id=task_id, tag_id=tag_id))
        session.commit()

    return {"task_id": str(task_id), "tag_name": tag_name, "tag_id": str(tag_id)}


def add_task(
    session: Session,
    user_id: str,
    title: str,
    description: str | None = None,
    due_date: str | None = None,
    recurrence_rule: str | None = None,
    priority: str = "medium",
    tags: list[str] | None = None,
    notes: str | None = None,
    reminder_offset_minutes: int | None = None,
) -> dict:
    """Create a new task for the user. Returns the created task dict."""
    if priority not in _VALID_PRIORITIES:
        return {"error": f"Invalid priority '{priority}'. Must be one of: low, medium, high, urgent"}

    if recurrence_rule:
        try:
            rrulestr(recurrence_rule, dtstart=datetime.now(timezone.utc))
        except Exception as e:
            return {"error": f"Invalid recurrence rule: {e}"}

    now = datetime.now(timezone.utc)
    task = Task(
        user_id=user_id,
        title=title[:200],
        description=description[:1000] if description else None,
        due_date=_parse_due_date(due_date),
        recurrence_rule=recurrence_rule,
        priority=priority,
        notes=notes[:5000] if notes else None,
        reminder_offset_minutes=reminder_offset_minutes,
        created_at=now,
        updated_at=now,
    )
    session.add(task)
    session.flush()

    if tags:
        for tag_name in tags:
            tag_result = add_tag(session, user_id, tag_name)
            tag_id = int(tag_result["id"])
            existing_link = session.exec(
                select(TaskTag).where(TaskTag.task_id == task.id, TaskTag.tag_id == tag_id)
            ).first()
            if not existing_link:
                session.add(TaskTag(task_id=task.id, tag_id=tag_id))

    session.commit()
    session.refresh(task)
    return {
        "id": str(task.id),
        "title": task.title,
        "description": task.description or "",
        "completed": str(task.completed),
        "priority": task.priority,
        "due_date": task.due_date.isoformat() if task.due_date else "",
        "recurrence_rule": task.recurrence_rule or "",
        "tags": str([t for t in (tags or [])]),
        "notes": task.notes or "",
        "reminder_offset_minutes": str(task.reminder_offset_minutes) if task.reminder_offset_minutes is not None else "",
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
            "id": str(t.id),
            "title": t.title,
            "description": t.description or "",
            "completed": str(t.completed),
            "priority": t.priority,
            "created_at": t.created_at.isoformat(),
        }
        for t in tasks
    ]


def complete_task(session: Session, user_id: str, task_id: int) -> dict:
    """Toggle a task's completion status. For recurring tasks, creates the next occurrence on completion."""
    task = session.exec(
        select(Task).where(Task.id == task_id, Task.user_id == user_id)
    ).first()
    if not task:
        return {"error": f"Task with id {task_id} not found"}

    was_completed = task.completed
    task.completed = not task.completed
    task.updated_at = datetime.now(timezone.utc)
    session.add(task)
    session.commit()
    session.refresh(task)

    next_occurrence_due = ""
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
            next_occurrence_due = next_due.isoformat()

    return {
        "id": str(task.id),
        "title": task.title,
        "description": task.description or "",
        "completed": str(task.completed),
        "priority": task.priority,
        "recurrence_rule": task.recurrence_rule or "",
        "next_occurrence_due": next_occurrence_due,
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
    return {"deleted": "true", "task_id": str(task_id)}


def get_stats(session: Session, user_id: str) -> dict:
    """Return task productivity statistics for the user."""
    tasks = session.exec(select(Task).where(Task.user_id == user_id)).all()
    now = datetime.now(timezone.utc)
    total = len(tasks)
    completed = sum(1 for t in tasks if t.completed)
    overdue = sum(
        1 for t in tasks
        if not t.completed and getattr(t, "due_date", None) and t.due_date < now
    )
    rate = round(completed / total * 100, 1) if total else 0.0
    return {
        "total": str(total),
        "completed": str(completed),
        "pending": str(total - completed),
        "overdue": str(overdue),
        "completion_rate": f"{rate}%",
    }


def update_task(
    session: Session,
    user_id: str,
    task_id: int,
    title: str | None = None,
    description: str | None = None,
    completed: bool | None = None,
    due_date: str | None = None,
    priority: str | None = None,
    notes: str | None = None,
    clear_notes: bool = False,
    reminder_offset_minutes: int | None = None,
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
    if due_date is not None:
        task.due_date = _parse_due_date(due_date)
    if priority is not None:
        if priority not in _VALID_PRIORITIES:
            return {"error": f"Invalid priority '{priority}'. Must be one of: low, medium, high, urgent"}
        task.priority = priority
    if clear_notes:
        task.notes = None
    elif notes is not None:
        task.notes = notes[:5000]
    if reminder_offset_minutes is not None:
        task.reminder_offset_minutes = reminder_offset_minutes
    task.updated_at = datetime.now(timezone.utc)

    session.add(task)
    session.commit()
    session.refresh(task)
    return {
        "id": str(task.id),
        "title": task.title,
        "description": task.description or "",
        "completed": str(task.completed),
        "priority": task.priority,
        "notes": task.notes or "",
        "reminder_offset_minutes": str(task.reminder_offset_minutes) if task.reminder_offset_minutes is not None else "",
        "due_date": task.due_date.isoformat() if task.due_date else "",
        "created_at": task.created_at.isoformat(),
    }
