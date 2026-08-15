from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app import models, schemas
from app.deps import get_current_user, require_roles
from app.models import UserRole

router = APIRouter(prefix="/api/companies", tags=["Companies"])

MANAGE_ROLES = (UserRole.placement_officer, UserRole.placement_coordinator)


@router.get("", response_model=List[schemas.CompanyOut])
def list_companies(
    industry: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.Company)
    if industry:
        q = q.filter(models.Company.industry == industry)
    if search:
        q = q.filter(models.Company.name.ilike(f"%{search}%"))
    return q.order_by(models.Company.name).offset(skip).limit(limit).all()


@router.get("/{company_id}", response_model=schemas.CompanyDetailOut)
def get_company(company_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    company = (
        db.query(models.Company)
        .options(joinedload(models.Company.job_history))
        .filter(models.Company.id == company_id)
        .first()
    )
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    return company


@router.post("", response_model=schemas.CompanyOut, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_roles(*MANAGE_ROLES))])
def create_company(payload: schemas.CompanyCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Company).filter(models.Company.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Company already exists")
    company = models.Company(**payload.model_dump())
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@router.patch("/{company_id}", response_model=schemas.CompanyOut,
              dependencies=[Depends(require_roles(*MANAGE_ROLES))])
def update_company(company_id: int, payload: schemas.CompanyUpdate, db: Session = Depends(get_db)):
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(company, field, value)
    db.commit()
    db.refresh(company)
    return company


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT,
               dependencies=[Depends(require_roles(UserRole.placement_officer))])
def delete_company(company_id: int, db: Session = Depends(get_db)):
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    db.delete(company)
    db.commit()


@router.post("/{company_id}/job-history", response_model=schemas.CompanyJobHistoryOut,
             status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_roles(*MANAGE_ROLES))])
def add_job_history(company_id: int, payload: schemas.CompanyJobHistoryBase, db: Session = Depends(get_db)):
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    entry = models.CompanyJobHistory(company_id=company_id, **payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
