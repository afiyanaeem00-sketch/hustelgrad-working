from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, students, companies, drives, placements, internships, communication, dashboard, users

# Creates tables automatically on startup if they don't exist yet.
# For production, prefer Alembic migrations (see README) instead of relying on this.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for the Placement / TPO Management Portal",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(students.router)
app.include_router(companies.router)
app.include_router(drives.router)
app.include_router(placements.router)
app.include_router(internships.router)
app.include_router(communication.router)
app.include_router(dashboard.router)
app.include_router(users.router)


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "app": settings.APP_NAME}


@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "healthy"}
