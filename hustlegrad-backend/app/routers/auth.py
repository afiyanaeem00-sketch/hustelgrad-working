from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.security import hash_password, verify_password, create_access_token
from app.deps import get_current_user
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/signup", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: schemas.SignupRequest, db: Session = Depends(get_db)):
    # Mirrors the frontend's institutional-email allow-list check.
    domain = payload.email.split("@")[-1].lower()
    if domain not in settings.allowed_domains_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your institution isn't verified yet.",
        )

    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = models.User(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        institution=payload.institution,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return schemas.TokenResponse(access_token=token, user=user)


@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    domain = payload.email.split("@")[-1].lower()
    if domain not in settings.allowed_domains_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your institution isn't verified yet.",
        )

    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if user.role != payload.role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Role does not match this account",
        )

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return schemas.TokenResponse(access_token=token, user=user)


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user
