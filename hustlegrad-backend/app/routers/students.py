from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user, require_roles
from app.models import UserRole

router = APIRouter(prefix="/api/students", tags=["Students"])

MANAGE_ROLES = (
    UserRole.placement_officer,
    UserRole.placement_coordinator,
    UserRole.department_coordinator,
)


def _initials(name: str) -> str:
    parts = name.strip().split()
    return "".join(p[0].upper() for p in parts[:2]) if parts else "?"


@router.get("", response_model=List[schemas.StudentListOut])
def list_students(
    department: Optional[str] = None,
    batch: Optional[str] = None,
    status_filter: Optional[schemas.PlacementStatus] = Query(None, alias="status"),
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.Student)
    if department and department != "All Departments":
        q = q.filter(models.Student.department == department)
    if batch and batch != "All Batches":
        q = q.filter(models.Student.batch == batch)
    if status_filter and status_filter != "All Statuses":
        q = q.filter(models.Student.status == status_filter)
    if search:
        like = f"%{search}%"
        q = q.filter(
            (models.Student.name.ilike(like)) | (models.Student.roll.ilike(like))
        )
    return q.order_by(models.Student.name).offset(skip).limit(limit).all()


@router.get("/{student_id}", response_model=schemas.StudentDetailOut)
def get_student(student_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    student = (
        db.query(models.Student)
        .options(
            joinedload(models.Student.certifications),
            joinedload(models.Student.semester_records),
            joinedload(models.Student.applications),
        )
        .filter(models.Student.id == student_id)
        .first()
    )
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return student


@router.post("", response_model=schemas.StudentDetailOut, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_roles(*MANAGE_ROLES))])
def create_student(payload: schemas.StudentCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Student).filter(models.Student.roll == payload.roll).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Roll number already exists")

    data = payload.model_dump()
    if not data.get("initials"):
        data["initials"] = _initials(payload.name)

    student = models.Student(**data)
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.patch("/{student_id}", response_model=schemas.StudentDetailOut,
              dependencies=[Depends(require_roles(*MANAGE_ROLES))])
def update_student(student_id: int, payload: schemas.StudentUpdate, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(student, field, value)

    db.commit()
    db.refresh(student)
    return student


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(require_roles(UserRole.placement_officer))])
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    db.delete(student)
    db.commit()


# ── Certifications ──────────────────────────────────────────────────────────

@router.post("/{student_id}/certifications", response_model=schemas.CertificationOut,
             status_code=status.HTTP_201_CREATED)
def add_certification(student_id: int, payload: schemas.CertificationBase, db: Session = Depends(get_db),
                       current_user: models.User = Depends(get_current_user)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    cert = models.Certification(student_id=student_id, **payload.model_dump())
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return cert


# ── Semester records ────────────────────────────────────────────────────────

@router.post("/{student_id}/semester-records", response_model=schemas.SemesterRecordOut,
             status_code=status.HTTP_201_CREATED)
def add_semester_record(student_id: int, payload: schemas.SemesterRecordBase, db: Session = Depends(get_db),
                         current_user: models.User = Depends(get_current_user)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    existing = db.query(models.SemesterRecord).filter(
        models.SemesterRecord.student_id == student_id,
        models.SemesterRecord.sem == payload.sem,
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Record for this semester already exists")

    record = models.SemesterRecord(student_id=student_id, **payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
