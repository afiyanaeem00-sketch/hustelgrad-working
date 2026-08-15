from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user, require_roles
from app.models import UserRole

router = APIRouter(prefix="/api/internships", tags=["Internships"])

MANAGE_ROLES = (
    UserRole.placement_officer,
    UserRole.placement_coordinator,
    UserRole.department_coordinator,
)


def _to_with_student(i: models.Internship) -> schemas.InternshipWithStudentOut:
    return schemas.InternshipWithStudentOut(
        id=i.id,
        student_id=i.student_id,
        company=i.company,
        role=i.role,
        duration=i.duration,
        start_date=i.start_date,
        end_date=i.end_date,
        mentor=i.mentor,
        stipend=i.stipend,
        ppo_eligible=i.ppo_eligible,
        ppo_converted=i.ppo_converted,
        status=i.status,
        student_name=i.student.name,
        roll=i.student.roll,
        department=i.student.department,
        initials=i.student.initials,
        avatar_color=i.student.avatar_color,
        avatar_bg=i.student.avatar_bg,
    )


@router.get("", response_model=List[schemas.InternshipWithStudentOut])
def list_internships(
    status_filter: Optional[schemas.InternshipStatus] = None,
    department: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.Internship).options(joinedload(models.Internship.student))
    if status_filter:
        q = q.filter(models.Internship.status == status_filter)
    if department:
        q = q.join(models.Student).filter(models.Student.department == department)
    internships = q.order_by(models.Internship.start_date.desc()).offset(skip).limit(limit).all()
    return [_to_with_student(i) for i in internships]


@router.post("", response_model=schemas.InternshipOut, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_roles(*MANAGE_ROLES))])
def create_internship(payload: schemas.InternshipCreate, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    internship = models.Internship(**payload.model_dump())
    db.add(internship)
    db.commit()
    db.refresh(internship)
    return internship


@router.patch("/{internship_id}", response_model=schemas.InternshipOut,
              dependencies=[Depends(require_roles(*MANAGE_ROLES))])
def update_internship(internship_id: int, payload: schemas.InternshipUpdate, db: Session = Depends(get_db)):
    internship = db.query(models.Internship).filter(models.Internship.id == internship_id).first()
    if not internship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Internship not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(internship, field, value)
    db.commit()
    db.refresh(internship)
    return internship


@router.delete("/{internship_id}", status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(require_roles(*MANAGE_ROLES))])
def delete_internship(internship_id: int, db: Session = Depends(get_db)):
    internship = db.query(models.Internship).filter(models.Internship.id == internship_id).first()
    if not internship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Internship not found")
    db.delete(internship)
    db.commit()
