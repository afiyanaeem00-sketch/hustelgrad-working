from typing import List, Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user, require_roles
from app.models import UserRole

router = APIRouter(prefix="/api/communication", tags=["Communication"])

MANAGE_ROLES = (UserRole.placement_officer, UserRole.placement_coordinator, UserRole.department_coordinator)


@router.get("/messages", response_model=List[schemas.SentMessageOut])
def list_messages(
    channel: Optional[schemas.CommChannel] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.SentMessage)
    if channel:
        q = q.filter(models.SentMessage.channel == channel)
    return q.order_by(models.SentMessage.sent_at.desc()).offset(skip).limit(limit).all()


@router.post("/messages", response_model=schemas.SentMessageOut, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_roles(*MANAGE_ROLES))])
def send_message(payload: schemas.SentMessageCreate, db: Session = Depends(get_db),
                  current_user: models.User = Depends(get_current_user)):
    message = models.SentMessage(**payload.model_dump(), created_by=current_user.id)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.get("/notifications", response_model=List[schemas.NotificationOut])
def list_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return (
        db.query(models.Notification)
        .filter(
            (models.Notification.user_id == current_user.id) | (models.Notification.user_id.is_(None))
        )
        .order_by(models.Notification.created_at.desc())
        .limit(50)
        .all()
    )


@router.patch("/notifications/{notification_id}/read", response_model=schemas.NotificationOut)
def mark_notification_read(notification_id: int, db: Session = Depends(get_db),
                            current_user: models.User = Depends(get_current_user)):
    notif = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if notif:
        notif.is_read = True
        db.commit()
        db.refresh(notif)
    return notif
