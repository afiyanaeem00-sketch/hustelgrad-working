from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, ConfigDict, Field

from app.models import (
    UserRole, PlacementStatus, ApplicationStage, InternshipStatus,
    DriveStatus, DriveType, CommChannel, CommStatus,
)


# ─────────────────────────────────────────────────────────────────────────────
# Auth / Users
# ─────────────────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(min_length=8)
    institution: str
    role: UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: UserRole


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    email: str
    role: UserRole
    institution: Optional[str] = None
    is_active: bool


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UserRoleUpdate(BaseModel):
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


# ─────────────────────────────────────────────────────────────────────────────
# Certifications / Semester Records
# ─────────────────────────────────────────────────────────────────────────────

class CertificationBase(BaseModel):
    name: str
    issuer: Optional[str] = None
    year: Optional[int] = None


class CertificationOut(CertificationBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class SemesterRecordBase(BaseModel):
    sem: int
    gpa: float
    backlogs: int = 0


class SemesterRecordOut(SemesterRecordBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ─────────────────────────────────────────────────────────────────────────────
# Applications
# ─────────────────────────────────────────────────────────────────────────────

class ApplicationBase(BaseModel):
    company: str
    role: str
    applied_date: Optional[date] = None
    stage: ApplicationStage = ApplicationStage.Applied
    package: Optional[str] = None
    offer_date: Optional[date] = None
    joining_date: Optional[date] = None
    drive_id: Optional[int] = None


class ApplicationCreate(ApplicationBase):
    student_id: int


class ApplicationUpdate(BaseModel):
    stage: Optional[ApplicationStage] = None
    package: Optional[str] = None
    offer_date: Optional[date] = None
    joining_date: Optional[date] = None


class ApplicationOut(ApplicationBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: int


class ApplicationWithStudentOut(ApplicationOut):
    student_name: str
    roll: str
    department: str
    initials: Optional[str] = None
    avatar_color: Optional[str] = None
    avatar_bg: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# Students
# ─────────────────────────────────────────────────────────────────────────────

class StudentBase(BaseModel):
    name: str
    roll: str
    department: str
    batch: str
    semester: int = 1
    cgpa: float = 0
    status: PlacementStatus = PlacementStatus.Eligible
    company: Optional[str] = None
    resume_url: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    hometown: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None
    bio: Optional[str] = None
    skills: List[str] = []
    graduation_year: Optional[int] = None
    total_backlogs: int = 0
    avatar_color: Optional[str] = None
    avatar_bg: Optional[str] = None
    initials: Optional[str] = None


class StudentCreate(StudentBase):
    user_id: Optional[int] = None


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    batch: Optional[str] = None
    semester: Optional[int] = None
    cgpa: Optional[float] = None
    status: Optional[PlacementStatus] = None
    company: Optional[str] = None
    resume_url: Optional[str] = None
    phone: Optional[str] = None
    hometown: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    graduation_year: Optional[int] = None
    total_backlogs: Optional[int] = None


class StudentListOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    initials: Optional[str] = None
    avatar_color: Optional[str] = None
    avatar_bg: Optional[str] = None
    roll: str
    department: str
    batch: str
    semester: int
    cgpa: float
    status: PlacementStatus
    company: Optional[str] = None


class StudentDetailOut(StudentListOut):
    resume_url: Optional[str] = None
    email: str
    phone: Optional[str] = None
    hometown: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None
    bio: Optional[str] = None
    skills: List[str] = []
    graduation_year: Optional[int] = None
    total_backlogs: int = 0
    certifications: List[CertificationOut] = []
    semester_records: List[SemesterRecordOut] = []
    applications: List[ApplicationOut] = []


# ─────────────────────────────────────────────────────────────────────────────
# Internships
# ─────────────────────────────────────────────────────────────────────────────

class InternshipBase(BaseModel):
    company: str
    role: str
    duration: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    mentor: Optional[str] = None
    stipend: Optional[str] = None
    ppo_eligible: bool = False
    ppo_converted: bool = False
    status: InternshipStatus = InternshipStatus.Ongoing


class InternshipCreate(InternshipBase):
    student_id: int


class InternshipUpdate(BaseModel):
    status: Optional[InternshipStatus] = None
    ppo_eligible: Optional[bool] = None
    ppo_converted: Optional[bool] = None
    end_date: Optional[date] = None


class InternshipOut(InternshipBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: int


class InternshipWithStudentOut(InternshipOut):
    student_name: str
    roll: str
    department: str
    initials: Optional[str] = None
    avatar_color: Optional[str] = None
    avatar_bg: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# Companies
# ─────────────────────────────────────────────────────────────────────────────

class CompanyJobHistoryBase(BaseModel):
    year: str
    role: str
    hired: int = 0
    package: Optional[str] = None


class CompanyJobHistoryOut(CompanyJobHistoryBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class CompanyBase(BaseModel):
    name: str
    logo: Optional[str] = None
    logo_color: Optional[str] = None
    logo_bg: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    hr_name: Optional[str] = None
    hr_email: Optional[EmailStr] = None
    hr_phone: Optional[str] = None
    past_visits: int = 0
    students_hired: int = 0
    avg_package_lpa: Optional[float] = None
    highest_package_lpa: Optional[float] = None
    last_visit: Optional[str] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    industry: Optional[str] = None
    location: Optional[str] = None
    hr_name: Optional[str] = None
    hr_email: Optional[EmailStr] = None
    hr_phone: Optional[str] = None
    past_visits: Optional[int] = None
    students_hired: Optional[int] = None
    avg_package_lpa: Optional[float] = None
    highest_package_lpa: Optional[float] = None
    last_visit: Optional[str] = None


class CompanyOut(CompanyBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class CompanyDetailOut(CompanyOut):
    job_history: List[CompanyJobHistoryOut] = []


# ─────────────────────────────────────────────────────────────────────────────
# Placement Drives
# ─────────────────────────────────────────────────────────────────────────────

class DriveBase(BaseModel):
    position: str
    package: Optional[str] = None
    package_lpa: Optional[float] = None
    type: DriveType = DriveType.FTE
    eligibility: Optional[str] = None
    skills: List[str] = []
    registration_deadline: Optional[date] = None
    interview_date: Optional[date] = None
    venue: Optional[str] = None
    status: DriveStatus = DriveStatus.Upcoming
    applications_count: int = 0


class DriveCreate(DriveBase):
    company_id: int


class DriveUpdate(BaseModel):
    position: Optional[str] = None
    package: Optional[str] = None
    package_lpa: Optional[float] = None
    type: Optional[DriveType] = None
    eligibility: Optional[str] = None
    skills: Optional[List[str]] = None
    registration_deadline: Optional[date] = None
    interview_date: Optional[date] = None
    venue: Optional[str] = None
    status: Optional[DriveStatus] = None
    applications_count: Optional[int] = None


class DriveOut(DriveBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    company_id: int


class DriveWithCompanyOut(DriveOut):
    company_name: str
    logo: Optional[str] = None
    logo_color: Optional[str] = None
    logo_bg: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# Communication
# ─────────────────────────────────────────────────────────────────────────────

class SentMessageBase(BaseModel):
    channel: CommChannel
    audience: str
    subject: str
    body: Optional[str] = None
    recipients: int = 0
    status: CommStatus = CommStatus.Scheduled


class SentMessageCreate(SentMessageBase):
    pass


class SentMessageOut(SentMessageBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    sent_at: datetime


# ─────────────────────────────────────────────────────────────────────────────
# Notifications
# ─────────────────────────────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    text: str
    is_read: bool
    created_at: datetime


# ─────────────────────────────────────────────────────────────────────────────
# Dashboard
# ─────────────────────────────────────────────────────────────────────────────

class KpiOut(BaseModel):
    label: str
    value: str
    delta: str
    up: bool
    sub: str


class ChartPointOut(BaseModel):
    month: str
    placed: int


class DashboardOut(BaseModel):
    kpis: List[KpiOut]
    chart: List[ChartPointOut]
    upcoming_drives: List[DriveWithCompanyOut]
    notifications: List[NotificationOut]
