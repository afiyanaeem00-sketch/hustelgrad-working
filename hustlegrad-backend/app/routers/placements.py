from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user, require_roles
from app.models import UserRole

router = APIRouter(prefix="/api/placements", tags=["Placements"])

MANAGE_ROLES = (
    UserRole.placement_officer,
    UserRole.placement_coordinator,
    UserRole.department_coordinator,
)


def _to_with_student(app_: models.Application) -> schemas.ApplicationWithStudentOut:
    return schemas.ApplicationWithStudentOut(
        id=app_.id,
        student_id=app_.student_id,
        drive_id=app_.drive_id,
        company=app_.company,
        role=app_.role,
        applied_date=app_.applied_date,
        stage=app_.stage,
        package=app_.package,
        offer_date=app_.offer_date,
        joining_date=app_.joining_date,
        student_name=app_.student.name,
        roll=app_.student.roll,
        department=app_.student.department,
        initials=app_.student.initials,
        avatar_color=app_.student.avatar_color,
        avatar_bg=app_.student.avatar_bg,
    )


@router.get("", response_model=List[schemas.ApplicationWithStudentOut])
def list_applications(
    stage: Optional[schemas.ApplicationStage] = None,
    department: Optional[str] = None,
    company: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.Application).options(joinedload(models.Application.student))
    if stage:
        q = q.filter(models.Application.stage == stage)
    if company:
        q = q.filter(models.Application.company == company)
    if department:
        q = q.join(models.Student).filter(models.Student.department == department)
    apps = q.order_by(models.Application.applied_date.desc()).offset(skip).limit(limit).all()
    return [_to_with_student(a) for a in apps]


@router.post("", response_model=schemas.ApplicationOut, status_code=status.HTTP_201_CREATED)
def create_application(payload: schemas.ApplicationCreate, db: Session = Depends(get_db),
                        current_user: models.User = Depends(get_current_user)):
    student = db.query(models.Student).filter(models.Student.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    application = models.Application(**payload.model_dump())
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.patch("/{application_id}", response_model=schemas.ApplicationOut,
              dependencies=[Depends(require_roles(*MANAGE_ROLES))])
def update_application(application_id: int, payload: schemas.ApplicationUpdate, db: Session = Depends(get_db)):
    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(application, field, value)

    # Keep the parent student's status roughly in sync with their furthest-along application.
    if payload.stage == models.ApplicationStage.Joined:
        application.student.status = models.PlacementStatus.Placed
        application.student.company = application.company
    elif payload.stage == models.ApplicationStage.Offered:
        if application.student.status != models.PlacementStatus.Placed:
            application.student.status = models.PlacementStatus.Offered

    db.commit()
    db.refresh(application)
    return application


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(require_roles(*MANAGE_ROLES))])
def delete_application(application_id: int, db: Session = Depends(get_db)):
    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    db.delete(application)
    db.commit()
