from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from auth import get_current_user
from db import get_session
from models import Tag, TagCreate, TagRead

router = APIRouter(prefix="/api")


@router.get("/{user_id}/tags", response_model=list[TagRead])
def list_tags(
    user_id: str,
    jwt_user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if user_id != jwt_user_id:
        raise HTTPException(status_code=403, detail="User ID mismatch")
    tags = session.exec(select(Tag).where(Tag.user_id == user_id)).all()
    return tags


@router.post("/{user_id}/tags", response_model=TagRead, status_code=201)
def create_tag(
    user_id: str,
    body: TagCreate,
    jwt_user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if user_id != jwt_user_id:
        raise HTTPException(status_code=403, detail="User ID mismatch")
    existing = session.exec(
        select(Tag).where(Tag.user_id == user_id, Tag.name == body.name)
    ).first()
    if existing:
        return existing
    tag = Tag(user_id=user_id, name=body.name, color=body.color)
    session.add(tag)
    session.commit()
    session.refresh(tag)
    return tag


@router.delete("/{user_id}/tags/{tag_id}", status_code=204)
def delete_tag(
    user_id: str,
    tag_id: int,
    jwt_user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if user_id != jwt_user_id:
        raise HTTPException(status_code=403, detail="User ID mismatch")
    tag = session.exec(select(Tag).where(Tag.id == tag_id)).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    if tag.user_id != user_id:
        raise HTTPException(status_code=403, detail="Tag belongs to a different user")
    session.delete(tag)
    session.commit()
