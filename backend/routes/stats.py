from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from auth import get_current_user
from db import get_session
from models import StatsResponse, Task, WeeklyPoint

router = APIRouter(prefix="/api")


@router.get("/{user_id}/stats", response_model=StatsResponse)
def get_user_stats(
    user_id: str,
    jwt_user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if user_id != jwt_user_id:
        raise HTTPException(status_code=403, detail="User ID mismatch")

    tasks = session.exec(select(Task).where(Task.user_id == user_id)).all()

    now = datetime.now(timezone.utc)
    total = len(tasks)
    completed = sum(1 for t in tasks if t.completed)
    pending = total - completed
    overdue = sum(
        1 for t in tasks
        if not t.completed
        and getattr(t, "due_date", None)
        and t.due_date < now
    )
    completion_rate = round(completed / total * 100, 1) if total else 0.0

    # Last 7 days: today-6 → today (UTC dates)
    weekly: list[WeeklyPoint] = []
    for i in range(7):
        day = (now - timedelta(days=6 - i)).date()
        count = sum(
            1 for t in tasks
            if t.completed
            and t.updated_at
            and t.updated_at.astimezone(timezone.utc).date() == day
        )
        weekly.append(WeeklyPoint(date=str(day), completed=count))

    return StatsResponse(
        total=total,
        completed=completed,
        pending=pending,
        overdue=overdue,
        completion_rate=completion_rate,
        weekly=weekly,
    )
