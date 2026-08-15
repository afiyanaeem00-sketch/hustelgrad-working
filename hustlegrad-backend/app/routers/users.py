from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.deps import require_roles
from app.models import UserRole

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("", response_model=List[schemas.UserOut],
            dependencies=[Depends(require_roles(UserRole.placement_officer))])
def list_users(db: Session = Depends(get_db)):
    return db.query(models.User).order_by(models.User.full_name).all()


@router.patch("/{user_id}", response_model=schemas.UserOut,
              dependencies=[Depends(require_roles(UserRole.placement_officer))])
def update_user(user_id: int, payload: schemas.UserRoleUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if payload.role is not None:
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(require_roles(UserRole.placement_officer))])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    db.delete(user)
    db.commit()
