from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user, require_roles
from app.models import UserRole

router = APIRouter(prefix="/api/drives", tags=["Placement Drives"])

MANAGE_ROLES = (UserRole.placement_officer, UserRole.placement_coordinator)


def _to_with_company(drive: models.PlacementDrive) -> schemas.DriveWithCompanyOut:
    return schemas.DriveWithCompanyOut(
        id=drive.id,
        company_id=drive.company_id,
        company_name=drive.company.name,
        logo=drive.company.logo,
        logo_color=drive.company.logo_color,
        logo_bg=drive.company.logo_bg,
        position=drive.position,
        package=drive.package,
        package_lpa=drive.package_lpa,
        type=drive.type,
        eligibility=drive.eligibility,
        skills=drive.skills or [],
        registration_deadline=drive.registration_deadline,
        interview_date=drive.interview_date,
        venue=drive.venue,
        status=drive.status,
        applications_count=drive.applications_count,
    )


@router.get("", response_model=List[schemas.DriveWithCompanyOut])
def list_drives(
    status_filter: Optional[schemas.DriveStatus] = None,
    drive_type: Optional[schemas.DriveType] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.PlacementDrive).options(joinedload(models.PlacementDrive.company))
    if status_filter:
        q = q.filter(models.PlacementDrive.status == status_filter)
    if drive_type:
        q = q.filter(models.PlacementDrive.type == drive_type)
    drives = q.order_by(models.PlacementDrive.interview_date).offset(skip).limit(limit).all()
    return [_to_with_company(d) for d in drives]


@router.get("/{drive_id}", response_model=schemas.DriveWithCompanyOut)
def get_drive(drive_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    drive = (
        db.query(models.PlacementDrive)
        .options(joinedload(models.PlacementDrive.company))
        .filter(models.PlacementDrive.id == drive_id)
        .first()
    )
    if not drive:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drive not found")
    return _to_with_company(drive)


@router.post("", response_model=schemas.DriveOut, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_roles(*MANAGE_ROLES))])
def create_drive(payload: schemas.DriveCreate, db: Session = Depends(get_db)):
    company = db.query(models.Company).filter(models.Company.id == payload.company_id).first()
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    drive = models.PlacementDrive(**payload.model_dump())
    db.add(drive)
    db.commit()
    db.refresh(drive)
    return drive


@router.patch("/{drive_id}", response_model=schemas.DriveOut,
              dependencies=[Depends(require_roles(*MANAGE_ROLES))])
def update_drive(drive_id: int, payload: schemas.DriveUpdate, db: Session = Depends(get_db)):
    drive = db.query(models.PlacementDrive).filter(models.PlacementDrive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drive not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(drive, field, value)
    db.commit()
    db.refresh(drive)
    return drive


@router.delete("/{drive_id}", status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(require_roles(UserRole.placement_officer))])
def delete_drive(drive_id: int, db: Session = Depends(get_db)):
    drive = db.query(models.PlacementDrive).filter(models.PlacementDrive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drive not found")
    db.delete(drive)
    db.commit()
