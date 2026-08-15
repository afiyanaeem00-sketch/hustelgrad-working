import enum
from datetime import datetime, date

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, Date, DateTime,
    ForeignKey, Enum as SAEnum, JSON, UniqueConstraint
)
from sqlalchemy.orm import relationship

from app.database import Base


# ─────────────────────────────────────────────────────────────────────────────
# Enums (mirrors the union/string-literal types used in the React frontend)
# ─────────────────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    placement_officer = "placement_officer"
    placement_coordinator = "placement_coordinator"
    department_coordinator = "department_coordinator"
    student = "student"
    recruiter = "recruiter"


class PlacementStatus(str, enum.Enum):
    Eligible = "Eligible"
    Applied = "Applied"
    Interviewing = "Interviewing"
    Offered = "Offered"
    Placed = "Placed"


class ApplicationStage(str, enum.Enum):
    Applied = "Applied"
    Shortlisted = "Shortlisted"
    Written_Test = "Written Test"
    Technical_Interview = "Technical Interview"
    HR_Round = "HR Round"
    Interviewing = "Interviewing"
    Offered = "Offered"
    Joined = "Joined"
    Rejected = "Rejected"


class InternshipStatus(str, enum.Enum):
    Ongoing = "Ongoing"
    Completed = "Completed"
    Withdrawn = "Withdrawn"


class DriveStatus(str, enum.Enum):
    Open = "Open"
    Upcoming = "Upcoming"
    Completed = "Completed"
    Closed = "Closed"


class DriveType(str, enum.Enum):
    FTE = "FTE"
    Internship = "Internship"
    FTE_Internship = "FTE + Internship"


class CommChannel(str, enum.Enum):
    Email = "Email"
    SMS = "SMS"
    WhatsApp = "WhatsApp"
    InApp = "In-App"


class CommStatus(str, enum.Enum):
    Delivered = "Delivered"
    Partial = "Partial"
    Scheduled = "Scheduled"


# ─────────────────────────────────────────────────────────────────────────────
# Users (login / signup — the Auth page in the frontend)
# ─────────────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(190), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), nullable=False)
    institution = Column(String(190), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    student_profile = relationship(
        "Student", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


# ─────────────────────────────────────────────────────────────────────────────
# Students
# ─────────────────────────────────────────────────────────────────────────────

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, unique=True)

    name = Column(String(120), nullable=False)
    initials = Column(String(6), nullable=True)
    avatar_color = Column(String(20), nullable=True)
    avatar_bg = Column(String(20), nullable=True)

    roll = Column(String(30), unique=True, nullable=False, index=True)
    department = Column(String(80), nullable=False)
    batch = Column(String(10), nullable=False)
    semester = Column(Integer, nullable=False, default=1)

    cgpa = Column(Float, nullable=False, default=0)
    status = Column(SAEnum(PlacementStatus), nullable=False, default=PlacementStatus.Eligible)
    company = Column(String(120), nullable=True)  # company placed at, if any
    resume_url = Column(String(255), nullable=True)

    email = Column(String(190), nullable=False, unique=True)
    phone = Column(String(30), nullable=True)
    hometown = Column(String(120), nullable=True)

    github = Column(String(190), nullable=True)
    linkedin = Column(String(190), nullable=True)
    portfolio = Column(String(190), nullable=True)

    bio = Column(Text, nullable=True)
    skills = Column(JSON, nullable=False, default=list)  # e.g. ["Python", "React"]

    graduation_year = Column(Integer, nullable=True)
    total_backlogs = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="student_profile")
    certifications = relationship("Certification", back_populates="student", cascade="all, delete-orphan")
    semester_records = relationship("SemesterRecord", back_populates="student", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="student", cascade="all, delete-orphan")
    internships = relationship("Internship", back_populates="student", cascade="all, delete-orphan")


class Certification(Base):
    __tablename__ = "certifications"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(190), nullable=False)
    issuer = Column(String(190), nullable=True)
    year = Column(Integer, nullable=True)

    student = relationship("Student", back_populates="certifications")


class SemesterRecord(Base):
    __tablename__ = "semester_records"
    __table_args__ = (UniqueConstraint("student_id", "sem", name="uq_student_sem"),)

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    sem = Column(Integer, nullable=False)
    gpa = Column(Float, nullable=False)
    backlogs = Column(Integer, nullable=False, default=0)

    student = relationship("Student", back_populates="semester_records")


# ─────────────────────────────────────────────────────────────────────────────
# Companies (CRM) + their historical hiring record
# ─────────────────────────────────────────────────────────────────────────────

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(190), unique=True, nullable=False, index=True)
    logo = Column(String(10), nullable=True)          # short letters e.g. "GO"
    logo_color = Column(String(20), nullable=True)
    logo_bg = Column(String(20), nullable=True)

    industry = Column(String(120), nullable=True)
    location = Column(String(190), nullable=True)

    hr_name = Column(String(120), nullable=True)
    hr_email = Column(String(190), nullable=True)
    hr_phone = Column(String(30), nullable=True)

    past_visits = Column(Integer, nullable=False, default=0)
    students_hired = Column(Integer, nullable=False, default=0)
    avg_package_lpa = Column(Float, nullable=True)     # numeric LPA for real math
    highest_package_lpa = Column(Float, nullable=True)
    last_visit = Column(String(30), nullable=True)     # kept as display string e.g. "Jan 2026"

    created_at = Column(DateTime, default=datetime.utcnow)

    job_history = relationship("CompanyJobHistory", back_populates="company", cascade="all, delete-orphan")
    drives = relationship("PlacementDrive", back_populates="company")


class CompanyJobHistory(Base):
    __tablename__ = "company_job_history"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    year = Column(String(10), nullable=False)
    role = Column(String(190), nullable=False)
    hired = Column(Integer, nullable=False, default=0)
    package = Column(String(30), nullable=True)  # display string e.g. "₹42 LPA"

    company = relationship("Company", back_populates="job_history")


# ─────────────────────────────────────────────────────────────────────────────
# Placement Drives
# ─────────────────────────────────────────────────────────────────────────────

class PlacementDrive(Base):
    __tablename__ = "placement_drives"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)

    position = Column(String(190), nullable=False)
    package = Column(String(30), nullable=True)          # display e.g. "₹42 LPA"
    package_lpa = Column(Float, nullable=True)            # numeric for analytics
    type = Column(SAEnum(DriveType), nullable=False, default=DriveType.FTE)

    eligibility = Column(String(255), nullable=True)
    skills = Column(JSON, nullable=False, default=list)

    registration_deadline = Column(Date, nullable=True)
    interview_date = Column(Date, nullable=True)
    venue = Column(String(190), nullable=True)

    status = Column(SAEnum(DriveStatus), nullable=False, default=DriveStatus.Upcoming)
    applications_count = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="drives")


# ─────────────────────────────────────────────────────────────────────────────
# Applications (used both for a student's own application list AND the
# admin-facing "Placements" tracking table — normalized into one table)
# ─────────────────────────────────────────────────────────────────────────────

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    drive_id = Column(Integer, ForeignKey("placement_drives.id", ondelete="SET NULL"), nullable=True)

    company = Column(String(190), nullable=False)
    role = Column(String(190), nullable=False)
    applied_date = Column(Date, nullable=True)
    stage = Column(SAEnum(ApplicationStage), nullable=False, default=ApplicationStage.Applied)

    package = Column(String(30), nullable=True)
    offer_date = Column(Date, nullable=True)
    joining_date = Column(Date, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("Student", back_populates="applications")
    drive = relationship("PlacementDrive")


# ─────────────────────────────────────────────────────────────────────────────
# Internships
# ─────────────────────────────────────────────────────────────────────────────

class Internship(Base):
    __tablename__ = "internships"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)

    company = Column(String(190), nullable=False)
    role = Column(String(190), nullable=False)
    duration = Column(String(30), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    mentor = Column(String(120), nullable=True)
    stipend = Column(String(30), nullable=True)

    ppo_eligible = Column(Boolean, default=False)
    ppo_converted = Column(Boolean, default=False)
    status = Column(SAEnum(InternshipStatus), nullable=False, default=InternshipStatus.Ongoing)

    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="internships")


# ─────────────────────────────────────────────────────────────────────────────
# Communication
# ─────────────────────────────────────────────────────────────────────────────

class SentMessage(Base):
    __tablename__ = "sent_messages"

    id = Column(Integer, primary_key=True, index=True)
    channel = Column(SAEnum(CommChannel), nullable=False)
    audience = Column(String(190), nullable=False)
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=True)

    sent_at = Column(DateTime, default=datetime.utcnow)
    recipients = Column(Integer, nullable=False, default=0)
    status = Column(SAEnum(CommStatus), nullable=False, default=CommStatus.Scheduled)

    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)  # null = broadcast
    text = Column(String(255), nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
